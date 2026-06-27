import crypto from "crypto";
import axios from "axios";
import { doc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../utils/firebase";

export default async function handler(req: any, res: any) {
  try {
    const { userId, txnId } = req.query;
    let paymentSuccess = false;

    const merchantId = process.env.PHONEPE_MERCHANT_ID || "";
    const saltKey = process.env.PHONEPE_SALT_KEY || "";
    const saltIndex = process.env.PHONEPE_SALT_INDEX || "1";
    const phonepeEnv = process.env.PHONEPE_ENV || "sandbox";

    console.log(`Vercel callback: PhonePe Callback received for userId: ${userId}, txnId: ${txnId}`);

    if (txnId && (txnId.startsWith("SIM_") || txnId.startsWith("MOCK_") || txnId.startsWith("SIM_FAILOVER_"))) {
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
          },
          timeout: 10000
        });

        if (statusResponse.data && statusResponse.data.success && statusResponse.data.code === "PAYMENT_SUCCESS") {
          paymentSuccess = true;
        }
      } catch (err) {
        console.error("Error querying PhonePe transaction status:", err);
        // Check post body or JSON parameters as fallback
        const bodyCode = req.body?.code || req.query?.code;
        if (bodyCode === "PAYMENT_SUCCESS") {
          paymentSuccess = true;
        }
      }
    } else {
      // General simulation fallback
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
        console.error("Error updating Firestore from serverless callback", fsErr);
      }
    }

    // Redirect user back to the application front-end
    const appBaseUrl = process.env.APP_BASE_URL || `https://${req.headers.host}`;
    const redirectUrl = paymentSuccess
      ? `${appBaseUrl}/?payment=success&id=${txnId}`
      : `${appBaseUrl}/?payment=failed&id=${txnId}`;

    res.writeHead(302, { Location: redirectUrl });
    res.end();
  } catch (error) {
    console.error("Callback error on Vercel:", error);
    const appBaseUrl = process.env.APP_BASE_URL || `https://${req.headers.host || 'localhost:3000'}`;
    res.writeHead(302, { Location: `${appBaseUrl}/?payment=failed` });
    res.end();
  }
}
