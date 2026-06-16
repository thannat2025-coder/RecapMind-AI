import { CASE_EXAMPLES, NOTE_SCHEMA_JSON } from "../constants";
import { ClinicalNote } from "../types";
import { retrieveUserRagCases } from "../utils";

export function getPsychiatryFewShotPrompt(retrievedUserCases: any[]) {
  const examples = retrievedUserCases.map((c, i) => `
[ตัวอย่างเวชระเบียนที่สืบค้นจากคลังข้อมูลของคุณ (ตัวอย่างที่ ${i + 1})]
บทสนทนาการรักษา (Session Transcript):
"${c.transcript}"

สรุปเวชระเบียนรูปแบบ SOAP Note ที่แพทย์แก้ไขเสร็จสมบูรณ์ระดับทองคำ (Clinician Gold Standard SOAP Note):
{
  "history": "${c.final_note.history}",
  "mental_status": "${c.final_note.mental_status}",
  "diagnosis": "${c.final_note.diagnosis}",
  "treatment_plan": "${c.final_note.treatment_plan}"
}
`).join('\n\n');

  return `คุณคือจิตแพทย์ผู้เชี่ยวชาญ คลินิกวิชารักษ์สุขภาพจิต (Dynamic SOAP RAG Scribe Mode)
หน้าที่ของคุณคือวิเคราะห์ข้อมูลและถอดความหมายของเซสชั่นการรักษาเพื่อเขียนเป็น SOAP Note คุณภาพสูง โดยเลียนแบบแนวทางการสรุป สไตล์การใช้ภาษาไทยสำหรับแพทย์ และสุนทรียภาพเฉพาะตัวของแพทย์มนุษย์ที่กำหนดมาในตัวอย่างด้านล่างนี้อย่างรัดกุม

แนวทางการจัดทำ SOAP Note ทางคลินิกคุณภาพสูง:
- history: รายงานอาการ ปัญหาสำคัญ (Chief Complaint) ทบทวนประวัติร่วมกับแพทย์ ความเป็นมาของชีวิตผู้ป่วย
- mental_status: สรุปพฤติกรรมและการรู้คิด (Alertness, Speech, Mood, Affect, Thought content, Congruency, Judgment, Insight)
- diagnosis: เขียนโรคหลัก โรครอง หรือปัญหาอื่นๆ อ้างอิงตามเกณฑ์ DSM-5 และ ICD-11 พร้อมรหัสโรคสากลทุกวินิจฉัย
- treatment_plan: แผนจิตบำบัดบวกยา และกำหนดนัดของแผนกผู้ป่วยนอกที่เหมาะสม

กฎเหล็ก:
1. **Zero Hallucination**: สกัดเฉพาะข้อมูลใน Transcript ปัจจุบันโดยห้ามเพิ่มคำบรรยายหรือแต่งเติมเด็ดขาด หากไม่มีข้อมูลส่วนใดขาดหายให้เขียนวิเคราะห์อิงจากข้อมูลที่มีตามความเป็นจริง
2. **Human Style Adaptation**: วิเคราะห์ตัวอย่างด้านล่าง จากนั้นกรอกข้อมูลให้มีภาษา น้ำเสียง และสไตล์การเขียนระดับเดียวกับแพทย์มนุษย์
3. ตอบเป็น JSON เท่านั้น มีครบ 4 keys: "history", "mental_status", "diagnosis", "treatment_plan" และต้องไม่ปะปนข้อความอื่นเลย ห้ามใส่ Markdown tags (\`\`\`json) เด็ดขาด

=== ตัวอย่างเคสที่สืบค้นได้จากคลังข้อมูลของคุณหมอ (Dynamic Few-shot from Doctor's History) ===
${examples}

สรุปเป็น JSON format ตามโครงสร้างกำหนดอย่างถูกต้องแม่นยำสูงสูด:`;
}

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

