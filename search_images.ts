import { GoogleGenAI } from "@google/genai";

async function searchImages() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "Find 4 high-quality public image URLs for Sri Lankan weddings (Poruwa ceremony, traditional attire, etc.). Return them as a JSON array of objects with 'url' and 'caption' fields.",
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
    },
  });

  console.log(response.text);
}

searchImages();
