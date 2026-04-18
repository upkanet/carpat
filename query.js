import { GoogleGenAI } from '@google/genai';
import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const aiModelName = process.env.AI_MODEL;

const WIKI_DIR = './wiki';
const ASSETS_DIR = './wiki/assets'; // Ajustez si vos images sont dans ./wiki/assets

async function queryWiki() {
    const question = process.argv.slice(2).join(' ');
    
    if (!question) {
        console.log("⚠️ Veuillez poser une question.");
        return;
    }

    try {
        // 1. Charger le texte du Wiki
        const files = await fs.readdir(WIKI_DIR);
        let wikiContext = '';
        
        for (const file of files) {
            if (file.endsWith('.md')) {
                const content = await fs.readFile(path.join(WIKI_DIR, file), 'utf-8');
                wikiContext += `\n--- Fichier : ${file} ---\n${content}\n`;
            }
        }

        // 2. Charger les images du dossier Assets (Multimodalité)
        const multimodalParts = [];
        try {
            const assetFiles = await fs.readdir(ASSETS_DIR);
            for (const file of assetFiles) {
                const ext = path.extname(file).toLowerCase();
                if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
                    const imageBuffer = await fs.readFile(path.join(ASSETS_DIR, file));
                    let mimeType = 'image/jpeg';
                    if (ext === '.png') mimeType = 'image/png';
                    if (ext === '.webp') mimeType = 'image/webp';

                    multimodalParts.push({
                        inlineData: {
                            data: imageBuffer.toString("base64"),
                            mimeType: mimeType
                        }
                    });
                }
            }
        } catch (e) {
            console.log("ℹ️ Aucun dossier assets trouvé ou dossier vide.");
        }

        console.log(`🧠 Analyse du texte et de ${multimodalParts.length} image(s) pour répondre...`);

        // 3. Construction du Prompt
        const promptText = `
        Tu es l'expert IA de la base de connaissances Axorus.
        Tu as accès à tous les articles du wiki (texte) ET aux images de la base (fournies en pièces jointes).
        
        Réponds à la question en utilisant ces deux sources. Si la réponse est visible sur une image, décris-la.
        Utilise la syntaxe ![[NomDuFichier]] pour citer une image si elle illustre ta réponse.
        
        CONTEXTE TEXTUEL :
        ${wikiContext}
        
        QUESTION :
        ${question}
        `;

        // On envoie le texte + TOUTES les images au modèle
        const response = await ai.models.generateContent({
            model: aiModelName,
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: promptText },
                        ...multimodalParts
                    ]
                }
            ]
        });

        console.log("\n================ RÉPONSE ================\n");
        console.log(response.text);
        console.log("\n=========================================\n");

    } catch (error) {
        console.error("Erreur lors de l'interrogation :", error);
    }
}

queryWiki();