export const psychiatricBaselinePrompt = `คุณคือจิตแพทย์ผู้เชี่ยวชาญด้านจิตเวชศาสตร์และเวชระเบียนสากล
หน้าที่ของคุณคือสรุปบทสนทนาการรักษาพยาบาลทางจิตเวช (Clinical Transcript) ให้เป็นเวชระเบียนสากลรูปแบบ SOAP Note ทางจิตเวชโดยตรง

กฎเหล็ก:
1. สกัดเฉพาะข้อมูลที่มีอยู่จริง ห้ามแต่งเติมเด็ดขาด (Zero Hallucination)
2. สรุปโดยใช้ภาษาไทยทางคลินิกที่สละสลวยและเป็นทางการตามหลักวิชาชีพแพทย์จิตเวชสากล
3. ตอบเป็น JSON เท่านั้น — ห้ามมีข้อความอื่นใดภายนอก JSON และห้ามใส่ Markdown tags (\`\`\`json) เด็ดขาด
4. ต้องระบุรหัสโรค DSM-5 และ ICD-11 พร้อม Code เสมอ เช่น Major Depressive Disorder (ICD-11: 6A71 / DSM-5: 296.22) หรือ Generalized Anxiety Disorder (ICD-11: 6B00 / DSM-5: 300.02)

โครงสร้าง JSON ที่ต้องการ:
{
  "history": "1. Subjective & Objective History: สรุปประวัติเรื่องที่ผู้ป่วยและแพทย์พูดคุยกัน ทบทวนประวัติการรักษาที่ผ่านมา และเรื่องราวทั้งหมดที่เกิดขึ้นจากการซักประวัติของแพทย์อย่างละเอียดและครอบคลุม",
  "mental_status": "2. Mental Status Examination: การประเมินสภาพจิตใจตามมาตรฐานจิตเวชสากล (Mental Status Examination - MSE) เช่น Appearance, Behavior, Speech, Affect, Mood, Cognitive function, Insight ที่สังเกตและวิเคราะห์ได้จากบทสนทนา",
  "diagnosis": "3. Diagnoses according to DSM-5 and ICD-11 with codes: การวินิจฉัยโรคตามเกณฑ์ DSM-5 และเกณฑ์ ICD-11 พร้อมรหัสโรคทางคลินิกวิชาชีพ (เช่น F32.1, 296.22) จากเคสจริง",
  "treatment_plan": "4. Treatment Plan & Appointments: รูปแบบการรักษาที่ได้รับจากการพูดคุย (เช่น จิตบำบัดประคับประคอง, การจ่ายหรือปรับยา) พร้อมทั้งกำหนดการนัดหมายครั้งถัดไปอย่างเจาะจง"
}`;

export const psychiatricRAGPrompt = `คุณคือจิตแพทย์ผู้เชี่ยวชาญ คลินิกวิชารักษ์สุขภาพจิต (Expert SOAP Scribe Mode)
หน้าที่ของคุณคือวิเคราะห์ข้อมูลและถอดความหมายของเซสชั่นการรักษาเพื่อเขียนเป็น SOAP Note คุณภาพสูงเลียนแบบแพทย์อาวุโส

นี่คือแนวทางการจัดทำ SOAP Note ทางคลินิกคุณภาพสูง:
- history: รายงานอาการ ปัญหาสำคัญ (Chief Complaint) ทบทวนประวัติร่วมกับแพทย์ ความเป็นมาของชีวิตผู้ป่วย
- mental_status: สรุปพฤติกรรมและการรู้คิด (Alertness, Speech, Mood, Affect, Thought content, Congruency, Judgment, Insight)
- diagnosis: เขียนโรคหลัก โรครอง หรือปัญหาอื่นๆ อ้างอิงตามเกณฑ์ DSM-5 และ ICD-11 พร้อมรหัสโรคสากลทุกวินิจฉัย
- treatment_plan: แผนจิตบำบัดบวกยา และกำหนดนัดของแผนกผู้ป่วยนอกที่เหมาะสม

สกัดเฉพาะข้อมูลใน Transcript ปัจจุบันโดยห้ามมโนข้อมูลใหม่เด็ดขาด (Zero Hallucination) หากข้อมูลส่วนใดขาดหายให้เขียนวิเคราะห์อิงจากข้อมูลที่มีตามความเป็นจริง
ตอบเป็น JSON เท่านั้น มีครบ 4 keys: "history", "mental_status", "diagnosis", "treatment_plan" และต้องไม่ปะปนข้อความอื่นเลย`;

