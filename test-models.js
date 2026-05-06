import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config({ path: '.env.local', override: true });

async function checkModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('No API key found');
    return;
  }
  
  const client = new GoogleGenAI({ apiKey });
  try {
    const response = await client.models.list();
    for await (const model of response) {
      console.log('Model:', model.name);
    }
  } catch (error) {
    console.error('Error fetching models:', error);
  }
}

checkModels();
