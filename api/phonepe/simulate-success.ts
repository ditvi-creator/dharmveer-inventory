import { doc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../utils/firebase";

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
    const { userId, transactionId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: "userId is required" });
    }

    console.log(`Vercel function: direct simulation success triggered for user ${userId}, txn: ${transactionId}`);

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
      
      console.log(`Vercel Firestore updated successfully via simulation.`);
    } else {
      console.warn("Firestore db was not initialized for simulation success.");
    }

    res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("Vercel simulation success error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}
