import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  // Always set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { message, history, systemInstruction, tools } = req.body;
    
    // Support both production variable names
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: "GEMINI_API_KEY is not configured on your Vercel project. Please add GEMINI_API_KEY as an environment variable in your Vercel Project Settings." 
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build-vercel',
        }
      }
    });

    // Prepare contents from history and current message
    const contents = (history || []).map((m: any) => ({
      role: m.role || 'user',
      parts: [{ text: m.content || "" }]
    }));
    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Use 2.5 flash or standard flash model
      contents,
      config: {
        systemInstruction,
        tools,
        temperature: 0.7,
        topP: 1,
        topK: 1
      }
    });
    
    res.status(200).json({ 
      text: response.text,
      functionCalls: response.functionCalls
    });
  } catch (error: any) {
    console.error("Vercel Serverless Gemini API Error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
