import { GOLDEN_CASES, SAFETY_KEYWORDS } from "./constants";
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
  return text
    .replace(/(นาย|นาง|นางสาว|ดร\.|คุณ)\s+[\u0E00-\u0E7F]{2,}(\s+[\u0E00-\u0E7F]{2,})?/g, '[PATIENT]')
    .replace(/0[689]\d{8}/g, '[PHONE]')
    .replace(/\d{13}/g, '[ID]')
    .replace(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g, '[DATE]');
}

/**
 * Simplified TF-IDF Cosine Similarity for RAG retrieval
 */
export function retrieveRagCases(query: string, count: number = 3) {
  const docs = [query, ...GOLDEN_CASES.map(c => c.tx)];
  const tokens = docs.map(d => d.replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s]/g, '').toLowerCase().split(/\s+/).filter(x => x.length > 1));
  
  const vocab = new Set<string>();
  tokens.forEach(ts => ts.forEach(t => vocab.add(t)));
  const vocabArr = Array.from(vocab);
  
  const tfidfs = tokens.map(ts => {
    const counts: Record<string, number> = {};
    ts.forEach(t => counts[t] = (counts[t] || 0) + 1);
    
    const vector = vocabArr.map(t => {
      const tf = (counts[t] || 0) / ts.length;
      const df = tokens.filter(docTs => docTs.includes(t)).length;
      const idf = Math.log(tokens.length / (df || 1)) + 1;
      return tf * idf;
    });
    return vector;
  });

  const queryVec = tfidfs[0];
  const caseVecs = tfidfs.slice(1);

  const similarities = caseVecs.map((vec, i) => {
    const dot = queryVec.reduce((sum, val, idx) => sum + val * vec[idx], 0);
    const magQ = Math.sqrt(queryVec.reduce((sum, val) => sum + val * val, 0));
    const magV = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
    const score = (magQ && magV) ? dot / (magQ * magV) : 0;
    return { ...GOLDEN_CASES[i], sim: score };
  });

  return similarities.sort((a, b) => b.sim - a.sim).slice(0, count);
}
