import { GoldenCase } from './types';

export const GOLDEN_CASES: GoldenCase[] = [
  {
    id: 'C01',
    th: 'โรคซึมเศร้า (ถูกตำหนิในที่ทำงาน)',
    risk: false,
    tx: 'นักบำบัด: คะแนนความเศร้า 0-10 อยู่ที่เท่าไหร่ครับ? ผู้รับบริการ: ประมาณ 8 ครับ อารมณ์ดิ่งมาก รู้สึกตัวเองไร้ค่า นักบำบัด: มีเหตุการณ์อะไรกระตุ้นไหมครับ? ผู้รับบริการ: วันพุธโดนหัวหน้าตำหนิต่อหน้าเพื่อนเรื่องบวกเลขผิดครับ ผมคิดว่าตัวเองโง่ เป็นตัวถ่วงทีม ร่างกายมันชาไปหมด ใจเต้นแรง หลังจากนั้นผมก็นั่งเหม่อ ไม่ยากทำงานชิ้นอื่นต่อเลย',
    mood_check: '8/10 (Depressed, feeling worthless); PHQ-9 = 19',
    bridge: 'Reviewed initial PHQ-9 assessment',
    agenda: 'Analyzing the recent reprimand from the boss and its impact',
    homework_review: 'N/A',
    new_topics: 'Publicly reprimanded for 2 minor calculation errors',
    cbt_model: {
      situation: 'Boss pointed out 2 calculation errors in front of colleagues',
      mood: 'Ashamed, Depressed (9/10)',
      thoughts: 'I am stupid. I am incompetent. I am a burden to the team. (Mental Filter, Overgeneralization)',
      behavior: 'Withdrawing, procrastinating on new tasks',
      physical: 'Facial numbness, palpitations, lump in throat'
    },
    intervention: 'CBT Model Psychoeducation, Socratic Questioning (Evidence For/Against), Graded Task Assignment',
    plan_homework: '1. Use Graded Task Assignment to break down tomorrow\'s work. 2. Complete a Thought Record if negative thoughts arise.',
    summary: 'Identified \'Mental Filter\' and \'Overgeneralization\'. Reframed the thought by acknowledging 98 correct data points and past \'Employee of the Quarter\' award.',
    feedback_appointment: 'Client\'s distress dropped to 3-4/10. Feels unburdened and motivated to return to work.',
    m: {
      b: { ccc: 71, kcer: 68, rdr: 100, fsr: 0, bert: 76.9, ccr: 3.1 },
      r: { ccc: 92, kcer: 93, rdr: 100, fsr: 0, bert: 84.3, ccr: 4.5 },
      ft: { ccc: 87, kcer: 90, rdr: 100, fsr: 0, bert: 82.8, ccr: 4.2 }
    }
  },
  {
    id: 'C02',
    th: 'โรควิตกกังวล (Panic Attack บนทางด่วน)',
    risk: false,
    tx: 'นักบำบัด: อาการแพนิคสัปดาห์นี้เป็นยังไงบ้าง? ผู้รับบริการ: วันอังคารพุ่งไป 10 เลยครับ ขับรถขึ้นทางด่วนแล้วใจเต้นรัว หายใจไม่ออก คิดว่าหัวใจจะวาย จะตายตรงนั้นเลย ต้องรีบจอดไหล่ทางแล้วโทรหาแฟนครับ ตอนนี้กังวลตลอด 6/10',
    mood_check: 'General anxiety 6/10; GAD-7 = 14; Panic spike 10/10',
    bridge: 'Follow up on the Panic Cycle and breathing exercises',
    agenda: 'Addressing recent severe Panic Attack while driving and reinforcing coping skills',
    homework_review: 'Good compliance with diaphragmatic breathing at bedtime, but unable to apply it during a real panic attack',
    new_topics: 'Panic attack on the expressway leading to extreme fear of dying and subsequent driving avoidance',
    cbt_model: {
      situation: 'Driving onto the expressway with mild traffic',
      mood: 'Panic, Severe Anxiety (10/10)',
      thoughts: 'I am having a heart attack. I am going to die here. (Catastrophizing)',
      behavior: 'Pulling over, calling partner to rescue, avoiding driving alone (Avoidance)',
      physical: 'Palpitations, diaphoresis (sweating), shortness of breath'
    },
    intervention: 'Psychoeducation (Fight-or-Flight, False Alarm), Cognitive Restructuring, Candle blowing breathing, Graded Exposure',
    plan_homework: 'Perform Level 1 Graded Exposure: Drive alone on nearby main roads. Apply \'False Alarm\' coping thought.',
    summary: 'Client understood symptoms are \'False Alarm\' not heart attack. Recognized avoidance strengthens phobia.',
    feedback_appointment: 'Client denies SI/SH. Motivated for exposure. Next appt in 1 week.',
    m: {
      b: { ccc: 68, kcer: 65, rdr: 100, fsr: 0, bert: 76.2, ccr: 3.0 },
      r: { ccc: 91, kcer: 92, rdr: 100, fsr: 0, bert: 83.8, ccr: 4.4 },
      ft: { ccc: 86, kcer: 89, rdr: 100, fsr: 0, bert: 82.2, ccr: 4.1 }
    }
  },
  {
    id: 'DEP-U01',
    th: 'ปัญหาทำธีสิส / หมดไฟ',
    risk: false,
    tx: 'นักบำบัด: สวัสดีครับ การบ้านบันทึกกิจกรรมสัปดาห์ที่แล้วเป็นยังไงบ้าง? ผู้ป่วย: ทำได้นิดหน่อยค่ะ ช่วงนี้หนูหมดไฟ ไม่อยากทำธีสิสเลย นอนเปื่อยอยู่บนเตียงทั้งวัน นักบำบัด: ถ้างั้น Agenda วันนี้เรามาดูเรื่องการหมดไฟทำธีสิสกันดีไหมครับ? ผู้ป่วย: ดีค่ะ หนูรู้สึกว่าตัวเองเป็นคนล้มเหลว เพื่อนคนอื่นคืบหน้าไปหมดแล้ว นักบำบัด: จำ CBT Model ที่เราคุยกันได้ไหมครับ พอเรามีความคิดว่า \'ฉันเป็นคนล้มเหลว\' มันส่งผลให้อารมณ์เราดิ่ง เศร้า แล้วพฤติกรรมก็คือการนอนเฉยๆ ไม่อยากทำอะไร วงจรมันก็วนลูป ผู้ป่วย: จริงด้วยค่ะ พอหนูคิดแบบนั้นก็ยิ่งไม่อยากเปิดคอมเลย นักบำบัด: เรามาลองปรับความคิด (Cognitive Restructuring) กันดูไหม มีหลักฐานอะไรไหมที่บอกว่าเราล้มเหลวจริงๆ ที่ผ่านมาเราก็ผ่านวิชายากๆ มาได้นะ ผู้ป่วย: ก็จริงค่ะ หนูแค่คิดไปเองล่วงหน้าว่าอาจารย์จะด่า นักบำบัด: เยี่ยมครับ งั้นเรามาทำ Behavioral Activation (BA) กัน เริ่มจากเป้าหมายเล็กๆ วันนี้ลองเปิดคอมเขียนธีสิสแค่ 15 นาทีดูก่อนไหม แค่ 15 นาทีแล้วพัก ผู้ป่วย: 15 นาทีคิดว่าพอไหวค่ะ นักบำบัด: การบ้านสัปดาห์นี้ ให้ทำ Thought Record ถ้าเริ่มรู้สึกแย่ ให้จดความคิดอัตโนมัติลงไป และลองทำธีสิสวันละ 15 นาทีนะครับ วันนี้ได้เรียนรู้อะไรบ้างครับ? ผู้ป่วย: ได้เห็นว่าความคิดหนูมันหลอกให้หนูหมดแรงค่ะ จะลองค่อยๆ เริ่มดู',
    mood_check: 'Burnout reported; Depressed mood 7/10',
    bridge: 'First follow-up session',
    agenda: 'ภาวะหมดไฟและพฤติกรรมหลีกเลี่ยงการทำธีสิส (Procrastination)',
    homework_review: 'Compliant partially (ทำบันทึกกิจกรรมได้บางส่วน)',
    new_topics: 'Academic pressure, Thesis burnout',
    cbt_model: {
      situation: 'Thesis work period',
      mood: 'Depressed, Burnout',
      thoughts: 'ฉันเป็นคนล้มเหลว (All-or-nothing thinking)',
      behavior: 'Staying in bed, Procrastination, Avoidance',
      physical: 'Fatigue'
    },
    intervention: 'CBT Model Psychoeducation, Cognitive Restructuring, Behavioral Activation (15-min rule)',
    plan_homework: '1. ทำ Thought Record 2. กิจกรรมทำธีสิสวันละ 15 นาที',
    summary: 'Insight gained into the thought-mood-behavior loop. Replaced absolute failure thought with past success evidence.',
    feedback_appointment: 'Better insight, motivation increased slightly. Appt 1 week.',
    m: {
      b: { ccc: 71, kcer: 68, rdr: 100, fsr: 0, bert: 76.9, ccr: 3.1 },
      r: { ccc: 92, kcer: 93, rdr: 100, fsr: 0, bert: 84.3, ccr: 4.5 },
      ft: { ccc: 89, kcer: 91, rdr: 100, fsr: 0, bert: 83.1, ccr: 4.3 }
    }
  },
  {
    id: 'SH-U01',
    th: 'ปัญหาอยากทำร้ายตนเอง (Self-Harm)',
    risk: true,
    tx: 'นักบำบัด: การบ้านเช็คอารมณ์ตัวเอง ทำมาไหมครับ? ผู้ป่วย: ทำค่ะ แต่เมื่อคืนหนูเครียดเรื่องสอบมิดเทอมมาก ร้องไห้หนักจนเผลอเอากรรไกรมากรีดแขนตัวเองอีกแล้ว มันช่วยให้หนูหยุดร้องไห้ได้ชั่วคราว นักบำบัด: Agenda วันนี้เรามาโฟกัสเรื่องทักษะการรับมือกับอารมณ์ที่รุนแรง (Emotion Regulation) เพื่อลดการทำร้ายตัวเองนะครับ ผู้ป่วย: ค่ะ หนูไม่อยากมีแผลเป็นเพิ่มแล้ว แต่ตอนนั้นมันคุมไม่ได้จริงๆ นักบำบัด: หมอเข้าใจครับ (CBT Model) ตอนที่เครียดถึงขีดสุด ความคิดคือ \'ทนไม่ไหวแล้ว ต้องเอาความเจ็บปวดนี้ออกไป\' พฤติกรรมทำร้ายตัวเองเลยกลายเป็นวิธีระบาย (Maladaptive Coping) ที่ให้ผลระยะสั้น ผู้ป่วย: ใช่เลยค่ะ มันดึงความสนใจจากหัวลงมาที่แขนแทน นักบำบัด: เรามาฝึก Problem Solving / Distress Tolerance skill กัน แทนที่จะกรีดแขน เราใช้ \'ความเย็น\' แทนได้ไหม เช่น เอาน้ำแข็งมากำไว้แน่นๆ (Ice Dive) หรือเอาหนังยางดีดข้อมือเบาๆ เพื่อดึงสติกลับมาที่สมาธิ ผู้ป่วย: กำน้ำแข็งน่าจะพอลองได้ค่ะ มันเย็นจนเจ็บเหมือนกัน นักบำบัด: ใช่ครับ และคู่กับการทำ Relaxation Training ควบคุมลมหายใจเพื่อดึงกราฟอารมณ์ลง (CR) บอกตัวเองว่า \'อารมณ์นี้มันมาแล้วเดี๋ยวมันก็ไป เราปลอดภัย\' ผู้ป่วย: จะลองใช้ความเย็นดูค่ะ นักบำบัด: การบ้านคือใช้ Ice technique เมื่ออยากทำร้ายตัวเอง และทำ Thought Record วันนี้รู้สึกยังไงบ้างครับ? ผู้ป่วย: รู้สึกมีเครื่องมืออื่นมาช่วยชีวิตตอนสติแตกค่ะ จะพยายามไม่ใช้กรรไกรอีก',
    mood_check: 'Extreme distress; Tearful',
    bridge: 'Ongoing safety monitoring',
    agenda: 'พฤติกรรมทำร้ายตนเอง (NSSI) และ Emotion Regulation',
    homework_review: 'Partially compliant (มีพฤติกรรม Self-harm เกิดขึ้น)',
    new_topics: 'Exam stress leading to NSSI (Scissors)',
    cbt_model: {
      situation: 'Severe stress from exam',
      mood: 'Overwhelmed, Desperate',
      thoughts: 'ทนไม่ไหวแล้ว ต้องเอาความเจ็บปวดออกไป',
      behavior: 'Self-harm (scissors), Crying',
      physical: 'Intense emotional pain, Tense'
    },
    intervention: 'Safety planning, Distress Tolerance (Ice dive/Temperature change), CBT Model psychoeducation',
    plan_homework: '1. Ice technique instead of cutting. 2. Safety plan adherence.',
    summary: 'Shifted from maladaptive coping to sensory-based distress tolerance.',
    feedback_appointment: 'High risk - closely monitored. Denies active suicide plan. Next appt 3 days.',
    m: {
      b: { ccc: 60, kcer: 58, rdr: 67, fsr: 33, bert: 73.8, ccr: 2.4 },
      r: { ccc: 92, kcer: 94, rdr: 100, fsr: 0, bert: 84.2, ccr: 4.6 },
      ft: { ccc: 88, kcer: 92, rdr: 100, fsr: 0, bert: 83.1, ccr: 4.3 }
    }
  }
];

