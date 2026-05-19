const SINHALA_UNICODE_RE = /[\u0D80-\u0DFF]/;
const TAMIL_UNICODE_RE = /[\u0B80-\u0BFF]/;

const SINGLISH_HINTS = [
  'kohomada', 'kohomd', 'mage', 'oya', 'oyage', 'oyata', 'obata', 'oba', 'ane', 'hari',
  'mata', 'mama', 'kawada', 'kawda', 'mokak', 'mona', 'monawada', 'ehema', 'neda',
  'puluwan', 'puluwanda', 'puluwannam', 'wenna', 'thiyenawa', 'thiyen', 'nathi', 'wage',
  'ayada', 'galapenne', 'kiyanna', 'kiyanne', 'subha', 'ayubowan', 'lasana', 'lassana', 
  'karanna', 'nangi', 'malli', 'akki', 'aiya', 'amma', 'thaththa', 'lanka', 'srilanka'
];

const TANGLISH_HINTS = [
  'vanakkam', 'epadi', 'epdi', 'enna', 'yenna', 'nalla', 'irukingala', 'irukkeenga',
  'romba', 'rompa', 'nandri', 'nanri', 'unoda', 'ungha', 'unka', 'enakku', 'enaku',
  'teriyum', 'theriyum', 'theriyuma', 'teriyuma', 'illai', 'porutham', 'athirshtham',
  'kalai', 'vanakam', 'macha', 'machan', 'thambi', 'anna', 'akka'
];

/**
 * Robustly detects whether a message is in English, Sinhala (including Singlish), or Tamil (including Tanglish).
 * Returns strict ISO codes: 'si' for Sinhala, 'ta' for Tamil, and 'en' for English.
 */
export function detectChatLanguage({ message, requestedLanguage } = {}) {
  const text = String(message || '').trim();
  const lower = text.toLowerCase();

  // 1. Direct Unicode Script Match (Highest Priority & 100% Reliable)
  if (SINHALA_UNICODE_RE.test(text)) return 'si';
  if (TAMIL_UNICODE_RE.test(text)) return 'ta';

  // 2. Transliterated Script Match (Singlish & Tanglish)
  const isLatinOnly = /^[\x00-\x7F\s\p{P}]+$/u.test(text);
  if (isLatinOnly && text) {
    // Check Singlish signals
    const singlishHits = SINGLISH_HINTS.filter(hint => lower.includes(hint)).length;
    const isCommonSinglish = /^(kohomada|kohomd|ayubowan|subha prathana|subha chithana)\??$/i.test(lower.trim());
    
    // Check Tanglish signals
    const tanglishHits = TANGLISH_HINTS.filter(hint => lower.includes(hint)).length;
    const isCommonTanglish = /^(vanakkam|vanakam|nandri|nanri)\??$/i.test(lower.trim());

    if (singlishHits >= 1 || isCommonSinglish) {
      return 'si';
    }

    if (tanglishHits >= 1 || isCommonTanglish) {
      return 'ta';
    }
  }

  // 3. Fallback to requestedLanguage if provided and strictly matching our supported list
  const explicit = String(requestedLanguage || '').trim().toLowerCase();
  if (explicit === 'si' || explicit === 'sinhala') return 'si';
  if (explicit === 'ta' || explicit === 'tamil') return 'ta';
  
  return 'en';
}
