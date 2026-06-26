import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import crypto from "crypto";
import axios from "axios";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc, setDoc } from "firebase/firestore";

dotenv.config();

// Load firebase config and initialize Firestore in server.ts
let db: any = null;
const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
if (fs.existsSync(firebaseConfigPath)) {
  try {
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
    const firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId || "(default)");
    console.log("Firebase initialized successfully on server-side.");
  } catch (err) {
    console.error("Failed to initialize Firebase on server-side", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

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

  // --- PhonePe Payment Gateway APIs ---

  // Initiate PhonePe Payment
  app.post("/api/phonepe/initiate", async (req, res) => {
    try {
      const { userId, amount, email } = req.body;
      if (!userId) {
        return res.status(400).json({ success: false, error: "userId is required" });
      }

      const merchantId = process.env.PHONEPE_MERCHANT_ID || "";
      const saltKey = process.env.PHONEPE_SALT_KEY || "";
      const saltIndex = process.env.PHONEPE_SALT_INDEX || "1";
      const phonepeEnv = process.env.PHONEPE_ENV || "sandbox";

      // If credentials are NOT configured, fallback immediately to simulated demo mode
      if (!merchantId || !saltKey) {
        console.log("No PhonePe credentials. Running in Simulated Sandbox mode.");
        return res.json({
          success: true,
          simulated: true,
          transactionId: "SIM_TXN_" + Date.now() + "_" + Math.floor(Math.random() * 1000)
        });
      }

      const transactionId = "TXN_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
      const appBaseUrl = process.env.APP_BASE_URL || `${req.protocol}://${req.get("host")}`;

      const paymentPayload = {
        merchantId,
        merchantTransactionId: transactionId,
        merchantUserId: userId,
        amount: (amount || 90) * 100, // paise (₹90 = 9000 paise)
        redirectUrl: `${appBaseUrl}/api/phonepe/callback?userId=${userId}&txnId=${transactionId}`,
        redirectMode: "POST",
        callbackUrl: `${appBaseUrl}/api/phonepe/callback?userId=${userId}&txnId=${transactionId}`,
        paymentInstrument: {
          type: "PAY_PAGE"
        }
      };

      const base64Data = Buffer.from(JSON.stringify(paymentPayload)).toString("base64");
      const stringToSign = base64Data + "/pg/v1/pay" + saltKey;
      const sha256 = crypto.createHash("sha256").update(stringToSign).digest("hex");
      const checksum = sha256 + "###" + saltIndex;

      const apiEndpoint = phonepeEnv === "production"
        ? "https://api.phonepe.com/apis/hermes/pg/v1/pay"
        : "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay";

      console.log(`Contacting PhonePe API at: ${apiEndpoint}`);
      const phonepeResponse = await axios.post(
        apiEndpoint,
        { request: base64Data },
        {
          headers: {
            "Content-Type": "application/json",
            "X-VERIFY": checksum,
            "accept": "application/json"
          },
          timeout: 10000
        }
      );

      if (phonepeResponse.data && phonepeResponse.data.success) {
        const url = phonepeResponse.data.data.instrumentResponse.redirectInfo.url;
        return res.json({
          success: true,
          simulated: false,
          transactionId,
          url,
          env: phonepeEnv
        });
      } else {
        throw new Error(phonepeResponse?.data?.message || "Invalid API response");
      }
    } catch (error: any) {
      console.error("PhonePe Initiation Failed (falling back to Simulation Mode):", error?.response?.data || error?.message);
      return res.json({
        success: true,
        simulated: true,
        transactionId: "SIM_FAILOVER_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        warning: "Fallback to Demo mode due to API gateway error."
      });
    }
  });

  // Direct checkout/simulation success trigger
  app.post("/api/phonepe/simulate-success", async (req, res) => {
    try {
      const { userId, transactionId } = req.body;
      if (!userId) {
        return res.status(400).json({ success: false, error: "userId is required" });
      }

      console.log(`Direct simulation success triggered for user ${userId}, txn: ${transactionId}`);

      if (db) {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
          isSubscribed: true,
          updatedAt: new Date()
        });

        const subRef = doc(db, "subscriptions", userId);
        await setDoc(subRef, {
          status: "active",
          plan: "pro",
          updatedAt: Date.now()
        }, { merge: true });
        
        console.log(`Firestore updated successfully via simulation.`);
      }

      res.json({ success: true });
    } catch (err: any) {
      console.error("Direct simulation success error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Support both GET and POST for callback
  const handleCallback = async (req: any, res: any) => {
    try {
      const { userId, txnId } = req.query;
      let paymentSuccess = false;

      const merchantId = process.env.PHONEPE_MERCHANT_ID || "";
      const saltKey = process.env.PHONEPE_SALT_KEY || "";
      const saltIndex = process.env.PHONEPE_SALT_INDEX || "1";
      const phonepeEnv = process.env.PHONEPE_ENV || "sandbox";

      console.log(`PhonePe Callback received for userId: ${userId}, txnId: ${txnId}`);

      if (txnId && (txnId.startsWith("SIM_") || txnId.startsWith("MOCK_"))) {
        // Simulated checkout success
        paymentSuccess = true;
      } else if (merchantId && saltKey && txnId) {
        // Real checkout status validation using PhonePe Transaction Status API
        try {
          const stringToSign = `/pg/v1/status/${merchantId}/${txnId}${saltKey}`;
          const sha256 = crypto.createHash("sha256").update(stringToSign).digest("hex");
          const checksum = sha256 + "###" + saltIndex;

          const statusEndpoint = phonepeEnv === "production"
            ? `https://api.phonepe.com/apis/hermes/pg/v1/status/${merchantId}/${txnId}`
            : `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${merchantId}/${txnId}`;

          const statusResponse = await axios.get(statusEndpoint, {
            headers: {
              "Content-Type": "application/json",
              "X-VERIFY": checksum,
              "X-MERCHANT-ID": merchantId,
              "accept": "application/json"
            }
          });

          if (statusResponse.data && statusResponse.data.success && statusResponse.data.code === "PAYMENT_SUCCESS") {
            paymentSuccess = true;
          }
        } catch (err) {
          console.error("Error querying PhonePe transaction status:", err);
          // Check post form parameters if status API failed
          const { code } = req.body;
          if (code === "PAYMENT_SUCCESS") {
            paymentSuccess = true;
          }
        }
      } else {
        paymentSuccess = true;
      }

      if (paymentSuccess && userId && db) {
        console.log(`Payment confirmed success for user ${userId}. Activating subscription...`);
        try {
          const userRef = doc(db, "users", userId);
          await updateDoc(userRef, {
            isSubscribed: true,
            updatedAt: new Date()
          });

          const subRef = doc(db, "subscriptions", userId);
          await setDoc(subRef, {
            status: "active",
            plan: "pro",
            updatedAt: Date.now()
          }, { merge: true });

          console.log(`Firestore updated successfully for user ${userId}.`);
        } catch (fsErr) {
          console.error("Error updating Firestore from server-side callback", fsErr);
        }
      }

      // Redirect user back to parent app with success/failure string
      const appBaseUrl = process.env.APP_BASE_URL || `${req.protocol}://${req.get("host")}`;
      if (paymentSuccess) {
        res.redirect(`${appBaseUrl}/?payment=success&id=${txnId}`);
      } else {
        res.redirect(`${appBaseUrl}/?payment=failed&id=${txnId}`);
      }
    } catch (error) {
      console.error("Callback error:", error);
      res.redirect("/?payment=failed");
    }
  };

  app.post("/api/phonepe/callback", handleCallback);
  app.get("/api/phonepe/callback", handleCallback);

  // --- End of PhonePe Payment Gateway APIs ---

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