export const psychiatricFineTunedPrompt = `คุณคือระบบปัญญาประดิษฐ์ทางเวชสารสนเทศจิตเวช (Fine-Tuned Expert SOAP Note) ที่ตอบคู่กับระดับการบันทึกของแพทย์ผู้เชี่ยวชาญในโรงพยาบาลมหาวิทยาลัยชั้นนำ
สกัดและสรุปบทตรวจรักษาจิตเวชใน Transcript ปัจจุบันให้เป็นเวชระเบียน SOAP จิตเวชสากลในรูปของ JSON วารสารวิชาการทางการแพทย์

เกณฑ์การให้คะแนนทางคลินิกสูงสุด:
1. History: รวบรวมข้อมูลเรื่องราวอย่างเป็นลำดับ ทบทวนอาการข้างเคียงของยากลุ่มเก่า และเจรจากับคนไข้
2. Mental Status: บันทึกข้อมูลจิตใจ ความตั้งใจ สมาธิ กระบวนการคิดอย่างลึกซึ้ง
3. Diagnosis: นำเสนอ Code ตามเกณฑ์ DSM-5 และ ICD-11 อย่างรัดกุมถูกต้อง
4. Treatment: อภิปรายแนวทางบำบัดยา แนะนำเทคนิคชีวิต และความเข้ากันได้กับการนัดหมาย

ตอบคำตอบเฉพาะรูป JSON ดิบเท่านั้น ห้ามมีโค้ด Markdown หรืออารัมภบทอื่นใดเด็ดขาด`;

