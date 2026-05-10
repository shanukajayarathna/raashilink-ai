import axios from 'axios';
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import logger from '../utils/logger.js';
import { getRealtimePlanetarySnapshot } from './realtimeAstro.service.js';

const SINHALA_UNICODE_RE = /[\u0D80-\u0DFF]/;
const TAMIL_UNICODE_RE = /[\u0B80-\u0BFF]/;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const AI_PROVIDER = (process.env.AI_PROVIDER || 'auto').toLowerCase();

let _groqClient = null;
function getGroqClient() {
  if (_groqClient) return _groqClient;
  const apiKey = process.env.GROQ_API_KEY;
  if (apiKey) {
    _groqClient = new OpenAI({
      apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }
  return _groqClient;
}

function getGroqModel() {
  const model = String(process.env.GROQ_MODEL || '').trim();
  if (!model) {
    throw new Error('Groq model not configured (set GROQ_MODEL in .env.local)');
  }
  return model;
}

let _geminiClient = null;
function getGeminiClient() {
  if (_geminiClient) return _geminiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    _geminiClient = new GoogleGenAI({ apiKey });
  }
  return _geminiClient;
}

const SYSTEM_PROMPTS = {
  en: "You are RaashiBot, the AI assistant for RaashiLink.AI — Sri Lanka's intelligent matchmaking and wedding planning platform. You assist users with:\n\nUnderstanding their Vedic horoscope (Rashi, Nakshatra, Ascendant, planetary positions)\nInterpreting compatibility scores (Guna Milan, Big Five personality, lifestyle, family values)\nFinding and evaluating potential life partners\nWedding planning (venues, vendors, budgets, checklists, timelines)\nDiscovering honeymoon destinations suited to Sri Lankan couples\n\nBe warm, culturally sensitive to Sri Lankan Buddhist, Hindu, Muslim and Christian traditions. Always respond in the same language the user writes in. Keep responses under 150 words unless asked for detail. Use LKR for all currency amounts. Use DD/MM/YYYY date format.",
  si: "ඔබ RaashiLink.AI හි AI සහාය RaashiBot ය — ශ්‍රී ලංකාවේ බුද්ධිමත් ගැටුම්කරණ සහ විවාහ සැලසුම් වේදිකාව। ඔබ පරිශීලකদට අනුමැතිය:\n\nඔවුන්ගේ වෙදического හෝරෝස්කෝපය තේරුම් ගැනීම (රාසි, නක්ෂත්‍ර, උසස්,행성 অবস్থান)\nසամ්‍යතා ගුණ දෙයක් සම්මතකරණ (ගුණ මිලාන, පංචාත්‍ම, ජීවන ශෙලි, පවුල් අගයන්)\nසිද්ධ ජීවන සගයින් සොයා ගැනීම සහ තක්සේරු කිරීම\nවිවාහ සැලසුම් (venue, විකිරුවන්, අයවැයන්, පරීක්ෂා ලැයිස්තු, කාලසීමාවන්)\nශ්‍රී ලංකා දම්පතිවරුන්ට සුදුසු පෙම්වතු ගවේෂණ\n\nවාත්‍යමුතු, සাংस්कृतිකව සংවේදි ශ්‍රී ලංකා බෞද්ධ, හින්දු, මුස්‍ලිම් සහ ක්‍රිස්තල සම්ප්‍රදාය වෙතින්. සෑම විටම පරිශීලකයා ලිවීමේ භාෂාවෙන් පිළිතුරු දෙන්න. විස්තර ඉල්ලා නොවුවහොත් 150 වචන තුළ පිළිතුරු පිළිබඳව. සියලුම මුදල් ප්‍රමාණ LKR සඳහා භාවිතා කරන්න. DD/MM/YYYY දින ආකෘතිය භාවිතා කරන්න.",
  ta: "நீங்கள் RaashiLink.AI இன் AI உதவியாளர் RaashiBot ஆவீர் — இலங்கையின் বুद்ධிமான் சிநேகம் மற்றும் திருமண திட்டமிடல் தளம். நீங்கள் பயனர்களுக்கு உதவுகிறீர்கள்:\n\nவேத ஜாதகம் புரிந்து கொள்ளுதல் (ராசி, நக்ஷத்திரம், உச்சம், கிரহ நிலைகள்)\nஇணக்கতை மதிப்பெண்கள் விளக்குதல் (குண மிலன், ஐந்து பெரிய ব்যক்তிত்வம், வாழ்க்கை வகுப்பு, குடும்ப மূல்யங়கள்)\nகூட்டு வாழ்க்கை துணைவரை கண்டுபிடிப்பது மற்றும் மதிப்பிடுதல்\nதிருமண திட்டமிடல் (இடங்கள், விற்பனையாளர்கள், பட்ജெட்கள், சரிபார்ப்பு பட்டியல்கள், காலக்கெடு)\nஇலங்கை தம்பதிகளுக்கு பொருத்தமான சிறுவர் கண்டுபிடிப்பு\n\nவெப்பமான, சாംஸ்கார உணர்வுடன் இலங்கை பௌத்த, இந்து, முஸ்லீம் மற்றும் கிறிஸ்தவ மரபுக்கு. எப்போதும் பயனர் எழுதும் மொழியிலேயே பதிலளியுங்கள். விரிவான விரும்பினால் தவிர 150 சொற்களுக்கு குறைவாக வைத்திருங்கள். அனைத்து நாணய தொகைகளுக்கு LKR ஐ பயன்படுத்தவும். DD/MM/YYYY திகதி வடிவம் பயன்படுத்தவும்."
};

function formatLanguage(language) {
  switch (language) {
    case 'si':
      return 'Sinhala';
    case 'ta':
      return 'Tamil';
    default:
      return 'English';
  }
}

function getUserFirstName(user) {
  return String(user?.personalInfo?.firstName || user?.firstName || 'User').trim() || 'User';
}

function buildProfileSummary(user) {
  const profileName = `${getUserFirstName(user)} ${user.personalInfo?.lastName || user?.lastName || ''}`.trim();
  const role = user.role === 'vendor' ? 'Vendor' : user.weddingProject?.partnerName ? 'Couple' : 'Partner';
  const location = user.personalInfo?.location || 'Sri Lanka';
  const horoscopeSummary = buildHoroscopeSummary(user);
  const profession = user.lifestyle?.professionType || 'Not specified';
  const education = user.lifestyle?.educationLevel || 'Not specified';
  const religion = user.lifestyle?.religion || 'Not specified';
  const familyStyle = user.lifestyle?.familyValues != null ? `${Math.round(user.lifestyle.familyValues * 100)}% family-oriented` : 'Not specified';

  return [
    `Name: ${profileName}`,
    `Role: ${role}`,
    `Location: ${location}`,
    `Profession: ${profession}`,
    `Education: ${education}`,
    `Religion: ${religion}`,
    `Family orientation: ${familyStyle}`,
    ...(horoscopeSummary ? [`Horoscope:\n${horoscopeSummary}`] : []),
  ].join('\n');
}

function buildHoroscopeSummary(user) {
  const h = user?.horoscopeData || {};
  const birth = user?.birthData || {};

  const moonSign = h.moonSign || h.rashi || h.zodiacSign || null;
  const nakshatra = h.nakshatra || null;
  const pada = Number.isFinite(h.nakshatraPada) ? h.nakshatraPada : null;
  const asc = h.ascendant || null;
  const tithi = h.tithi || null;
  const yoga = h.yoga || null;
  const karana = h.karana || null;
  const paksha = h.paksha || null;
  const ayanamsa = h.ayanamsa || null;

  const dob = birth?.dateOfBirth ? new Date(birth.dateOfBirth) : null;
  const dobISO = dob && !Number.isNaN(dob.getTime()) ? dob.toISOString().slice(0, 10) : null;
  const tob = birth?.timeOfBirth || null;
  const knownBirthTime = birth?.knownBirthTime === false ? false : true;
  const pob = birth?.placeOfBirth;
  const pobSummary =
    pob?.city && pob?.country
      ? `${pob.city}, ${pob.country}${pob.timezone ? ` (${pob.timezone})` : ''}`
      : null;

  const planetList = Array.isArray(h.planetaryPositions) ? h.planetaryPositions : [];
  const planets = planetList
    .filter((p) => p?.planet && p?.sign)
    .slice(0, 12)
    .map((p) => `${p.planet}: ${p.sign}${p.house ? ` (H${p.house})` : ''}`)
    .join(', ');

  const lines = [
    dobISO ? `Birth: ${dobISO}${tob ? ` ${tob}` : ''}${knownBirthTime ? '' : ' (time unknown/approx)'}` : null,
    pobSummary ? `Place: ${pobSummary}` : null,
    moonSign ? `Moon sign (Rashi): ${moonSign}` : null,
    nakshatra ? `Nakshatra: ${nakshatra}${pada ? ` (Pada ${pada})` : ''}` : null,
    asc ? `Ascendant (Lagna): ${asc}` : null,
    tithi ? `Tithi: ${tithi}` : null,
    paksha ? `Paksha: ${paksha}` : null,
    yoga ? `Yoga: ${yoga}` : null,
    karana ? `Karana: ${karana}` : null,
    ayanamsa ? `Ayanamsa: ${ayanamsa}` : null,
    planets ? `Planets: ${planets}` : null,
  ].filter(Boolean);

  return lines.length ? lines.join('\n') : '';
}

function buildSystemPrompt(user, language) {
  const profileSummary = buildProfileSummary(user);
  const firstName = getUserFirstName(user);
  const isHoroscopeSeeker = String(user?.userType || '').toLowerCase() === 'horoscope_seeker';
  let realtimeSnapshotText = '';
  try {
    const rt = getRealtimePlanetarySnapshot();
    const planetLine = (rt.planets || [])
      .map((p) => `${p.planet} ${p.signTropical} (${p.eclipticLongitude}°)`)
      .join(', ');
    realtimeSnapshotText = `\n\nReal-time planetary snapshot (computed ${rt.computedAtUtc}, ${rt.zodiacSystem} zodiac):\n${planetLine}`;
  } catch {
    realtimeSnapshotText = '';
  }
  const scopeLine = isHoroscopeSeeker
    ? 'This user is a horoscope seeker. Focus ONLY on astrology-based personal life guidance (timing, strengths, relationships, career, health habits, remedies, routines, decision-making). Do NOT mention matchmaking, finding a partner, or wedding planning unless the user explicitly asks.'
    : 'You support users with relationships, matchmaking, and wedding planning; you may also answer horoscope questions when asked.';

  return `You are RaashiBot, the AI assistant for RaashiLink.AI. Answer the user with kindness, cultural sensitivity, and relevance to Sri Lankan context.
${scopeLine}
Always honor the user's selected language: ${formatLanguage(language)}.
Always address the user by their first name in every reply, naturally and respectfully. User first name: ${firstName}.

Astrology behavior rules:
- Only interpret from the "Horoscope" and "Birth" data provided above; do not invent placements.
- If the user asks for compatibility, request the other person's birth details or clearly label the reading as approximate.
- If the user asks "mata galapenne mona wage ayada?" (what kind of person suits me), answer directly with practical partner traits and what to look for, based on the user's chart; do NOT respond with generic transit commentary.
- If exact timing (auspicious times/muhurta) requires missing birth time or location, ask for what is missing and give a best-effort window with assumptions.
- Never claim you browsed the internet or verified live panchang data unless explicitly provided in the conversation.

User profile:
${profileSummary}
${realtimeSnapshotText}

Reply in ${formatLanguage(language)} and keep your answer concise, helpful, and friendly.`;
}

function buildUserPrompt(message, language) {
  const localPrefix =
    language === 'si'
      ? 'Please answer in Sinhala using Sinhala script characters (සිංහල අකුරු). Do not use English letters.'
      : language === 'ta'
      ? 'Please answer in Tamil using Tamil script characters. Do not use English letters.'
      : 'Please answer in English.';

  return `${localPrefix}\n\nUser asked: ${message}`;
}

function getActiveProvider() {
  const provider = (process.env.AI_PROVIDER || 'auto').toLowerCase();
  const hasGemini = !!process.env.GEMINI_API_KEY;
  const hasGroq = !!process.env.GROQ_API_KEY;

  if (provider === 'gemini') return hasGemini ? 'gemini' : 'fallback';
  if (provider === 'groq') return hasGroq ? 'groq' : 'fallback';
  if (hasGemini) return 'gemini';
  if (hasGroq) return 'groq';
  return 'fallback';
}

function buildGeminiTranscript(systemPrompt, history = [], userMessage = '', language = 'en') {
  const renderedHistory = (history || [])
    .slice(-12)
    .map((item) => {
      const role = item?.role === 'assistant' ? 'Assistant' : 'User';
      return `${role}: ${item?.content || ''}`;
    })
    .join('\n');

  const base = systemPrompt || SYSTEM_PROMPTS[language] || SYSTEM_PROMPTS.en;
  return `${base}\n\nConversation history:\n${renderedHistory}\n\nUser: ${userMessage}\nAssistant:`;
}

async function generateGroqReply({ user, message, language }) {
  const client = getGroqClient();
  if (!client) {
    throw new Error('Groq API key not configured');
  }

  const baseMessages = [
    { role: 'system', content: buildSystemPrompt(user, language) },
    { role: 'user', content: buildUserPrompt(message, language) },
  ];

  let text = '';
  let finishReason = null;
  let messagesForContinuation = [...baseMessages];

  // Try up to 3 segments if the model truncates due to token limits.
  for (let i = 0; i < 3; i++) {
    const resp = await client.chat.completions.create({
      model: getGroqModel(),
      messages: messagesForContinuation,
      temperature: i === 0 ? 0.8 : 0.4,
      max_tokens: 900,
      stream: false,
    });

    const part = resp?.choices?.[0]?.message?.content?.trim() || '';
    finishReason = resp?.choices?.[0]?.finish_reason || null;
    if (part) {
      text = text ? `${text}\n${part}` : part;
    }

    if (finishReason !== 'length') break;

    messagesForContinuation = [
      ...baseMessages,
      { role: 'assistant', content: text },
      { role: 'user', content: 'Continue. Complete the unfinished sentence and finish the full answer.' },
    ];
  }

  // If user asked for Sinhala/Tamil but the model responded in Latin script, do a fast rewrite pass.
  if (language === 'si' && text && !SINHALA_UNICODE_RE.test(text)) {
    const rewrite = await client.chat.completions.create({
      model: getGroqModel(),
      messages: [
        { role: 'system', content: 'Rewrite the assistant reply in Sinhala, using Sinhala script characters only. No English letters.' },
        { role: 'user', content: text },
      ],
      temperature: 0.2,
      max_tokens: 900,
      stream: false,
    });
    return rewrite?.choices?.[0]?.message?.content?.trim() || text;
  }

  if (language === 'ta' && text && !TAMIL_UNICODE_RE.test(text)) {
    const rewrite = await client.chat.completions.create({
      model: getGroqModel(),
      messages: [
        { role: 'system', content: 'Rewrite the assistant reply in Tamil, using Tamil script characters only. No English letters.' },
        { role: 'user', content: text },
      ],
      temperature: 0.2,
      max_tokens: 900,
      stream: false,
    });
    return rewrite?.choices?.[0]?.message?.content?.trim() || text;
  }

  return text;
}

async function generateGeminiReply({ user, message, language }) {
  const client = getGeminiClient();
  if (!client) {
    throw new Error('Gemini API key not configured');
  }

  const prompt = `${buildSystemPrompt(user, language)}\n\n${buildUserPrompt(message, language)}`;
  const response = await client.models.generateContent({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    contents: prompt,
    config: {
      temperature: 0.8,
      responseMimeType: 'text/plain',
    },
  });

  return response?.text?.trim() || '';
}

function fallbackReply(user, language) {
  const name = getUserFirstName(user);
  const sign = user.horoscopeData?.moonSign || user.horoscopeData?.rashi || user.horoscopeData?.zodiacSign || 'special';
  const hasBirth =
    !!(user?.birthData?.dateOfBirth && user?.birthData?.placeOfBirth?.city && user?.birthData?.placeOfBirth?.country);

  if (false && language === 'si') {
    if (!hasBirth) {
      return `ආයුබෝවන් ${name}! මට ඔබට උදව් කිරීමට සූදානම්. ඔබගේ චන්ද්‍ර රාශිය ${sign} ලෙස පෙනෙනවා. තවත් නිවැරදි/පුද්ගලික උපදෙස් සඳහා කරුණාකර උපන් දිනය, උපන් වෙලාව (දන්නෑ නම් “දන්නෑ”), සහ උපන් ස්ථානය (නගරය/රට) පුරවලා නැවත අහන්න.`;
    }
    return `ආයුබෝවන් ${name}! ඔබගේ ජාතක තොරතුරු අනුව මට පුද්ගලික උපදෙස් දෙන්න පුළුවන්. ඔබගේ චන්ද්‍ර රාශිය ${sign}. කරුණාකර ඔබට අවශ්‍ය ප්‍රශ්නය කියන්න (කාලය/තීරණ, රැකියාව, සම්බන්ධතා, පුරුදු/ප්‍රතිකාර).`;
  }

  if (false && language === 'ta') {
    if (!hasBirth) {
      return `வணக்கம் ${name}! நான் உங்களுக்கு உதவ தயாராக இருக்கிறேன். உங்கள் சந்திர ராசி ${sign} என்று தெரிகிறது. மேலும் துல்லியமான தனிப்பட்ட வழிகாட்டலுக்கு பிறந்த தேதி, பிறந்த நேரம் (தெரியாவிட்டால் “தெரியாது”), மற்றும் பிறந்த இடம் (நகரம்/நாடு) ஆகியவற்றை நிரப்பி மீண்டும் கேளுங்கள்.`;
    }
    return `வணக்கம் ${name}! உங்கள் ஜாதகத் தகவல்களின் அடிப்படையில் நான் தனிப்பட்ட வழிகாட்டல் தரலாம். உங்கள் சந்திர ராசி ${sign}. உங்கள் கேள்வியை கேளுங்கள் (நேரம்/முடிவுகள், தொழில், உறவு, பழக்கங்கள்/பரிகாரங்கள்).`;
  }

  if (language === 'si') {
    return `හෙලෝ ${name}! මට ඔබට උදව් කිරීමට සූදානම්. ඔබගේ රashi ලකුණ ${sign} වන අතර, ඔබේ තොරතුරු සම්පුර්ණ කරගැනීමට පිවිසුමෙන් පසු වැඩිදුරටත් උපදෙස් ලබාගත හැක.`;
  }
  if (language === 'ta') {
    return `வணக்கம் ${name}! நான் உங்களுக்கு உதவ தயாராக உள்ளேன். உங்கள் ராசி ${sign} ஆகும். மேலும் தகவல்களுக்கு பதிவு செய்து உள்நுழைந்த பிறகு உதவி செய்வேன்.`;
  }
  if (!hasBirth) {
    return `Hello ${name}! I'm ready to help. Your Moon sign looks like ${sign}. For deeper personalized guidance, please fill your birth date, birth time (or mark unknown), and birth place (city/country).`;
  }
  return `Hello ${name}! I'm ready to help using your horoscope profile. Your Moon sign is ${sign}. Ask your personal life question (timing, career, relationships, routines, remedies).`;
}

export async function generateAssistantReply({ user, message, language = 'en' }) {
  try {
    const maybeLocal = buildLocalHoroscopeAnswer({ user, message, language });
    if (maybeLocal) return maybeLocal;

    // Ordered list of providers to try: Gemini then Groq
    const providers = ['gemini', 'groq'];
    
    const forced = (process.env.AI_PROVIDER || '').toLowerCase();
    if (forced && providers.includes(forced)) {
      providers.splice(providers.indexOf(forced), 1);
      providers.unshift(forced);
    }

    for (const provider of providers) {
      try {
        if (provider === 'gemini' && process.env.GEMINI_API_KEY) {
          return await generateGeminiReply({ user, message, language });
        }
        if (provider === 'groq' && process.env.GROQ_API_KEY) {
          return await generateGroqReply({ user, message, language });
        }
      } catch (err) {
        logger.warn(`AI Provider ${provider} failed or out of credits. Falling back...`, { 
          error: err.message,
          user: user?._id 
        });
        continue; 
      }
    }

    return fallbackReply(user, language);
  } catch (error) {
    logger.error('Critical failure in generateAssistantReply', { error: error.message });
    return fallbackReply(user, language);
  }
}

function setSseHeaders(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
}

function isPartnerSuitabilityQuestion(text = '') {
  const t = String(text || '').toLowerCase();
  return (
    t.includes('galapenne') ||
    t.includes('galapen') ||
    t.includes('marry') ||
    t.includes('marriage') ||
    t.includes('wivaha') ||
    t.includes('vivaha') ||
    t.includes('lagna') ||
    t.includes('lagne') ||
    t.includes('lagn') ||
    t.includes('spouse') ||
    t.includes('partner')
  );
}

function buildLocalHoroscopeAnswer({ user, message, language }) {
  if (language !== 'si') return '';
  if (!isPartnerSuitabilityQuestion(message)) return '';

  const moonSign = user?.horoscopeData?.moonSign || user?.horoscopeData?.rashi || null;
  const ascendant = user?.horoscopeData?.ascendant || null;

  const parts = [];
  parts.push('ඔබට ගැලපෙන විවාහ/සම්බන්ධතාවයක් ගැන සාමාන්‍ය මාර්ගෝපදේශයක් දෙන්නම්.');

  if (ascendant) {
    parts.push(`ඔබගේ ලග්නය: ${ascendant}.`);
  } else {
    parts.push('ඔබගේ ලග්නය (Ascendant) තොරතුර මගේ පැත්තේ නොපෙනෙනවා. ඒක නොමැති නම් “ලග්නය අනුව” නිවැරදිව කියන්න අමාරුයි.');
  }

  if (moonSign) {
    parts.push(`ඔබගේ චන්ද්‍ර රාශිය: ${moonSign}.`);
  }

  parts.push('ඔබට ගැලපෙන්නේ: සන්සුන්, වගකීමක් තියෙන, විවෘතව කතා කරන, ආර්ථික/ජීවිත වගකීම් රැගෙන යන්න පුළුවන්, සහ ගරුගන්වන කෙනෙක්.');
  parts.push('“මොන වගේ ලග්නයක් තියෙන කෙනෙක්ද?” කියලා නිකම් ලග්නයක් දීලා කියන්නේ මම අනුමාන කරලා වන නිසා, ඔබට ගැලපෙන බව තහවුරු කරගැනීමට එයාගේ උපන් දිනය/වෙලාව/ස්ථානය දීලා compatibility check එකක් කරමු.');

  return parts.join(' ');
}

async function streamGeminiChat(systemPrompt, history, userMessage, language = 'en', res) {
  const client = getGeminiClient();
  if (!client) {
    throw new Error('Gemini client not initialized');
  }

  try {
    setSseHeaders(res);

    const prompt = buildGeminiTranscript(systemPrompt, history, userMessage, language);
    const stream = await client.models.generateContentStream({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
        responseMimeType: 'text/plain',
      },
    });

    for await (const chunk of stream) {
      const content =
        (typeof chunk?.text === 'string' ? chunk.text : '') ||
        chunk?.candidates?.[0]?.content?.parts?.map((part) => part?.text || '').join('') ||
        '';

      if (content) {
        res.write(`data: ${content}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    logger.error('Gemini stream chat failed', { message: error.message });
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Stream failed: ' + error.message,
      });
    } else {
      res.end();
    }
  }
}

async function streamChatWithFallback({ user, history, userMessage, language, res }) {
  const providers = ['gemini', 'groq'];
  const forced = (process.env.AI_PROVIDER || '').toLowerCase();
  if (forced && providers.includes(forced)) {
    providers.splice(providers.indexOf(forced), 1);
    providers.unshift(forced);
  }

  const systemPrompt = buildSystemPrompt(user, language);

  for (const provider of providers) {
    try {
      if (provider === 'gemini' && process.env.GEMINI_API_KEY) {
        return await streamGeminiChat(systemPrompt, Array.isArray(history) ? history : [], userMessage, language, res);
      }
      if (provider === 'groq' && process.env.GROQ_API_KEY) {
        const client = getGroqClient();
        if (!client) continue;

        if (language === 'si' || language === 'ta') {
          setSseHeaders(res);
          const fullText = await generateGroqReply({ user, message: userMessage, language });
          if (fullText) {
            const chunkSize = 700;
            for (let i = 0; i < fullText.length; i += chunkSize) {
              res.write(`data: ${fullText.slice(i, i + chunkSize)}\n\n`);
            }
          }
          res.write('data: [DONE]\n\n');
          res.end();
          return;
        }

        // Default to Groq streaming if not Sinhala/Tamil
        const trimmedHistory = (Array.isArray(history) ? history : []).slice(-12);
        const messages = [
          { role: 'system', content: systemPrompt },
          ...trimmedHistory,
          { role: 'user', content: userMessage },
        ];

        setSseHeaders(res);
        const stream = await client.chat.completions.create({
          model: getGroqModel(),
          messages,
          max_tokens: 600,
          temperature: 0.7,
          stream: true,
        });

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) res.write(`data: ${content}\n\n`);
        }

        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }
    } catch (err) {
      if (res.headersSent && !res.writableEnded) {
        logger.error(`Streaming failed mid-request for ${provider}`, { error: err.message });
        res.end();
        return;
      }
      logger.warn(`Streaming AI Provider ${provider} failed. Falling back...`, { error: err.message });
      continue;
    }
  }

  if (!res.headersSent) {
    setSseHeaders(res);
    res.write(`data: ${fallbackReply(user, language)}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
}

export async function streamChat({ user, history, userMessage, language = 'en', res }) {
  const maybeLocal = buildLocalHoroscopeAnswer({ user, message: userMessage, language });
  if (maybeLocal) {
    setSseHeaders(res);
    res.write(`data: ${maybeLocal}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  return streamChatWithFallback({ user, history, userMessage, language, res });
}

export default {
  generateAssistantReply,
  streamChat,
};
