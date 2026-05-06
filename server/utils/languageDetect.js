const SINHALA_UNICODE_RE = /[\u0D80-\u0DFF]/;
const TAMIL_UNICODE_RE = /[\u0B80-\u0BFF]/;

const SINGLISH_HINTS = [
  'kohomada',
  'kohomd',
  'mage',
  'oya',
  'oyage',
  'oyata',
  'obata',
  'oba',
  'ane',
  'hari',
  'mata',
  'mama',
  'kawada',
  'kawda',
  'mokak',
  'mona',
  'monawada',
  'ehema',
  'neda',
  'puluwan',
  'puluwanda',
  'puluwannam',
  'wenna',
  'thiyenawa',
  'thiyen',
  'nathi',
  'wage',
  'ayada',
  'galapenne',
  'kiyanna',
  'kiyanne',
];

export function detectChatLanguage({ message, requestedLanguage } = {}) {
  const text = String(message || '').trim();
  // Strong signals override any requested language (some UIs always send "en").
  if (SINHALA_UNICODE_RE.test(text)) return 'si';
  if (TAMIL_UNICODE_RE.test(text)) return 'ta';

  const explicit = String(requestedLanguage || '').trim().toLowerCase();
  // If UI explicitly sets a non-English language, respect it.
  if (explicit && explicit !== 'en') return explicit;

  if (!text) return 'en';

  const lower = text.toLowerCase();
  const isLatinOnly = /^[\x00-\x7F]+$/.test(text);
  if (!isLatinOnly) return 'en';

  // Singlish (Sinhala typed in English letters): allow overriding explicit "en" only when signal is strong.
  const strongSinglishAnchors = [
    'kohomada',
    'kohomd',
    'oya',
    'oyage',
    'oyata',
    'oba',
    'obata',
    'mama',
    'mata',
    'mokak',
    'mona',
    'monawada',
    'kawda',
    'ane',
    'hari',
    'wage',
    'galapenne',
    'kiyanna',
    'kiyanne',
  ];
  const anchorHit = strongSinglishAnchors.some((hint) => lower.includes(hint));
  const hits = SINGLISH_HINTS.reduce((count, hint) => (lower.includes(hint) ? count + 1 : count), 0);

  // Common singlish greetings should always be treated as Sinhala.
  const normalized = lower.replace(/[^\p{L}\p{N}\s]/gu, '').trim();
  if (normalized === 'kohomada' || normalized === 'kohomd' || normalized === 'kohomada?' || normalized === 'kohomd?') {
    return 'si';
  }

  // If user typed Singlish, answer in Sinhala. Keep this conservative enough to avoid normal English sentences.
  if (anchorHit || hits >= 2) return 'si';

  // If UI explicitly requested English, keep English unless we detected Sinhala/Tamil above.
  if (explicit === 'en') return 'en';

  return 'en';
}
