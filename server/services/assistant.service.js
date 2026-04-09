import axios from 'axios';
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import logger from '../utils/logger.js';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-pro';

const client = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

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

function buildProfileSummary(user) {
  const profileName = `${user.personalInfo?.firstName || 'User'} ${user.personalInfo?.lastName || ''}`.trim();
  const role = user.role === 'vendor' ? 'Vendor' : user.weddingProject?.partnerName ? 'Couple' : 'Partner';
  const location = user.personalInfo?.location || 'Sri Lanka';
  const sign = user.horoscope?.moonSign || user.horoscope?.rashi || 'Unknown';
  const nakshatra = user.horoscope?.nakshatra || 'Unknown';
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
    `Moon sign: ${sign}`,
    `Nakshatra: ${nakshatra}`,
  ].join('\n');
}

function buildSystemPrompt(user, language) {
  const profileSummary = buildProfileSummary(user);
  return `You are RaashiBot, the AI assistant for RaashiLink.AI. Answer the user with kindness, cultural sensitivity, and relevance to Sri Lankan wedding matchmaking.
Use the provided profile information when making matchmaking, horoscope, wedding planning, or budget suggestions.
Always honor the user's selected language: ${formatLanguage(language)}.

User profile:
${profileSummary}

Reply in ${formatLanguage(language)} and keep your answer concise, helpful, and friendly.`;
}

function buildUserPrompt(message, language) {
  const localPrefix =
    language === 'si'
      ? 'Please answer in Sinhala.'
      : language === 'ta'
      ? 'Please answer in Tamil.'
      : 'Please answer in English.';

  return `${localPrefix}\n\nUser asked: ${message}`;
}

async function generateOpenAIReply({ user, message, language }) {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const payload = {
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: buildSystemPrompt(user, language) },
      { role: 'user', content: buildUserPrompt(message, language) },
    ],
    temperature: 0.8,
    max_tokens: 500,
  };

  const response = await axios.post('https://api.openai.com/v1/chat/completions', payload, {
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  return response.data?.choices?.[0]?.message?.content?.trim() || '';
}

async function generateGeminiReply({ user, message, language }) {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const client = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const prompt = `${buildSystemPrompt(user, language)}\n\n${buildUserPrompt(message, language)}`;
  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      temperature: 0.8,
      responseMimeType: 'text/plain',
    },
  });

  return response?.text?.trim() || '';
}

function fallbackReply(user, language) {
  const name = user.personalInfo?.firstName || 'Friend';
  const sign = user.horoscope?.moonSign || user.horoscope?.rashi || 'special';

  if (language === 'si') {
    return `හෙලෝ ${name}! මට ඔබට උදව් කිරීමට සූදානම්. ඔබගේ රashi ලකුණ ${sign} වන අතර, ඔබේ තොරතුරු සම්පුර්ණ කරගැනීමට පිවිසුමෙන් පසු වැඩිදුරටත් උපදෙස් ලබාගත හැක.`;
  }
  if (language === 'ta') {
    return `வணக்கம் ${name}! நான் உங்களுக்கு உதவ தயாராக உள்ளேன். உங்கள் ராசி ${sign} ஆகும். மேலும் தகவல்களுக்கு பதிவு செய்து உள்நுழைந்த பிறகு உதவி செய்வேன்.`;
  }
  return `Hello ${name}! I'm ready to help. I see your moon sign is ${sign}. Please complete your profile details and ask again for personalized guidance.`;
}

export async function generateAssistantReply({ user, message, language = 'en' }) {
  try {
    if (OPENAI_API_KEY) {
      return await generateOpenAIReply({ user, message, language });
    }

    if (GEMINI_API_KEY) {
      return await generateGeminiReply({ user, message, language });
    }

    return fallbackReply(user, language);
  } catch (error) {
    logger.error('Assistant service failed', {
      message: error.message,
      provider: OPENAI_API_KEY ? 'openai' : GEMINI_API_KEY ? 'gemini' : 'fallback',
    });
    return fallbackReply(user, language);
  }
}

async function streamChat(history, userMessage, language = 'en', res) {
  if (!client) {
    throw new Error('OpenAI client not initialized');
  }

  try {
    // Trim history to last 12 messages (6 turns)
    const trimmedHistory = history.slice(-12);

    // Build messages array: system prompt + history + new user message
    const messages = [
      { role: 'system', content: SYSTEM_PROMPTS[language] || SYSTEM_PROMPTS.en },
      ...trimmedHistory,
      { role: 'user', content: userMessage }
    ];

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Create streaming response
    const stream = await client.chat.completions.create({
      model: OPENAI_MODEL,
      messages,
      max_tokens: 400,
      temperature: 0.7,
      stream: true
    });

    // Send chunks as SSE
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${content}\n\n`);
      }
    }

    // Send completion signal
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    logger.error('Stream chat failed', { message: error.message });
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Stream failed: ' + error.message
      });
    } else {
      res.end();
    }
  }
}

export default {
  generateAssistantReply,
  streamChat,
};