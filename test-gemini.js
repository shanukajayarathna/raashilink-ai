import dotenv from 'dotenv';
import assistantService from './server/services/assistant.service.js';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });

async function testGemini() {
  console.log('Testing Gemini API...');
  console.log('AI_PROVIDER:', process.env.AI_PROVIDER);
  console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
  
  const mockUser = {
    name: 'Test User',
    personalInfo: { firstName: 'Test', lastName: 'User' },
    horoscope: { moonSign: 'Leo', nakshatra: 'Magha' }
  };

  try {
    console.log('Calling assistantService.generateAssistantReply...');
    const reply = await assistantService.generateAssistantReply({
      user: mockUser,
      message: 'Hello RaashiBot, can you tell me something about my horoscope?',
      language: 'en'
    });
    console.log('Resulting Reply:', reply);
  } catch (error) {
    console.error('Test script EXCEPTION:', error);
  }
}

testGemini();
