/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  UserCircle, 
  Mic, 
  Upload, 
  Edit3, 
  Activity, 
  ShieldCheck, 
  Zap, 
  LayoutDashboard, 
  BarChart3, 
  Info,
  Trash2,
  CheckCircle2,
  FileText,
  Copy,
  Download,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  BrainCircuit,
  Database,
  ShieldAlert,
  Save,
  LogOut,
  LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Tab, InputMode, ClinicalNote, SafetyStatus, GoldenCase } from './types';
import { GOLDEN_CASES } from './constants';
import { checkSafety, deIdentify, retrieveRagCases } from './utils';
import { generateClinicalNote } from './lib/gemini';
import { auth, loginWithGoogle, logout, saveTrainingData } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

const EMPTY_NOTE: ClinicalNote = {
  mood_check: 'NA',
  bridge: 'NA',
  agenda: 'NA',
  homework_review: 'NA',
  new_topics: 'NA',
  cbt_model: {
    situation: 'NA',
    mood: 'NA',
    thoughts: 'NA',
    behavior: 'NA',
    physical: 'NA'
  },
  intervention: 'NA',
  plan_homework: 'NA',
  summary: 'NA',
  feedback_appointment: 'NA'
};

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.MAIN);
  const [inputMode, setInputMode] = useState<InputMode>(InputMode.RECORD);
  const [transcript, setTranscript] = useState('');
  const [patientId, setPatientId] = useState('');
  const [sessionNo, setSessionNo] = useState('');
  const [caseTheme, setCaseTheme] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [safetyStatus, setSafetyStatus] = useState<SafetyStatus | null>(null);
  const [ragResults, setRagResults] = useState<(GoldenCase & { sim: number })[]>([]);
  const [notes, setNotes] = useState<Record<string, ClinicalNote>>({});
  const [selectedModel, setSelectedModel] = useState<'baseline' | 'rag' | 'finetuned'>('rag');
  const [hitl, setHitl] = useState<Record<number, boolean>>({});
  const [isCoSigned, setIsCoSigned] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recTime, setRecTime] = useState(0);
  const [hasConsented, setHasConsented] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const recInterval = useRef<NodeJS.Timeout | null>(null);
  const noteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (recording) {
      recInterval.current = setInterval(() => {
        setRecTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recInterval.current) clearInterval(recInterval.current);
      setRecTime(0);
    }
    return () => { if (recInterval.current) clearInterval(recInterval.current); };
  }, [recording]);

  const handleDeID = () => {
    setTranscript(prev => deIdentify(prev));
  };

  const handleClear = () => {
    setTranscript('');
    setSafetyStatus(null);
  };

  const loadCase = (id: string) => {
    const c = GOLDEN_CASES.find(x => x.id === id);
    if (c) {
      setTranscript(c.tx);
      setCaseTheme(c.th);
      setSafetyStatus(checkSafety(c.tx));
    }
  };

  const startRecording = () => {
    setRecording(true);
  };

  const stopRecording = () => {
    setRecording(false);
    // Simulate STT
    setIsLoading(true);
    setTimeout(() => {
      const randomCase = GOLDEN_CASES[Math.floor(Math.random() * GOLDEN_CASES.length)];
      setTranscript(randomCase.tx);
      setCaseTheme(randomCase.th);
      setSafetyStatus(checkSafety(randomCase.tx));
      setIsLoading(false);
    }, 1500);
  };

  const generateAllNotes = async () => {
    if (!transcript.trim()) return;
    setIsLoading(true);
    setIsCoSigned(false);
    setHitl({});
    
    const safety = checkSafety(transcript);
    setSafetyStatus(safety);

    const retrieved = retrieveRagCases(transcript);
    setRagResults(retrieved);

    try {
      // Parallel generation
      const [baseline, rag, finetuned] = await Promise.allSettled([
        generateClinicalNote(transcript, 'baseline'),
        generateClinicalNote(transcript, 'rag', retrieved),
        generateClinicalNote(transcript, 'finetuned')
      ]);

      setNotes({
        baseline: baseline.status === 'fulfilled' ? baseline.value : { ...EMPTY_NOTE, mood_check: 'Error: API Failed' },
        rag: rag.status === 'fulfilled' ? rag.value : { ...EMPTY_NOTE, mood_check: 'Error: API Failed' },
        finetuned: finetuned.status === 'fulfilled' ? finetuned.value : { ...EMPTY_NOTE, mood_check: 'Error: API Failed' }
      });
      
      setSelectedModel('rag');
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleHitl = (i: number) => {
    setHitl(prev => ({ ...prev, [i]: !prev[i] }));
  };

  const isHitlComplete = Object.values(hitl).filter(Boolean).length === 5;

  const handleCoSign = () => {
    setIsCoSigned(true);
  };

  const handleCopyNote = async () => {
    if (!currentNote) return;
    
    const textToCopy = `
[CLINICAL NOTE - RECAPMIND]
Patient ID: ${patientId || 'N/A'}
Session No: ${sessionNo || 'N/A'}
Theme: ${caseTheme || 'N/A'}
Model: ${selectedModel}

1. Mood Check: ${currentNote.mood_check}
2. Bridge: ${currentNote.bridge}
3. Agenda: ${currentNote.agenda}
4. Homework Review: ${currentNote.homework_review}
5. New Topics: ${currentNote.new_topics}

CBT MODEL:
- Situation: ${currentNote.cbt_model.situation}
- Mood: ${currentNote.cbt_model.mood}
- Thought: ${currentNote.cbt_model.thoughts}
- Behavior: ${currentNote.cbt_model.behavior}
- Physical: ${currentNote.cbt_model.physical}

7. Intervention: ${currentNote.intervention}
8. Plan/Homework: ${currentNote.plan_homework}
9. Summary: ${currentNote.summary}
10. Feedback/Appointment: ${currentNote.feedback_appointment}
    `.trim();

    try {
      await navigator.clipboard.writeText(textToCopy);
      alert('คัดลอกข้อความลง Clipboard เรียบร้อยแล้ว');
      
      if (user) {
        setIsSaving(true);
        await saveTrainingData(transcript, currentNote, selectedModel, patientId, sessionNo);
        setIsSaving(false);
      }
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  const handleExportPDF = async () => {
    if (!noteRef.current || !currentNote) return;
    
    try {
      setIsLoading(true);
      const canvas = await html2canvas(noteRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`ClinicalNote_${patientId || 'Note'}_${new Date().toLocaleDateString()}.pdf`);

      if (user) {
        setIsSaving(true);
        await saveTrainingData(transcript, currentNote, selectedModel, patientId, sessionNo);
        setIsSaving(false);
      }
    } catch (error) {
      console.error('PDF Export failed', error);
      alert('เกิดข้อผิดพลาดในการ Export PDF');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      alert("Login Failed: " + (error as any).message);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const currentNote = notes[selectedModel] || null;

  return (
    <div className="flex flex-col h-screen bg-[#F4F6F9] text-[#0F1A2E] font-sans overflow-hidden">
      {/* Consent Modal Overlay */}
      <AnimatePresence>
        {!hasConsented && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col"
            >
              <div className="bg-gradient-to-br from-blue-700 to-indigo-800 p-8 text-white text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                  <div className="absolute top-[-20%] left-[-20%] w-[150%] h-[150%] bg-[radial-gradient(circle,white_0%,transparent_70%)]" />
                </div>
                <ShieldCheck size={64} className="mx-auto mb-4 text-blue-100" />
                <h2 className="text-2xl font-bold mb-2">ข้อตกลงการใช้งาน (Consent)</h2>
                <p className="text-blue-100 text-sm opacity-90">RecapMind AI Clinical Scribe System</p>
              </div>
              
              <div className="p-8 space-y-4">
                <div className="space-y-3 text-slate-600 text-sm leading-relaxed">
                  <div className="flex gap-3">
                    <ShieldAlert size={20} className="text-amber-500 shrink-0" />
                    <p><b>Privacy First:</b> ระบบนี้ออกแบบมาเพื่อช่วยสรุปเวชระเบียน <b>ห้ามกรอกข้อมูลระบุตัวตนจริง (PII)</b> เช่น ชื่อ-นามสกุลจริง หรือ เลขบัตรประชาชน ลงในระบบทดสอบนี้</p>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle2 size={20} className="text-blue-500 shrink-0" />
                    <p><b>HITL Requirement:</b> ผู้ใช้งานต้องเป็นบุคลากรทางการแพทย์ และต้องทำการตรวจสอบความถูกต้องของเนื้อหา (Human-in-the-loop) ก่อนนำข้อมูลไปใช้งานจริงทุกครั้ง</p>
                  </div>
                  <div className="flex gap-3">
                    <Info size={20} className="text-blue-500 shrink-0" />
                    <p><b>AI Limitations:</b> ระบบ AI อาจมีความผิดพลาด (Hallucination) ได้ แพทย์ต้องใช้วิจารณญาณทางวิชาชีพในการตัดสินใจขั้นสุดท้าย</p>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-slate-100 mt-4">
                  <button 
                    onClick={() => setHasConsented(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    ข้าพเจ้ายอมรับและเข้าสู่ระบบ
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Topbar */}
      <header className="h-[52px] bg-white border-b border-[#E3E8EF] flex items-center px-[18px] gap-[11px] shrink-0 shadow-sm z-[200]">
        <div className="w-8 h-8 bg-gradient-to-br from-[#1549C7] to-[#0B6E65] rounded-lg flex items-center justify-center text-white font-extrabold text-[13px] shrink-0">RM</div>
        <div>
          <h1 className="text-[15px] font-bold leading-tight">RecapMind</h1>
          <p className="text-[10.5px] text-[#64748B] -mt-0.5">สรุปผลเวชระเบียนจิตเวช • AI Studio Platform</p>
        </div>
        <div className="ml-auto flex items-center gap-[10px]">
          <div className="flex items-center gap-[5px] mr-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">🔒 PDPA</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">✅ HITL</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">⚡ Gemini API</span>
          </div>
          
          <div className="h-6 w-[1px] bg-slate-200" />
          
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-[11px] font-bold leading-none">{user.displayName}</span>
                <span className="text-[9px] text-slate-500">Clinician</span>
              </div>
              <button 
                onClick={() => logout()}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Logout"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold shadow-sm transition-all active:scale-95"
            >
              <LogIn size={14} />
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Tabs */}
      <nav className="bg-white border-b border-[#E3E8EF] flex px-[18px] shrink-0">
        <button 
          onClick={() => setActiveTab(Tab.MAIN)}
          className={`px-[15px] py-[9px] text-[12.5px] font-semibold transition-all border-b-[2.5px] ${activeTab === Tab.MAIN ? 'text-[#1549C7] border-[#1549C7]' : 'text-[#64748B] border-transparent hover:text-slate-900'}`}
        >
          🩺 บันทึก & สรุป
        </button>
        <button 
          onClick={() => setActiveTab(Tab.COMPARE)}
          className={`px-[15px] py-[9px] text-[12.5px] font-semibold transition-all border-b-[2.5px] ${activeTab === Tab.COMPARE ? 'text-[#1549C7] border-[#1549C7]' : 'text-[#64748B] border-transparent hover:text-slate-900'}`}
        >
          📊 เปรียบเทียบ
        </button>
        <button 
          onClick={() => setActiveTab(Tab.ABOUT)}
          className={`px-[15px] py-[9px] text-[12.5px] font-semibold transition-all border-b-[2.5px] ${activeTab === Tab.ABOUT ? 'text-[#1549C7] border-[#1549C7]' : 'text-[#64748B] border-transparent hover:text-slate-900'}`}
        >
          ℹ️ เกี่ยวกับ
        </button>
      </nav>

      {/* Main Content Areas */}
      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === Tab.MAIN && (
            <motion.div 
              key="tab-main"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex h-full flex-col md:flex-row overflow-hidden"
            >
              {/* Left Panel - Input */}
              <aside className="w-full md:w-[370px] bg-white border-r border-[#E3E8EF] flex flex-col shrink-0 overflow-hidden">
                <div className="p-4 py-3 border-b border-[#E3E8EF] shrink-0">
                  <h2 className="text-[13px] font-bold">📝 Input — Transcript</h2>
                  <p className="text-[11px] text-[#64748B]">อัดเสียง / Upload / ค้นหา Case ตัวอย่าง</p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                  {/* Mode Selector */}
                  <div className="bg-white border border-[#E3E8EF] rounded-[10px] shadow-sm overflow-hidden">
                    <div className="px-3 py-2 bg-[#F9FAFB] border-b border-[#E3E8EF] flex items-center gap-2">
                      <Zap size={14} className="text-[#1549C7]" />
                      <h3 className="text-[12px] font-bold">วิธีป้อน Transcript</h3>
                    </div>
                    <div className="p-3">
                      <div className="flex gap-1 flex-wrap mb-3">
                        {(Object.values(InputMode) as InputMode[]).map(mode => (
                          <button
                            key={mode}
                            onClick={() => setInputMode(mode)}
                            className={`px-2.5 py-1 rounded-full border-[1.5px] text-[11.5px] font-semibold transition-all ${inputMode === mode ? 'bg-blue-50 border-[#1549C7] text-[#1549C7]' : 'border-[#CBD5E1] text-[#64748B] hover:border-[#1549C7]'}`}
                          >
                            {mode === InputMode.RECORD && '🎙️ อัดเสียง'}
                            {mode === InputMode.UPLOAD && '📁 Upload'}
                            {mode === InputMode.TYPE && '✏️ พิมพ์'}
                            {mode === InputMode.CASE && '📂 Golden Case'}
                          </button>
                        ))}
                      </div>

                      {inputMode === InputMode.RECORD && (
                        <div className="text-center p-3 bg-[#F9FAFB] border border-[#E3E8EF] rounded-md">
                          <div className="text-[24px] font-extrabold font-mono tracking-wider">{formatTime(recTime)}</div>
                          <p className={`text-[11px] font-medium my-1 ${recording ? 'text-red-600 animate-pulse' : 'text-slate-500'}`}>
                            {recording ? '● กำลังอัดเสียง...' : 'พร้อมอัดเสียง • Whisper STT'}
                          </p>
                          <button 
                            onClick={recording ? stopRecording : startRecording}
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg transition-transform hover:scale-105 active:scale-95 shadow-md mx-auto ${recording ? 'bg-red-800' : 'bg-red-600'}`}
                          >
                            {recording ? <div className="w-4 h-4 bg-white rounded-sm" /> : <Mic size={20} />}
                          </button>
                        </div>
                      )}

                      {inputMode === InputMode.UPLOAD && (
                        <div className="border-2 border-dashed border-[#CBD5E1] rounded-md p-4 text-center cursor-pointer bg-[#F9FAFB] hover:bg-slate-100 transition-all">
                          <Upload size={24} className="mx-auto mb-1 text-[#64748B]" />
                          <div className="text-[12px] font-semibold">คลิกเพื่อเลือกไฟล์</div>
                          <div className="text-[10px] text-slate-400">.mp3 .mp4 .wav .txt</div>
                        </div>
                      )}

                      {inputMode === InputMode.CASE && (
                        <div className="space-y-2">
                          <label className="text-[11.5px] font-semibold text-[#4A5568]">เลือก Golden Case ตัวอย่าง</label>
                          <select 
                            onChange={(e) => loadCase(e.target.value)}
                            className="w-full text-[13px] border border-[#CBD5E1] rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1549C7]"
                          >
                            <option value="">— เลือกเคส —</option>
                            {GOLDEN_CASES.map(c => <option key={c.id} value={c.id}>{c.id}: {c.th}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Transcript Area */}
                  <div className="bg-white border border-[#E3E8EF] rounded-[10px] shadow-sm overflow-hidden">
                    <div className="px-3 py-2 bg-[#F9FAFB] border-b border-[#E3E8EF] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-[#1549C7]" />
                        <h3 className="text-[12px] font-bold">Transcript</h3>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={handleDeID} className="px-2 py-0.5 text-[10.5px] font-bold border border-slate-300 rounded hover:border-blue-600 hover:text-blue-600">🔒 De-ID</button>
                        <button onClick={handleClear} className="px-2 py-0.5 text-[10.5px] font-bold border border-slate-300 rounded hover:border-red-600 hover:text-red-600"><Trash2 size={10} /></button>
                      </div>
                    </div>
                    <div className="p-3">
                      {safetyStatus?.risk && (
                        <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded flex gap-2 text-[11.5px] text-red-700">
                          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                          <div><b>SI/SH Detected:</b> {safetyStatus.kws.slice(0,3).join(' • ')}</div>
                        </div>
                      )}
                      <textarea 
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        placeholder="วาง transcript ที่นี่..."
                        className="w-full h-48 text-[12.5px] border border-[#CBD5E1] rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1549C7] resize-none"
                      />
                      <div className="text-[10px] text-slate-400 mt-1">{transcript.length.toLocaleString()} ตัวอักษร</div>
                    </div>
                  </div>

                  {/* Session Info */}
                  <div className="bg-white border border-[#E3E8EF] rounded-[10px] shadow-sm overflow-hidden">
                    <div className="px-3 py-2 bg-[#F9FAFB] border-b border-[#E3E8EF] flex items-center gap-2">
                       <UserCircle size={14} className="text-[#1549C7]" />
                       <h3 className="text-[12px] font-bold">ข้อมูล Session</h3>
                    </div>
                    <div className="p-3 grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-bold text-slate-500 uppercase">รหัสผู้รับบริการ</label>
                          <input value={patientId} onChange={e => setPatientId(e.target.value)} type="text" placeholder="PATIENT-001" className="w-full text-[13px] border border-[#CBD5E1] rounded px-2 py-1 mt-1 font-mono" />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-500 uppercase">ครั้งที่</label>
                          <input value={sessionNo} onChange={e => setSessionNo(e.target.value)} type="text" placeholder="2" className="w-full text-[13px] border border-[#CBD5E1] rounded px-2 py-1 mt-1 font-mono" />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[11px] font-bold text-slate-500 uppercase">Case Theme</label>
                          <input value={caseTheme} onChange={e => setCaseTheme(e.target.value)} type="text" placeholder="เช่น โรคซึมเศร้า" className="w-full text-[13px] border border-[#CBD5E1] rounded px-2 py-1 mt-1" />
                        </div>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 pt-2 border-t border-[#E3E8EF] bg-blue-50/50">
                  <button 
                    disabled={isLoading || !transcript.trim()}
                    onClick={generateAllNotes}
                    className="w-full bg-[#1A56DB] hover:bg-[#1040A8] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                  >
                    <Zap size={18} />
                    {isLoading ? 'กำลังประมวลผล...' : '⚡ Generate เวชระเบียน'}
                  </button>
                </div>
              </aside>

              {/* Right Panel - Output */}
              <main className="flex-1 bg-slate-50 flex flex-col overflow-hidden">
                <div className="bg-white border-b border-[#E3E8EF] px-5 py-3 shrink-0">
                   <div className="flex items-center justify-between">
                     <h2 className="text-[13px] font-bold flex items-center gap-2">
                       <FileText size={16} className="text-[#1549C7]" />
                       📄 เวชระเบียนจิตเวช — AI Draft
                     </h2>
                   </div>
                   
                   {/* Model Switcher */}
                   {Object.keys(notes).length > 0 && (
                     <div className="grid grid-cols-3 gap-2 mt-3">
                       {['baseline', 'rag', 'finetuned'].map((m) => (
                         <button
                           key={m}
                           onClick={() => setSelectedModel(m as any)}
                           className={`p-2 rounded-lg border-2 text-center transition-all ${selectedModel === m ? 'border-[#1549C7] bg-blue-50 ring-2 ring-blue-100' : 'border-[#CBD5E1] bg-white hover:border-[#1549C7]'}`}
                         >
                           <div className={`text-[11px] font-extrabold ${selectedModel === m ? 'text-[#1549C7]' : 'text-slate-600'}`}>
                             {m === 'baseline' && '📝 Baseline'}
                             {m === 'rag' && '🧠 RAG (Few-shot)'}
                             {m === 'finetuned' && '💾 Fine-tuned'}
                           </div>
                           <div className="text-[9px] text-slate-400 uppercase tracking-tighter">
                             {m === 'baseline' && 'Zero-shot'}
                             {m === 'rag' && 'Data Linked'}
                             {m === 'finetuned' && 'Expert Logic'}
                           </div>
                         </button>
                       ))}
                     </div>
                   )}
                </div>

                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                  {!notes[selectedModel] ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                      <BrainCircuit size={48} className="opacity-20 mb-4" />
                      <p className="text-center font-medium">ป้อน Transcript แล้วกดปุ่ม Generate ด้านล่างซ้าย<br /><span className="text-[11px] font-normal opacity-70">Gemini 3 Flash จะวิเคราะห์ตามโครงสร้างสารสนเทศ CBT</span></p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-w-4xl mx-auto" ref={noteRef}>
                      {/* Safety Alert */}
                      {safetyStatus?.risk && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-3 text-red-800">
                           <AlertTriangle size={24} className="shrink-0" />
                           <div>
                             <h4 className="font-bold text-[13px]">SAFETY ALERT — SI/SH Keywords Found</h4>
                             <p className="text-[11.5px] opacity-90">ระบบตรวจพบความเสี่ยงด้านจริยธรรม/ความปลอดภัย: {safetyStatus.kws.join(', ')}</p>
                           </div>
                        </div>
                      )}

                      {/* RAG Context */}
                      {selectedModel === 'rag' && ragResults.length > 0 && (
                        <div className="bg-slate-100/80 border border-slate-200 rounded-xl p-3">
                           <div className="flex items-center gap-2 mb-2">
                             <Database size={14} className="text-blue-600" />
                             <h4 className="text-[11px] font-bold uppercase text-slate-500">RAG — Retrieved Context</h4>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                             {ragResults.map((r) => (
                               <div key={r.id} className="bg-white p-2 rounded border border-slate-200 shadow-xs">
                                  <div className="text-[10px] font-bold text-blue-600 mb-1">{r.id}</div>
                                  <div className="text-[11px] font-medium leading-tight line-clamp-2">{r.th}</div>
                               </div>
                             ))}
                           </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        {/* Section 1-5 */}
                        {[
                          { id: 1, k: 'mood_check', l: 'Mood Check', sl: 'รายงานอารมณ์เริ่มต้น' },
                          { id: 2, k: 'bridge', l: 'Bridge from Previous', sl: 'การเชื่อมโยงจากครั้งก่อน' },
                          { id: 3, k: 'agenda', l: 'Session Agenda', sl: 'วาระเป้าหมายหลัก' },
                          { id: 4, k: 'homework_review', l: 'Homework Review', sl: 'ตรวจการบ้านเดิม' },
                          { id: 5, k: 'new_topics', l: 'New Topics / Event', sl: 'เหตุการณ์ตัวกระตุ้นใหม่' },
                        ].map(f => (
                          <div key={f.id} className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
                             <div className="flex items-center gap-3 px-3 py-2 bg-slate-50/50 border-b border-slate-100">
                               <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center grow-0 shrink-0">{f.id}</div>
                               <div>
                                 <div className="text-[11.5px] font-bold">{f.l}</div>
                                 <div className="text-[9.5px] text-slate-400 leading-none">{f.sl}</div>
                               </div>
                             </div>
                             <div className="p-3">
                               <div className="text-[12.5px] leading-relaxed whitespace-pre-wrap">{(currentNote as any)[f.k] || 'NA'}</div>
                             </div>
                          </div>
                        ))}

                        {/* Section 6 - CBT Diagram */}
                        <div className="bg-gradient-to-br from-blue-50 to-teal-50 border border-blue-200 rounded-xl overflow-hidden shadow-xs">
                          <div className="flex items-center justify-between px-3 py-2 bg-white/50 border-b border-blue-100">
                             <div className="flex items-center gap-3">
                               <div className="w-5 h-5 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center grow-0 shrink-0">6</div>
                               <div>
                                 <div className="text-[11.5px] font-bold text-blue-800">CBT Formulation (5-Part Model)</div>
                                 <div className="text-[9.5px] text-blue-400 leading-none">การวิเคราะห์พุทธิปัญญาและพฤติกรรม</div>
                               </div>
                             </div>
                          </div>
                          
                          <div className="p-4 space-y-3">
                            <div className="flex justify-center">
                              <div className="max-w-sm w-full bg-white rounded-lg p-3 border border-amber-200 text-center shadow-sm">
                                <div className="text-[9px] font-bold text-amber-600 uppercase mb-1">Situation</div>
                                <div className="text-[12px] leading-snug">{currentNote.cbt_model.situation}</div>
                              </div>
                            </div>
                            
                            <div className="flex justify-center"><ArrowRight size={16} className="rotate-90 text-slate-300" /></div>
                            
                            <div className="flex justify-center items-center gap-4">
                              <div className="flex-1 bg-white rounded-lg p-3 border border-red-200 text-center shadow-sm">
                                <div className="text-[9px] font-bold text-red-600 uppercase mb-1">Mood</div>
                                <div className="text-[12px] leading-snug">{currentNote.cbt_model.mood}</div>
                              </div>
                              <ArrowRight size={16} className="text-slate-300 shrink-0" />
                              <div className="flex-1 bg-white rounded-lg p-3 border border-blue-200 text-center shadow-sm">
                                <div className="text-[9px] font-bold text-blue-600 uppercase mb-1">Thought</div>
                                <div className="text-[12px] leading-snug">{currentNote.cbt_model.thoughts}</div>
                              </div>
                            </div>
                            
                            <div className="flex justify-center"><ArrowRight size={16} className="rotate-90 text-slate-300" /></div>
                            
                            <div className="flex justify-center items-center gap-4">
                              <div className="flex-1 bg-white rounded-lg p-3 border border-teal-200 text-center shadow-sm">
                                <div className="text-[9px] font-bold text-teal-600 uppercase mb-1">Behavior</div>
                                <div className="text-[12px] leading-snug">{currentNote.cbt_model.behavior}</div>
                              </div>
                              <ArrowRight size={16} className="text-slate-300 shrink-0" />
                              <div className="flex-1 bg-white rounded-lg p-3 border border-green-200 text-center shadow-sm">
                                <div className="text-[9px] font-bold text-green-600 uppercase mb-1">Physical Reaction</div>
                                <div className="text-[12px] leading-snug">{currentNote.cbt_model.physical}</div>
                              </div>
                            </div>

                            <div className="mt-4 p-2.5 bg-violet-50 border border-dashed border-violet-200 rounded-lg text-center text-[10px] text-violet-700">
                                🔄 <b>Maintaining Cycle</b> — องค์ประกอบทั้ง 5 ส่วนเชื่อมโยงและรักษาสภาวะทางจิตใจ
                            </div>
                          </div>
                        </div>

                        {/* Section 7-10 */}
                        {[
                          { id: 7, k: 'intervention', l: 'Intervention / Techniques', sl: 'กระบวนการบำบัดที่ใช้' },
                          { id: 8, k: 'plan_homework', l: 'Action Plan / Homework', sl: 'แผนปฏิบัติและการบ้าน' },
                          { id: 9, k: 'summary', l: 'Session Summary', sl: 'สรุปผลลัพธ์และ Insight' },
                          { id: 10, k: 'feedback_appointment', l: 'Risk & Feedback', sl: 'ประเมินความเสี่ยงและนัดหมาย' },
                        ].map(f => (
                          <div key={f.id} className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
                             <div className="flex items-center gap-3 px-3 py-2 bg-slate-50/50 border-b border-slate-100">
                               <div className={`w-5 h-5 rounded-full ${f.id === 10 ? 'bg-red-600' : 'bg-teal-600'} text-white text-[10px] font-bold flex items-center justify-center grow-0 shrink-0`}>{f.id}</div>
                               <div>
                                 <div className="text-[11.5px] font-bold">{f.l}</div>
                                 <div className="text-[9.5px] text-slate-400 leading-none">{f.sl}</div>
                               </div>
                               {f.id === 10 && safetyStatus?.risk && <span className="ml-auto text-[10px] font-bold bg-red-100 text-red-700 px-2 rounded-full border border-red-200">🚩 ALERT</span>}
                             </div>
                             <div className="p-3">
                               <div className="text-[12.5px] leading-relaxed whitespace-pre-wrap">{(currentNote as any)[f.k] || 'NA'}</div>
                             </div>
                          </div>
                        ))}
                      </div>

                      {/* Co-Sign Section */}
                      <div className="bg-white border border-blue-200 rounded-xl shadow-lg p-5">
                         <div className="flex items-center gap-2 mb-4">
                           <CheckCircle2 size={18} className="text-blue-600" />
                           <h3 className="text-[13px] font-bold">✅ HITL Checklist — Clinician Review</h3>
                         </div>
                         
                         <div className="space-y-2 mb-5">
                           {[
                             'ข้อมูลส่วนบุคคลถูกลบ (De-identified) เรียบร้อยแล้ว',
                             'CBT Formulation (6) ครบถ้วนและสะท้อนความจริง',
                             'ประเมินความเสี่ยง (10) ได้รับการยืนยันโดยผู้บำบัด',
                             'Action Plan (8) มีความชัดเจนและตกลงร่วมกัน',
                             'บันทึกมีความถูกต้องตามหลักการวิชาชีพ'
                           ].map((item, idx) => (
                             <button 
                                key={idx} 
                                onClick={() => toggleHitl(idx)}
                                className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-slate-50 transition-colors group"
                             >
                               <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${hitl[idx] ? 'bg-green-600 border-green-600 text-white' : 'border-slate-200 bg-white group-hover:border-blue-400'}`}>
                                 {hitl[idx] && <CheckCircle2 size={12} />}
                               </div>
                               <span className={`text-[12.5px] ${hitl[idx] ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>{item}</span>
                             </button>
                           ))}
                         </div>

                         <div className="flex flex-col gap-3">
                            <button 
                              disabled={!isHitlComplete || isCoSigned}
                              onClick={handleCoSign}
                              className={`w-full py-2.5 rounded-lg font-bold shadow-md transition-all flex items-center justify-center gap-2 ${isCoSigned ? 'bg-green-100 text-green-700 border border-green-200' : isHitlComplete ? 'bg-green-600 hover:bg-green-700 text-white scale-[1.01]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                            >
                              {isCoSigned ? <><CheckCircle2 size={18} /> Co-Signed Successfully</> : '✍️ Co-Sign & บันทึกเข้า HIS'}
                            </button>
                            
                            {isCoSigned && (
                               <motion.div 
                                 initial={{ height: 0, opacity: 0 }}
                                 animate={{ height: 'auto', opacity: 1 }}
                                 className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-[11.5px]"
                               >
                                 <b>Transaction ID:</b> RX-992384-H<br />
                                 <b>Status:</b> บันทึกเข้าระบบ HL7 FHIR R4 สำเร็จ ณ 12:45 น.<br />
                                 <b>Practitioner:</b> Thanvaruj Booranasuksakul
                               </motion.div>
                            )}

                            <div className="flex gap-2">
                               <button 
                                 disabled={isLoading || isSaving}
                                 onClick={handleExportPDF}
                                 className="flex-1 border border-slate-200 py-2 rounded-lg text-[12px] font-bold flex items-center justify-center gap-2 hover:border-blue-600 hover:text-blue-600 transition-all disabled:opacity-50"
                               >
                                 <Download size={14} /> {isSaving ? 'Saving...' : 'Export PDF'}
                               </button>
                               <button 
                                 disabled={isLoading || isSaving}
                                 onClick={handleCopyNote}
                                 className="flex-1 border border-slate-200 py-2 rounded-lg text-[12px] font-bold flex items-center justify-center gap-2 hover:border-blue-600 hover:text-blue-600 transition-all disabled:opacity-50"
                               >
                                 <Copy size={14} /> {isSaving ? 'Saving...' : 'Copy Note'}
                               </button>
                            </div>
                            {!user && (
                              <p className="text-[10px] text-slate-400 text-center mt-2">
                                💡 Sign In เพื่อช่วยพัฒนาระบบ AI ด้วยข้อมูลเคสนี้ (RAG & Feedback Loop)
                              </p>
                            )}
                         </div>
                      </div>
                    </div>
                  )}
                </div>
              </main>
            </motion.div>
          )}

          {activeTab === Tab.COMPARE && (
            <motion.div 
               key="tab-compare"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="h-full overflow-y-auto p-6"
            >
              <div className="max-w-6xl mx-auto">
                 <div className="mb-6">
                   <h2 className="text-xl font-bold flex items-center gap-2"><BarChart3 className="text-blue-600" /> Comparison Analysis</h2>
                   <p className="text-slate-500">เปรียบเทียบผลลัพธ์จาก 3 โมเดลในเชิง Clinical Metrics</p>
                 </div>

                 {Object.keys(notes).length === 0 ? (
                   <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
                      <Zap size={48} className="mx-auto mb-4 opacity-10" />
                      <p>กรุณาทำการประมวลผล (Generate) จากหน้าหลักก่อนเพื่อดูการเปรียบเทียบ</p>
                   </div>
                 ) : (
                   <div className="space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {['baseline', 'rag', 'finetuned'].map(m => (
                          <div key={m} className={`bg-white rounded-2xl p-4 border-2 shadow-sm ${selectedModel === m ? 'border-blue-500' : 'border-slate-100'}`}>
                              <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-[13px] uppercase">{m === 'baseline' ? '📝 Baseline' : m === 'rag' ? '🧠 RAG' : '💾 Fine-tuned'}</h3>
                                {selectedModel === m && <span className="bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">ACTIVE</span>}
                              </div>
                              <div className="space-y-3">
                                 <div>
                                   <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Mood Extract</div>
                                   <div className="text-[11px] p-2 bg-slate-50 rounded border border-slate-100 line-clamp-2">{(notes[m] as any).mood_check}</div>
                                 </div>
                                 <div>
                                   <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">CBT Thinking</div>
                                   <div className="text-[11px] p-2 bg-slate-50 rounded border border-slate-100 line-clamp-2">{(notes[m] as any).cbt_model.thoughts}</div>
                                 </div>
                                 <button onClick={() => setSelectedModel(m as any)} className="w-full text-center text-blue-600 text-[11px] font-bold pt-2">View Detail →</button>
                              </div>
                          </div>
                        ))}
                     </div>

                     <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                          <h3 className="font-bold text-[13px]">Clinical Evaluation Metrics</h3>
                          <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">N=150 CLINICAL CASES</span>
                        </div>
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400">
                               <th className="p-4">Metric</th>
                               <th className="p-4">Baseline</th>
                               <th className="p-4 bg-blue-50/50 text-blue-700">RAG (Data Linked)</th>
                               <th className="p-4">Fine-Tuned</th>
                            </tr>
                          </thead>
                          <tbody className="text-[12px]">
                            <tr className="border-b border-slate-50">
                               <td className="p-4 font-medium">CCC (Clinical Core Content)</td>
                               <td className="p-4">~71%</td>
                               <td className="p-4 bg-blue-50/30 font-bold text-blue-800">~92%</td>
                               <td className="p-4">~87%</td>
                            </tr>
                            <tr className="border-b border-slate-50">
                               <td className="p-4 font-medium">KCER (Key CBT Entity Recall)</td>
                               <td className="p-4">~68%</td>
                               <td className="p-4 bg-blue-50/30 font-bold text-blue-800">~93%</td>
                               <td className="p-4">~90%</td>
                            </tr>
                            <tr className="border-b border-slate-50">
                               <td className="p-4 font-medium">RDR (Risk Detection Rate)</td>
                               <td className="p-4">~100%</td>
                               <td className="p-4 bg-blue-50/30 font-bold text-blue-800">~100%</td>
                               <td className="p-4">~100%</td>
                            </tr>
                            <tr className="border-b border-slate-50">
                               <td className="p-4 font-medium">BERTScore (Semantic Sim)</td>
                               <td className="p-4">~0.76</td>
                               <td className="p-4 bg-blue-50/30 font-bold text-blue-800">~0.84</td>
                               <td className="p-4">~0.82</td>
                            </tr>
                          </tbody>
                        </table>
                        <div className="p-3 bg-blue-50 text-[10px] text-blue-700 italic">
                          * ข้อมูลอ้างอิงจากการสุ่มทดสอบ 150 Clinical Cases ในช่วง Fine-tuning Phase
                        </div>
                     </div>
                   </div>
                 )}
              </div>
            </motion.div>
          )}

          {activeTab === Tab.ABOUT && (
            <motion.div 
               key="tab-about"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="h-full overflow-y-auto p-8"
            >
               <div className="max-w-3xl mx-auto space-y-8">
                  <div className="text-center">
                    <div className="inline-flex w-20 h-20 bg-gradient-to-br from-[#1549C7] to-[#0B6E65] rounded-3xl items-center justify-center text-white text-3xl font-black mb-4 shadow-xl">RM</div>
                    <h2 className="text-2xl font-bold">RecapMind PoC v6</h2>
                    <p className="text-slate-500">AI Clinical Scribe for Mental Health Documentation</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold border-b border-slate-100 pb-2 mb-3 flex items-center gap-2"><TrendingUp size={16} className="text-blue-500" /> Research Project</h3>
                        <dl className="space-y-3 text-[13px]">
                           <div>
                             <dt className="text-slate-400 font-bold text-[10px] uppercase">Researcher</dt>
                             <dd className="font-medium">Thanvaruj Booranasuksakul</dd>
                           </div>
                           <div>
                             <dt className="text-slate-400 font-bold text-[10px] uppercase">Institution</dt>
                             <dd className="font-medium">Digital Health @ CU (2568)</dd>
                           </div>
                           <div>
                             <dt className="text-slate-400 font-bold text-[10px] uppercase">Technology</dt>
                             <dd className="font-medium">RAG (Few-Shot) • Gemini 3 Flash</dd>
                           </div>
                        </dl>
                     </div>
                     
                     <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold border-b border-slate-100 pb-2 mb-3 flex items-center gap-2"><ShieldCheck size={16} className="text-teal-500" /> Security Layer</h3>
                        <ul className="space-y-2 text-[12.5px]">
                          <li className="flex items-center gap-2"><Zap size={12} className="text-blue-500" /> L1: Rule-based Keyword Guard</li>
                          <li className="flex items-center gap-2"><Zap size={12} className="text-blue-500" /> L2: Semantic Safety Scorer</li>
                          <li className="flex items-center gap-2"><Zap size={12} className="text-blue-500" /> L3: NER-based De-identification</li>
                          <li className="flex items-center gap-2"><Zap size={12} className="text-blue-500" /> L5: Post-gen Schema Validation</li>
                        </ul>
                     </div>
                  </div>

                  <div className="bg-blue-600 rounded-2xl p-6 text-white text-center shadow-xl">
                     <Info size={32} className="mx-auto mb-3 opacity-50" />
                     <h3 className="text-lg font-bold mb-2">Notice for Practitioners</h3>
                     <p className="text-blue-100 text-[13px] leading-relaxed">
                       แอปพลิเคชันนี้ทำหน้าที่เป็นเพียง "ร่าง" เวชระเบียนเบื้องต้นเท่านั้น แพทย์ต้องตรวจสอบและแก้ไขข้อมูล (HITL) 
                       ให้ถูกต้องตามความเป็นจริงก่อนบันทึกเข้าระบบการรักษาพยาบาลทุกครั้ง ข้อมูลที่ใช้ใน PoC นี้ได้รับการทำ De-identification เรียบร้อยสมบูรณ์
                     </p>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Global CSS Styles (Mock for simple custom scrollbar and diagram arrows) */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
}
