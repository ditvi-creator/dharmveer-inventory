import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import axios from "axios";
import crypto from "crypto";

dotenv.config();

const PHONEPE_HOST_URL = process.env.PHONEPE_ENV === "production" 
  ? "https://api.phonepe.com/apis/pg" 
  : "https://api-preprod.phonepe.com/apis/pg-sandbox";

const PHONEPE_AUTH_URL = process.env.PHONEPE_ENV === "production"
  ? "https://api.phonepe.com/apis/identity-manager/v1/oauth/token"
  : "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token";

const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
const CLIENT_ID = process.env.PHONEPE_CLIENT_ID;
const CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET;
const CLIENT_VERSION = process.env.PHONEPE_CLIENT_VERSION || "1";
const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:3000";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getPhonePeToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("PhonePe Client ID or Client Secret is missing in environment variables. Please add PHONEPE_CLIENT_ID and PHONEPE_CLIENT_SECRET.");
  }

  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('client_version', CLIENT_VERSION);

    const response = await axios.post(PHONEPE_AUTH_URL, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { access_token, expires_at } = response.data;
    // expires_at from PhonePe is usually an epoch timestamp in seconds
    const expiryTime = expires_at ? (expires_at * 1000) : (Date.now() + 3500 * 1000);
    
    cachedToken = {
      token: access_token,
      expiresAt: expiryTime - 60000 // Buffer of 60 seconds
    };
    return access_token;
  } catch (error: any) {
    const errorData = error.response?.data;
    console.error("PhonePe Auth Error Details:", errorData || error.message);
    throw new Error(`PhonePe authentication failed. Verify your Client ID, Secret, and Version. API Response: ${JSON.stringify(errorData || error.message)}`);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API endpoints
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history, systemInstruction, tools } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ 
          error: "GEMINI_API_KEY is not configured on the server. If you are on Vercel, add it to your Project Settings > Environment Variables." 
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Prepare contents from history and current message
      const contents = history.map((m: any) => ({
        role: m.role || 'user',
        parts: [{ text: m.content || "" }]
      }));
      contents.push({ role: 'user', parts: [{ text: message }] });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction,
          tools,
          temperature: 0.7,
          topP: 1,
          topK: 1
        }
      });
      
      res.json({ 
        text: response.text,
        functionCalls: response.functionCalls
      });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // PhonePe Payment Initiation (V2)
  app.post("/api/payment/initiate", async (req, res) => {
    try {
      const { amount, uid } = req.body;
      if (!MERCHANT_ID) {
        return res.status(400).json({ error: "PHONEPE_MERCHANT_ID is not configured" });
      }

      const merchantTransactionId = `T${Date.now()}`;
      
      const token = await getPhonePeToken();

      const paymentPayload = {
        merchantOrderId: merchantTransactionId,
        merchantUserId: uid.replace(/[^a-zA-Z0-9]/g, ''), // Ensure clean ID
        amount: Math.round(amount * 100), // Ensure integer paise
        redirectUrl: `${APP_BASE_URL}/payment-status?id=${merchantTransactionId}`,
        redirectMode: "REDIRECT",
        callbackUrl: `${APP_BASE_URL}/api/payment/callback`,
        paymentInstrument: {
          type: "PAY_PAGE",
        },
      };

      const response = await axios.post(
        `${PHONEPE_HOST_URL}/checkout/v2/pay`,
        paymentPayload,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "X-Merchant-Id": MERCHANT_ID,
            accept: "application/json",
          },
        }
      );

      if (response.data && response.data.data && response.data.data.redirectInfo) {
        res.json({
          url: response.data.data.redirectInfo.url,
          merchantTransactionId
        });
      } else {
        console.error("Malformed PhonePe Response:", response.data);
        res.status(500).json({ error: "Invalid response from payment gateway" });
      }
    } catch (error: any) {
      const errorData = error.response?.data;
      console.error("PhonePe Initiation Error Details:", errorData || error.message);
      res.status(500).json({ 
        error: "Failed to initiate payment",
        details: errorData || error.message
      });
    }
  });

  // PhonePe Payment Status Check (V2)
  app.get("/api/payment/status/:transactionId", async (req, res) => {
    const { transactionId } = req.params;

    try {
      const token = await getPhonePeToken();

      const response = await axios.get(
        `${PHONEPE_HOST_URL}/checkout/v2/order/${transactionId}/status`,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "X-Merchant-Id": MERCHANT_ID,
            accept: "application/json",
          },
        }
      );

      res.json(response.data);
    } catch (error: any) {
      console.error("PhonePe Status Error:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to check payment status" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
