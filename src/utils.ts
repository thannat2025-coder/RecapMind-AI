import { CASE_EXAMPLES, SAFETY_KEYWORDS, CLINICAL_WEIGHTS } from "./constants";
import { SafetyStatus } from "./types";

export function checkSafety(text: string): SafetyStatus {
  const kws = SAFETY_KEYWORDS.filter(k => text.toLowerCase().includes(k.toLowerCase()));
  // Simplified risk scoring
  const score = kws.length > 0 ? 0.65 + Math.min(kws.length * 0.1, 0.3) : Math.random() * 0.2;
  return {
    risk: kws.length > 0 || score >= 0.65,
    kws,
    score
  };
}

export function deIdentify(text: string): string {
  // Pseudonyms list for variety
  const pseudonyms = ['สมชาย', 'สมศรี', 'เอ', 'บี', 'มานะ', 'ชูใจ', 'วิชัย', 'กัญญา'];
  let counter = 0;
  const nameMap = new Map<string, string>();

  // Better Thai name regex (Prefix + Name + Surname)
  return text
    .replace(/(นาย|นาง|นางสาว|ดร\.|คุณ)\s+([\u0E00-\u0E7F]{2,})(\s+[\u0E00-\u0E7F]{2,})?/g, (match, prefix, fname, lname) => {
      const fullMatch = match.trim();
      if (!nameMap.has(fullMatch)) {
        const pseudo = pseudonyms[counter % pseudonyms.length];
        nameMap.set(fullMatch, `${prefix}${pseudo} (นามสมมติ)`);
        counter++;
      }
      return nameMap.get(fullMatch)!;
    })
    .replace(/0[689]\d{8}/g, '[PHONE]')
    .replace(/\d{13}/g, '[ID]')
    .replace(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g, '[DATE]');
}

/**
 * Enhanced RAG retrieval using clinical weighting, theme-aware search, and risk-matching
 */
export function retrieveRagCases(query: string, count: number = 3) {
  const normalizedQuery = query.toLowerCase();
  
  // 1. Prepare documents for multi-field search (Weighting Theme + Transcript)
  const docs = [
    normalizedQuery, 
    ...CASE_EXAMPLES.map(c => `${c.th} ${c.th} ${c.tx}`) // Repeat theme to give it more weight
  ];

  // 2. Stop words to ignore (Common Thai particles and fillers)
  const stopWords = new Set(['ครับ', 'ค่ะ', 'นะ', 'คะ', 'อ่ะ', 'เอ่อ', 'คือ', 'ว่า', 'ที่', 'ของ', 'เป็น', 'ได้', 'ใน', 'กับ', 'จาก']);

  // 3. Tokenization with better handling
  const tokenRegex = /[\u0E00-\u0E7Fa-zA-Z0-9]+/g;
  const tokens = docs.map(d => (d.match(tokenRegex) || [])
    .filter(x => x.length > 1 && !stopWords.has(x)));
  
  // 4. TF-IDF with Clinical Boosting
  const vocab = new Set<string>();
  tokens.forEach(ts => ts.forEach(t => vocab.add(t)));
  const vocabArr = Array.from(vocab);
  
  const tfidfs = tokens.map(ts => {
    const counts: Record<string, number> = {};
    ts.forEach(t => counts[t] = (counts[t] || 0) + 1);
    
    const vector = vocabArr.map(t => {
      const tf = (counts[t] || 0) / (ts.length || 1);
      const df = tokens.filter(docTs => docTs.includes(t)).length;
      const idf = Math.log(tokens.length / (df || 1)) + 1;
      
      // Apply Clinical Boosting (e.g., "ซึมเศร้า" is more important than "วันพุธ")
      const boost = CLINICAL_WEIGHTS[t] || 1.0;
      
      return tf * idf * boost;
    });
    return vector;
  });

  const queryVec = tfidfs[0];
  const caseVecs = tfidfs.slice(1);
  const querySafety = checkSafety(normalizedQuery);

  // 5. Cosine Similarity & Clinical Signal Boosting
  const similarities = caseVecs.map((vec, i) => {
    const dot = queryVec.reduce((sum, val, idx) => sum + val * vec[idx], 0);
    const magQ = Math.sqrt(queryVec.reduce((sum, val) => sum + val * val, 0));
    const magV = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
    const cosineScore = (magQ && magV) ? dot / (magQ * magV) : 0;
    
    // 6. Explicit Clinical Relevance Logic
    let signalBoost = 0;
    const queryTokens = tokens[0];
    const caseTokens = tokens[i+1];
    const targetCase = CASE_EXAMPLES[i];

    // Case Theme matching bonus
    const themeTokens = targetCase.th.toLowerCase().match(tokenRegex) || [];
    themeTokens.forEach(tt => {
      if (queryTokens.includes(tt)) signalBoost += 0.08;
    });

    // Risk alignment (If query has SI/SH, prioritize risk cases)
    if (querySafety.risk && targetCase.risk) signalBoost += 0.20;

    // Clinical keyword overlap bonus
    Object.keys(CLINICAL_WEIGHTS).forEach(kw => {
      if (queryTokens.includes(kw) && caseTokens.includes(kw)) {
        signalBoost += 0.04;
      }
    });

    return { ...targetCase, sim: Math.min(0.99, cosineScore + signalBoost) };
  });

  return similarities.sort((a, b) => b.sim - a.sim).slice(0, count);
}

/**
 * RAG retrieval on doctor's own past psychiatric SOAP cases using simple keyword overlap
 */
export function retrieveUserRagCases(query: string, userCases: any[], count: number = 3) {
  if (!userCases || userCases.length === 0) return [];
  
  // Filter for psychiatric SOAP notes (where history is present)
  const psychCases = userCases.filter(uc => {
    return uc.final_note && uc.final_note.history !== undefined && uc.transcript;
  });
  
  if (psychCases.length === 0) return [];

  const normalizedQuery = query.toLowerCase();
  const stopWords = new Set(['ครับ', 'ค่ะ', 'นะ', 'คะ', 'อ่ะ', 'เอ่อ', 'คือ', 'ว่า', 'ที่', 'ของ', 'เป็น', 'ได้', 'ใน', 'กับ', 'จาก']);
  const tokenRegex = /[\u0E00-\u0E7Fa-zA-Z0-9]+/g;
  
  const queryTokens = (normalizedQuery.match(tokenRegex) || []).filter(x => x.length > 1 && !stopWords.has(x));
  if (queryTokens.length === 0) {
    return psychCases.slice(0, count);
  }

  const scored = psychCases.map(uc => {
    const ucTokens = (uc.transcript.toLowerCase().match(tokenRegex) || []).filter(x => x.length > 1 && !stopWords.has(x));
    const tokenSet = new Set(ucTokens);
    let overlap = 0;
    queryTokens.forEach(qt => {
      if (tokenSet.has(qt)) {
        overlap += 1;
      }
    });
    
    const unionSize = new Set([...queryTokens, ...ucTokens]).size;
    const score = unionSize > 0 ? overlap / unionSize : 0;
    
    return { ...uc, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

