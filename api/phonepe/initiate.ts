import crypto from "crypto";
import axios from "axios";

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

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
      return res.status(200).json({
        success: true,
        simulated: true,
        transactionId: "SIM_TXN_" + Date.now() + "_" + Math.floor(Math.random() * 1000)
      });
    }

    const transactionId = "TXN_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
    const appBaseUrl = process.env.APP_BASE_URL || `https://${req.headers.host}`;

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
      return res.status(200).json({
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
    return res.status(200).json({
      success: true,
      simulated: true,
      transactionId: "SIM_FAILOVER_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      warning: "Fallback to Demo mode due to API gateway error."
    });
  }
}
