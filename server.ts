import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// API Route for Audio/Video File Transcription to Thai Text
app.post("/api/transcribe", async (req, res) => {
  const { audioData, mimeType } = req.body;

  console.log(`[API /api/transcribe] New request received. mimeType: ${mimeType}, dataLen: ${audioData ? audioData.length : 0}`);

  if (!process.env.GEMINI_API_KEY) {
    console.error(`[API /api/transcribe] Missing GEMINI_API_KEY env variable.`);
    return res.status(500).json({ error: "GEMINI_API_KEY is not set on the server." });
  }

  if (!audioData || !mimeType) {
    console.error(`[API /api/transcribe] Missing parameter. audioData: ${!!audioData}, mimeType: ${mimeType}`);
    return res.status(400).json({ error: "Missing audioData or mimeType" });
  }

  try {
    console.log(`[API /api/transcribe] Calling Gemini-3.5-flash for speech transcription...`);
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: audioData
          }
        },
        "กรุณาถอดคำพูดจากการอัดเสียงภาษาไทยนี้อย่างละเอียดและครบถ้วนที่สุด โดยเขียนออกมาเป็นบทสนทนา (Thai Transcription) ให้สมบูรณ์ที่สุด ห้ามละและห้ามสรุปความเด็ดขาด หากมีการหารือหรือประเมินในบทสนทนาให้ระบุทั้งหมดให้ตรงตามจริง และไม่ต้องพิมพ์ปูบทนำหรือคำลงท้ายใดๆ"
      ]
    });

    console.log(`[API /api/transcribe] Transcription success. Result length: ${response.text ? response.text.length : 0} chars.`);
    res.json({ text: response.text });
  } catch (error) {
    console.error("[API /api/transcribe] Transcription API Error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// API Route for Gemini Proxy
app.post("/api/generate-note", async (req, res) => {
  const { prompt, systemInstruction } = req.body;
  
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not set on the server." });
  }

  try {
    const model = "gemini-flash-latest";
    const result = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
      }
    });

    res.json({ text: result.text });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// JSON Error Handling Middleware for Express to catch parsing and body-parser limits gracefully
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[Express Middleware Error]", err);
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || "Internal Server Error",
    details: err.status === 413 ? "File size or request payload is too large to process. Please try uploading a smaller file." : undefined
  });
});

async function startServer() {
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
