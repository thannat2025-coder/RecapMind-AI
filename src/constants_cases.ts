import { CaseExample } from './types';

const defaultMetrics = {
  b: { ccc: 71, kcer: 68, rdr: 100, fsr: 0, bert: 76.9, ccr: 3.1 },
  r: { ccc: 92, kcer: 93, rdr: 100, fsr: 0, bert: 84.3, ccr: 4.5 },
  ft: { ccc: 87, kcer: 90, rdr: 100, fsr: 0, bert: 82.8, ccr: 4.2 }
};

export const CASES_FROM_CSV: CaseExample[] = [
  {
    id: 'C01',
    th: '1. โรคซึมเศร้า Depression (Workplace Worthlessness)',
    risk: false,
    tx: `Therapist (T): สวัสดีครับ วันนี้เราเจอกันครั้งที่ 2 แล้ว คะแนน PHQ-9 คุณนัทอยู่ที่ 19 คะแนน อยู่ในเกณฑ์ซึมเศร้าปานกลางค่อนข้างรุนแรง ถ้าให้คะแนนความดิ่งช่วงนี้ 0-10 อยู่ที่เท่าไหร่ครับ?
Client (C): ประมาณ 8 ครับหมอ รู้สึกดิ่ง ไม่มีแรง ไม่อยากไปทำงาน นั่งเหม่อ รู้สึกตัวเองไม่มีค่า ทำอะไรก็ผิดไปหมด
T: มีเหตุการณ์อะไรเฉพาะเจาะจงในสัปดาห์นี้ไหมครับที่ทำให้รู้สึกแบบนี้?
C: วันพุธที่ผ่านมา หัวหน้าเรียกไปยืนหน้าโต๊ะตำหนิเรื่องรายงานบวกเลขผิดสองจุด พูดว่า "ทำงานมาตั้งนาน ทำไมยังพลาดเรื่องง่ายๆ แบบนี้อีก" เพื่อนร่วมงานก็ได้ยินหมดเลยครับ
T: ตอนโดนตำหนิต่อหน้าเพื่อนร่วมงาน มีความคิดอะไรแล่นเข้ามาในหัวบ้างครับ?
C: คิดว่า "ผมมันโง่จริงๆ", "ผมทำงานนี้ไม่ได้แน่ๆ ไร้ความสามารถ เป็นตัวถ่วงของทีมเปล่าๆ เขาคงเตรียมหาคนมาแทนผมแล้ว"
T: ความรู้สึกและร่างกายตอนนั้นเป็นอย่างไรครับ?
C: อับอาย ไร้ค่า และเศร้าดิ่งมาก (9-10/10) หน้าชา ใจเต้นแรง จุกที่คอเหมือนจะร้องไห้
T: หลังจากเหตุการณ์นั้นกลับมาที่โต๊ะทำงาน คุณนัททำอย่างไรต่อครับ?
C: นั่งนิ่งๆ ไม่สบตาใคร ไม่กล้าทำงานชิ้นอื่น ได้แต่นั่งมองหน้าจอคอมจนเลิกงาน วันถัดมาเริ่มมาสาย ผลัดผ่อนงานใหม่เพราะกลัวพลาดอีก
T: วันนี้เรามาตั้งวาระ (Agenda) เพื่อทำความเข้าใจวงจร CBT Model กันครับ ตัวสถานการณ์คือ "หัวหน้าตำหนิบวกเลขผิด" นำไปสู่ความคิดอัตโนมัติ "ฉันโง่ ไร้ความสามารถ เป็นตัวถ่วง" ทำให้เกิดอารมณ์ "อับอายและเศร้า (9/10)" อาการทางกาย "หน้าชา ใจเต้นแรง" และพฤติกรรมหลีกเลี่ยง (Avoidance) คือ "นั่งเหม่อ หลบหน้าคน ผลัดวันประกันพรุ่ง"... ทีนี้เรามาช่วยกันหาหลักฐานสนับสนุนและคัดค้านความคิดลบนี้กันครับ
C: หลักฐานสนับสนุนคือผมบวกเลขผิดจริงๆ ครับ และหัวหน้าก็พูดแบบนั้น
T: แล้วหลักฐานคัดค้านล่ะครับ? รายงานยอดขายนี้มีจุดข้อมูลทั้งหมดกี่จุดครับ?
C: เป็นร้อยๆ จุดเลยครับ เป็นตารางสรุปของทั้งเดือน
T: คุณนัททำถูก 98 จุด ทำผิด 2 จุด คนที่ทำถูกถึง 98% เรียกว่าเป็นคน "ไร้ความสามารถ" ได้อย่างเต็มปากไหมครับ? และที่ผ่านมาทำงาน 3 ปีเคยทำอะไรสำเร็จบ้างไหม?
C: ก็ไม่แย่ขนาดนั้นครับ... จริงๆ ปีที่แล้วผมได้รางวัลพนักงานดีเด่นไตรมาส 2 ยอดขายก็ทะลุเป้าตลอดครับ
T: คนเป็นตัวถ่วงจะได้พนักงานดีเด่นไหมครับ? นี่คือหลักฐานชิ้นสำคัญ ตอนนี้คุณนัทมีความคิดบิดเบือนแบบ Mental Filter (กรองแต่เรื่องลบ) และ Overgeneralization (เหมารวมเอาความผิดพลาดครั้งเดียวมาสรุปตัวเองทั้งหมด) เรามาเขียน ความคิดใหม่ที่สมดุลขึ้น (Alternative Thought) กันดีไหมครับ?
C: "ถึงผมจะบวกเลขพลาดไป 2 จุดจนโดนหัวหน้าตำหนิ แต่มันก็เป็นแค่ส่วนเล็กๆ ของงานทั้งหมด และที่ผ่านมาผมก็เคยทำงานได้ดีจนได้รางวัล ผมไม่ใช่ตัวถ่วง ผมแค่พลาดและแก้ไขมันได้"
T: ยอดเยี่ยมมากครับ! พออ่านความคิดนี้ในใจแล้ว คะแนนความเศร้าและอับอายลดลงเหลือเท่าไหร่ครับ?
C: เหลือประมาณ 3 หรือ 4 ครับ รู้สึกเบาใจขึ้นเยอะ มีแรงอยากกลับไปแก้ตัวเลขนั้นแล้วครับ
T: ดีมากครับ สำหรับแผนปฏิบัติการ (Action Plan) สัปดาห์นี้ คือ 1. ใช้ Graded Task Assignment แบ่งงานวันพรุ่งนี้เป็นชิ้นเล็กๆ แล้วขีดฆ่าทิ้งเมื่อทำเสร็จเพื่อสร้างความรู้สึกสำเร็จ (Mastery) 2. ทำ Thought Record บันทึกความคิดเมื่อเกิดความคิดลบเพื่อหาข้อคัดค้านครับ`,
    mood_check: '8/10 (Depressed, feeling worthless); PHQ-9 = 19',
    bridge: 'Reviewed initial PHQ-9 assessment and session 1 follow-up',
    agenda: 'Analyzing the recent reprimand from the boss and its cognitive impact',
    homework_review: 'N/A (Session 2)',
    new_topics: 'Publicly reprimanded for 2 minor calculation errors',
    cbt_model: {
      situation: 'Boss pointed out 2 calculation errors in front of colleagues',
      mood: 'Ashamed, Depressed (9/10)',
      thoughts: 'I am stupid. I am incompetent. I am a burden to the team. (Mental Filter, Overgeneralization)',
      behavior: 'Withdrawing, procrastinating on new tasks, coming late to work',
      physical: 'Facial numbness, palpitations, lump in throat'
    },
    intervention: 'CBT Model Psychoeducation, Socratic Questioning (Evidence For/Against), Graded Task Assignment',
    plan_homework: '1. Use Graded Task Assignment to break down tomorrow\'s work into small pieces. 2. Complete a Thought Record if negative thoughts arise.',
    summary: 'Identified Mental Filter and Overgeneralization. Reframed thoughts by looking at 98% correct data points and past Employee of the Quarter award. Reduced sadness from 9 to 3-4.',
    feedback_appointment: 'Client felt unburdened and motivated to return to work. Next session in 1 week.',
    m: defaultMetrics
  },
  {
    id: 'C02',
    th: '2. โรควิตกกังวล Anxiety - Panic (Expressway Panic Attack)',
    risk: false,
    tx: `Therapist (T): สวัสดีครับ สัปดาห์นี้เป็นอย่างไรบ้าง คะแนนความวิตกกังวล (Anxiety) 0-10 อยู่ที่เท่าไหร่ครับ?
Client (C): ทั่วไปประมาณ 6 ครับหมอ แต่เมื่อวันอังคารที่ผ่านมามันพุ่งไปถึง 10 เลยค่ะ อาการแพนิคกำเริบหนักมาก คะแนน GAD-7 เพิ่งทำได้ 14 คะแนนค่ะ
T: วันอังคารเกิดอะไรขึ้นบ้างครับ พอเล่าให้หมอฟังได้ไหม?
C: กำลังขับรถขึ้นทางด่วนค่ะ รถติดนิดหน่อย จู่ๆ ก็รู้สึกหายใจไม่เข้า หัวใจเต้นรัวขึ้นมาเอง หนูคิดในหัวเลยว่า "ฉันกำลังจะหัวใจวายแน่ๆ เลย กำลังจะตายบนทางด่วนแล้ว ไม่มีใครช่วยทันแน่นอน"
T: พอมีความคิดว่าจะหัวใจวายและกำลังจะตาย อารมณ์และร่างกายเป็นอย่างไรบ้างครับ?
C: กลัวสุดขีด (Panic 10/10) มือเปียกเหงื่อ สั่นจนจับพวงมาลัยแทบไม่อยู่ หนูรีบตบไฟเลี้ยวซ้ายจอดแอบไหล่ทาง ดับเครื่องโทรหาแฟนร้องไห้โฮ รอแฟนมาขับต่อให้ค่ะ ตอนนี้กลัวจนไม่กล้าขับรถขึ้นทางด่วนอีกเลย
T: สิ่งที่คุณ C ทำคือ Escape / Avoidance (พฤติกรรมหลีกเลี่ยง) ครับ ซึ่งทำให้สมองจำฝังใจว่าทางด่วนคืออันตรายถึงชีวิต วันนี้หมอขอให้คำแนะนำเรื่องกลไก Fight or Flight (สู้หรือหนี) ของร่างกายครับ เวลาสมองเครียดสะสม อะมิกดะลาจะสั่งหลั่งสารอะดรีนาลิน (Adrenaline) สั่งให้หัวใจเต้นเร็ว (สูบฉีดเลือด) หายใจหอบ (รับออกซิเจน) เพื่อเตรียมวิ่งเอาชีวิตรอด แต่คุณ C นั่งนิ่งๆ ในรถ พลังงานมันเลยระเบิดออกมาเป็นอาการสั่นและมวนท้อง มันคือ False Alarm (สัญญาณเตือนภัยที่รวน) ครับ หัวใจคุณแข็งแรงดีมาก แต่โดนฮอร์โมนสั่งให้เต้นเร็วเฉยๆ
C: โห... เพิ่งเข้าใจค่ะหมอ นึกว่าตัวเองกำลังจะหัวใจวายจริงๆ
T: ต่อไปนี้ถ้าร่างกายมีสัญญาณใจเต้นรัว คุณ C จะปรับความคิด (Cognitive Restructuring) อย่างไรดีเพื่อรับมือกับความคิด "กำลังจะตาย"?
C: ท่องว่า "นี่คือ False Alarm หัวใจไม่ได้วาย มันคืออะดรีนาลินหลั่ง ฉันปลอดภัยดี อาการมันน่ากลัวแต่มันไม่อันตราย"
T: ยอดเยี่ยมครับ! และเรามาฝึกเทคนิคหายใจเพื่อเบรกสารอะดรีนาลินกัน โดยใช้วิธี "จับพวงมาลัยแน่นๆ สูดหายใจเข้าลึกๆ กลั้นไว้ 3 วินาที แล้วเป่าลมออกทางปากช้าๆ เหมือนเป่าเทียนวันเกิด" ทำซ้ำๆ 10 รอบ ร่างกายจะดึงเบรกดึงสติกลับมาได้ดีครับ และเราจะทำ Graded Exposure (เผชิญหน้าทีละขั้น) สัปดาห์นี้อยากให้เริ่มจากขั้นเล็กๆ คือลองขับรถคนเดียวในถนนใหญ่ใกล้บ้าน (ไม่ใช่ทางด่วน) เพื่อทลายพฤติกรรมหลีกเลี่ยงดูครับ
C: ได้ค่ะหมอ หนูจะลองเอาเทคนิคเป่าเทียนและคาถา False Alarm ไปลองสู้กับมัน ขับแถวใกล้บ้านน่าจะพอไหวค่ะ
T: สัปดาห์ที่ผ่านมารู้สึกดิ่งจนมีความคิดอยากทำร้ายตัวเอง (SH) หรืออยากฆ่าตัวตาย (SI) ไหมครับ?
C: ไม่มีเลยค่ะหมอ หนูกลัวตายจะแย่ หนูแค่อยากหายทรมานเฉยๆ ทานยาสม่ำเสมอดีค่ะ`,
    mood_check: 'Anxiety score 6/10; GAD-7 = 14; Panic spike 10/10',
    bridge: 'Follow up on the Panic Cycle and breathing exercises compliance',
    agenda: 'Addressing recent severe Panic Attack while driving on expressway and reinforcing coping skills',
    homework_review: 'Good compliance with diaphragmatic breathing before sleep, but forgot to use during panic attack',
    new_topics: 'Panic attack on the expressway leading to intense fear of dying and subsequent driving avoidance',
    cbt_model: {
      situation: 'Driving onto the expressway with mild traffic',
      mood: 'Panic, Severe Anxiety (10/10)',
      thoughts: 'I am having a heart attack. I am going to die here and no one will help me. (Catastrophizing)',
      behavior: 'Pulling over, calling partner to rescue, avoiding driving alone (Avoidance / Escape)',
      physical: 'Palpitations, diaphoresis (sweating), shortness of breath, trembling'
    },
    intervention: 'Psychoeducation (Fight-or-Flight, Adrenaline, False Alarm), Cognitive Restructuring, Simplified Breathing Technique (Candle blowing), Graded Exposure',
    plan_homework: 'Perform Level 1 Graded Exposure: Drive alone on nearby main roads. Apply the "False Alarm" coping thought and candle-blowing exhalation.',
    summary: 'Client understood that physiological symptoms are a harmless False Alarm driven by adrenaline, not a heart attack. Recognized avoidance strengthens phobia and agreed to practice exposure.',
    feedback_appointment: 'Client denies Suicidal Ideation or Self-Harm. Highly motivated for the exposure task. Follow up next week.',
    m: defaultMetrics
  },
  {
    id: 'C03',
    th: '3. โรคบุคลิก Perfectionist (Unrelenting Standards)',
    risk: false,
    tx: `Therapist (T): ประเมินอารมณ์สัปดาห์นี้หน่อยครับ มีเรื่องกวนใจไหมครับ?
Client (C): ให้คะแนนความเครียด 7/10 ค่ะ รู้สึกเบิร์นเอาท์ (burn out) และเหนื่อยล้าสะสมมากๆ
T: วันนี้เรามาตั้งวาระคุยกันเรื่องมาตรฐานการทำงานที่สูงเกินไป (Unrelenting standards) และความรู้สึกกลัวความผิดพลาดกันดีไหมครับ?
C: ดีค่ะหมอ หนูรู้สึกว่าหนูทำงานพลาดไม่ได้เลย ถ้าพลาดนิดเดียวคือชีวิตพังหมดล้มเหลวสิ้นเชิง
T: เล่าสถานการณ์ล่าสุดที่ทำให้เครียดที่สุดให้ฟังหน่อยครับ?
C: หนูได้รับมอบหมายให้ทำสไลด์พรีเซนต์งานระดับภูมิภาคค่ะ หนูใช้เวลาทำนานมาก แก้แล้วแก้อีก ตรวจเช็กคำผิดไม่ต่ำกว่า 10 รอบ ทำงานล่วงเวลาถึงเที่ยงคืนทุกวันจนปวดตึงคอบ่าไหล่ทรมานมากค่ะ
T: อะไรคือความคิดหรือแกนความเชื่อ (Core belief) ที่ทำให้เราต้องเช็กซ้ำๆ ขนาดนี้ครับ?
C: คิดว่า "ถ้าสไลด์มีข้อผิดพลาดหรือไม่ perfect 100% ฉันจะดูไม่มีความเป็นมืออาชีพ นายจะหมดความเชื่อมั่นและเกลียดฉันไปเลย"
T: เรามาท้าทายความคิดแบบขาวดำ (All-or-Nothing Thinking / Catastrophizing) ดูกันนะครับ ถ้าสไลด์พิมพ์ผิดไป 1 คำจริงๆ (Typo) ความเป็นมืออาชีพของคุณจะลดลงจาก 100 เหลือ 0 ทันทีเลยไหม? นายจะมองข้ามความสำเร็จที่ผ่านมาทิ้งหมดเลยไหมครับ?
C: (คิดตาม) ...ก็คงไม่ขนาดนั้นค่ะ แต่มันก็ยังอยากให้เพอร์เฟ็กต์อยู่ดี
T: การทำงานหักโหมจนปวดตัวและใจไหม้เกรียมนำไปสู่ภาวะ Burnout ซึ่งไม่คุ้มค่าในระยะยาวครับ เรามาปรับความคิดที่สมดุลขึ้นและทดลองทางพฤติกรรม (Behavioral experiment) กันดีไหมครับ โดยสัปดาห์นี้กำหนดให้ตรวจสไลด์ได้สูงสุดไม่เกิน 2 รอบ แล้วส่งงานเลย เพื่อเรียนรู้ที่จะยอมรับมาตรฐานที่ยืดหยุ่นขึ้น
C: ยินดีทดลองทำค่ะหมอ จะพยายามส่งงานโดยไม่ตรวจซ้ำเกิน 2 รอบค่ะ`,
    mood_check: 'Stress 7/10 (Burnout/Tired)',
    bridge: 'N/A (CBT Session 3)',
    agenda: 'Addressing Unrelenting Standards and Fear of Mistakes (Perfectionism)',
    homework_review: 'N/A',
    new_topics: 'Regional Presentation Slide preparation leading to severe exhaustion and overworking',
    cbt_model: {
      situation: 'Preparing regional presentation slides',
      mood: 'Anxious, Pressured, Burned out (7/10)',
      thoughts: 'If the presentation is not 100% perfect, I am unprofessional and everyone will lose trust in me. (All-or-nothing thinking, Catastrophizing)',
      behavior: 'Working overtime until midnight, checking for typos over 10 times (Compulsive checking, Overworking)',
      physical: 'Severe neck and shoulder muscle tension, headaches, fatigue'
    },
    intervention: 'Cognitive Restructuring (challenging All-or-nothing thinking), Behavioral Experiment (limiting checking to 2 times)',
    plan_homework: 'Complete presentation slide with a maximum of 2 proofread checks, then submit to study the outcome.',
    summary: 'Identified perfectionistic core beliefs and all-or-nothing thinking styles. Discussed the concept of healthy excellence vs. rigid perfectionism.',
    feedback_appointment: 'Client felt validated. Agreed to the behavioral experiment to limit checking behavior.',
    m: defaultMetrics
  },
  {
    id: 'C04',
    th: '4. ปัญหาสัมพันธภาพ Relationship (Peer Rejection)',
    risk: false,
    tx: `Therapist (T): สวัสดีครับช่วงนี้การปรับตัวที่โรงเรียนเป็นอย่างไรบ้างครับ?
Client (C): (ก้มหน้า น้ำตาคลอ) แย่เหมือนเดิมค่ะ ไม่อยากไปโรงเรียนเลย อึดอัดมากความรู้สึกแย่ประมาณ 8/10 ค่ะ
T: มีเหตุการณ์อะไรเกิดขึ้นเป็นพิเศษช่วงสัปดาห์นี้ไหมครับที่ทำให้อึดอัดขนาดนี้?
C: เมื่อวันอังคารตอนพักเที่ยง ซื้อข้าวเสร็จหันกลับมาเห็นกลุ่มเพื่อนสนิท 3-4 คนลุกย้ายโต๊ะหนีไปนั่งโต๊ะอื่นกันหมด ทิ้งให้หนูยืนถือจานข้าวคนเดียวในโรงอาหารค่ะ หนูคิดในหัวเลยว่า "พวกเขาทุกคนต้องเกลียดฉันแน่ๆ ฉันมันตัวประหลาด ไม่มีใครอยากคบด้วย ทำไมต้องรังเกียจฉันขนาดนี้"
T: วินาทีนั้นรู้สึกอย่างไรและร่างกายมีปฏิกิริยาอย่างไรครับ?
C: อับอายและเศร้ามากๆ (8/10) รู้สึกไร้ค่า มือสั่นจนจานข้าวแทบหลุด มวนท้อง คลื่นไส้ไปหมด หนูก้มหน้ารีบเอาข้าวไปเททิ้งแล้วหนีไปซ่อนแอบร้องไห้ในห้องน้ำคนเดียวจนหมดเวลาพักค่ะ ไม่อยากเผชิญหน้าใครอีกเลย
T: การคิดว่าเพื่อนย้ายโต๊ะเพราะเกลียดเรา โดยไม่รู้สาเหตุแน่ชัด ในทาง CBT เรียกว่า Mind Reading (การอ่านใจคนอื่น) และ Personalization (การเอาปัญหาทุกอย่างมาคิดว่าเป็นความผิดเราเอง) เรามาเป็นนักสืบลองหา "ความเป็นไปได้อื่นๆ" ที่เพื่อนลุกย้ายโต๊ะอย่างรวดเร็วไหมครับ?
C: (คิดตาม) ...อาจจะเพราะโต๊ะตรงนั้นแดดส่องร้อนเกินไป หรือมีเพื่อนอีกกลุ่มกวักเรียก หรือเขารีบไปปั่นลอกการบ้านเลขส่งตอนบ่ายค่ะ
T: ถูกต้องเลยครับ มีความเป็นไปได้มากมายโดยที่ไม่ได้แปลว่าคุณเป็นตัวประหลาด การหนีไปหลบในห้องน้ำทำให้เราสูญเสียโอกาสทดสอบความจริง วันนี้หมออยากเสนอให้ทำ Behavioral Experiment (การทดลองพฤติกรรม) สัปดาห์นี้ลองหันไปยิ้มทักทายเพื่อนชื่อ "แพรว" ที่นั่งข้างๆ สั้นๆ 1 ประโยคตอนเช้า เพื่อทดสอบความเชื่อที่ว่า "ทุกคนเกลียดฉันและหนูเป็นตัวประหลาด" ดูดีไหมครับ?
C: ได้ค่ะ แพรวเคยให้ยืมปากกา คงไม่ใจร้ายเดินหนีหนูหรอกค่ะ หนูจะลองทักทายดูและจะไม่หนีไปซ่อนในห้องน้ำแล้วค่ะ ตอนนี้ความอึดอัดลดลงเหลือ 4/10 แล้วค่ะ ตื่นเต้นนิดหน่อยอยากลองไปทักเพื่อนดู`,
    mood_check: 'Worthlessness, alienation, sadness 8/10',
    bridge: 'Follow up on school peer adjustment and social dynamics',
    agenda: 'Analyzing feelings of alienation after being abandoned in the canteen',
    homework_review: 'N/A',
    new_topics: 'Friends shifted to another dining table, leaving client alone; client hid in the restroom',
    cbt_model: {
      situation: 'Friends moved to another table in the canteen, leaving client standing alone with food',
      mood: 'Ashamed, Depressed, Alienated (8/10)',
      thoughts: 'They hate me. I am a freak. Nobody wants to be friends with me. (Mind Reading, Personalization)',
      behavior: 'Throwing away food, escaping to hide and cry in the restroom (Avoidance / Escape)',
      physical: 'Trembling hands, stomach distress, nausea'
    },
    intervention: 'Identifying Mind Reading & Personalization, Generating Alternative Explanations, Designing Behavioral Experiment (Greeting a neutral peer)',
    plan_homework: '1. Greet classmate "Praew" with one simple sentence in the morning. 2. Refrain from escaping to the restroom during lunch.',
    summary: 'Helped client identify Mind Reading and Personalization. Explored alternative reasons for friends moving (heat, homework, other friends) rather than peer rejection.',
    feedback_appointment: 'Client felt relieved, subjective distress fell from 8 to 4. Excited to try the behavioral experiment. Denies SI/SH.',
    m: defaultMetrics
  },
  {
    id: 'C05',
    th: '5. ปัญหาครอบครัว Boundary Setting (Sandwich Generation Stress)',
    risk: false,
    tx: `Therapist (T): สวัสดีครับ ดูอิดโรยมาก สัปดาห์นี้เป็นอย่างไรบ้างครับ?
Client (C): แย่มากค่ะ แบกรับความกดดันรุมเร้า เหนื่อยจนอยากหลับยาวๆ ไม่อยากตื่นมาอีกเลย ให้คะแนนความดิ่ง 9/10 ค่ะ
T: มีเหตุการณ์อะไรที่ทำให้รู้สึกกดดันและเหนื่อยขนาดนี้ครับ?
C: วันพุธตอนบ่ายสาม หนูกำลังพรีเซนต์งานให้ลูกค้าอยู่ แม่โทรมาแต่หนูรับสายไม่ได้ (แม่ป่วยเบาหวานเดินไม่ค่อยไหวค่ะ) พอพรีเซนต์เสร็จหนูรีบโทรกลับ แม่ต่อว่าด่าหนูรุนแรงมาก หาว่าทิ้งขว้าง ปล่อยให้ท่านหิวข้าว ไม่จัดยาไว้ให้ ทั้งที่หนูเตรียมข้าวและยาวางไว้ให้บนโต๊ะอย่างดีแล้ว แต่แม่แค่เดินไปหยิบไม่ไหวค่ะ
T: ตอนโดนคุณแม่ว่า ความคิดอัตโนมัติอะไรแวบขึ้นมาในหัวบ้างครับ?
C: คิดว่า "ฉันเป็นลูกที่แย่ เป็นแม่ที่ไม่ได้เรื่อง (ลืมเซ็นสมุดพกให้ลูกวันนั้นด้วย) เป็นพนักงานที่ไม่ได้ความ ฉันล้มเหลวทุกบทบาททำให้ทุกคนผิดหวังไปหมด"
T: อารมณ์และร่างกายเป็นอย่างไรบ้างครับ?
C: รู้สึกผิดอย่างรุนแรง (Guilty) ร้องไห้สะอึกสะอื้น แอบไปร้องไห้ในห้องน้ำออฟฟิศ ปวดหัวไมเกรนจี๊ด บ่าไหล่ปวดตึงขยับไม่ได้เลยค่ะ
T: แล้วพฤติกรรมหลังจากนั้นเป็นอย่างไรครับ?
C: หนูลากระทันหันครึ่งวันบ่าย ทิ้งงานที่ทำงานไว้เพื่อรีบขับรถกลับไปดูแลแม่ พอกลับถึงบ้านเจอสภาพบ้านรกก็หงุดหงิด ตวาดใส่ลูกเสียงดัง แล้วก็กลับมารู้สึกผิดซ้ำสองที่ทำไม่ดีกับลูกค่ะ
T: คุณกำลังแบกรับหน้าที่ Sandwich Generation (ดูแลทั้งพ่อแม่และลูกพร้อมกับทำงาน) จนเกิดการเหมารวม (Overgeneralization) และดึงอารมณ์ลบทั้งหมดมาโทษตัวเอง (Personalization) หมออยากชวนใช้เทคนิค Sphere of Control (วงกลมควบคุม) แยกแยะว่าอารมณ์ของแม่และอาการป่วยของท่าน รวมถึงตารางงานด่วนของลูกค้า อยู่ในวงนอก (ควบคุมไม่ได้) ส่วนสิ่งที่คุณทำได้ (เตรียมข้าว ยา วางไว้ให้) อยู่ในวงใน ซึ่งคุณทำดีที่สุดแล้ว ความโกรธของแม่ไม่ได้แปลว่าคุณเป็นลูกที่แย่
C: (น้ำตาคลอ) จริงด้วยค่ะ หนูเอาอารมณ์แม่มาวัดคุณค่าตัวเองหมดเลย หนูอยากปรับความคิดใหม่ค่ะ "เราทำดีที่สุดในส่วนของเราแล้ว การที่แม่หงุดหงิดมาจากตัวโรคของท่านและปัจจัยที่ควบคุมไม่ได้ เราไม่สามารถทำให้ทุกคนพอใจได้ 100% ตลอดเวลา" พอคิดแบบนี้ความดิ่งลดเหลือ 5/10 เลยค่ะ รู้สึกเหมือนยกภูเขาออกจากอก
T: ยอดเยี่ยมครับ! เพื่อไม่ให้เกิดภาวะเหนื่อยล้าสะสมจนไประเบิดอารมณ์ใส่ลูกอีก หมอขอสั่ง "Self-Care Time (เวลาเพื่อตัวเอง)" วันละ 20 นาทีก่อนนอน ห้ามทำงาน ห้ามทำหน้าที่แม่หรือลูก ให้ทำสิ่งที่ผ่อนคลายเพื่อชาร์จแบตเตอรี่ให้ตัวเองและตกลงสร้าง Boundary (ขอบเขต) ที่ชัดเจนเพื่อรักษาสุขภาพจิตครับ
C: ยินดีค่ะคุณหมอ หนูจะขโมยเวลา 20 นาทีก่อนนอนมาทำ Self-Care เพื่อไม่ให้ตัวเองฟิวส์ขาดอีกค่ะ`,
    mood_check: 'Overwhelmed, severe guilt, depressed 9/10',
    bridge: 'Follow up on chronic burnout and caregiving stress',
    agenda: 'Addressing deep guilt and Sandwich Generation caretaker burnout',
    homework_review: 'N/A',
    new_topics: 'Mother called and yelled at client during work, leading client to leave work early and snap at her own child',
    cbt_model: {
      situation: 'Receiving an angry reprimand from sick mother while delivering client presentations to customers',
      mood: 'Guilty, Depressed, Exhausted (9/10)',
      thoughts: 'I am a terrible daughter. I am a bad mother. I fail in every aspect of life. (Overgeneralization, Personalization)',
      behavior: 'Leaving work abruptly, rushing home to placate mother, yelling at her child (Displaced anger)',
      physical: 'Severe migraine attack, extreme neck/shoulder tension, crying'
    },
    intervention: 'Sphere of Control, Boundary Setting, Self-Care Scheduling, Psychoeducation on Sandwich Generation stress',
    plan_homework: 'Implement 20-minute daily "Self-Care" routine before bedtime without doing chores or parenting/caregiving tasks.',
    summary: 'Utilized Sphere of Control to separate client\'s active efforts (preparing food/meds) from her mother\'s emotional reactions. Challenged Personalization and created boundary setting.',
    feedback_appointment: 'Caretaker distress reduced from 9 to 5. Denies SI/SH. Client highly cooperative with the Self-Care Plan.',
    m: defaultMetrics
  },
  {
    id: 'C06',
    th: '6. ปัญหาการเรียน/การทำงาน Fear of Failure (Academic Pressure)',
    risk: false,
    tx: `Therapist (T): สวัสดีครับน้องมายด์ ช่วงนี้อารมณ์เป็นอย่างไรบ้างครับ?
Client (C): ดิ่งๆ เหนื่อย ไม่อยากทำอะไรเลยค่ะ ให้คะแนนความเศร้าดิ่ง 8-9/10 เลยค่ะ
T: มีเรื่องอะไรเกิดขึ้นเป็นพิเศษหรือเปล่าครับช่วงนี้?
C: สอบจำลอง Mock Exam คะแนนเพิ่งออกวันศุกร์ค่ะ หนูทำฟิสิกส์ได้แค่ 40/100 ทั้งที่เรียนพิเศษและพยายามหนักมาก แม่ก็คาดหวังอยากให้หนูติดแพทย์มาก พอเห็นคะแนนปุ๊บก็คิดในหัวทันทีว่า "จบแล้ว สอบไม่ติดชัวร์ๆ ฉันมันโง่ พยายามไปก็ไร้ประโยชน์ ถ้าสอบไม่ติดฉันคือลูกที่ล้มเหลว ไร้ค่า ไม่มีใครต้องการ"
T: วินาทีนั้นมีความรู้สึกและร่างกายเป็นอย่างไรบ้างครับ?
C: เศร้า ดิ่ง รู้สึกผิดต่อเงินที่แม่ส่งเรียนพิเศษมากค่ะ ร่างกายชาไปทั้งตัว แน่นหน้าอก หายใจไม่ออก พอกลับถึงบ้านหนูปิดสมุดหนังสือ ล้มตัวลงนอนคลุมโปงทั้งวัน ไม่ลงมากินข้าว ไม่ยอมรับรู้อะไรอีกเลยค่ะ
T: นี่คือวงจร CBT Model ชัดเจนครับ ความคิด "ถ้าไม่ติดหมอ = ล้มเหลวสิ้นเชิง" คือ All-or-Nothing Thinking (การคิดแบบขาวดำ) และ Fortune Telling (การด่วนสรุปอนาคตในแง่ร้าย) เราลองมาทำ Thought Record หักล้างหาหลักฐานสนับสนุนและคัดค้านความคิดนี้กันครับ... หลักฐานสนับสนุนคือคะแนนฟิสิกส์ 40 แล้ววิชาอื่นๆ ใน Mock Exam รอบนี้ล่ะครับเป็นอย่างไรบ้าง?
C: (คิดตาม) ...วิชาชีวะหนูได้ 75 เคมีได้ 68 ค่ะ และนี่เป็นแค่ Mock Exam แรก ยังเหลือเวลาอีก 4 เดือนกว่าจะสอบสนามจริงค่ะ น่าจะมีเวลาอุดรอยรั่วเรื่องวิชากลศาสตร์ฟิสิกส์ได้ทัน
T: ยอดเยี่ยมมากครับ! คนได้ชีวะ 75 ไม่ใช่คนโง่แน่นอน เราลองมาปรับความคิดใหม่ที่สมดุลขึ้นกันครับ
C: "ถึงแม้หนูจะทำคะแนนฟิสิกส์ครั้งนี้ได้น้อย แต่มันเป็นแค่การสอบจำลอง หนูยังทำวิชาอื่นได้ดี และมีเวลาอีก 4 เดือนในการกลับไปทบทวนบทกลศาสตร์เพื่อเตรียมสอบจริง" พออ่านแล้วความดิ่งลดเหลือ 4-5/10 ค่ะ รู้สึกโล่งใจขึ้นเยอะเลย ไม่รู้สึกว่าโลกถล่มแล้วค่ะ
T: เก่งมากครับ แผนปฏิบัติการสัปดาห์นี้คือ 1. ทำ Thought Record 2-3 ครั้งเมื่ออารมณ์ดิ่งเกิน 7/10 เพื่อสู้ความคิดลบ 2. เมื่อเริ่มรู้สึกดิ่ง ให้งดพฤติกรรมนอนคลุมโปงหลีกเลี่ยง (Avoidance) เปลี่ยนมาใช้ Behavioral Activation เช่น ไปกินข้าวพูดคุยกับแม่หรือเดินเล่นนอกบ้าน 10 นาทีเพื่อดึงพลังงานกลับมาครับ`,
    mood_check: 'Depressed, exhausted 8-9/10',
    bridge: 'Follow-up on academic stress from prior sessions',
    agenda: 'Analyzing Mock Exam failure event and overcoming extreme fear of failure',
    homework_review: 'N/A',
    new_topics: 'Poor physics mock exam score (40/100) causing extreme self-doubt and hopelessness',
    cbt_model: {
      situation: 'Checking Mock Exam results in bedroom and seeing a score of 40/100 in Physics',
      mood: 'Sad, Hopeless, Guilty (9/10)',
      thoughts: 'I will never pass the medical entrance exam. I am stupid and a complete failure. (All-or-nothing thinking, Fortune Telling)',
      behavior: 'Closing books, stopping studying, sleeping under blankets, avoiding meals (Avoidance / Withdrawal)',
      physical: 'Shallow breathing, chest tightness, full-body numbness'
    },
    intervention: 'CBT Psychoeducation, Cognitive Distortion Identification (All-or-nothing, Fortune telling), Thought Record (Evidence For/Against), Behavioral Activation',
    plan_homework: '1. Complete 2-3 Thought Records when mood falls below 7/10. 2. Behavioral Activation (walk for 10 minutes or eat with mother) when feeling overwhelmed.',
    summary: 'Challenged all-or-nothing thinking styles. Re-evaluated academic self-worth using high scores in Biology/Chemistry and 4 months of preparation time. Sadness reduced from 9 to 4-5.',
    feedback_appointment: 'Client felt deeply relieved and validated. Regained motivation to study. Next session scheduled.',
    m: defaultMetrics
  },
  {
    id: 'C07',
    th: '7. ปัญหาการสูญเสีย Grief & Guilt (Survivor\'s Guilt post-Trauma)',
    risk: true,
    tx: `Therapist (T): สวัสดีครับคุณ C สัปดาห์นี้เป็นอย่างไรบ้างครับ ร้องไห้น้อยลงไหม?
Client (C): (ร้องไห้น้ำตาคลอ) ไม่เลยค่ะ ร้องหนักกว่าเดิมอีก สัปดาห์นี้เป็นวันเกิดครบรอบของ "แพท" เพื่อนสนิทของหนูที่เสียชีวิตในเหตุการณ์ไฟไหม้ผับค่ะ หนูเข้าไปดูเฟซบุ๊กเห็นแม่เขาโพสต์อวยพรวันเกิดลูกสาว... หนูก็ดิ่ง ร้องไห้โฮ รู้สึกแย่ระดับ 10/10 เลยค่ะ รู้สึกว่าตัวเองไม่สมควรมีชีวิตอยู่เลยค่ะหมอ
T: เสียใจด้วยกับการสูญเสียนะครับ ความคิดในหัวเวลานั้นคืออะไรครับ?
C: คิดว่า "ทำไมฉันเห็นแก่ตัวทิ้งเพื่อนและเอาตัวรอดออกมาคนเดียว ทำไมไม่ดึงมือเขาออกมา ถ้าวันนั้นจับมือให้แน่นกว่านี้ เขาก็คงปลอดภัยได้อวยพรกับแม่... ฉันสมควรตายแทนแพทจริงๆ" หนูเกลียดตัวเองและรู้สึกผิดสุดหัวใจ ร่างกายปวดหัวไมเกรนจี๊ด คลื่นไส้จนอาเจียน
T: คืนนั้นคุณ C จัดการกับอารมณ์นี้อย่างไรบ้างครับ (พฤติกรรม)?
C: หนูจุดบุหรี่สูบ (ทั้งที่เลิกไปปีนึงแล้ว) แล้วเอาปลายบุหรี่ร้อนๆ ไปจี้แขนตัวเองหลายทีค่ะ ให้เกิดความเจ็บปวดทางกาย จะได้สาสมกับความผิดที่หนูปล่อยมือแพท... หนูอยากลงโทษตัวเองค่ะหมอ
T: หมอรับรู้ถึงความเจ็บปวดอันแสนสาหัสของคุณครับ แผลพุพองที่แขนเจ็บมากไหมครับ... สิ่งที่คุณเผชิญเรียกว่า Survivor's Guilt (ความรู้สึกผิดของผู้รอดชีวิต) ในผู้ป่วย PTSD เรามาวิเคราะห์เหตุการณ์ผ่านมุมมองจิตวิทยากัน ตอนนั้นในผับเกิดอะไรขึ้นบ้างครับ?
C: มืดสนิท ควันดำทึบ แสบตาจนมองไม่เห็น คนแย่งเบียดเหยียบกันออกทางประตูที่แคบมาก หนูถูกฝูงชนดันหลุดจากมือแพท ตะโกนเรียกก็ไม่ได้ยินเพราะเสียงเพลงและเสียงคนกรีดร้องดังมาก หนูถูกกระแสฝูงชนผลักดันไหลออกประตูมาเองค่ะ
T: มนุษย์ตัวเล็กๆ ท่ามกลางกระแสฝูงชนหนีตายเป็นร้อยคน ไม่มีใครต้านกระแสน้ำป่าฝูงชนนั้นได้ครับ คุณไม่ได้ตั้งใจทิ้งเพื่อน การโทษตัวเองในอดีตหลังรู้ผลลัพธ์แล้วในวันนี้ เรียกว่า Hindsight Bias และ Inflated Responsibility (ความรับผิดชอบเกินจริง) และใครคือ "ต้นเหตุ" ของอัคคีภัยและการปิดล็อคประตูหนีไฟครับ?
C: เจ้าของผับที่ประมาทเลินเล่อเลี่ยงกฎหมาย และอุบัติเหตุเอฟเฟ็กต์ไฟเวทีค่ะ ไม่ใช่หนู...
T: ใช่ครับ! คุณไม่ได้ตั้งใจปล่อยมือ และคุณคือผู้รอดชีวิตจากโศกนาฏกรรม ไม่ใช่คนฆ่าเพื่อน แพทก็รักคุณมากและคงไม่อยากเห็นคุณทำร้ายตัวเองเพื่อลงโทษตัวเองแบบนี้ เรามาปรับความคิด (Alternative Thought) ใหม่เพื่อความเป็นธรรมต่อตัวเองกันครับ
C: "ฉันไม่ได้ตั้งใจปล่อยมือแพท มันเป็นเหตุสุดวิสัยที่ไม่มีใครควบคุมได้ ฉันไม่ใช่คนจุดไฟหรือล็อคประตู ฉันเป็นผู้รอดชีวิต และแพทคงอยากให้ฉันใช้ชีวิตต่อไปให้ดีแทนที่จะมาลงโทษตัวเอง" พออ่านแล้วใจเบาลงค่ะ ความรู้สึกผิดและความอยากทำร้ายตัวเองลดลงเหลือ 5/10 ค่ะ
T: เก่งมากครับ! เรามาทำสัญญาความปลอดภัยกัน (Safety contract): 1. งดเว้นการทำร้ายตัวเองโดยเด็ดขาด 2. เมื่อมีความรู้สึกผิดพุ่งสูงจนทนไม่ไหว (Distress Tolerance) ให้ใช้ TIPP Skill: ใช้ก้อนน้ำแข็งกำไว้ในมือแน่นๆ จนกว่าจะละลาย หรือเอาน้ำเย็นจัดลูบหน้าเพื่อลดอาการตื่นตระหนกทางระบบประสาทพาราซิมพาเทติกอย่างปลอดภัย 3. เขียนจดหมายบอกความรู้สึกผิดถึงแพทและสวมบทบาทเขียนจดหมายตอบกลับแทนตัวแพทเพื่อสร้าง Closure 4. ทำ Graded Exposure: ลองเดินเข้า 7-11 ซื้อของ 5 นาทีแล้วออก เพื่อฝึกเผชิญหน้ากับสถานที่ปิดเครื่องปรับอากาศเย็นๆ (Trigger คล้ายผับแอร์เย็น) ทีละนิดโดยไม่หลีกเลี่ยงขังตัวเองในห้องครับ
C: สัญญาค่ะหมอ หนูจะรักษาแผลที่แขนและใช้เทคนิคกำน้ำแข็งแทน จะลองเขียนจดหมายและเดินเข้าเซเว่นดูค่ะ ขอบคุณหมอมากที่ช่วยดึงสติหนู`,
    mood_check: 'Grief/Survivor\'s guilt 10/10 with active self-harm behaviors',
    bridge: 'Follow-up on trauma and PTSD avoidance behaviors',
    agenda: 'Managing severe Survivor\'s Guilt and implementing a strict Safety Contract to stop self-harm',
    homework_review: 'N/A',
    new_topics: 'Saw deceased friend\'s online birthday post, causing deep emotional crisis and self-harm (cigarette burns on arm)',
    cbt_model: {
      situation: 'Reading Facebook birthday tribute written by the deceased friend\'s mother',
      mood: 'Intense Guilt, Shame, Grief (10/10)',
      thoughts: 'I am selfish for surviving. I should have died instead of her. Her death is my fault. (Inflated Responsibility, Hindsight Bias)',
      behavior: 'Crying uncontrollably, smoking, burning her own arm with a hot cigarette (Self-punishment / Self-harm)',
      physical: 'Nausea, vomiting, severe tension headache, chest compression'
    },
    intervention: 'Cognitive Processing (challenging Hindsight Bias & Re-attributing Blame), TIPP Skills (Ice hold for distress tolerance), 2-Way Letter Writing (Closure), Graded Exposure',
    plan_homework: '1. Safety Contract: Absolute zero self-harm. Use "Ice Hold" technique for acute distress. 2. Write a 2-way letter to the deceased friend. 3. Visit a nearby 7-11 for 5 mins as a small-scale exposure to closed spaces.',
    summary: 'Challenged Hindsight Bias and Inflated Responsibility. Re-attributed blame from the survivor to the venue negligence and physical fire. Established safety contract and distress tolerance skills.',
    feedback_appointment: 'In-session distress fell to 5/10. Client agreed to the safety plan and felt relieved from deep-seated guilt. Appt in 1 week.',
    m: {
      b: { ccc: 60, kcer: 58, rdr: 67, fsr: 33, bert: 73.8, ccr: 2.4 },
      r: { ccc: 92, kcer: 94, rdr: 100, fsr: 0, bert: 84.2, ccr: 4.6 },
      ft: { ccc: 88, kcer: 92, rdr: 100, fsr: 0, bert: 83.1, ccr: 4.3 }
    }
  },
  {
    id: 'C08',
    th: '8. ปัญหาบุคลิกขี้โมโห Anger Management (Adolescent Outbursts)',
    risk: false,
    tx: `Therapist (T): สวัสดีครับนนท์ สัปดาห์นี้ความหงุดหงิดโกรธง่ายอยู่ที่เท่าไหร่ครับ?
Client (C): ประมาณ 8/10 ครับหมอ สัปดาห์นี้แย่มาก น่ารำคาญไปหมดทั้งที่บ้านและที่โรงเรียน
T: คราวที่แล้วเราเรียนเรื่องการจับสัญญาณเตือนของร่างกายตอนความโกรธมาเยือน (ใจเต้นแรง หน้าร้อน กำหมัดแน่นอยากซัดหน้าคน) สัปดาห์นี้มีเรื่องหงุดหงิดอะไรเกิดขึ้นบ้างครับ?
C: เรื่องครูพละวันอังคารครับ ผมเล่นบาสเกตบอลชู้ตไม่ลง โดนเพื่อนแซวเลยเตะบาสอัดกำแพงระบายอารมณ์ ครูพละตะโกนด่าประจานผมดังลั่นกลางโรงยิมต่อหน้าเพื่อนๆ ว่า "นิสัยเสีย ทำลายของโรงเรียน ไปนั่งสมาธิในห้องพักเลยไป!" ผมโกรธ 100% อายด้วย 80% ตะโกนสวนกลับครูทันที แล้วเตะเก้าอี้สนามล้มกระเด็น เดินโดดเรียนวิชานั้นเลย ผลคือโดนใบเตือน โดนเรียกพ่อแม่ด่าซ้ำอีกรอบ โคตรซวยเลยครับ
T: ลองย้อนสืบหาความจริง (Socratic Questioning) กันดูนะ ความคิดที่ว่า "ครูเกลียดผมและตั้งใจประจานแกล้งผม" มีหลักฐานหักล้างไหมครับ? ในอดีตครูเคยดีกับเราไหม?
C: (คิด) ...เทอมที่แล้วผมข้อเท้าพลิก ครูก็พยุงผมไปส่งห้องพยาบาล และเคยชมว่าเลี้ยงบาสเก่งครับ... จริงๆ ที่เขาตะโกนเพราะโรงยิมมันกว้างและคนเล่นเสียงดังมาก ถ้าไม่พูดเสียงดังผมก็คงไม่ได้ยิน และผมเตะบาสอัดกำแพงแรงๆ ก็อาจเป็นอันตรายโดนคนอื่นได้จริงครับ
T: ดีมากเลยครับ! ถ้าเราปรับความคิดใหม่ (Cognitive Restructuring) ว่า "ครูเตะเตือนเพราะต้องการหยุดพฤติกรรมอันตราย ไม่ใช่เพราะเกลียดเรา" ความโกรธจะลดลงไหมครับ?
C: น่าจะลดลงเหลือ 40-50 ครับ คงไม่ถึงกับเตะเก้าอี้หนีโดนใบเตือนแน่นอนครับ ผมด่วนสรุปคิดแง่ลบเองไปก่อน
T: ถูกต้องครับ! แผนปฏิบัติการสัปดาห์นี้คือ 1. ใช้เทคนิค Time-out: สังเกตถ้าร่างกายหน้าร้อนเกร็งหมัด ให้เดินเลี่ยงออกจากสถานการณ์นั้นทันที 5 นาที ไปล้างหน้าดื่มน้ำสงบสติอารมณ์ 2. ทำ Thought Record บันทึกมองหาความคิดทางเลือกอื่นเมื่อรู้สึกโกรธจัดครับ`,
    mood_check: 'Anger/Irritability 8/10; High impulsivity',
    bridge: 'Follow-up on physical warning signs of anger discussed last session',
    agenda: 'Managing acute anger outbursts and developing non-destructive coping strategies',
    homework_review: 'Partially completed diary for 2 days, threw the book away on the 3rd day due to rage',
    new_topics: 'Conflict with PE teacher, leading to screaming back, kicking a chair, and skipping class',
    cbt_model: {
      situation: 'PE teacher yells at client in the gym in front of classmates after client kicked a basketball at a wall',
      mood: 'Anger (100%), Shame (80%)',
      thoughts: 'The teacher hates me. He is trying to humiliate me. I am a troublemaker. (Mind reading, Personalization)',
      behavior: 'Screaming back, kicking gym chairs over, skipping class (Aggressive venting / Outburst)',
      physical: 'Rapid breathing, facial flushing, clenched fists, high heart rate'
    },
    intervention: 'Socratic Questioning for evidence against "teacher hates me" thought, Cognitive Restructuring, Time-out strategy instruction',
    plan_homework: '1. Use 5-minute Time-out (wash face/drink water) when physical anger alerts appear. 2. Resume Thought Record with alternative viewpoints.',
    summary: 'Analyzed Gym outburst via CBT model. Identified "Mind Reading" and reframed teacher\'s shouting from active malice to situational necessity. Sadness/anger dropped from 100% to 40%.',
    feedback_appointment: 'Client felt validated, recognized role of cognitive distortion in escalating conflict, and agreed to try Time-out. Appt in 1 week.',
    m: defaultMetrics
  },
  {
    id: 'C09',
    th: '9. ปัญหาทำร้ายตนเอง Self-Harm / Numbness (NSSI)',
    risk: true,
    tx: `Therapist (T): สวัสดีครับมายด์ สัปดาห์นี้ความเครียดและความรู้สึกดิ่งเป็นอย่างไรบ้างครับ 0-10?
Client (C): (ก้มหน้า น้ำตาคลอ) สัปดาห์นี้เครียดและดิ่งมากระดับ 9/10 ค่ะ สอบย่อยเยอะมากและหนูเพิ่งกลับไปใช้คัตเตอร์กรีดข้อมือตัวเองมาอีกแล้วเมื่อวันพุธค่ะ ขอโทษด้วยนะคะที่ผิดสัญญาความปลอดภัย
T: ขอบคุณที่ซื่อสัตย์เล่าให้หมอฟังนะครับ หมอไม่ได้โกรธและเป็นห่วงแผลมาก แผลลึกไหมครับและล้างแผลหรือยัง?
C: แผลลึกนิดหน่อยแต่ทายาดูแลดีแล้วค่ะ วันพุธประกาศคะแนนเลข หนูได้ 12/20 แต่เพื่อนในกลุ่มได้ 18-19 กันหมด พอกลับมาถึงบ้านแม่ก็ถามคะแนน พอได้ยินแม่ก็ถอนหายใจยาวและดุว่า "ทำไมไม่ตั้งใจให้มากกว่านี้ ดูลูกป้าสิเขาสอบได้ที่หนึ่งตลอด" หนูกดดัน ผิดหวัง เสียใจมาก วิ่งขึ้นห้อง ล็อคประตูร้องไห้หนัก มันแน่นหน้าอก อึดอัดจนหายใจไม่ออก สมองคิดว่า "ฉันมันเป็นคนล้มเหลว โง่เง่า เป็นลูกที่ไม่ได้เรื่องทำแม่ผิดหวัง ไม่มีใครต้องการฉันอีกแล้ว" เลยหยิบคัตเตอร์มากรีดข้อมือให้เลือดซิบค่ะ พอเห็นเลือดและรู้สึกเจ็บ ความอึดอัดแน่นในใจมันลดลงชั่วขณะค่ะหมอ
T: การกรีดข้อมือทำหน้าที่เป็น "วาล์วระบายความดัน" ทางกายภาพชั่วคราวเพื่อเบี่ยงเบนความเจ็บปวดในใจ แต่สุดท้ายจะตามมาด้วยความรู้สึกผิดซ้ำซ้อนหลังทำ เราลองมาปรับความคิด (Cognitive Restructuring) สู้ความเชื่อเรื่อง "ฉันล้มเหลว โง่ทั้งหมด" กัน การทำเลขพลาดครั้งเดียวตัดสินชีวิตล้มเหลวทั้งหมดได้จริงๆ หรือครับ?
C: (คิด) ...ก็ไม่ทั้งหมดค่ะ วิชาวรรณคดีไทยหนูก็ได้ท็อปของห้อง... หนูแค่อ่อนเลขแต่เก่งวิชาอื่น ความคิดหนูมันบิดเบือนแบบ All-or-Nothing (คิดแบบขาวดำ) และ Overgeneralization จริงๆ ค่ะ ถ้าปรับความคิดใหม่คือ "ฉันพยายามเต็มที่แล้ว แค่คะแนนเลขครั้งนี้ไม่ดี แต่ฉันก็เก่งวิชาอื่นและเรียนรู้เพิ่มเติมได้" พอคิดแบบนี้ความดิ่งลดเหลือ 5/10 เลยค่ะ
T: ดีมากครับ! สำหรับการควบคุมแรงขับในการทำร้ายตนเอง (Distress Tolerance) สัปดาห์นี้หมอให้ใช้วิธี TIPP Skill: เมื่อรู้สึกดิ่งจนอยากทำร้ายตัวเอง ให้เดินไปหยิบ "ก้อนน้ำแข็ง" มากำไว้ในมือแน่นๆ จนกว่าจะละลาย หรือเอาหนังยางคล้องข้อมือดีดเบาๆ เพื่อให้เกิดแรงกระตุ้นทางกายภาพทดแทนการกรีดข้อมืออย่างปลอดภัยโดยไม่ทิ้งแผลเป็นไว้ และทำบันทึก Thought Record ใจดีกับตัวเองเพิ่มขึ้นครับ
C: ยินดีค่ะหมอ จะกำน้ำแข็งแทนและเขียน Thought Record ไม่ให้ความเศร้าบิดเบือนหลอกหนูอีก`,
    mood_check: 'Depressed/Distressed 9/10 with recent non-suicidal self-injury (NSSI) behavior',
    bridge: 'Follow-up on academic stress and coping mechanisms',
    agenda: 'Analyzing self-harm trigger events and establishing safer distress tolerance strategies',
    homework_review: 'Kept track of mood diary; identified Wednesday as the lowest point of the week',
    new_topics: 'Bad math test score (12/20) and mother\'s comparison leading to bedroom isolation and cutting wrist with cutter',
    cbt_model: {
      situation: 'Receiving a low math test score (12/20) and mother comparing client to a successful neighbor',
      mood: 'Worthless, Depressed, Numb (10/10)',
      thoughts: 'I am a complete failure. I am stupid. No one will ever love a failure like me. (All-or-nothing thinking, Overgeneralization)',
      behavior: 'Locking bedroom door, crying, cutting wrist with cutter for emotional venting (Self-harm / Maladaptive Coping)',
      physical: 'Heavy chest tightness, shallow breathing, emotional numbness/shaking'
    },
    intervention: 'Challenging All-or-Nothing thinking, Distress Tolerance strategies (TIPP - Ice holding, rubber band snapping), Psychoeducation on self-harm mechanism',
    plan_homework: '1. Safety Plan: Zero blade cutting. Use "Ice holding" or "rubber band snap" when urges arise. 2. Practice self-compassionate Thought Record writing.',
    summary: 'Analyzed cutting mechanism as temporary emotional pressure release. Reframed client self-image from "general failure" to "someone who is good at literature but struggled in math". Urge reduced to 5/10.',
    feedback_appointment: 'Client felt safe, unjudged, and empowered with practical alternatives (Ice hold). Appt in 1 week.',
    m: {
      b: { ccc: 60, kcer: 58, rdr: 67, fsr: 33, bert: 73.8, ccr: 2.4 },
      r: { ccc: 92, kcer: 94, rdr: 100, fsr: 0, bert: 84.2, ccr: 4.6 },
      ft: { ccc: 88, kcer: 92, rdr: 100, fsr: 0, bert: 83.1, ccr: 4.3 }
    }
  },
  {
    id: 'C10',
    th: '10. ปัญหาความเครียด Stress / Somatization (Social Anxiety & Speaking)',
    risk: false,
    tx: `Therapist (T): สวัสดีครับ สัปดาห์นี้เป็นอย่างไรบ้างครับเห็นกินไม่ได้นอนไม่หลับมาหลายวัน?
Client (C): เครียดและกังวลสะสมมากครับ 8-9/10 รู้สึกมวนท้องตลอดเวลาเนื่องจากสัปดาห์หน้าต้องขึ้นพรีเซนต์โปรเจกต์ประจำไตรมาสใหญ่ต่อหน้าผู้บริหาร ซึ่งเป็นงานแรกของผมในบริษัทครับ
T: นึกถึงงานพรีเซนต์แล้วมีความคิดอัตโนมัติอะไรแวบมาในหัวบ้างครับ?
C: คิดว่า "ผมต้องพูดตะกุกตะกักแน่ๆ เสียงต้องสั่น ทุกคนจะจ้องจับผิดและคิดว่าผมไร้ความสามารถ ไม่สมควรกับตำแหน่งงานนี้แน่นอน" อารมณ์ประหม่ากลัว (8-9/10) มือเปียกเหงื่อ ใจเต้นรัว มวนท้องอยากเข้าห้องน้ำ พฤติกรรมคือทำสไลด์แก้ไปแก้มาเกิน 10 รอบ ท่องสคริปต์แบบจำคำต่อคำจนดึกดื่น นอนไม่หลับ และมีความคิดอยากแกล้งป่วยลางานหลบพรีเซนต์ครับ
T: ปัญหานี้มาจาก Social Anxiety ครับ มีความคิดบิดเบือน 2 อย่างคือ Spotlight Effect (คิดว่าสปอตไลท์จ้องจับผิดคุณคนเดียว ทั้งที่คนอื่นเขาก็โฟกัสเรื่องเนื้อหาหรือคิดเรื่องตัวเองอยู่) และ Mind Reading (คิดแทนผู้บริหารในทางลบ) จริงๆ อาการตื่นเต้นตระหนกทางเสียงสั่นไม่ได้แปลว่าเราไม่เก่ง ในอดีตรุ่นพี่ที่เสียงสั่นเวลาพูดเขาก็ทำงานเก่งใช่ไหมครับ เรามาปรับความคิดที่สมดุลขึ้นกันครับ
C: "ผมอาจจะตื่นเต้นและเสียงสั่นบ้าง แต่มันเป็นเรื่องปกติของการพูดครั้งแรก ผู้บริหารสนใจผลงานและเนื้อหามากกว่าอาการประหม่าของผม ความตื่นเต้นไม่ได้ลบล้างความสามารถในการทำงานของผม" พออ่านความคิดนี้ความกังวลลดเหลือ 5-6/10 ครับ หายใจโล่งขึ้น ยกเลิกความคิดอยากแกล้งป่วยแล้วครับ
T: เยี่ยมครับ! สัปดาห์นี้เรามาทำการทดลองทางพฤติกรรม (Behavioral Experiment) ร่วมกับเทคนิค Focus Outward (ละสายตาจากการเพ่งจับอาการสั่นของตัวเอง แล้วหันไปสังเกตผู้ฟัง สิ่งแวดล้อม สีเสื้อ หรือเนื้องานแทน) และ Graded Exposure: ลองยกมือเสนอความเห็นหรือถามคำถามสั้นๆ 1 ประโยคในการประชุมทีมย่อยวันศุกร์นี้เพื่อวอร์มอัปความประหม่า และพก Coping Card ความคิดใหม่ติดขอบหน้าจอคอมเพื่อเตือนสติครับ
C: ได้ครับหมอ จะลองฝึกมองออกข้างนอกและลองออกความเห็นสั้นๆ ในทีมย่อยวันศุกร์นี้เพื่อซ้อมควบคุมความกลัวครับ`,
    mood_check: 'Anxiety and somatization (stomach distress) 8-9/10',
    bridge: 'Follow-up on general work adaptation and stress',
    agenda: 'Managing performance/speaking anxiety and physical somatization symptoms (mวนท้อง)',
    homework_review: 'N/A',
    new_topics: 'Upcoming major presentation to top executives leading to severe insomnia and stomach ache',
    cbt_model: {
      situation: 'Preparing for first major quarterly project presentation to the executive board next week',
      mood: 'Anxious, Fearful, Ashamed (8-9/10)',
      thoughts: 'My voice will shake and I will stutter. Everyone will judge my mistakes and think I am incompetent. (Spotlight Effect, Mind Reading)',
      behavior: 'Over-preparing (proofreading slides 10+ times, writing verbatim script), planning to fake illness/call in sick (Avoidance)',
      physical: 'Stomach distress/nausea, sweaty palms, heart palpitations, severe insomnia'
    },
    intervention: 'Psychoeducation on Spotlight Effect & Mind Reading, Cognitive Restructuring, Focus Outward / Decentering technique, Graded Exposure (speaking in a small group)',
    plan_homework: '1. Practice Focus Outward (focusing on the listener/message, not on internal trembling). 2. Speak up or ask 1 question in the small team meeting on Friday.',
    summary: 'Addressed speaking anxiety. Shifted client\'s goal from "forcefully trying to be flawless" to "delivering the message despite feeling nervous". Reduced distress from 9 to 5.',
    feedback_appointment: 'Client dropped the avoidance plan of faking illness. Willing to perform the mini-exposure task. Next session in 1 week.',
    m: defaultMetrics
  }
];
