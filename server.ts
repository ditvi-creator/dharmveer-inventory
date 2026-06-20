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

const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
const SALT_KEY = process.env.PHONEPE_SALT_KEY;
const SALT_INDEX = process.env.PHONEPE_SALT_INDEX || "1";
const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:3000";

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

  // PhonePe Payment Initiation
  app.post("/api/payment/initiate", async (req, res) => {
    try {
      const { amount, uid } = req.body;
      const merchantTransactionId = `MT${Date.now()}`;
      
      const paymentPayload = {
        merchantId: MERCHANT_ID,
        merchantTransactionId: merchantTransactionId,
        merchantUserId: uid,
        amount: amount * 100, // PhonePe accepts amount in paise
        redirectUrl: `${APP_BASE_URL}/payment-status?id=${merchantTransactionId}`,
        redirectMode: "REDIRECT",
        callbackUrl: `${APP_BASE_URL}/api/payment/callback`,
        paymentInstrument: {
          type: "PAY_PAGE",
        },
      };

      const buffer = Buffer.from(JSON.stringify(paymentPayload), "utf8");
      const base64Payload = buffer.toString("base64");

      const stringToHash = base64Payload + "/v1/pay" + SALT_KEY;
      const sha256 = crypto.createHash("sha256").update(stringToHash).digest("hex");
      const xVerify = sha256 + "###" + SALT_INDEX;

      const response = await axios.post(
        `${PHONEPE_HOST_URL}/v1/pay`,
        { request: base64Payload },
        {
          headers: {
            "Content-Type": "application/json",
            "X-VERIFY": xVerify,
            accept: "application/json",
          },
        }
      );

      res.json({
        url: response.data.data.instrumentResponse.redirectInfo.url,
        merchantTransactionId
      });
    } catch (error: any) {
      console.error("PhonePe Initiation Error:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to initiate payment" });
    }
  });

  // PhonePe Payment Status Check
  app.get("/api/payment/status/:transactionId", async (req, res) => {
    const { transactionId } = req.params;

    try {
      const stringToHash = `/v1/status/${MERCHANT_ID}/${transactionId}${SALT_KEY}`;
      const sha256 = crypto.createHash("sha256").update(stringToHash).digest("hex");
      const xVerify = sha256 + "###" + SALT_INDEX;

      const response = await axios.get(
        `${PHONEPE_HOST_URL}/v1/status/${MERCHANT_ID}/${transactionId}`,
        {
          headers: {
            "Content-Type": "application/json",
            "X-VERIFY": xVerify,
            "X-MERCHANT-ID": MERCHANT_ID,
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
