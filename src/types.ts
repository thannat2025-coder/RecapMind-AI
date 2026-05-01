export enum Tab {
  MAIN = 'main',
  COMPARE = 'compare',
  ABOUT = 'about',
}

export enum InputMode {
  RECORD = 'rec',
  UPLOAD = 'up',
  TYPE = 'type',
  CASE = 'case',
}

export interface GoldenCase {
  id: string;
  th: string;
  risk: boolean;
  tx: string;
  mood_check: string;
  bridge: string;
  agenda: string;
  homework_review: string;
  new_topics: string;
  cbt_model: {
    situation: string;
    mood: string;
    thoughts: string;
    behavior: string;
    physical: string;
  };
  intervention: string;
  plan_homework: string;
  summary: string;
  feedback_appointment: string;
  m: {
    b: Metrics;
    r: Metrics;
    ft: Metrics;
  };
}

export interface Metrics {
  ccc: number;
  kcer: number;
  rdr: number;
  fsr: number;
  bert: number;
  ccr: number;
}

export interface ClinicalNote {
  mood_check: string;
  bridge: string;
  agenda: string;
  homework_review: string;
  new_topics: string;
  cbt_model: {
    situation: string;
    mood: string;
    thoughts: string;
    behavior: string;
    physical: string;
  };
  intervention: string;
  plan_homework: string;
  summary: string;
  feedback_appointment: string;
}

export interface SafetyStatus {
  risk: boolean;
  kws: string[];
  score: number;
}
