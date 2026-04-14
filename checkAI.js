import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const prompt = `
    Salut, comme t'appelles-tu ?
`;

const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
                responseMimeType: "application/json",
            }
});

console.log(response.text)

