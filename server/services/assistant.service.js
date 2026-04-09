import axios from 'axios';
import { GoogleGenAI } from '@google/genai';
import logger from '../utils/logger.js';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-pro';

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

export default {
  generateAssistantReply,
};