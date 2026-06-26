import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  ShieldAlert, 
  Database, 
  Brain, 
  UserCheck, 
  ChevronRight, 
  Info, 
  Cpu, 
  Layers, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface PipelineViewerProps {
  isLoading: boolean;
  loadingMessage: string;
  hasNotes: boolean;
  onSelectSampleCase?: () => void;
}

export const PipelineViewer: React.FC<PipelineViewerProps> = ({
  isLoading,
  loadingMessage,
  hasNotes,
  onSelectSampleCase
}) => {
  const [selectedDetail, setSelectedDetail] = useState<number | null>(null);

  // Define steps
  const steps = [
    {
      id: 1,
      title: 'Input Transcript',
      thaiTitle: 'นำเข้าบทสนทนา',
      color: '#066E84',
      bgLight: '#E6F4F8',
      textColor: '#024D5C',
      icon: FileText,
      desc: 'รับข้อความถอดคำพูดจากแพทย์-คนไข้, บทสนทนารวมทั้งไฟล์เสียง/ไฟล์เอกสารเพื่อเข้าสู่กระบวนการ Scribe อัจฉริยะ',
      details: [
        'รองรับการอัดเสียงผ่านไมโครโฟนสด และถอดความด้วย Whisper/STT ในตัว',
        'สามารถอัปโหลดไฟล์เอกสาร .txt, .docx, .pdf และไฟล์เสียง .mp3, .wav ได้โดยตรง',
        'ระบบทำ De-Identification (PDPA Compliance) ทำลายข้อมูลชื่อผู้ป่วย, เบอร์โทรศัพท์ และข้อมูลระบุตัวตนออกทันทีก่อนส่งให้โมเดลเพื่อความปลอดภัยสูงสุด'
      ]
    },
    {
      id: 2,
      title: 'Safety Screen',
      thaiTitle: 'สกรีนความปลอดภัย L2',
      color: '#E25438',
      bgLight: '#FDF2F0',
      textColor: '#9E2E1A',
      icon: ShieldAlert,
      desc: 'ตรวจจับความเสี่ยงฆ่าตัวตาย/ทำร้ายตัวเอง (SI/SH) ด้วยโมเดลสัญชาติไทยระดับปลอดภัยสูงสุดพิเศษ',
      details: [
        'ตรวจสอบความเสี่ยงด้วยโมเดลความปลอดภัยเฉพาะทาง เช่น WangchanBERTa ปรับแต่งพฤติกรรมเสี่ยง',
        'วิเคราะห์หา Keyword สุ่มเสี่ยง และคัดกรองเนื้อหารุนแรงด้วยค่า Threshold ที่ปรับตั้งไว้เข้มข้นที่ 0.65',
        'สร้างสัญญาณแจ้งเตือนแก่ผู้ใช้งาน (Flag Warning) ทันทีบนเวชระเบียนที่ถูกสร้างขึ้น เพื่อให้แพทย์ดูแลใกล้ชิดพิเศษ'
      ]
    },
    {
      id: 3,
      title: 'RAG Retrieval',
      thaiTitle: 'ดึงข้อมูลประวัติ RAG',
      color: '#00C497',
      bgLight: '#EAFDF9',
      textColor: '#008767',
      icon: Database,
      desc: 'ดึงแนวทางการรักษาสอดคล้องจากคลังความรู้จำลองออฟไลน์ ผ่านกระบวนการจับคู่เวกเตอร์ความคล้ายคลึง',
      details: [
        'ใช้โมเดล Embedding ยอดนิยม multilingual-e5-large รองรับสองภาษา (Thai-English) คุณภาพเยี่ยม',
        'ค้นหาแนวปฏิบัติทางจิตบำบัดที่คล้ายคลึงจาก ChromaDB (Local, Offline Vector Database)',
        'คำนวณคะแนนด้วย Cosine Similarity พร้อมระบบเพิ่มน้ำหนักพิเศษ (Clinical Signal Boosting) เพื่อหา Top-k=3 กรณีศึกษาแนวทางที่ดีที่สุดมาใช้เป็นตัวอย่าง Few-Shot ให้โมเดลหลัก'
      ]
    },
    {
      id: 4,
      title: 'LLM Generate',
      thaiTitle: 'ถอดเวชระเบียนอัจฉริยะ',
      color: '#027F94',
      bgLight: '#EBF7F9',
      textColor: '#015B6B',
      icon: Brain,
      desc: 'ประกอบ Few-shot RAG Prompt และรันแบบจำลองหลักเพื่อแปลงเป็นโครงสร้างบันทึกแพทย์สมบูรณ์แบบ',
      details: [
        'ใช้โมเดลภาษาขนาดใหญ่หลักระดับประเทศ Typhoon2-8B-Instruct (GGUF Q4_K_M ขนาด 4.8 GB, CPU)',
        'สร้างโครงสร้างข้อมูลเวชระเบียนจิตเวชครบถ้วน 10 หัวข้อย่อย (10-field JSON CBT Psychiatric Note) เที่ยงตรงสูง',
        'ความปลอดภัยระดับสูงสุดเนื่องจากการรันภายในระบบเซิร์ฟเวอร์เครือข่ายจำลองของโรงพยาบาลเองโดยไม่ผ่านอินเทอร์เน็ต'
      ]
    },
    {
      id: 5,
      title: 'HITL Review',
      thaiTitle: 'แพทย์ตรวจทานลงนาม',
      color: '#F9A825',
      bgLight: '#FFFDEB',
      textColor: '#9E6800',
      icon: UserCheck,
      desc: 'ผู้ประกอบวิชาชีพเวชกรรมตรวจสอบและปรับปรุงความครบถ้วนของเวชระเบียนแบบ Human-in-the-Loop',
      details: [
        'แสดงผลแยกเป็นส่วนๆ พร้อมปุ่มเปิดแก้ไขข้อความจริงได้ด้วยตัวแพทย์เองแบบยืดหยุ่น',
        'ระบบสัญลักษณ์ "ผ่านการตรวจสอบโดยมนุษย์" (HITL Badge) ช่วยรับรองความเที่ยงตรงทางคลินิก',
        'รองรับการส่งออกข้อมูลที่รับรองแล้วไปยังระบบข้อมูลสุขภาพสากล FHIR R4 / ระบบโรงพยาบาล (HIS)'
      ]
    }
  ];

  // Map loadingMessage to current step
  const getActiveStep = (): number => {
    if (!isLoading) return 0;
    const msg = loadingMessage.toLowerCase();
    if (msg.includes('ถอดความ') || msg.includes('ไฟล์') || msg.includes('de-identification') || msg.includes('จำแลง')) {
      return 1;
    }
    if (msg.includes('ความปลอดภัย') || msg.includes('สกรีน') || msg.includes('safety') || msg.includes('suicidal')) {
      return 2;
    }
    if (msg.includes('rag') || msg.includes('ดึงข้อมูล') || msg.includes('ฐานความรู้') || msg.includes('retriev') || msg.includes('เปรียบเทียบ')) {
      return 3;
    }
    if (msg.includes('llm') || msg.includes('generate') || msg.includes('ประมวลผล') || msg.includes('สร้าง') || msg.includes('เวชระเบียน')) {
      return 4;
    }
    return 4; // Default to generation
  };

  const activeStep = getActiveStep();

  return (
    <div id="pipeline-viewer-container" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5 transition-all">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-blue-50 text-blue-600">
              <Layers size={16} />
            </span>
            <h3 className="font-bold text-[14px] text-slate-800">Dynamic Few-Shot RAG Pipeline</h3>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">สถาปัตยกรรมระบบรักษาความปลอดภัยและการประมวลผลเวชระเบียน • Offline, CPU-based, PDPA-Compliant</p>
        </div>
        
        {/* Connection status badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse"></span>
            CPU Mode (GGUF)
          </span>
          <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            PDPA Secure
          </span>
        </div>
      </div>

      {/* 5-Step visual pipeline row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 lg:gap-2 relative">
        {steps.map((step, idx) => {
          const StepIcon = step.icon;
          const isStepActive = activeStep === step.id;
          const isCompleted = activeStep > step.id || hasNotes;
          const isSelected = selectedDetail === step.id;

          return (
            <React.Fragment key={step.id}>
              <motion.div
                whileHover={{ y: -2 }}
                onClick={() => setSelectedDetail(isSelected ? null : step.id)}
                className={`relative p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isStepActive 
                    ? 'ring-2 ring-blue-500 bg-blue-50/50 border-blue-200 shadow-md' 
                    : isCompleted 
                      ? 'border-slate-200 bg-white hover:border-slate-300' 
                      : 'border-slate-100 bg-slate-50/50 opacity-80 hover:opacity-100'
                }`}
                style={{
                  borderLeft: `4px solid ${step.color}`
                }}
              >
                {/* Step badge */}
                <div className="flex items-center justify-between mb-2">
                  <span 
                    className="text-[14px] font-black italic opacity-35"
                    style={{ color: step.color }}
                  >
                    {step.id}
                  </span>
                  
                  {isCompleted ? (
                    <span className="text-emerald-500">
                      <CheckCircle2 size={13} fill="currentColor" className="text-white" />
                    </span>
                  ) : isStepActive ? (
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
                    </span>
                  ) : null}
                </div>

                {/* Title and Icon */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span 
                      className="p-1 rounded-lg shrink-0"
                      style={{ backgroundColor: step.bgLight, color: step.color }}
                    >
                      <StepIcon size={14} />
                    </span>
                    <h4 className="font-bold text-[12px] text-slate-800 truncate leading-tight" title={step.title}>
                      {step.title}
                    </h4>
                  </div>
                  <div className="text-[10px] font-bold text-slate-500">{step.thaiTitle}</div>
                  <p className="text-[9.5px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                    {step.desc}
                  </p>
                </div>

                {/* Micro-hint to click */}
                <div className="text-[8.5px] text-blue-600 font-bold mt-2 text-right hover:underline flex items-center justify-end gap-0.5">
                  {isSelected ? 'ปิดคำอธิบาย' : 'ดูคำอธิบาย...'}
                </div>
              </motion.div>

              {/* Connecting arrows between columns (Only on large monitors) */}
              {idx < 4 && (
                <div className="hidden lg:flex items-center justify-center absolute top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"
                  style={{ left: `${(idx + 1) * 20 - 1}%` }}
                >
                  <ChevronRight size={14} className="opacity-40" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Expanded Walkthrough Details Section */}
      <AnimatePresence mode="wait">
        {selectedDetail !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {(() => {
              const selectedStep = steps.find(s => s.id === selectedDetail);
              if (!selectedStep) return null;
              const StepIcon = selectedStep.icon;

              return (
                <div 
                  className="p-4 rounded-xl border text-[12px] space-y-2 mt-1"
                  style={{ 
                    backgroundColor: selectedStep.bgLight, 
                    borderColor: `${selectedStep.color}30` 
                  }}
                >
                  <div className="flex items-center gap-2 font-bold" style={{ color: selectedStep.textColor }}>
                    <StepIcon size={16} />
                    <span>ขั้นตอนที่ {selectedStep.id}: {selectedStep.title} ({selectedStep.thaiTitle})</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{selectedStep.desc}</p>
                  
                  <div className="pt-2">
                    <div className="font-bold text-[10.5px] mb-1.5" style={{ color: selectedStep.textColor }}>
                      ⚙️ รายละเอียดและเทคโนโลยีการทำงานของโมเดล:
                    </div>
                    <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px] leading-relaxed">
                      {selectedStep.details.map((detail, dIdx) => (
                        <li key={dIdx}>{detail}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Core Technology Specs (Matching bottom specs in image) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-3 border-t border-slate-100 bg-slate-50/50 p-3 rounded-xl">
        <div className="space-y-0.5">
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">🧠 Main LLM</div>
          <div className="text-[11px] font-bold text-slate-700 font-mono truncate" title="Typhoon2-8B-Instruct (GGUF Q4_K_M, 4.8 GB, CPU)">
            Typhoon2-8B-Instruct
          </div>
          <div className="text-[8.5px] text-slate-400">GGUF Q4_K_M, 4.8 GB, CPU</div>
        </div>

        <div className="space-y-0.5">
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">🔎 Embedding</div>
          <div className="text-[11px] font-bold text-slate-700 font-mono truncate" title="multilingual-e5-large">
            multilingual-e5-large
          </div>
          <div className="text-[8.5px] text-slate-400">Semantic Search (Thai-EN)</div>
        </div>

        <div className="space-y-0.5">
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">🗄️ Vector DB</div>
          <div className="text-[11px] font-bold text-slate-700 font-mono truncate" title="ChromaDB (Local, Offline)">
            ChromaDB
          </div>
          <div className="text-[8.5px] text-slate-400">Local Offline • Top-k=3 Cosine</div>
        </div>

        <div className="space-y-0.5">
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">🛡️ Safety L2</div>
          <div className="text-[11px] font-bold text-slate-700 font-mono truncate" title="WangchanBERTa">
            WangchanBERTa
          </div>
          <div className="text-[8.5px] text-slate-400">SI/SH Zero-shot • Thr. 0.65</div>
        </div>
      </div>

      {/* Output Flow Banner (Matching Bottom Teal Banner in Image) */}
      <div className="bg-[#2C9CAF] rounded-xl p-3 text-white flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-4 text-center shadow-inner mt-2">
        <div className="text-[10.5px] font-bold uppercase tracking-wider flex items-center gap-1.5">
          <CheckCircle2 size={13} className="text-amber-300" />
          Output: 10-field JSON CBT Psychiatric Note
        </div>
        <ArrowRight size={13} className="hidden sm:block opacity-70" />
        <div className="text-[10.5px] font-bold uppercase tracking-wider flex items-center gap-1.5">
          <UserCheck size={13} className="text-amber-300" />
          Human Review (HITL)
        </div>
        <ArrowRight size={13} className="hidden sm:block opacity-70" />
        <div className="text-[10.5px] font-bold uppercase tracking-wider flex items-center gap-1.5">
          <Cpu size={13} className="text-amber-300" />
          FHIR R4 / HIS Hand-off
        </div>
      </div>

      {/* Extra helper to guide user when empty */}
      {!hasNotes && !isLoading && onSelectSampleCase && (
        <div className="text-center py-1">
          <span className="text-[11px] text-slate-400 mr-2">ยังไม่มีข้อมูลประมวลผล?</span>
          <button 
            onClick={onSelectSampleCase}
            className="text-[11px] text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
          >
            💡 คลิกที่นี่เพื่อป้อนกรณีศึกษาทดสอบ (Sample Case) และชมการทำงานของท่อส่งข้อมูล ➔
          </button>
        </div>
      )}
    </div>
  );
};
