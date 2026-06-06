import { CASE_EXAMPLES, NOTE_SCHEMA_JSON } from "../constants";
import { ClinicalNote } from "../types";

export const baselineSystemPrompt = `คุณคือจิตแพทย์ผู้เชี่ยวชาญด้านจิตเวชศาสตร์เด็ก วัยรุ่น และ Cognitive Behavioral Therapy (CBT)
หน้าที่ของคุณคือการทำหน้าที่เป็น "AI Clinical Scribe" วิเคราะห์และสรุปบทสนทนาให้เป็นเวชระเบียน

กฎเหล็ก:
1. สกัดเฉพาะข้อมูลที่มีอยู่จริง ห้ามแต่งเติม (Zero Hallucination)
2. ระบุเทคนิค CBT ที่ใช้ให้ถูกต้อง
3. วิเคราะห์ Mental Status โดยแยก Mood, Thought, Behavior, Physical Reaction
4. ตอบเป็นภาษาไทยทั้งหมด: สรุปโดยใช้ภาษาไทยที่สละสลวยและเป็นทางการตามแบบแผนของแพทย์ไทย ไม่ต้องใส่วงเล็บภาษาอังกฤษกำกับในคำศัพท์เทคนิค (ยกเว้นกรณีที่จำเป็นอย่างยิ่งและไม่มีคำไทยทดแทนที่สื่อความหมายได้)
5. ตอบเป็น JSON เท่านั้น — ห้ามมีข้อความอื่นนอก JSON
6. ต้องกรอกครบทุก key ใน JSON (mood_check, bridge, agenda, homework_review, new_topics, cbt_model {situation, mood, thoughts, behavior, physical}, intervention, plan_homework, summary, feedback_appointment)
7. ถ้าไม่มีข้อมูลในบทสนทนาให้ใส่ "NA"

โครงสร้าง JSON ที่ต้องการ:
${NOTE_SCHEMA_JSON}`;

