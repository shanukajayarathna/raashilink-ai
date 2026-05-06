import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config({ path: '.env.local', override: true });

async function checkModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  const client = new GoogleGenAI({ apiKey });
  try {
    const response = await client.models.list();
    const flashModels = [];
    for await (const model of response) {
      if (model.name.includes('flash') || model.name.includes('pro')) {
        flashModels.push(model.name);
      }
    }
    console.log('Available flash/pro models:', flashModels.join(', '));
  } catch (error) {
    console.error('Error:', error);
  }
}

checkModels();
