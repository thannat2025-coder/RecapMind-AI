import { GoogleGenAI } from "@google/genai";
import { GOLDEN_CASES, NOTE_SCHEMA_JSON } from "../constants";
import { ClinicalNote } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const baselineSystemPrompt = `คุณคือจิตแพทย์ผู้เชี่ยวชาญด้านจิตเวชศาสตร์เด็ก วัยรุ่น และ Cognitive Behavioral Therapy (CBT)
หน้าที่ของคุณคือการทำหน้าที่เป็น "AI Clinical Scribe" วิเคราะห์และสรุปบทสนทนาให้เป็นเวชระเบียน

กฎเหล็ก:
1. สกัดเฉพาะข้อมูลที่มีอยู่จริง ห้ามแต่งเติม (Zero Hallucination)
2. ระบุเทคนิค CBT ที่ใช้ให้ถูกต้อง
3. วิเคราะห์ Mental Status โดยแยก Mood, Thought, Behavior, Physical Reaction
4. ตอบเป็น JSON เท่านั้น — ห้ามมีข้อความอื่นนอก JSON
5. ต้องกรอกครบทุก key ใน JSON (mood_check, bridge, agenda, homework_review, new_topics, cbt_model {situation, mood, thoughts, behavior, physical}, intervention, plan_homework, summary, feedback_appointment)
6. ถ้าไม่มีข้อมูลในบทสนทนาให้ใส่ "NA"

โครงสร้าง JSON ที่ต้องการ:
${NOTE_SCHEMA_JSON}`;

export function getRAGSystemPrompt(retrievedCases: typeof GOLDEN_CASES) {
  const examples = retrievedCases.map((c, i) => `
[Example ${i + 1}] ${c.id}: ${c.th}
Transcript excerpt: "${c.tx.slice(0, 300)}..."
Expert Note:
  mood_check: "${c.mood_check}"
  bridge: "${c.bridge}"
  agenda: "${c.agenda}"
  homework_review: "${c.homework_review}"
  new_topics: "${c.new_topics}"
  cbt_model:
    situation: "${c.cbt_model.situation}"
    mood: "${c.cbt_model.mood}"
    thoughts: "${c.cbt_model.thoughts}"
    behavior: "${c.cbt_model.behavior}"
    physical: "${c.cbt_model.physical}"
  intervention: "${c.intervention}"
  plan_homework: "${c.plan_homework}"
  summary: "${c.summary}"
  feedback_appointment: "${c.feedback_appointment}"
`).join('\n\n');

  return `คุณคือจิตแพทย์ผู้เชี่ยวชาญด้าน CBT และ AI Clinical Scribe (RAG Mode)

กฎเหล็ก:
1. สกัดเฉพาะข้อมูลที่มีอยู่จริง ห้ามแต่งเติม
2. ตอบเป็น JSON เท่านั้น (ทุก key ต้องมีครบ)

=== RETRIEVED GOLDEN CASES (Top-${retrievedCases.length}) ===
${examples}

สรุป Transcript ปัจจุบันโดยใช้แนวทางจากตัวอย่างด้านบนลงใน JSON:
${NOTE_SCHEMA_JSON}`;
}

export const fineTunedSystemPrompt = `คุณคือจิตแพทย์ผู้เชี่ยวชาญด้านจิตเวชศาสตร์เด็ก วัยรุ่น และ Cognitive Behavioral Therapy (CBT)
หน้าที่ของคุณคือการทำหน้าที่เป็น "AI Clinical Scribe" แบบ Fine-tuned (ใช้เคสจริง 150 เคสเป็นฐานความรู้)

กฎเหล็ก:
1. วิเคราะห์เจาะลึกเฉพาะข้อมูลที่มีอยู่จริง (Zero Hallucination)
2. เชื่อมโยง CBT Model ให้แม่นยำ (Thoughts, Behavior, Physical, Coping)
3. ตอบเป็น JSON เท่านั้น

โครงสร้าง JSON:
${NOTE_SCHEMA_JSON}`;

export async function generateClinicalNote(transcript: string, modelType: 'baseline' | 'rag' | 'finetuned', ragCases?: typeof GOLDEN_CASES): Promise<ClinicalNote> {
  let systemPrompt = baselineSystemPrompt;
  if (modelType === 'rag' && ragCases) {
    systemPrompt = getRAGSystemPrompt(ragCases);
  } else if (modelType === 'finetuned') {
    systemPrompt = fineTunedSystemPrompt;
  }

  const prompt = `CBT Session Transcript (De-identified):\n\n${transcript}\n\nสรุปเป็น JSON format ที่กำหนด`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      }
    });

    const text = response.text || "{}";
    return JSON.parse(text) as ClinicalNote;
  } catch (error) {
    console.error(`Error generating clinical note for ${modelType}:`, error);
    throw error;
  }
}