export function getRAGSystemPrompt(retrievedCases: typeof CASE_EXAMPLES) {
  const examples = retrievedCases.map((c, i) => `
[Example ${i + 1}] ${c.id}: ${c.th}
Clinical Transcript: "${c.tx}"
Expert Note Summary:
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

  return `คุณคือจิตแพทย์ผู้เชี่ยวชาญด้าน CBT และ AI Clinical Scribe (Expert RAG Mode)
หน้าที่ของคุณคือสรุปบทสนทนาบำบัดให้เป็น Clinical Note คุณภาพสูง โดยใช้สไตล์และระดับรายละเอียดตามตัวอย่างที่ให้มา

กฎการวิเคราะห์ (Expert Guidelines):
1. **Zero Hallucination**: สกัดเฉพาะข้อมูลที่มีอยู่จริง ห้ามแต่งเติมเด็ดขาด
2. **Clinical Language (Thai)**: ใช้ภาษาไทยทางคลินิกที่กระชับและเป็นทางการ ไม่ต้องใส่วงเล็บภาษาอังกฤษกำกับ (ถ้าไม่จำเป็น)
3. **CBT Specifics**: ระบุเทคนิค CBT ที่เกิดขึ้นในบทสนทนาโดยใช้คำเรียกภาษาไทยที่เป็นมาตรฐาน
4. **Mental Status**: แยกแยะองค์ประกอบพุทธิปัญญา พฤติกรรม และอาการทางกายใน CBT Model ให้ชัดเจน

คำแนะนำในการสรุป (Learning from Examples):
- ดูแนวทางการสรุปจาก "Expert Note Summary" ในเคสตัวอย่างด้านล่าง
- หากใน Transcript ปัจจุบันไม่มีข้อมูลในส่วนใด ให้ใส่ "NA"
- ตอบเป็น JSON เท่านั้น (ทุก key ต้องมีครบ)

=== RETRIEVED CASE EXAMPLES (Top-${retrievedCases.length}) ===
${examples}

สรุป Transcript ปัจจุบันโดยใช้ภาษาไทยสไตล์แพทย์ไทยตามแนวทางจากตัวอย่างด้านบนลงใน JSON:
${NOTE_SCHEMA_JSON}`;
}

export const fineTunedSystemPrompt = `คุณคือจิตแพทย์ผู้เชี่ยวชาญด้านจิตเวชศาสตร์เด็ก วัยรุ่น และ Cognitive Behavioral Therapy (CBT)
หน้าที่ของคุณคือการทำหน้าที่เป็น "AI Clinical Scribe" แบบ Fine-tuned (ใช้เคสจริง 150 เคสเป็นฐานความรู้)

กฎเหล็ก:
1. วิเคราะห์เจาะลึกเฉพาะข้อมูลที่มีอยู่จริง (Zero Hallucination)
2. เชื่อมโยง CBT Model ให้แม่นยำ (Thoughts, Behavior, Physical, Coping)
3. ตอบเป็นภาษาไทยทางคลินิกที่สละสลวยเท่านั้น ไม่ต้องใส่วงเล็บภาษาอังกฤษกำกับ
4. ตอบเป็น JSON ที่ถูกต้องสมบูรณ์ (Valid JSON) เท่านั้น — ห้ามมีข้อความอื่นใด ห้ามมี Markdown code blocks (เช่น \`\`\`json) อยู่ในคำตอบ

โครงสร้าง JSON:
${NOTE_SCHEMA_JSON}`;

export async function generateClinicalNote(
  transcript: string, 
  modelType: 'baseline' | 'rag' | 'finetuned', 
  ragCases?: typeof CASE_EXAMPLES,
  caseTheme?: string
): Promise<ClinicalNote> {
  let systemPrompt = baselineSystemPrompt;
  if (modelType === 'rag' && ragCases) {
    systemPrompt = getRAGSystemPrompt(ragCases);
  } else if (modelType === 'finetuned') {
    systemPrompt = fineTunedSystemPrompt;
  }

  const prompt = `Case Theme/Context: ${caseTheme || 'General Mental Health'}\n\nCBT Session Transcript (De-identified):\n\n${transcript}\n\nสรุปเป็น JSON format ที่กำหนด`;

  try {
    const response = await fetch('/api/generate-note', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        systemInstruction: systemPrompt
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate note via proxy');
    }

    const data = await response.json();
    const rawText = data.text || "{}";
    
    // Robustly find and parse the JSON object
    let cleanedText = rawText.trim();
    
    // Remove potential markdown blocks if present (though responseMimeType: "application/json" should prevent this)
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```(?:json)?/, '').replace(/```$/, '').trim();
    }

    try {
      return JSON.parse(cleanedText) as ClinicalNote;
    } catch (parseError) {
      // If parsing fails, it might be due to trailing noise (like an extra closing brace)
      // Attempt to find the first valid JSON object starting from the first '{'
      const firstBrace = cleanedText.indexOf('{');
      if (firstBrace !== -1) {
        const potentialJson = cleanedText.substring(firstBrace);
        // Find all indices of '}' and try to parse the substring
        const closingBraceIndices: number[] = [];
        for (let i = 0; i < potentialJson.length; i++) {
          if (potentialJson[i] === '}') {
            closingBraceIndices.push(i);
          }
        }

        // Try candidate strings from longest to shortest
        for (let i = closingBraceIndices.length - 1; i >= 0; i--) {
          const candidate = potentialJson.substring(0, closingBraceIndices[i] + 1);
          try {
            return JSON.parse(candidate) as ClinicalNote;
          } catch (e) {
            // keep trying
          }
        }
      }

      console.error("Failed to parse JSON text after extraction attempts:", cleanedText);
      throw new Error(`Invalid JSON format from AI: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }
  } catch (error) {
    console.error(`Error generating clinical note for ${modelType}:`, error);
    throw error;
  }
}
