import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const aiModelName = process.env.AI_MODEL;

// const prompt = `
//     Salut, comme t'appelles-tu ?
// `;

// const response = await ai.models.generateContent({
//     model: aiModelName,
//     contents: prompt
// });

// console.log(prompt)
// console.log(response.text)
// console.log(ai.models)

console.log("==== Models ====")
for await (const model of await ai.models.list()){
    console.log(model.name.split('models/')[1])
}
