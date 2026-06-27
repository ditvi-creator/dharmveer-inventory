import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import fs from "fs";
import path from "path";

let db: any = null;

try {
  const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(firebaseConfigPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
    const firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId || "(default)");
    console.log("Firebase initialized successfully for Vercel Serverless Function.");
  } else {
    console.warn("firebase-applet-config.json not found at standard path:", firebaseConfigPath);
  }
} catch (err) {
  console.error("Failed to initialize Firebase in Vercel helper:", err);
}

export { db };
