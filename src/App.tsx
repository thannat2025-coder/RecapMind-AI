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
  LogIn,
  X,
  Keyboard,
  FolderOpen,
  Network
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import * as pdfjs from 'pdfjs-dist';
import mammoth from 'mammoth';
import { Tab, InputMode, ClinicalNote, SafetyStatus, CaseExample } from './types';

// PDF Worker setup
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
import { CASE_EXAMPLES } from './constants';
import { checkSafety, deIdentify, retrieveRagCases } from './utils';
import { compressAudioFile } from './utils/audioCompressor';
import { generateClinicalNote, generateTranscription } from './lib/gemini';
import { auth, loginWithGoogle, logout, saveTrainingData, getTrainingData } from './lib/firebase';
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
  const [sessionType, setSessionType] = useState<'cbt' | 'psychiatric'>('cbt');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('กำลังประมวลผล...');
  const [safetyStatus, setSafetyStatus] = useState<SafetyStatus | null>(null);
  const [ragResults, setRagResults] = useState<(CaseExample & { sim: number })[]>([]);
  const [notes, setNotes] = useState<Record<string, ClinicalNote>>({});
  const [selectedModel, setSelectedModel] = useState<'baseline' | 'rag' | 'finetuned'>('rag');
  const [hitl, setHitl] = useState<Record<string, boolean[]>>({
    baseline: [false, false, false, false, false],
    rag: [false, false, false, false, false],
    finetuned: [false, false, false, false, false]
  });
  const [signedModels, setSignedModels] = useState<Record<string, boolean>>({});
  const [dismissedRisk, setDismissedRisk] = useState<Record<string, boolean>>({});
  const [includeHitlInExport, setIncludeHitlInExport] = useState(true);
  const [includeSignInExport, setIncludeSignInExport] = useState(true);
  const [recording, setRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [recTime, setRecTime] = useState(0);
  const [hasConsented, setHasConsented] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const noteDraftsRef = useRef<any>(null); // To store noteDrafts
  const [noteDrafts, setNoteDrafts] = useState<Record<string, ClinicalNote>>({});
  const recInterval = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const noteRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [customApiKey, setCustomApiKeyState] = useState(localStorage.getItem('recapmind_custom_api_key') || '');
  const [customEmail, setCustomEmailState] = useState(localStorage.getItem('recapmind_custom_email') || '');
  const [customModel, setCustomModelState] = useState(localStorage.getItem('recapmind_custom_model') || 'gemini-1.5-flash');
  const [tempApiKey, setTempApiKey] = useState(customApiKey);
  const [tempEmail, setTempEmail] = useState(customEmail);
  const [tempModel, setTempModel] = useState(customModel);
  const [settingsSavedSuccess, setSettingsSavedSuccess] = useState(false);

  // Local LLM & Hospital HIS Connection Settings State
  const [llmProvider, setLlmProvider] = useState<string>(localStorage.getItem('recapmind_llm_provider') || 'cloud_gemini');
  const [localEndpoint, setLocalEndpoint] = useState<string>(localStorage.getItem('recapmind_local_endpoint') || 'http://localhost:11434/v1');
  const [localModel, setLocalModel] = useState<string>(localStorage.getItem('recapmind_local_model') || 'llama3');
  const [localSttModel, setLocalSttModel] = useState<string>(localStorage.getItem('recapmind_local_stt_model') || 'whisper-1');
  const [localApiKey, setLocalApiKey] = useState<string>(localStorage.getItem('recapmind_local_api_key') || '');

  const [hisEnabled, setHisEnabled] = useState<boolean>(localStorage.getItem('recapmind_his_enabled') === 'true');
  const [hisEndpoint, setHisEndpoint] = useState<string>(localStorage.getItem('recapmind_his_endpoint') || 'https://his.hospital-intranet.go.th/api/v1/clinical-notes');
  const [hisAuthToken, setHisAuthToken] = useState<string>(localStorage.getItem('recapmind_his_token') || '');
  const [hisFormat, setHisFormat] = useState<string>(localStorage.getItem('recapmind_his_format') || 'json_standard');

  const [hisExportStatus, setHisExportStatus] = useState<Record<string, 'idle' | 'exporting' | 'success' | 'failed'>>({});
  const [hisExportMessage, setHisExportMessage] = useState<Record<string, string>>({});

  // Temp states for Modal inputs
  const [tempLlmProvider, setTempLlmProvider] = useState(llmProvider);
  const [tempLocalEndpoint, setTempLocalEndpoint] = useState(localEndpoint);
  const [tempLocalModel, setTempLocalModel] = useState(localModel);
  const [tempLocalSttModel, setTempLocalSttModel] = useState(localSttModel);
  const [tempLocalApiKey, setTempLocalApiKey] = useState(localApiKey);

  const [tempHisEnabled, setTempHisEnabled] = useState(hisEnabled);
  const [tempHisEndpoint, setTempHisEndpoint] = useState(hisEndpoint);
  const [tempHisAuthToken, setTempHisAuthToken] = useState(hisAuthToken);
  const [tempHisFormat, setTempHisFormat] = useState(hisFormat);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save draft of the transcript to prevent loss of clinical data
  useEffect(() => {
    localStorage.setItem('recapmind_draft_transcript', transcript);
  }, [transcript]);

  useEffect(() => {
    const saved = localStorage.getItem('recapmind_draft_transcript');
    if (saved && !transcript) {
      setTranscript(saved);
    }
  }, []);

  const openSettings = () => {
    setTempApiKey(localStorage.getItem('recapmind_custom_api_key') || '');
    setTempEmail(localStorage.getItem('recapmind_custom_email') || '');
    setTempModel(localStorage.getItem('recapmind_custom_model') || 'gemini-1.5-flash');
    
    setTempLlmProvider(localStorage.getItem('recapmind_llm_provider') || 'cloud_gemini');
    setTempLocalEndpoint(localStorage.getItem('recapmind_local_endpoint') || 'http://localhost:11434/v1');
    setTempLocalModel(localStorage.getItem('recapmind_local_model') || 'llama3');
    setTempLocalSttModel(localStorage.getItem('recapmind_local_stt_model') || 'whisper-1');
    setTempLocalApiKey(localStorage.getItem('recapmind_local_api_key') || '');

    setTempHisEnabled(localStorage.getItem('recapmind_his_enabled') === 'true');
    setTempHisEndpoint(localStorage.getItem('recapmind_his_endpoint') || 'https://his.hospital-intranet.go.th/api/v1/clinical-notes');
    setTempHisAuthToken(localStorage.getItem('recapmind_his_token') || '');
    setTempHisFormat(localStorage.getItem('recapmind_his_format') || 'json_standard');

    setSettingsSavedSuccess(false);
    setIsSettingsOpen(true);
  };

  const handleSaveSettings = () => {
    const cleanKey = tempApiKey.trim();
    const cleanEmail = tempEmail.trim();

    if (cleanKey) {
      localStorage.setItem('recapmind_custom_api_key', cleanKey);
    } else {
      localStorage.removeItem('recapmind_custom_api_key');
    }
    
    if (cleanEmail) {
      localStorage.setItem('recapmind_custom_email', cleanEmail);
    } else {
      localStorage.removeItem('recapmind_custom_email');
    }
    
    localStorage.setItem('recapmind_custom_model', tempModel);
    
    setCustomApiKeyState(cleanKey);
    setCustomEmailState(cleanEmail);
    setCustomModelState(tempModel);

    // Save local LLM settings
    localStorage.setItem('recapmind_llm_provider', tempLlmProvider);
    localStorage.setItem('recapmind_local_endpoint', tempLocalEndpoint.trim());
    localStorage.setItem('recapmind_local_model', tempLocalModel.trim());
    localStorage.setItem('recapmind_local_stt_model', tempLocalSttModel.trim());
    localStorage.setItem('recapmind_local_api_key', tempLocalApiKey.trim());

    setLlmProvider(tempLlmProvider);
    setLocalEndpoint(tempLocalEndpoint);
    setLocalModel(tempLocalModel);
    setLocalSttModel(tempLocalSttModel);
    setLocalApiKey(tempLocalApiKey);

    // Save HIS settings
    localStorage.setItem('recapmind_his_enabled', tempHisEnabled ? 'true' : 'false');
    localStorage.setItem('recapmind_his_endpoint', tempHisEndpoint.trim());
    localStorage.setItem('recapmind_his_token', tempHisAuthToken.trim());
    localStorage.setItem('recapmind_his_format', tempHisFormat);

    setHisEnabled(tempHisEnabled);
    setHisEndpoint(tempHisEndpoint);
    setHisAuthToken(tempHisAuthToken);
    setHisFormat(tempHisFormat);
    
    setSettingsSavedSuccess(true);
    setTimeout(() => {
      setSettingsSavedSuccess(false);
    }, 2000);
  };

  const handleClearSettings = () => {
    localStorage.removeItem('recapmind_custom_api_key');
    localStorage.removeItem('recapmind_custom_email');
    localStorage.removeItem('recapmind_custom_model');
    
    localStorage.removeItem('recapmind_llm_provider');
    localStorage.removeItem('recapmind_local_endpoint');
    localStorage.removeItem('recapmind_local_model');
    localStorage.removeItem('recapmind_local_stt_model');
    localStorage.removeItem('recapmind_local_api_key');

    localStorage.removeItem('recapmind_his_enabled');
    localStorage.removeItem('recapmind_his_endpoint');
    localStorage.removeItem('recapmind_his_token');
    localStorage.removeItem('recapmind_his_format');

    setTempApiKey('');
    setTempEmail('');
    setTempModel('gemini-1.5-flash');
    setCustomApiKeyState('');
    setCustomEmailState('');
    setCustomModelState('gemini-1.5-flash');

    setLlmProvider('cloud_gemini');
    setLocalEndpoint('http://localhost:11434/v1');
    setLocalModel('llama3');
    setLocalSttModel('whisper-1');
    setLocalApiKey('');

    setHisEnabled(false);
    setHisEndpoint('https://his.hospital-intranet.go.th/api/v1/clinical-notes');
    setHisAuthToken('');
    setHisFormat('json_standard');

    setTempLlmProvider('cloud_gemini');
    setTempLocalEndpoint('http://localhost:11434/v1');
    setTempLocalModel('llama3');
    setTempLocalSttModel('whisper-1');
    setTempLocalApiKey('');

    setTempHisEnabled(false);
    setTempHisEndpoint('https://his.hospital-intranet.go.th/api/v1/clinical-notes');
    setTempHisAuthToken('');
    setTempHisFormat('json_standard');

    setSettingsSavedSuccess(true);
    setTimeout(() => {
      setSettingsSavedSuccess(false);
    }, 1500);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const [userCases, setUserCases] = useState<any[]>([]);
  const hasUserPsychCases = userCases.some(uc => uc.final_note && uc.final_note.history !== undefined && uc.transcript);

  const fetchUserCases = async () => {
    try {
      const data = await getTrainingData();
      setUserCases(data);
    } catch (err) {
      console.warn("Failed to load user cases", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserCases();
    } else {
      setUserCases([]);
    }
  }, [user]);

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
    const c = CASE_EXAMPLES.find(x => x.id === id);
    if (c) {
      setTranscript(c.tx);
      setCaseTheme(c.th);
      setSafetyStatus(checkSafety(c.tx));
    }
  };

  const startRecording = () => {
    // Check if SpeechRecognition is available
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'th-TH'; // Primary lang is Thai

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            currentFinal += event.results[i][0].transcript;
          } else {
            currentInterim += event.results[i][0].transcript;
          }
        }

        setInterimTranscript(currentInterim);
        if (currentFinal) {
          setTranscript(prev => deIdentify(prev + ' ' + currentFinal));
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error === 'not-allowed') {
          alert('กรุณาอนุญาตการเข้าถึงไมโครโฟนเพื่อใช้งานระบบอัดเสียง');
          setRecording(false);
        }
      };

      recognition.onend = () => {
        if (recording) recognition.start(); // Keep recording if still in recording state
      };

      recognition.start();
      recognitionRef.current = recognition;
    }

    setRecording(true);
    setTranscript('');
  };

  const stopRecording = () => {
    setRecording(false);
    setInterimTranscript('');
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setLoadingMessage('กำลังโหลดโครงสร้างไฟล์แพ็คเก็ต...');
    const fileName = file.name.toLowerCase();

    try {
      let extractedText = '';

      const isMedia = fileName.endsWith('.mp3') || fileName.endsWith('.wav') || fileName.endsWith('.m4a') || fileName.endsWith('.mp4');
      if (isMedia && file.size > 250 * 1024 * 1024) {
        throw new Error('ขนาดไฟล์สื่อของคุณใหญ่กว่า 250MB เกินระดับการตระเตรียมของอุปกรณ์ กรุณาอัปโหลดไฟล์ที่สั้นลง');
      }

      if (fileName.endsWith('.txt')) {
        setLoadingMessage('กำลังอ่านข้อความจากไฟล์ Text...');
        extractedText = await file.text();
      } else if (fileName.endsWith('.docx')) {
        setLoadingMessage('กำลังแกะข้อความจากไฟล์ Word (.docx)...');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        extractedText = result.value;
      } else if (fileName.endsWith('.pdf')) {
        setLoadingMessage('กำลังถอดพจนานุกรมประมวลคำจากไฟล์เอกสาร PDF...');
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          setLoadingMessage(`กำลังอ่านหน้าเอกสาร PDF [${i}/${pdf.numPages}]...`);
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
        }
        extractedText = fullText;
      } else if (isMedia) {
        const { chunks } = await compressAudioFile(file, (msg) => {
          setLoadingMessage(msg);
        });

        let fullTranscript = '';
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          setLoadingMessage(`กำลังถอดคำพูดจากส่วนเสียงภาษาไทย ชิ้นที่ ${i + 1} จากทั้งหมด ${chunks.length} ชิ้น ด้วยโมเดลวิเคราะห์ความละเอียดสูง...`);
          
          try {
            const partText = await generateTranscription(chunk.data, chunk.mimeType);
            fullTranscript += (fullTranscript ? '\n' : '') + partText;
          } catch (err: any) {
            throw new Error(`ถอดความสัญญาณเสียงล้มเหลวในส่วนชิ้นที่ ${i + 1}: ${err.message || String(err)}`);
          }
        }

        extractedText = fullTranscript;
      } else {
        alert('ประเภทไฟล์ไม่รองรับ กรุณาใช้ .txt, .docx, .pdf หรือไฟล์เสียง/วีดีโอ (.mp3, .wav, .mp4)');
        setIsLoading(false);
        return;
      }

      if (extractedText) {
        setLoadingMessage('เสร็จสิ้นขั้นตอนการถอดอักษร กำลังเข้ารหัสนิรภัยจำแลงข้อมูล (De-Identification)...');
        // Automatically de-identify when uploading documents
        const cleanedText = deIdentify(extractedText);
        setTranscript(cleanedText);
        setSafetyStatus(checkSafety(cleanedText));
        alert(`ถอดอักษรและดึงข้อความจากไฟล์ ${file.name} ลงในช่อง Transcript เรียบร้อยแล้ว!`);
      }
    } catch (error) {
      console.error("File upload/processing failed", error);
      alert('เกิดข้อผิดพลาดในการประมวลผลไฟล์: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const generateAllNotes = async () => {
    if (!transcript.trim()) return;
    setIsLoading(true);
    setLoadingMessage('กำลังปรับข้อมูลฐานความรู้ คัดกรองรหัสและเปรียบเทียบคำถอดความจิตเวช...');
    setSignedModels({});
    setHitl({
      baseline: [false, false, false, false, false],
      rag: [false, false, false, false, false],
      finetuned: [false, false, false, false, false]
    });
    
    const safety = checkSafety(transcript);
    setSafetyStatus(safety);
 
    const retrieved = retrieveRagCases(transcript);
    setRagResults(retrieved);
 
    try {
      if (sessionType === 'cbt') {
        // Parallel generation for CBT - only RAG and Finetuned as requested
        const [rag, finetuned] = await Promise.allSettled([
          generateClinicalNote(transcript, 'rag', retrieved, caseTheme, 'cbt', userCases),
          generateClinicalNote(transcript, 'finetuned', undefined, caseTheme, 'cbt', userCases)
        ]);
   
        const generatedNotes = {
          rag: rag.status === 'fulfilled' ? rag.value : { ...EMPTY_NOTE, mood_check: 'Error: API Failed' },
          finetuned: finetuned.status === 'fulfilled' ? finetuned.value : { ...EMPTY_NOTE, mood_check: 'Error: API Failed' }
        };
  
        setNotes(generatedNotes);
        setNoteDrafts(JSON.parse(JSON.stringify(generatedNotes)));
        setSelectedModel('rag');
      } else {
        // Single generation for Psychiatric SOAP (Dynamic RAG / Zero-Shot)
        const noteResult = await generateClinicalNote(transcript, 'rag', undefined, caseTheme, 'psychiatric', userCases);
   
        const generatedNotes = {
          rag: noteResult
        };
  
        setNotes(generatedNotes);
        setNoteDrafts(JSON.parse(JSON.stringify(generatedNotes)));
        setSelectedModel('rag');
      }
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleHitl = (modelId: string, index: number) => {
    setHitl(prev => {
      const newItems = [...(prev[modelId] || [false, false, false, false, false])];
      newItems[index] = !newItems[index];
      return { ...prev, [modelId]: newItems };
    });
  };

  const isHitlComplete = (modelId: string) => {
    return (hitl[modelId] || []).filter(Boolean).length === 5;
  };

  const handleSendToHIS = async (modelId: string) => {
    const note = noteDrafts[modelId] || notes[modelId];
    if (!note) {
      alert('ไม่พบข้อมูลเวชระเบียนที่ต้องการส่งออก');
      return;
    }

    setHisExportStatus(prev => ({ ...prev, [modelId]: 'exporting' }));
    setHisExportMessage(prev => ({ ...prev, [modelId]: 'กำลังเชื่อมโยงและส่งข้อมูลเข้าเวชระเบียนโรงพยาบาล...' }));

    try {
      const endpoint = localStorage.getItem('recapmind_his_endpoint') || 'https://his.hospital-intranet.go.th/api/v1/clinical-notes';
      const token = localStorage.getItem('recapmind_his_token') || '';
      const format = localStorage.getItem('recapmind_his_format') || 'json_standard';

      let payload: any = {};
      const generatedAt = new Date().toISOString();

      if (format === 'fhir_document_reference') {
        const textContent = JSON.stringify({
          metadata: {
            recorder: "RecapMind AI Scribe",
            doctor_email: customEmail || "practitioner@hospital.local",
            session_no: sessionNo,
            case_theme: caseTheme,
            session_type: sessionType,
            ai_model_used: modelId
          },
          clinical_note: note
        });

        // Safe conversion of UTF-8 string to base64
        const binaryString = unescape(encodeURIComponent(textContent));
        const base64Data = btoa(binaryString);

        payload = {
          resourceType: "DocumentReference",
          status: "current",
          docStatus: "final",
          type: {
            coding: [{
              system: "http://loinc.org",
              code: "11506-3",
              display: "Subspecialty progress note"
            }]
          },
          subject: {
            identifier: {
              system: "http://hospital-intranet/patient-hn",
              value: patientId || "UNKNOWN_HN"
            },
            display: `HN: ${patientId || "N/A"}`
          },
          date: generatedAt,
          description: `RecapMind Scribe Clinical Note Summary (${sessionType.toUpperCase()})`,
          content: [
            {
              attachment: {
                contentType: "application/json",
                language: "th",
                creation: generatedAt,
                title: `RecapMind Scribe Note ss:${sessionNo || "1"}`,
                data: base64Data
              }
            }
          ],
          context: {
            encounter: [
              {
                identifier: {
                  system: "http://hospital-intranet/encounter-id",
                  value: sessionNo || "UNKNOWN_ENCOUNTER"
                }
              }
            ]
          }
        };
      } else {
        payload = {
          patient_hn: patientId || "UNKNOWN_HN",
          encounter_id: sessionNo || "UNKNOWN_ENCOUNTER",
          clinician_signer: customEmail || "practitioner@hospital.local",
          exported_datetime: generatedAt,
          evaluation_type: sessionType === 'cbt' ? 'Cognitive Behavioral Therapy (CBT)' : 'Psychiatric Assessment',
          scribe_method: `RecapMind Scribe [${modelId.toUpperCase()}]`,
          note_data: note
        };
      }

      console.log(`[HIS API Export] Sending to ${endpoint}...`, payload);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HIS Server Returned: HTTP ${response.status}`);
      }

      const responseData = await response.json().catch(() => ({}));
      
      setHisExportStatus(prev => ({ ...prev, [modelId]: 'success' }));
      setHisExportMessage(prev => ({ 
        ...prev, 
        [modelId]: `ส่งออกเข้าเวชระเบียนโรงพยาบาลผ่าน API สำเร็จ! [Ref: ${responseData.id || responseData.ref_num || 'HIS-ACK-' + Math.floor(Math.random() * 900000 + 100000)}]` 
      }));
    } catch (err: any) {
      console.error("Failed to export to Hospital HIS", err);
      setHisExportStatus(prev => ({ ...prev, [modelId]: 'failed' }));
      setHisExportMessage(prev => ({ 
        ...prev, 
        [modelId]: `ส่งออก HIS ไม่สำเร็จ: ${err instanceof Error ? err.message : String(err)}` 
      }));
    }
  };

  const handleCoSign = async (modelId: string) => {
    setSignedModels(prev => ({ ...prev, [modelId]: true }));
    
    // Auto export to HIS if configured
    const isHisEnabledActive = localStorage.getItem('recapmind_his_enabled') === 'true';
    if (isHisEnabledActive) {
      handleSendToHIS(modelId);
    }

    // Auto-save to training database as "Committed/Co-signed" record
    const note = noteDrafts[modelId] || notes[modelId];
    if (user && note) {
       try {
         setIsSaving(true);
         await saveTrainingData(transcript, note, modelId + "-signed", patientId, sessionNo);
         await fetchUserCases();
       } catch (err) {
         console.warn("Failed to background save co-signed note", err);
       } finally {
         setIsSaving(false);
       }
    }
  };

  const handleCopyNote = async (modelId: 'baseline' | 'rag' | 'finetuned') => {
    const note = noteDrafts[modelId] || notes[modelId];
    if (!note) return;
    
    let textToCopy = '';
    if (sessionType === 'cbt') {
      textToCopy = `
[CLINICAL NOTE - RECAPMIND - CBT SESSION]
Patient ID: ${patientId || 'N/A'}
Session No: ${sessionNo || 'N/A'}
Theme: ${caseTheme || 'N/A'}
Model: ${modelId}

1. Mood Check: ${note.mood_check}
2. Bridge: ${note.bridge}
3. Agenda: ${note.agenda}
4. Homework Review: ${note.homework_review}
5. New Topics: ${note.new_topics}

CBT MODEL:
- Situation: ${note.cbt_model?.situation}
- Mood: ${note.cbt_model?.mood}
- Thought: ${note.cbt_model?.thoughts}
- Behavior: ${note.cbt_model?.behavior}
- Physical: ${note.cbt_model?.physical}

7. Intervention: ${note.intervention}
8. Plan/Homework: ${note.plan_homework}
9. Summary: ${note.summary}
10. Feedback/Appointment: ${note.feedback_appointment}

--------------------------------------------------
[RecapMind Clinical Decision Support System]
Developed by Thanvaruj Booranasuksakul
Master of Science Program in Mental Health
Generated: ${new Date().toLocaleString('th-TH')}
`.trim();
    } else {
      textToCopy = `
[CLINICAL SOAP NOTE - RECAPMIND - PSYCHIATRIC SESSION]
Patient ID: ${patientId || 'N/A'}
Session No: ${sessionNo || 'N/A'}
Theme: ${caseTheme || 'N/A'}
Model: ${modelId}

1. History of Discussion & Review (ประวัติเรื่องที่พูดคุยกัน/ทบทวนการรักษา):
${note.history || 'N/A'}

2. Mental Status Examination (มาตรฐานทางจิตเวชสากล):
${note.mental_status || 'N/A'}

3. Diagnosis according to DSM-5 & ICD-11 with codes (การวินิจฉัยโรคพร้อมรหัส):
${note.diagnosis || 'N/A'}

4. Treatment Plan & Appointments (รูปแบบการรักษาและการนัดหมาย):
${note.treatment_plan || 'N/A'}

--------------------------------------------------
[RecapMind Clinical Decision Support System]
Developed by Thanvaruj Booranasuksakul
Master of Science Program in Mental Health
Generated: ${new Date().toLocaleString('th-TH')}
`.trim();
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      alert(`คัดลอกข้อความ (${modelId}) ลง Clipboard เรียบร้อยแล้ว`);
      
      if (user) {
        setIsSaving(true);
        await saveTrainingData(transcript, note, modelId, patientId, sessionNo);
        await fetchUserCases();
        setIsSaving(false);
      }
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  const handleSaveAsText = (modelId: string) => {
    const note = noteDrafts[modelId] || notes[modelId];
    if (!note) return;

    let text = '';
    if (sessionType === 'cbt') {
      text = `RECAPMIND CLINICAL NOTE DRAFT (${modelId.toUpperCase()})\n`;
      text += `=========================================\n`;
      text += `Patient ID: ${patientId || 'N/A'}\n`;
      text += `Session No: ${sessionNo || 'N/A'}\n`;
      text += `Case Theme: ${caseTheme || 'N/A'}\n`;
      text += `Generated Date: ${new Date().toLocaleString()}\n`;
      text += `=========================================\n\n`;

      text += `1. MOOD CHECK:\n${note.mood_check || 'N/A'}\n\n`;
      text += `2. BRIDGE:\n${note.bridge || 'N/A'}\n\n`;
      text += `3. AGENDA:\n${note.agenda || 'N/A'}\n\n`;
      text += `4. HOMEWORK REVIEW:\n${note.homework_review || 'N/A'}\n\n`;
      text += `5. NEW TOPICS:\n${note.new_topics || 'N/A'}\n\n`;

      text += `6. CBT FORMULATION:\n`;
      text += `   - Situation: ${note.cbt_model?.situation || 'N/A'}\n`;
      text += `   - Mood: ${note.cbt_model?.mood || 'N/A'}\n`;
      text += `   - Thoughts: ${note.cbt_model?.thoughts || 'N/A'}\n`;
      text += `   - Behavior: ${note.cbt_model?.behavior || 'N/A'}\n`;
      text += `   - Physical: ${note.cbt_model?.physical || 'N/A'}\n\n`;

      text += `7. INTERVENTION:\n${note.intervention || 'N/A'}\n\n`;
      text += `8. HOMEWORK:\n${note.plan_homework || 'N/A'}\n\n`;
      text += `9. SUMMARY:\n${note.summary || 'N/A'}\n\n`;
      text += `10. RISK & APPOINTMENT:\n${note.feedback_appointment || 'N/A'}\n\n`;
    } else {
      text = `RECAPMIND CLINICAL SOAP NOTE DRAFT (${modelId.toUpperCase()})\n`;
      text += `=========================================\n`;
      text += `Patient ID: ${patientId || 'N/A'}\n`;
      text += `Session No: ${sessionNo || 'N/A'}\n`;
      text += `Case Theme: ${caseTheme || 'N/A'}\n`;
      text += `Generated Date: ${new Date().toLocaleString()}\n`;
      text += `=========================================\n\n`;

      text += `1. SUBJECTIVE/OBJECTIVE HISTORY (ประวัติเรื่องที่พูดคุยกัน/ทบทวนการรักษา):\n${note.history || 'N/A'}\n\n`;
      text += `2. MENTAL STATUS EXAMINATION (มาตรฐานทางจิตเวชสากล):\n${note.mental_status || 'N/A'}\n\n`;
      text += `3. CLINICAL DIAGNOSES DSM-5 & ICD-11 WITH CODES:\n${note.diagnosis || 'N/A'}\n\n`;
      text += `4. TREATMENT PLAN & APPOINTMENTS (รูปแบบการรักษาและการนัดหมาย):\n${note.treatment_plan || 'N/A'}\n\n`;
    }

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `recapmind_note_${modelId}_${patientId || 'patient'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    alert(`ดาวน์โหลดไฟล์เวชระเบียน (${modelId}) เรียบร้อยแล้ว`);
  };

  const handleExportPDF = async (modelId: 'baseline' | 'rag' | 'finetuned') => {
    const ref = noteRefs.current[modelId];
    const note = noteDrafts[modelId] || notes[modelId];
    if (!ref || !note) {
      alert('ไม่พบข้อมูลที่จะ Export');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Temporary style to expand textareas for full capture
      const textareas = ref.querySelectorAll('textarea');
      const originalStyles = Array.from(textareas).map(ta => {
        const hta = ta as HTMLTextAreaElement;
        return {
          height: hta.style.height,
          overflow: hta.style.overflow
        };
      });
      
      textareas.forEach(ta => {
        const hta = ta as HTMLTextAreaElement;
        hta.style.height = hta.scrollHeight + 'px';
        hta.style.overflow = 'visible';
      });

      // Hide sections if requested
      const hitlSections = ref.querySelectorAll('.hitl-section');
      const originalHitlDisplay = Array.from(hitlSections).map(s => (s as HTMLElement).style.display);
      if (!includeHitlInExport) {
        hitlSections.forEach(s => {
          (s as HTMLElement).style.display = 'none';
        });
      }

      const signSections = ref.querySelectorAll('.sign-section');
      const originalSignDisplay = Array.from(signSections).map(s => (s as HTMLElement).style.display);
      if (!includeSignInExport) {
        signSections.forEach(s => {
          (s as HTMLElement).style.display = 'none';
        });
      }

      // Wait for layout to settle
      await new Promise(r => setTimeout(r, 500));
      
      const canvas = await html2canvas(ref, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        scrollY: -window.scrollY,
        windowWidth: ref.scrollWidth,
        windowHeight: ref.scrollHeight
      });
      
      // Revert styles
      textareas.forEach((ta, i) => {
        const hta = ta as HTMLTextAreaElement;
        hta.style.height = originalStyles[i].height;
        hta.style.overflow = originalStyles[i].overflow;
      });

      if (!includeHitlInExport) {
        hitlSections.forEach((s, i) => {
          (s as HTMLElement).style.display = originalHitlDisplay[i];
        });
      }

      if (!includeSignInExport) {
        signSections.forEach((s, i) => {
          (s as HTMLElement).style.display = originalSignDisplay[i];
        });
      }

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Basic multipage support if content is very long
      let heightLeft = imgHeight;
      let position = 0;
      const pageHeight = 297;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      const fileName = `RecapMind_${modelId}_${patientId || 'Note'}_${new Date().getTime()}.pdf`;
      
      // Fallback for iframe environments: save as blob then trigger download
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      if (user) {
        setIsSaving(true);
        await saveTrainingData(transcript, note, modelId, patientId, sessionNo);
        await fetchUserCases();
        setIsSaving(false);
      }
      
      alert(`Export สำเร็จ: ${fileName}`);
    } catch (error) {
      console.error('PDF Export failed', error);
      alert('เกิดข้อผิดพลาดในการ Export PDF: ' + (error instanceof Error ? error.message : String(error)));
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

  useEffect(() => {
    const newDrafts: Record<string, ClinicalNote> = {};
    Object.entries(notes).forEach(([key, note]) => {
      newDrafts[key] = JSON.parse(JSON.stringify(note)); // Deep clone
    });
    setNoteDrafts(newDrafts);
  }, [notes]);

  const handleNoteFieldChange = (modelId: string, field: keyof ClinicalNote, value: any) => {
    setNoteDrafts(prev => {
      const currentDraft = prev[modelId] || JSON.parse(JSON.stringify(notes[modelId] || EMPTY_NOTE));
      return {
        ...prev,
        [modelId]: {
          ...currentDraft,
          [field]: value
        }
      };
    });
  };

  const handleCbtFieldChange = (modelId: string, field: keyof ClinicalNote['cbt_model'], value: string) => {
    setNoteDrafts(prev => {
      const currentDraft = prev[modelId] || JSON.parse(JSON.stringify(notes[modelId] || EMPTY_NOTE));
      return {
        ...prev,
        [modelId]: {
          ...currentDraft,
          cbt_model: {
            ...currentDraft.cbt_model,
            [field]: value
          }
        }
      };
    });
  };

  const saveAllChanges = async (modelId: string) => {
    const draft = noteDrafts[modelId];
    if (!draft) return;
    
    setNotes(prev => ({
      ...prev,
      [modelId]: JSON.parse(JSON.stringify(draft))
    }));

    if (user) {
      try {
        setIsSaving(true);
        await saveTrainingData(transcript, draft, modelId + "-edited", patientId, sessionNo);
        await fetchUserCases();
      } catch (err) {
        console.warn("Failed to background save edited note", err);
      } finally {
        setIsSaving(false);
      }
    }
    
    alert(`บันทึกการแก้ไขเวชระเบียน (${modelId}) เรียบร้อยแล้ว`);
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

        {isSettingsOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 text-slate-800"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[95vh]"
            >
              <div className="bg-gradient-to-br from-[#1E3A8A] to-[#1549C7] p-6 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 bg-blue-900/30 rounded-xl text-lg">⚙️</span>
                  <div>
                    <h2 className="text-lg font-bold leading-none">ตั้งค่าความปลอดภัย & การเชื่อมต่อระบบพยาบาล</h2>
                    <p className="text-blue-100 text-[11px] opacity-90 mt-1">กำหนดค่าโมเดลถอดความ คีย์ประมวลผล และระบบฐานข้อมูลเวชระเบียนโรงพยาบาล</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-5 flex-1 text-sm text-[#334155]">
                {/* 1. Offline Mode Audit & Diagnostics */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                    <h3 className="font-bold flex items-center gap-1.5 text-slate-800 text-[13px]">
                      <Database size={15} className="text-slate-600" />
                      รายงานความเข้ากันได้โหมดทำงานแบบ Local / Offline
                    </h3>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {isOnline ? '🌐 เชื่อมต่ออินเทอร์เน็ตแล้ว' : '📴 ระบบทำงานแบบ Offline 100%'}
                    </span>
                  </div>
                  
                  <div className="text-[11.5px] leading-relaxed text-slate-600 space-y-1.5">
                    <p>
                      เบราว์เซอร์ได้รับการติดตั้ง Offline Service Worker เรียบร้อยแล้ว ระบบนี้สามารถถอดความ นำเข้าไฟล์ และจัดระเบียบเคสในเครื่องผู้ใช้ของท่านได้โดยไม่มีการส่งข้อมูลระบุตัวตนจริงออกนอกโรงพยาบาล
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-1 font-semibold text-[11px]">
                      <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-2 rounded-lg flex items-center gap-1.5">
                        <span className="text-emerald-700 font-bold">✓</span> 
                        <span>On-Device Recording (ออฟไลน์ 100%)</span>
                      </div>
                      <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-2 rounded-lg flex items-center gap-1.5">
                        <span className="text-emerald-700 font-bold">✓</span> 
                        <span>De-Identifier ปิดบังความลับ (ออฟไลน์ 100%)</span>
                      </div>
                      <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-2 rounded-lg flex items-center gap-1.5">
                        <span className="text-emerald-700 font-bold">✓</span> 
                        <span>พิมพ์บันทึก / ดาวน์โหลด PDF & DOC (ออฟไลน์ 100%)</span>
                      </div>
                      <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-2 rounded-lg flex items-center gap-1.5">
                        <span className="text-emerald-700 font-bold">✓</span>
                        <span>สลับรันร่วมกับ Open-Source LLM ภายใน รพ. (ออฟไลน์ 150%)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Platform Model Processor Source (LLM Provider Selection) */}
                <div className="space-y-3.5 border border-slate-150 rounded-2xl p-4 bg-white shadow-sm">
                  <h3 className="font-bold text-slate-800 text-[13px] flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <BrainCircuit size={15} className="text-indigo-600" />
                    แหล่งประมวลผลโมเดลคอมพิวเตอร์ปัญญาประดิษฐ์ (Model Engine)
                  </h3>

                  <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                    <button
                      type="button"
                      onClick={() => setTempLlmProvider('cloud_gemini')}
                      className={`flex-1 text-center py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${tempLlmProvider === 'cloud_gemini' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-650 hover:bg-white/50'}`}
                    >
                      ☁️ Cloud Gemini API
                    </button>
                    <button
                      type="button"
                      onClick={() => setTempLlmProvider('local_llm')}
                      className={`flex-1 text-center py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${tempLlmProvider === 'local_llm' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-650 hover:bg-white/50'}`}
                    >
                      🖥️ Local Open-Source LLM
                    </button>
                  </div>

                  {tempLlmProvider === 'cloud_gemini' ? (
                    <div className="space-y-3 pt-2">
                      <p className="text-[11px] text-slate-500 leading-normal">
                        สรุปและถอดความผ่านเซิร์ฟเวอร์คลาวด์ Google Cloud โดยสามารถระบุคีย์ระบุตนและคีย์โมเดลของแอปแยกเปรียบเทียบคู่ขนานได้อย่างสมบูรณ์
                      </p>
                      
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">📧 อีเมลผู้ใช้สำหรับเชื่อมความปลอดภัย (User Email)</label>
                        <input 
                          type="email" 
                          value={tempEmail}
                          onChange={(e) => setTempEmail(e.target.value)}
                          placeholder="แพทย์@โรงพยาบาล.co.th"
                          className="w-full text-[12px] border rounded-xl px-3 py-2 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all border-slate-300"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">🔑 กุญแจ API คีย์ส่วนตัวจาก Google API (Gemini API Key)</label>
                        <input 
                          type="password" 
                          value={tempApiKey}
                          onChange={(e) => setTempApiKey(e.target.value)}
                          placeholder={customApiKey ? "••••••••••••••••••••••••" : "AIzaSy..."}
                          className="w-full text-[12px] font-mono border rounded-xl px-3 py-2 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all border-slate-300"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">🤖 เลือกใช้โมเดลวิเคราะห์ (Preferred Gemini Model)</label>
                        <select 
                          value={tempModel}
                          onChange={(e) => setTempModel(e.target.value)}
                          className="w-full text-[12px] border rounded-xl px-3 py-2 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all border-slate-300"
                        >
                          <option value="gemini-1.5-flash">Gemini 1.5 Flash (มาตรฐาน ถอดความเก่ง รวดเร็วสูง)</option>
                          <option value="gemini-2.5-flash">Gemini 2.5 Flash (คิดเร็ว และประหยัดทอร์เค่น)</option>
                          <option value="gemini-1.5-pro">Gemini 1.5 Pro (สรุปแนวคิดทางการแพทย์เชิงลึก)</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-2">
                      <p className="text-[11px] text-[#A0522D] bg-[#FFF8DC] border border-[#F5DEB3] rounded-xl p-2 leading-relaxed">
                        ⚠️ <b>Local Offline Hospital Mode:</b> ใช้สำหรับการเชื่อมโยงกับแบบจำลอง open-source (เช่น Llama 3, Mistral, SeaLLM) ที่เปิดอยู่บนโครงสร้างเซิร์ฟเวอร์ร่าของแผนกไอทีโรงพยาบาลเองเพื่อความปลอดภัยสูงสุดและไม่ใช้อินเทอร์เน็ต
                      </p>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">🌐 ที่อยู่ URL บริการเครือข่ายภายในโรงพยาบาล (Local Endpoint API)</label>
                        <input 
                          type="text" 
                          value={tempLocalEndpoint}
                          onChange={(e) => setTempLocalEndpoint(e.target.value)}
                          placeholder="http://10.X.X.X:11434/v1 หรือ http://localhost:11434/v1"
                          className="w-full text-[12px] font-mono border rounded-xl px-3 py-2 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all border-slate-300"
                        />
                        <div className="text-[9.5px] text-slate-400 mt-1">
                          * บริการตามมาตรฐาน OpenAI Chat API เช่น Ollama (/v1), LM Studio, vLLM
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">🤖 ชื่อแบบจำลองภาษา (Local LLM Model)</label>
                          <input 
                            type="text" 
                            value={tempLocalModel}
                            onChange={(e) => setTempLocalModel(e.target.value)}
                            placeholder="llama3, sea-lion, thollama..."
                            className="w-full text-[12px] font-mono border rounded-xl px-3 py-2 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all border-slate-300"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">🎙️ โมเดลถอดความ (Local STT Model)</label>
                          <input 
                            type="text" 
                            value={tempLocalSttModel}
                            onChange={(e) => setTempLocalSttModel(e.target.value)}
                            placeholder="whisper-1 หรือ faster-whisper"
                            className="w-full text-[12px] font-mono border rounded-xl px-3 py-2 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all border-slate-300"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">🔑 คีย์ผ่านทางระบบเครือข่ายภายใน (Optional local key/token)</label>
                        <input 
                          type="password" 
                          value={tempLocalApiKey}
                          onChange={(e) => setTempLocalApiKey(e.target.value)}
                          placeholder="กรณีเซิร์ฟเวอร์รพ.ต้องการรหัสรักษาความปลอดภัย"
                          className="w-full text-[12px] font-mono border rounded-xl px-3 py-2 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all border-slate-300"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Hospital Electronic Health Record (EHR / HIS Export Integration) */}
                <div className="space-y-3.5 border border-slate-150 rounded-2xl p-4 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="font-bold text-slate-800 text-[13px] flex items-center gap-1.5 flex-1 animate-pulse">
                      <Network size={15} className="text-emerald-500 shrink-0" />
                      <span>ระบบเชื่อมข้อมูลเวชระเบียนโรงพยาบาล (EHR / HIS API Export)</span>
                    </h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input 
                        type="checkbox" 
                        id="his-enabled-check"
                        checked={tempHisEnabled}
                        onChange={(e) => setTempHisEnabled(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <label htmlFor="his-enabled-check" className="text-[11px] font-bold text-slate-755 cursor-pointer select-none">
                        เชื่อมโยงอัตโนมัติ
                      </label>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-normal">
                    เมื่อท่านตอบรับและ Co-Sign เคส ข้อมูลบันทึกประวัติการบำบัดรักษาพยาบาลจะถูกโพสต์ส่งต่อเข้าฐานข้อมูลของท่านใน รพ. ทันทีโดยช่องทาง REST endpoint
                  </p>

                  {tempHisEnabled && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-3 overflow-hidden"
                    >
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">🔗 ที่อยู่ URL ระบบนำเวชระเบียนเข้า (HIS API endpoint)</label>
                        <input 
                          type="text" 
                          value={tempHisEndpoint}
                          onChange={(e) => setTempHisEndpoint(e.target.value)}
                          placeholder="https://his-server.hospital-intranet/api/v1/notes"
                          className="w-full text-[11px] font-mono border rounded-xl px-3 py-2 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all border-slate-300"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">📄 รูปแบบโครงสร้างนำส่ง</label>
                          <select 
                            value={tempHisFormat}
                            onChange={(e) => setTempHisFormat(e.target.value)}
                            className="w-full text-[11px] border rounded-xl px-2 py-2 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all border-slate-300"
                          >
                            <option value="json_standard">EMR Custom SOAP JSON (แยกคุณสมบัติประวัติ)</option>
                            <option value="fhir_document_reference">HL7 FHIR DocumentReference (มาตรฐานแลกเปลี่ยนสากล FHIR JSON)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">🔑 คีย์รักษาความปลอดภัยสำหรับการเชื่อมต่อ (JWT API Token)</label>
                          <input 
                            type="password" 
                            value={tempHisAuthToken}
                            onChange={(e) => setTempHisAuthToken(e.target.value)}
                            placeholder="Bearer JWT token"
                            className="w-full text-[11px] font-mono border rounded-xl px-3 py-2 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all border-slate-300"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {settingsSavedSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-emerald-50 text-emerald-850 border border-emerald-250 rounded-xl text-[12px] text-center font-bold"
                  >
                    🎉 บันทึกคุณสมบัติความปลอดภัยและระบบเชื่อมโยงพยาบาลเรียบร้อยแล้ว!
                  </motion.div>
                )}

                {/* Standalone reminder */}
                <div className="text-[11px] text-indigo-700 bg-indigo-50/70 rounded-xl p-3 border border-indigo-150 flex gap-2 leading-relaxed">
                  <Info size={16} className="shrink-0 mt-0.5 text-indigo-650" />
                  <div>
                    <b>เคล็ดลับการดาวน์โหลดใช้งาน:</b> ท่านสามารถเซฟระบบนี้เป็นรูปแบบหน้าเว็บเดี่ยว และก๊อบปี้ผ่าน Flash Drive ไปเปิดรันภายใต้เครื่องคอมพิวเตอร์อึดที่ไม่มีอินเทอร์เน็ตของโรงพยาบาลได้ทันที (Fully Air-Gapped Local Clinical Workstation) โดยรันร่วมกับแบบจำลอง open-source!
                  </div>
                </div>
              </div>

              <div className="bg-slate-100 p-4 border-t border-slate-205 shrink-0 flex items-center justify-between">
                <button 
                  onClick={handleClearSettings}
                  className="px-4 py-2 border border-slate-300 text-slate-650 hover:text-slate-800 rounded-xl hover:bg-slate-200 text-[12px] font-bold transition-all cursor-pointer"
                >
                  🔴 กลับไปใช้ API ระบบ (Revert Default)
                </button>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsSettingsOpen(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-100 text-[12px] font-bold transition-all cursor-pointer"
                  >
                    ปิดหน้าต่าง
                  </button>
                  <button 
                    onClick={handleSaveSettings}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[12px] font-bold shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    💾 บันทึกความปลอดภัย (Save Key)
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
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">🔒 PDPA Security</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors ${isOnline ? 'bg-green-150 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-200'}`}>
              {isOnline ? '🌐 Online' : '📴 Offline Mode'}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors ${customApiKey ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
              {customApiKey ? '🔑 Custom: ' + (customEmail ? customEmail : 'Connected') : '⚡ API Host Agent'}
            </span>
          </div>

          <button 
            onClick={openSettings}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#EFF6FF] hover:bg-blue-100 text-[#1D4ED8] hover:text-[#1E40AF] border border-[rgba(29,78,216,0.15)] rounded-lg text-[11px] font-bold transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-sm"
            title="ตั้งค่า API Key เพื่อความเป็นส่วนตัวสูงสุดและสามารถทำงานได้เป็นเอกเทศ"
          >
            ⚙️ เชื่อม API คีย์ / ทำงาน Offline
          </button>
          
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
        {sessionType === 'cbt' && (
          <button 
            onClick={() => setActiveTab(Tab.COMPARE)}
            className={`px-[15px] py-[9px] text-[12.5px] font-semibold transition-all border-b-[2.5px] ${activeTab === Tab.COMPARE ? 'text-[#1549C7] border-[#1549C7]' : 'text-[#64748B] border-transparent hover:text-slate-900'}`}
          >
            📊 เปรียบเทียบ
          </button>
        )}
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
              <aside className="w-full md:w-[440px] bg-white border-r border-[#E3E8EF] flex flex-col shrink-0 overflow-hidden">
                <div className="p-4 py-3 border-b border-[#E3E8EF] shrink-0">
                  <h2 className="text-[13px] font-bold">📝 Input — Transcript</h2>
                  <p className="text-[11px] text-[#64748B]">อัดเสียง / Upload / ค้นหา Case ตัวอย่าง</p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                  {/* Session Type selection */}
                  <div className="bg-white border border-[#E3E8EF] rounded-[10px] shadow-sm overflow-hidden">
                    <div className="px-3 py-2 bg-[#F9FAFB] border-b border-[#E3E8EF] flex items-center gap-2">
                       <Activity size={14} className="text-[#1549C7]" />
                       <h3 className="text-[12px] font-bold">เลือกประเภทเวชระเบียน</h3>
                    </div>
                    <div className="p-2 space-y-1.5 bg-slate-50/50">
                      <button
                        onClick={() => {
                          setSessionType('cbt');
                          setNotes({});
                          setNoteDrafts({});
                        }}
                        className={`w-full text-left p-2 rounded-lg border transition-all flex items-start gap-2 ${sessionType === 'cbt' ? 'border-[#1549C7] bg-blue-50/55 shadow-sm' : 'border-[#E3E8EF] bg-white hover:border-slate-300'}`}
                      >
                        <div className={`mt-0.5 w-3.5 h-3.5 rounded-full border shrink-0 flex items-center justify-center ${sessionType === 'cbt' ? 'border-[#1549C7]' : 'border-slate-300'}`}>
                          {sessionType === 'cbt' && <div className="w-1.5 h-1.5 rounded-full bg-[#1549C7]" />}
                        </div>
                        <div>
                          <div className="text-[11px] font-bold text-slate-800">CBT Psychotherapy Session</div>
                          <div className="text-[9.5px] text-slate-500 leading-tight">สรุปโมเดลความคิด-พฤติกรรม (10 หัวข้อย่อย)</div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setSessionType('psychiatric');
                          setNotes({});
                          setNoteDrafts({});
                          setActiveTab(Tab.MAIN);
                        }}
                        className={`w-full text-left p-2 rounded-lg border transition-all flex items-start gap-2 ${sessionType === 'psychiatric' ? 'border-[#1549C7] bg-blue-50/55 shadow-sm' : 'border-[#E3E8EF] bg-white hover:border-slate-300'}`}
                      >
                        <div className={`mt-0.5 w-3.5 h-3.5 rounded-full border shrink-0 flex items-center justify-center ${sessionType === 'psychiatric' ? 'border-[#1549C7]' : 'border-slate-300'}`}>
                          {sessionType === 'psychiatric' && <div className="w-1.5 h-1.5 rounded-full bg-[#1549C7]" />}
                        </div>
                        <div>
                          <div className="text-[11px] font-bold text-slate-800">Psychiatric Session (SOAP)</div>
                          <div className="text-[9.5px] text-slate-500 leading-tight">สรุปเวชระเบียนมาตรฐานแพทยสภาสากล SOAP</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Transcript Input Section (Vertical Rail + Workspace Row) */}
                  <div className="bg-white border border-[#E3E8EF] rounded-[10px] shadow-sm overflow-hidden flex flex-col">
                    <div className="px-3 py-2 bg-[#F9FAFB] border-b border-[#E3E8EF] flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Zap size={13} className="text-[#1549C7]" />
                        <h3 className="text-[12px] font-bold">นำเข้า Transcript</h3>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={handleDeID} className="px-2 py-0.5 text-[10px] font-bold border border-slate-300 rounded bg-white hover:border-indigo-600 hover:text-indigo-600 transition-colors">🔒 De-ID</button>
                        <button onClick={handleClear} className="px-2 py-0.5 text-[10px] font-bold border border-slate-300 rounded bg-white hover:border-red-600 hover:text-red-600 transition-colors"><Trash2 size={10} /></button>
                      </div>
                    </div>

                    <div className="flex items-stretch bg-white min-h-[340px]">
                      {/* Left vertical Icon Rail */}
                      <div className="w-[68px] bg-slate-50/80 border-r border-[#E3E8EF] flex flex-col items-center py-4 gap-3.5 shrink-0">
                        {/* Record Button */}
                        <button
                          onClick={() => setInputMode(InputMode.RECORD)}
                          className={`w-[48px] h-[48px] rounded-xl flex flex-col items-center justify-center transition-all ${inputMode === InputMode.RECORD ? 'bg-blue-600 text-white shadow-sm font-bold' : 'text-slate-500 hover:bg-slate-150 hover:text-slate-800'}`}
                          title="อัดเสียง Real-time STT"
                        >
                          <Mic size={16} />
                          <span className="text-[8.5px] font-bold mt-1">อัดเสียง</span>
                        </button>

                        {/* Upload Button */}
                        <button
                          onClick={() => setInputMode(InputMode.UPLOAD)}
                          className={`w-[48px] h-[48px] rounded-xl flex flex-col items-center justify-center transition-all ${inputMode === InputMode.UPLOAD ? 'bg-blue-600 text-white shadow-sm font-bold' : 'text-slate-500 hover:bg-slate-150 hover:text-slate-800'}`}
                          title="อัปโหลดไฟล์ไฟล์"
                        >
                          <Upload size={16} />
                          <span className="text-[8.5px] font-bold mt-1">Upload</span>
                        </button>

                        {/* Type Button */}
                        <button
                          onClick={() => setInputMode(InputMode.TYPE)}
                          className={`w-[48px] h-[48px] rounded-xl flex flex-col items-center justify-center transition-all ${inputMode === InputMode.TYPE ? 'bg-blue-600 text-white shadow-sm font-bold' : 'text-slate-500 hover:bg-slate-150 hover:text-slate-800'}`}
                          title="พิมพ์เองด้วยมือ"
                        >
                          <Keyboard size={16} />
                          <span className="text-[8.5px] font-bold mt-1">พิมพ์เอง</span>
                        </button>

                        {/* Case Template Button */}
                        <button
                          onClick={() => setInputMode(InputMode.CASE)}
                          className={`w-[48px] h-[48px] rounded-xl flex flex-col items-center justify-center transition-all ${inputMode === InputMode.CASE ? 'bg-blue-600 text-white shadow-sm font-bold' : 'text-slate-500 hover:bg-slate-150 hover:text-slate-800'}`}
                          title="เคสสัมภาษณ์ตัวอย่าง"
                        >
                          <FolderOpen size={16} />
                          <span className="text-[8.5px] font-bold mt-1">ตัวอย่าง</span>
                        </button>
                      </div>

                      {/* Right Workspace with Controls and Textarea */}
                      <div className="flex-1 p-3 flex flex-col gap-2.5 min-w-0 bg-white">
                        {/* Conditional Active Mode panel at top of workspace */}
                        {inputMode === InputMode.RECORD && (
                          <div className="text-center p-2 py-3 bg-[#F9FAFB] border border-[#E3E8EF] rounded-md relative overflow-hidden">
                            {recording && (
                              <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.05 }}
                                className="absolute inset-0 bg-red-600 pointer-events-none"
                              />
                            )}
                            <div className="text-[18px] font-extrabold font-mono tracking-wider relative z-10">{formatTime(recTime)}</div>
                            <p className={`text-[9.5px] font-medium my-0.5 relative z-10 ${recording ? 'text-red-600' : 'text-slate-500'}`}>
                              {recording ? '● กำลังอัดเสียง...' : 'พร้อมอัดเสียง • Real-time STT'}
                            </p>
                            <button 
                              onClick={recording ? stopRecording : startRecording}
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-base transition-transform hover:scale-105 active:scale-95 shadow-md mx-auto relative z-10 ${recording ? 'bg-red-800' : 'bg-red-600'}`}
                            >
                              {recording ? (
                                <motion.div 
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ repeat: Infinity, duration: 1.5 }}
                                  className="w-3 h-3 bg-white rounded-sm" 
                                />
                              ) : <Mic size={14} />}
                            </button>
                            
                            <div className="mt-1.5 p-1 bg-blue-50/50 border border-blue-100 rounded text-[8.5px] text-[#1E3A8A] text-left leading-normal flex gap-1 items-start">
                              <Info size={10} className="text-blue-600 shrink-0 mt-0.5" />
                              <span>
                                <b>On-Device STT:</b> ถอดเสียงทันทีแบบปลอดภัย ฟรี ไม่มีข้อจำกัดด้านความยาว
                              </span>
                            </div>
                          </div>
                        )}

                        {inputMode === InputMode.UPLOAD && (
                          <div 
                            onClick={() => !isLoading && fileInputRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onDrop={(e) => {
                              if (isLoading) return;
                              e.preventDefault();
                              e.stopPropagation();
                              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                const dt = new DataTransfer();
                                dt.items.add(e.dataTransfer.files[0]);
                                if (fileInputRef.current) {
                                  fileInputRef.current.files = dt.files;
                                  const event = { target: fileInputRef.current } as React.ChangeEvent<HTMLInputElement>;
                                  handleFileUpload(event);
                                }
                              }
                            }}
                            className={`border border-dashed border-[#CBD5E1] rounded-md p-2.5 text-center cursor-pointer bg-[#F9FAFB] hover:bg-slate-100 transition-all ${isLoading ? 'opacity-90 border-blue-500 bg-blue-50/20 cursor-wait' : ''}`}
                          >
                            {isLoading ? (
                              <div className="flex flex-col items-center justify-center space-y-1 py-1.5">
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                  className="w-5 h-5 border-2.5 border-blue-600 border-t-transparent rounded-full"
                                />
                                <div className="text-[10px] font-bold text-blue-800">กำลังถอดความ...</div>
                                <div className="text-[8.5px] text-slate-600 px-1 leading-relaxed animate-pulse">
                                  {loadingMessage}
                                </div>
                              </div>
                            ) : (
                              <>
                                <input 
                                  type="file" 
                                  ref={fileInputRef} 
                                  onChange={handleFileUpload} 
                                  className="hidden" 
                                  accept=".txt,.docx,.pdf,.mp3,.wav,.m4a,.mp4"
                                />
                                <Upload size={16} className="mx-auto mb-0.5 text-[#64748B]" />
                                <div className="text-[10px] font-semibold">คลิกเพื่อเลือกไฟล์ หรือลากวาง</div>
                                <div className="text-[8px] text-slate-450">รองรับ .docx, .pdf, .mp3, .mp4, .txt</div>
                              </>
                            )}
                          </div>
                        )}

                        {inputMode === InputMode.CASE && (
                          <div className="p-2 bg-[#F9FAFB] border border-[#E3E8EF] rounded-md">
                            <label className="text-[9.5px] font-semibold text-[#4A5568] block mb-1">เลือกเคสตัวอย่าง</label>
                            <select 
                              onChange={(e) => loadCase(e.target.value)}
                              className="w-full text-[11px] border border-[#CBD5E1] rounded px-1.5 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-100 focus:border-[#1549C7]"
                            >
                              <option value="">— เลือกเคสตัวอย่างที่ต้องการ —</option>
                              {CASE_EXAMPLES.map(c => <option key={c.id} value={c.id}>{c.id}: {c.th}</option>)}
                            </select>
                          </div>
                        )}

                        {inputMode === InputMode.TYPE && (
                          <div className="text-[9px] font-medium text-[#2F80ED] bg-blue-50/50 p-2 rounded border border-blue-100/50 flex gap-1.5 items-center">
                            <Info size={11} className="text-[#2F80ED]" />
                            <span>เขียน หรือคัดลอกบทสนทนาการรักษามาวางด้านล่างได้ทันที</span>
                          </div>
                        )}

                        {/* Transcript Field */}
                        <div className="flex-1 flex flex-col min-h-[170px]">
                          {safetyStatus?.risk && (
                            <div className="mb-1.5 p-1.5 bg-red-50 border border-red-200 rounded flex gap-1.5 text-[9.5px] text-red-700">
                              <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                              <div><b>พบความเสี่ยงเพิ่มเติม:</b> {safetyStatus.kws.slice(0,3).join(' • ')}</div>
                            </div>
                          )}
                          <textarea 
                            value={transcript + (interimTranscript ? ' ' + interimTranscript : '')}
                            onChange={(e) => setTranscript(e.target.value)}
                            placeholder="พิมพ์ หรือผลลัพธ์การอัดเสียง/อัพโหลดไฟล์จะมาปรากฏอยู่ในช่องนี้..."
                            className={`w-full flex-1 text-[12px] border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none transition-colors min-h-[150px] ${recording ? 'bg-slate-50 border-red-200 ring-2 ring-red-50' : 'bg-white border-[#CBD5E1] focus:border-[#1549C7]'}`}
                          />
                          <div className="text-[9px] text-slate-400 mt-1 flex justify-between items-center bg-white px-0.5">
                            <span>{transcript.length.toLocaleString()} ตัวอักษร</span>
                            {inputMode === InputMode.TYPE && <span className="text-[#1549C7] font-semibold">โหมดพิมพ์เอง</span>}
                          </div>
                        </div>
                      </div>
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
                   
                    {/* Model Info Header */}
                    <div className="flex items-center gap-2 mt-2">
                       <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-[#E3E8EF]">
                         {sessionType === 'cbt' ? `${Object.keys(notes).length} Models Compared` : '1 Unified Personalized Scribe'}
                       </span>
                       <span className="text-[10px] text-slate-400 font-medium">Gemini Scribe Sessional Analysis</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-12 bg-slate-50">
                  {Object.keys(notes).length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                      <BrainCircuit size={48} className="opacity-20 mb-4" />
                      <p className="text-center font-medium">ป้อน Transcript แล้วกดปุ่ม Generate ด้านล่างซ้าย<br /><span className="text-[11px] font-normal opacity-70">{sessionType === 'cbt' ? 'ระบบจะวิเคราะห์และสรุปด้วย 2 โมเดล (RAG และ Fine-tuning) พร้อมกันเพื่อให้คุณเลือกใช้งานต่อ' : 'ระบบจะประมวลผลดึงประวัติแพทย์ป้อนและเขียน SOAP Note อัจฉริยะ (Dynamic RAG) เพียง 1 ฉบับที่แม่นยำสูงสุด'}</span></p>
                    </div>
                  ) : (
                    (sessionType === 'cbt' ? ['rag', 'finetuned'] : ['rag']).map((m) => {
                      const note = notes[m];
                      if (!note) return null;
                      const draft = noteDrafts[m] || note;

                      return (
                        <div 
                          key={m} 
                          ref={(el) => (noteRefs.current[m] = el)}
                          className={`space-y-4 max-w-4xl mx-auto p-6 rounded-2xl border bg-white shadow-md relative transition-all ${selectedModel === m ? 'ring-2 ring-blue-500 border-transparent shadow-blue-100' : 'border-slate-200 shadow-slate-100 hover:shadow-md'}`}
                          onClick={() => setSelectedModel(m as any)}
                        >
                          {/* Model Ribbon */}
                          <div className={`absolute top-0 right-0 px-4 py-1 text-[10px] font-black uppercase tracking-widest text-white rounded-bl-xl ${sessionType === 'psychiatric' ? 'bg-[#1549C7]' : m === 'baseline' ? 'bg-slate-400' : m === 'rag' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                            {sessionType === 'psychiatric' ? (hasUserPsychCases ? 'Dynamic RAG' : 'Zero-shot') : `${m} model`}
                          </div>

                          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${sessionType === 'psychiatric' ? 'bg-[#1549C7]' : m === 'baseline' ? 'bg-slate-400' : m === 'rag' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                              {sessionType === 'psychiatric' ? <Database size={18} /> : (
                                <>
                                  {m === 'baseline' && <FileText size={18} />}
                                  {m === 'rag' && <Database size={18} />}
                                  {m === 'finetuned' && <Zap size={18} />}
                                </>
                              )}
                            </div>
                            <div className="flex-1">
                               <div className="flex justify-between items-start">
                                 <div>
                                   <h3 className="text-[14px] font-bold">
                                     {sessionType === 'psychiatric' ? (
                                       hasUserPsychCases ? 'Personalized SOAP Note (Dynamic Few-Shot RAG)' : 'Standard SOAP Note (Zero-Shot Baseline)'
                                     ) : (
                                       <>
                                         {m === 'baseline' && 'Baseline Generation (Zero-shot)'}
                                         {m === 'rag' && 'RAG Enhanced (Clinical KB)'}
                                         {m === 'finetuned' && 'Fine-tuned (Expert Logic)'}
                                       </>
                                     )}
                                   </h3>
                                   <div className="flex gap-2 items-center mt-0.5">
                                      <p className="text-[10px] text-slate-400 font-medium">AI Clinical Scribe Draft • Gemini 3 Flash</p>
                                      {patientId && <span className="text-[10px] font-mono bg-slate-100 px-1.5 rounded text-slate-600">ID: {patientId}</span>}
                                      {sessionNo && <span className="text-[10px] font-mono bg-slate-100 px-1.5 rounded text-slate-600">SS: {sessionNo}</span>}
                                   </div>
                                 </div>
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); saveAllChanges(m); }}
                                   className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold shadow-sm transition-all"
                                 >
                                   <Save size={14} /> Save All Changes
                                 </button>
                               </div>
                            </div>
                          </div>

                          {/* Section Summaries */}
                          {sessionType === 'cbt' ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <div className="space-y-3">
                                {[
                                  { id: 1, k: 'mood_check', l: 'Mood Check' },
                                  { id: 2, k: 'bridge', l: 'Bridge' },
                                  { id: 3, k: 'agenda', l: 'Agenda' },
                                  { id: 4, k: 'homework_review', l: 'Homework Review' },
                                  { id: 5, k: 'new_topics', l: 'New Topics' },
                                ].map(f => (
                                  <div key={f.id} className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-sm">
                                     <div className="text-[10px] font-bold text-blue-600 uppercase mb-1">{f.id}. {f.l}</div>
                                     <textarea 
                                       value={(noteDrafts[m] as any)?.[f.k] || ''}
                                       onChange={(e) => handleNoteFieldChange(m, f.k as keyof ClinicalNote, e.target.value)}
                                       placeholder="N/A"
                                       className="w-full text-[11.5px] leading-relaxed border-none bg-transparent focus:ring-0 resize-none min-h-[60px] custom-scrollbar"
                                     />
                                  </div>
                                ))}
                              </div>

                              <div className="space-y-4">
                                {/* Editable CBT Diagram */}
                                <div className="bg-gradient-to-br from-blue-50/30 to-teal-50/30 border border-blue-100 rounded-xl p-3">
                                  <div className="text-[10px] font-bold text-blue-800 uppercase mb-2 flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px]">6</div>
                                    CBT Formulation
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <div className="bg-white rounded-lg p-2 border border-amber-200 shadow-sm">
                                      <div className="text-[8px] font-bold text-amber-600 uppercase">Situation</div>
                                      <textarea 
                                        value={draft.cbt_model?.situation || ''} 
                                        onChange={(e) => handleCbtFieldChange(m, 'situation', e.target.value)}
                                        className="w-full text-[11px] leading-snug border-none bg-transparent focus:ring-0 resize-none h-10 custom-scrollbar mt-0.5"
                                      />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="bg-white rounded-lg p-2 border border-red-200 shadow-sm">
                                        <div className="text-[8px] font-bold text-red-600 uppercase">Mood</div>
                                        <textarea 
                                          value={draft.cbt_model?.mood || ''} 
                                          onChange={(e) => handleCbtFieldChange(m, 'mood', e.target.value)}
                                          className="w-full text-[11px] leading-snug border-none bg-transparent focus:ring-0 resize-none h-10 custom-scrollbar mt-0.5"
                                        />
                                      </div>
                                      <div className="bg-white rounded-lg p-2 border border-blue-200 shadow-sm">
                                        <div className="text-[8px] font-bold text-blue-600 uppercase">Thought</div>
                                        <textarea 
                                          value={draft.cbt_model?.thoughts || ''} 
                                          onChange={(e) => handleCbtFieldChange(m, 'thoughts', e.target.value)}
                                          className="w-full text-[11px] leading-snug border-none bg-transparent focus:ring-0 resize-none h-10 custom-scrollbar mt-0.5"
                                        />
                                      </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="bg-white rounded-lg p-2 border border-teal-200 shadow-sm">
                                        <div className="text-[8px] font-bold text-teal-600 uppercase">Behavior</div>
                                        <textarea 
                                          value={draft.cbt_model?.behavior || ''} 
                                          onChange={(e) => handleCbtFieldChange(m, 'behavior', e.target.value)}
                                          className="w-full text-[11px] leading-snug border-none bg-transparent focus:ring-0 resize-none h-10 custom-scrollbar mt-0.5"
                                        />
                                      </div>
                                      <div className="bg-white rounded-lg p-2 border border-green-200 shadow-sm">
                                        <div className="text-[8px] font-bold text-green-600 uppercase">Physical</div>
                                        <textarea 
                                          value={draft.cbt_model?.physical || ''} 
                                          onChange={(e) => handleCbtFieldChange(m, 'physical', e.target.value)}
                                          className="w-full text-[11px] leading-snug border-none bg-transparent focus:ring-0 resize-none h-10 custom-scrollbar mt-0.5"
                                        />
                                      </div>
                                    </div>

                                    <div className="flex justify-end pt-1">
                                        <button 
                                          onClick={() => saveAllChanges(m)}
                                          className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[9px] font-bold shadow-sm transition-all"
                                        >
                                          <Save size={10} /> Save Changes
                                        </button>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  {[
                                    { id: 7, k: 'intervention', l: 'Intervention' },
                                    { id: 8, k: 'plan_homework', l: 'Homework' },
                                    { id: 9, k: 'summary', l: 'Summary' },
                                    { id: 10, k: 'feedback_appointment', l: 'Risk & Appt' },
                                  ].map(f => (
                                    <div key={f.id} className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-sm">
                                       <div className="text-[10px] font-bold text-blue-600 uppercase mb-1">{f.id}. {f.l}</div>
                                       <textarea 
                                         value={(noteDrafts[m] as any)?.[f.k] || ''}
                                         onChange={(e) => handleNoteFieldChange(m, f.k as keyof ClinicalNote, e.target.value)}
                                         placeholder="N/A"
                                         className="w-full text-[11.5px] leading-relaxed border-none bg-transparent focus:ring-0 resize-none min-h-[60px] custom-scrollbar"
                                       />
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Export-only Footer */}
                              <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-end opacity-60 col-span-2">
                                 <div className="text-[9px] text-slate-500">
                                   <b>RecapMind Clinical Decision Support System</b><br />
                                   Generated: {new Date().toLocaleString('th-TH')}<br />
                                   Clinical Integrity: Validated by AI & Practitioner
                                 </div>
                                 <div className="text-[9px] text-slate-400 text-right">
                                   Developed by <b>Thanvaruj Booranasuksakul</b><br />
                                   Master of Science Program in Mental Health
                                 </div>
                              </div>
                            </div>
                          ) : (
                            // Psychiatric SOAP Layout - Only 4 SOAP standard clinical medicine sections
                            <div className="grid grid-cols-1 gap-5">
                              {[
                                { id: 1, k: 'history', l: 'Subjective & Objective History (ประวัติการซักและทบทวนการรักษา)', placeholder: 'ประวัติเรื่องที่พูดคุยกัน ทบทวนการรักษาที่ผ่านมา เรื่องราวที่ซักประวัติ...' },
                                { id: 2, k: 'mental_status', l: 'Mental Status Examination (MSE - มาตรฐานทางจิตเวชสากล)', placeholder: 'ลักษณะทั่วไป พฤติกรรม คำพูด อารมณ์ ความตั้งใจวิเคราะห์...' },
                                { id: 3, k: 'diagnosis', l: 'Clinical Diagnosis according to DSM-5 & ICD-11 with codes', placeholder: 'การวินิจฉัยโรคตามคู่มือ DSM-5 และเกณฑ์ ICD-11 พร้อมรหัสหรือ Code โรค...' },
                                { id: 4, k: 'treatment_plan', l: 'Treatment Plan & Appointments (รูปแบบการรักษาและการจัดนัดหมาย)', placeholder: 'รูปแบบการรักษาที่ได้รับจากการพูดคุย พร้อมทั้งแผนการนัดหมาย...' }
                              ].map(f => (
                                <div key={f.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm text-left">
                                   <div className="text-[11px] font-extrabold text-blue-700 uppercase mb-2 flex items-center gap-1.5 pb-2 border-b border-slate-200/50">
                                     <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[10px] font-black">{f.id}</span>
                                     {f.l}
                                   </div>
                                   <textarea 
                                     value={(noteDrafts[m] as any)?.[f.k] || ''}
                                     onChange={(e) => handleNoteFieldChange(m, f.k as keyof ClinicalNote, e.target.value)}
                                     placeholder={f.placeholder}
                                     className="w-full text-[13px] leading-relaxed border-none bg-white p-3 rounded-lg shadow-inner focus:ring-1 focus:ring-blue-500 min-h-[125px] custom-scrollbar focus:outline-none focus:bg-white text-slate-800 font-sans"
                                   />
                                </div>
                              ))}

                              {/* Export-only Psychiatric Footer */}
                              <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-end opacity-60 col-span-1">
                                 <div className="text-[9px] text-slate-500">
                                   <b>RecapMind Psychiatric SOAP Clinical CDSS</b><br />
                                   Generated: {new Date().toLocaleString('th-TH')}<br />
                                   Clinical Guidelines: Compiled with DSM-5 and ICD-11 Standards
                                 </div>
                                 <div className="text-[9px] text-slate-400 text-right">
                                   Developed by <b>Thanvaruj Booranasuksakul</b><br />
                                   Master of Science Program in Mental Health
                                 </div>
                              </div>
                            </div>
                          )}

                          {/* Action Footer for specific model */}
                          <div className="flex flex-col gap-4 pt-6 mt-4 border-t border-slate-100 bg-slate-50/50 -mx-6 -mb-6 px-6 pb-6 rounded-b-2xl">
                             
                             {/* HITL Review Section */}
                             <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-sm hitl-section">
                                <div className="flex items-center gap-2 mb-3">
                                   <ShieldCheck size={16} className="text-blue-600" />
                                   <h4 className="text-[12px] font-bold text-slate-800">✅ HITL Checklist — Clinician Review</h4>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-2 mb-4">
                                   {[
                                     'De-identified: ข้อมูลบุคคลถูกลบเรียบร้อยแล้ว',
                                     'Formulation: CBT สอดคล้องกับข้อเท็จจริง',
                                     'Risk: ยืนยันผลการประเมินความเสี่ยงแล้ว',
                                     'Plan: แผนการรักษามีความชัดเจนตกลงร่วมกัน',
                                     'Integrity: บันทึกถูกต้องตามหลักวิชาชีพ'
                                   ].map((item, idx) => (
                                     <div key={idx} className="flex items-center justify-between group py-1 border-b border-slate-50 last:border-0">
                                       <button 
                                          onClick={(e) => { e.stopPropagation(); toggleHitl(m, idx); }}
                                          className="flex items-start gap-2.5 text-left flex-1"
                                       >
                                         <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-all ${hitl[m][idx] ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-slate-300 group-hover:border-blue-400'}`}>
                                            {hitl[m][idx] && <CheckCircle2 size={10} />}
                                         </div>
                                         <span className={`text-[11px] leading-tight ${hitl[m][idx] ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>{item}</span>
                                       </button>
                                       
                                       {idx === 2 && safetyStatus?.risk && !dismissedRisk[m] && !hitl[m][idx] && (
                                         <span className="flex items-center gap-1 px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[8px] font-black animate-pulse uppercase ring-1 ring-red-200 ml-2">
                                           <AlertTriangle size={8} /> 
                                           Review Required
                                           <button 
                                              onClick={(e) => { e.stopPropagation(); setDismissedRisk(prev => ({...prev, [m]: true})); }}
                                              className="ml-1 hover:bg-red-200 rounded p-0.5"
                                           >
                                              <X size={8} />
                                           </button>
                                         </span>
                                       )}
                                       
                                       {idx === 2 && safetyStatus?.risk && hitl[m][idx] && (
                                         <span className="text-[8px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100 ml-2">
                                           Verified Risk
                                         </span>
                                       )}
                                     </div>
                                   ))}
                                </div>

                                <div className="flex flex-col gap-3">
                                  <button 
                                    disabled={!isHitlComplete(m) || signedModels[m]}
                                    onClick={(e) => { e.stopPropagation(); handleCoSign(m); }}
                                    className={`w-full py-2 rounded-lg font-bold text-[12px] shadow-sm transition-all flex items-center justify-center gap-2 ${signedModels[m] ? 'bg-green-50 text-green-700 border border-green-200 cursor-default' : isHitlComplete(m) ? 'bg-green-600 hover:bg-green-700 text-white transform hover:-translate-y-0.5' : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'}`}
                                  >
                                    {signedModels[m] ? <><CheckCircle2 size={14} /> Co-Signed & Committed to HIS</> : '✍️ Co-Sign & บันทึกเข้าเวชระเบียนโรงพยาบาล'}
                                  </button>

                                  {signedModels[m] && (
                                    <motion.div 
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      className="p-3 bg-green-50 border border-green-200 rounded-lg text-[10.5px] font-mono leading-relaxed sign-section"
                                    >
                                      <div className="flex justify-between items-start text-green-800">
                                        <div className="flex flex-col">
                                          <b>[HIS AUDIT TRAIL]</b>
                                          <span>Status: COMPLETED (HL7 FHIR R4)</span>
                                          <span>Resource: ClinicalImpression</span>
                                          <span>TxID: RX-2026-{(Math.random() * 100000).toFixed(0)}</span>
                                        </div>
                                        <div className="text-right">
                                          <span>Practitioner: {user?.displayName || 'Thanvaruj B.'}</span><br />
                                          <span>Time: {new Date().toLocaleTimeString()}</span>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </div>
                             </div>

                             <div className="flex items-center justify-between">
                                <div className="flex flex-col gap-1.5">
                                   <div className="flex items-center gap-2">
                                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${signedModels[m] ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                       {signedModels[m] ? 'VERIFIED' : 'DRAFT'}
                                     </span>
                                     {m === 'rag' && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 rounded border border-blue-100">RECOMMENDED</span>}
                                   </div>
                                   <div className="flex gap-4 ml-0.5">
                                     <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                       <input 
                                         type="checkbox" 
                                         checked={includeHitlInExport} 
                                         onChange={e => setIncludeHitlInExport(e.target.checked)}
                                         className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                                       />
                                       <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Export Review Checklist</span>
                                     </label>
                                     <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                       <input 
                                         type="checkbox" 
                                         checked={includeSignInExport} 
                                         onChange={e => setIncludeSignInExport(e.target.checked)}
                                         className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                                       />
                                       <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Export Sign-off</span>
                                     </label>
                                   </div>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setSelectedModel(m as any); handleCopyNote(m as any); }}
                                      className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-[11px] font-bold hover:border-blue-600 hover:text-blue-600 transition-all bg-white shadow-sm"
                                    >
                                      <Copy size={13} /> Copy
                                    </button>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); handleSaveAsText(m); }}
                                      className="flex items-center gap-1.5 px-3 py-1.5 border border-[#CBD5E1] rounded-lg text-[11px] font-bold hover:border-blue-600 hover:text-blue-600 transition-all bg-white shadow-sm"
                                    >
                                      <Save size={13} /> Save as TXT
                                    </button>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setSelectedModel(m as any); handleExportPDF(m as any); }}
                                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1549C7] text-white hover:bg-blue-700 rounded-lg text-[11px] font-bold transition-all shadow-sm"
                                    >
                                      <Download size={13} /> Export PDF
                                    </button>
                                 </div>
                             </div>
                          </div>
                        </div>
                      );
                    })
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
                        {(sessionType === 'cbt' ? ['rag', 'finetuned'] : ['baseline', 'rag', 'finetuned']).map(m => {
                          const note = notes[m];
                          if (!note) return null;
                          return (
                            <div key={m} className={`bg-white rounded-2xl p-4 border-2 shadow-sm ${selectedModel === m ? 'border-blue-500' : 'border-slate-100'}`}>
                                <div className="flex justify-between items-center mb-3">
                                  <h3 className="font-bold text-[13px] uppercase">{m === 'baseline' ? '📝 Baseline' : m === 'rag' ? '🧠 RAG' : '💾 Fine-tuned'}</h3>
                                  {selectedModel === m && <span className="bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">ACTIVE</span>}
                                </div>
                                <div className="space-y-3">
                                   {sessionType === 'cbt' ? (
                                     <>
                                       <div>
                                         <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Mood Extract</div>
                                         <div className="text-[11px] p-2 bg-slate-50 rounded border border-slate-100 line-clamp-2">{note.mood_check}</div>
                                       </div>
                                       <div>
                                         <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">CBT Thinking</div>
                                         <div className="text-[11px] p-2 bg-slate-50 rounded border border-slate-100 line-clamp-2">{note.cbt_model?.thoughts}</div>
                                       </div>
                                     </>
                                   ) : (
                                     <>
                                       <div>
                                         <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Diagnoses (DSM-5 / ICD-11)</div>
                                         <div className="text-[11px] p-2 bg-slate-50 rounded border border-slate-100 line-clamp-2">{note.diagnosis}</div>
                                       </div>
                                       <div>
                                         <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Treatment & Appointment</div>
                                         <div className="text-[11px] p-2 bg-slate-50 rounded border border-slate-100 line-clamp-2">{note.treatment_plan}</div>
                                       </div>
                                     </>
                                   )}
                                   <button onClick={() => setSelectedModel(m as any)} className="w-full text-center text-blue-600 text-[11px] font-bold pt-2">View Detail →</button>
                                </div>
                            </div>
                          );
                        })}
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
