import { GoogleGenAI } from '@google/genai';
import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const aiModelName = process.env.AI_MODEL;
const WIKI_DIR = './wiki';

async function queryWiki() {
    // Récupérer la question tapée dans le terminal (après "node query.js")
    const question = process.argv.slice(2).join(' ');
    
    if (!question) {
        console.log("⚠️ Veuillez poser une question.");
        console.log("💡 Exemple : node query.js \"Quelles sont les dates clés des essais cliniques d'Axorus ?\"");
        return;
    }

    try {
        // 1. Charger tout le savoir du Wiki en mémoire
        const files = await fs.readdir(WIKI_DIR);
        let wikiContext = '';
        
        for (const file of files) {
            if (file.endsWith('.md')) {
                const content = await fs.readFile(path.join(WIKI_DIR, file), 'utf-8');
                wikiContext += `\n--- Fichier Source : ${file} ---\n${content}\n`;
            }
        }

        console.log(`🧠 Lecture du wiki en cours pour répondre à : "${question}"...`);

        // 2. Le Prompt système : On force l'IA à n'utiliser QUE le Wiki
        const prompt = `
        Tu es un assistant expert spécialisé sur la société Axorus. 
        Utilise UNIQUEMENT le contexte fourni ci-dessous (qui est ma base de connaissances personnelle) pour répondre.
        Si la réponse ne se trouve pas dans le contexte, dis-le clairement, n'invente rien.
        Formate ta réponse en Markdown clair et lisible.
        
        CONTEXTE DE LA BASE DE CONNAISSANCES :
        ${wikiContext}
        
        QUESTION DE L'UTILISATEUR :
        ${question}
        `;

        // 3. Appel à l'API
        const response = await ai.models.generateContent({
            model: aiModelName,
            contents: prompt,
        });

        // 4. Affichage du résultat
        console.log("\n================ RÉPONSE ================\n");
        console.log(response.text);
        console.log("\n=========================================\n");

    } catch (error) {
        console.error("Erreur lors de l'interrogation :", error);
    }
}

queryWiki();