export const SAFETY_KEYWORDS = ['อยากตาย', 'ฆ่าตัวตาย', 'ทำร้ายตัวเอง', 'กรีด', 'nssi', 'passive si', 'อยากหายไป', 'ไม่อยากมีชีวิต', 'suicidal', 'self-harm', 'ควรเป็นฉัน', 'คิดสั้น'];

export const NOTE_SCHEMA_JSON = `{
  "mood_check": "Mood Check: อารมณ์ทางคลินิกเริ่มต้นและคะแนน (เช่น PHQ-9, คะแนน 0-10)",
  "bridge": "Bridge from Previous: ความต่อเนื่องจากการคุยครั้งก่อน",
  "agenda": "Session Agenda: วาระหลักที่ตกลงจะคุยวันนี้",
  "homework_review": "Homework Review: ตรวจการบ้านเดิมและอุปสรรค",
  "new_topics": "New Topics: เหตุการณ์หรือตัวกระตุ้นใหม่ที่รายงาน",
  "cbt_model": {
    "situation": "CBT: สถานการณ์ตัวกระตุ้น",
    "mood": "CBT: อารมณ์และความรู้สึก",
    "thoughts": "CBT: ความคิดอัตโนมัติและความผิดเพี้ยนทางความคิด",
    "behavior": "CBT: พฤติกรรมที่แสดงออกหรือการหลีกเลี่ยง",
    "physical": "CBT: อาการทางร่างกาย"
  },
  "intervention": "Interventions/Techniques: เทคนิค CBT ที่นำมาใช้",
  "plan_homework": "Action Plan/Homework: แผนปฏิบัติและการบ้านสำหรับสัปดาห์หน้า",
  "summary": "Session Summary: ประเด็นสำคัญและ Insight ที่เกิดขึ้น",
  "feedback_appointment": "Risk, Feedback & Appointment: ประเมินความเสี่ยง ฟีดแบค และวันนัดครั้งถัดไป"
}`;
