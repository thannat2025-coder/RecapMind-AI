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

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Common helper for Gemini API calls with retries and fallbacks
async function generateContentWithRetryAndFallback(options: {
  primaryModel: string;
  contents: any;
  config?: any;
}) {
  // Use gemini-3.5-flash by default if a deprecated model format is received
  let modelName = options.primaryModel;
  if (modelName === "gemini-flash-latest" || modelName === "gemini-1.5-flash") {
    modelName = "gemini-3.5-flash";
  }

  const modelsToTry = [modelName, "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const currentModel of modelsToTry) {
    let delay = 1000;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Gemini API] Requesting ${currentModel} (Attempt ${attempt}/${maxRetries})...`);
        const result = await ai.models.generateContent({
          model: currentModel,
          contents: options.contents,
          config: options.config,
        });
        return result;
      } catch (err: any) {
        lastError = err;
        const errMessage = err?.message || String(err);
        const isTemporaryError =
          errMessage.includes("503") ||
          errMessage.toLowerCase().includes("unavailable") ||
          errMessage.toLowerCase().includes("high demand") ||
          errMessage.includes("429") ||
          errMessage.toLowerCase().includes("rate limit") ||
          errMessage.toLowerCase().includes("overloaded");

        console.warn(`[Gemini API Warning] Model: ${currentModel}, Attempt: ${attempt}/${maxRetries} failed. Error: ${errMessage}`);

        if (isTemporaryError && attempt < maxRetries) {
          console.log(`[Gemini API] Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
        } else {
          // Break to next model in list if non-retryable or we ran out of attempts for current model
          break;
        }
      }
    }
  }

  throw lastError || new Error("All models failed after multiple retries");
}

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
    console.log(`[API /api/transcribe] Calling speech transcription flow...`);
    
    const response = await generateContentWithRetryAndFallback({
      primaryModel: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: audioData
          }
        },
        {
          text: "กรุณาถอดคำพูดจากการอัดเสียงภาษาไทยนี้อย่างละเอียดและครบถ้วนที่สุด โดยเขียนออกมาเป็นบทสนทนา (Thai Transcription) ให้สมบูรณ์ที่สุด ห้ามละและห้ามสรุปความเด็ดขาด หากมีการหารือหรือประเมินในบทสนทนาให้ระบุทั้งหมดให้ตรงตามจริง และไม่ต้องพิมพ์ปูบทนำหรือคำลงท้ายใดๆ"
        }
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
    const result = await generateContentWithRetryAndFallback({
      primaryModel: "gemini-3.5-flash",
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