export async function generateClinicalNote(
  transcript: string, 
  modelType: 'baseline' | 'rag' | 'finetuned', 
  ragCases?: typeof CASE_EXAMPLES,
  caseTheme?: string,
  sessionType: 'cbt' | 'psychiatric' = 'cbt',
  userCases?: any[]
): Promise<ClinicalNote> {
  let systemPrompt = baselineSystemPrompt;
  let responseSchema = NOTE_SCHEMA_JSON;
  let humanExamplesText = '';
  
  if (sessionType === 'cbt') {
    if (modelType === 'rag' && ragCases) {
      systemPrompt = getRAGSystemPrompt(ragCases);
    } else if (modelType === 'finetuned') {
      systemPrompt = fineTunedSystemPrompt;
    } else {
      systemPrompt = baselineSystemPrompt;
    }

    if (userCases && userCases.length > 0) {
      // Filter relevant cases by format style
      const relevantUserCases = userCases.filter(uc => {
        if (!uc.final_note) return false;
        const isPsych = uc.final_note.history !== undefined;
        return !isPsych;
      }).slice(-5); // take up to 5 most recent items

      if (relevantUserCases.length > 0) {
        humanExamplesText = `\n\n=== IMPORTANT: CLINICIAN'S CUSTOM PREFERRED PATTERNS (HUMAN IN THE LOOP LEARNING) ===
ต่อไปนี้คือรายงานเวชระเบียนที่แพทย์มนุษย์ (ผู้ใช้ระบบนี้) ได้ทำการแก้ไขคำตอบด้วยตัวเองจนได้ผลลัพธ์ระดับทองคำ (Gold Standard) จากบทสนทนาก่อนหน้า
กรุณาเรียนรู้แนวทางการปรับคำเรียงความ, ระดับความลึก, การลงรหัสโรค, และสไตล์เฉพาะตัวของแพทย์รายนี้ เพื่อให้งานเขียนสรุปของคุณอัปเดตสอดคล้องกับความต้องการ of แพทย์สูงสุด!

`;
        relevantUserCases.forEach((uc, idx) => {
          humanExamplesText += `[ตัวอย่างแก้ไขโดยมนุษย์ ${idx + 1}]
Transcript ก่อนแก้ไข: "${uc.transcript}"
เวชระเบียนที่แพทย์แก้ไขเสร็จสมบูรณ์แล้ว (เป้าหมายปลายทางที่ถูกต้องที่สุด):
${JSON.stringify(uc.final_note, null, 2)}\n\n`;
        });
        humanExamplesText += `โปรดนำสไตล์ โครงสร้าง และสุนทรียภาพทางภาษาจาก "ตัวอย่างแก้ไขโดยมนุษย์" ข้างต้นนี้ไปใช้เขียนสรุปเวชระเบียนของบทสนทนารอบนี้ด้วยความแม่นยำสูงสุด คืนค่าคำตอบเป็นโครงสร้าง JSON เท่านั้นไม่มีข้อความอื่นภายนอกเลย!\n`;
      }
    }
  } else {
    // Psychiatric Session Notes
    responseSchema = `{
      "history": "ประวัติเรื่องที่ผู้ป่วยและแพทย์พูดคุยกัน ทบทวนการรักษาที่ผ่านมา เรื่องราวที่ซักประวัติ",
      "mental_status": "Mental Status Examination มาตรฐานทางจิตเวชสากล",
      "diagnosis": "การวินิจฉัยตาม DSM-5 และ ICD-11 พร้อม code",
      "treatment_plan": "รูปแบบการรักษาที่ได้รับจากการพูดคุย พร้อมทั้งการนัดหมาย"
    }`;
    
    // Retrieve relevant custom psychiatric cases (RAG)
    const relevantPsychUserCases = retrieveUserRagCases(transcript, userCases || [], 3);
    
    if (relevantPsychUserCases.length === 0) {
      // First time - Zero Shot Zero Examples Model
      systemPrompt = psychiatricBaselinePrompt;
    } else {
      // Subsequent times - Dynamic Few-Shot RAG Model using clinician's own gold-standard data
      systemPrompt = getPsychiatryFewShotPrompt(relevantPsychUserCases);
    }
  }

  const prompt = `Case Theme/Context: ${caseTheme || 'General Mental Health'}\n\nSession Transcript (De-identified):\n\n${transcript}\n\n${humanExamplesText}\n\nสรุปเป็น JSON format ตามโครงสร้างกำหนด:\n${responseSchema}`;

  const provider = localStorage.getItem('recapmind_llm_provider') || 'cloud_gemini';
  const customApiKey = localStorage.getItem('recapmind_custom_api_key');
  const customModel = localStorage.getItem('recapmind_custom_model') || 'gemini-1.5-flash';

  try {
    let rawText = '';

    if (provider === 'local_llm') {
      const localEndpoint = localStorage.getItem('recapmind_local_endpoint') || 'http://localhost:11434/v1';
      const localModel = localStorage.getItem('recapmind_local_model') || 'llama3';
      const localApiKey = localStorage.getItem('recapmind_local_api_key') || '';
      
      const cleanEndpoint = localEndpoint.replace(/\/$/, '');
      const url = `${cleanEndpoint}/chat/completions`;
      
      console.log(`[Local LLM Request] Endpoint: ${url}, Model: ${localModel}`);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (localApiKey) {
        headers['Authorization'] = `Bearer ${localApiKey}`;
      }

      const body: any = {
        model: localModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      };

      let response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body)
        });
      } catch (networkErr) {
        throw new Error(`ไม่สามารถเชื่อมต่อ Local Server ที่ ${url} ได้กรุณาเปิดบริการหรือตรวจสอบการตั้งค่า (Error: ${networkErr instanceof Error ? networkErr.message : String(networkErr)})`);
      }

      if (!response.ok && response.status === 400) {
        // Fallback retry without response_format if some local engines don't support it
        console.warn('Local engine rejected response_format, retrying without it...');
        delete body.response_format;
        response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body)
        });
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`โรงพยาบาล Local LLM ตอบกลับผิดพลาด: HTTP ${response.status} (${errorText.slice(0, 100)})`);
      }

      const data = await response.json();
      rawText = data.choices?.[0]?.message?.content || '{}';
    } else if (customApiKey && customApiKey.trim().length > 0) {
      console.log(`[Gemini SDK Direct Client API] Using custom API key and model ${customModel}...`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${customModel}:generateContent?key=${customApiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Failed with Google Gemini API: HTTP ${response.status}`);
      }

      const data = await response.json();
      rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    } else {
      // Fallback: server-side API proxy
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate note via server proxy');
      }

      const data = await response.json();
      rawText = data.text || "{}";
    }
    
    // Robustly find and parse the JSON object
    let cleanedText = rawText.trim();
    
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```(?:json)?/, '').replace(/```$/, '').trim();
    }

    try {
      return JSON.parse(cleanedText) as ClinicalNote;
    } catch (parseError) {
      const firstBrace = cleanedText.indexOf('{');
      if (firstBrace !== -1) {
        const potentialJson = cleanedText.substring(firstBrace);
        const closingBraceIndices: number[] = [];
        for (let i = 0; i < potentialJson.length; i++) {
          if (potentialJson[i] === '}') {
            closingBraceIndices.push(i);
          }
        }

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

export async function generateTranscription(audioData: string, mimeType: string): Promise<string> {
  const provider = localStorage.getItem('recapmind_llm_provider') || 'cloud_gemini';
  const customApiKey = localStorage.getItem('recapmind_custom_api_key');
  const customModel = localStorage.getItem('recapmind_custom_model') || 'gemini-1.5-flash';

  if (provider === 'local_llm') {
    const localEndpoint = localStorage.getItem('recapmind_local_endpoint') || 'http://localhost:11434/v1';
    const localApiKey = localStorage.getItem('recapmind_local_api_key') || '';
    const localSttModel = localStorage.getItem('recapmind_local_stt_model') || 'whisper-1';

    // Typically, Whisper endpoint is at local base url + "/audio/transcriptions"
    const cleanEndpoint = localEndpoint.replace(/\/$/, '');
    const url = `${cleanEndpoint}/audio/transcriptions`;

    console.log(`[Local Whisper Request] Endpoint: ${url}, Model: ${localSttModel}`);

    try {
      // Convert base64 data to Blob
      const byteCharacters = atob(audioData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const audioBlob = new Blob([byteArray], { type: mimeType });

      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', localSttModel);
      formData.append('language', 'th');

      const headers: Record<string, string> = {};
      if (localApiKey) {
        headers['Authorization'] = `Bearer ${localApiKey}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Local Whisper API error: HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.text || "";
    } catch (err) {
      console.warn("Failed local STT transcription, falling back to Cloud", err);
      // Fallback: If local transcription fails (e.g., Ollama doesn't have STT), fallback gracefully to Cloud proxy so that the app remains fully functional!
    }
  }

  if (customApiKey && customApiKey.trim().length > 0) {
    console.log(`[Gemini SDK Direct Client Transcription] Using custom API key and model ${customModel}...`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${customModel}:generateContent?key=${customApiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
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
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Transcription failed with Custom API Key (HTTP ${response.status})`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } else {
    // Calling the standard proxy
    const response = await fetch('/api/transcribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audioData,
        mimeType
      })
    });

    if (!response.ok) {
      let errorMessage = 'ถอดความสัญญาณเสียงล้มเหลว';
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          if (errorData.details) {
            errorMessage += ` (${errorData.details})`;
          }
        } catch (e) {
          // ignore
        }
      } else {
        const tempText = await response.text();
        if (response.status === 413 || tempText.includes('too large') || tempText.includes('Payload Too Large')) {
          errorMessage = 'ขนาดข้อมูลเสียงส่วนนี้ใหญ่เกินพิกัดสุทธิของเซิร์ฟเวอร์';
        } else {
          errorMessage = `เซิร์ฟเวอร์ตอบกลับผิดพลาด (${response.status} ${response.statusText})`;
        }
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.text || "";
  }
}
