import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const aiModelName = process.env.AI_MODEL;

console.log("==== Models ====")
for await (const model of await ai.models.list()){
    console.log(model.name.split('models/')[1])
}
