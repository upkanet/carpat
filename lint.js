import { GoogleGenAI } from '@google/genai';
import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config';
import { dateString } from './tools.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const aiModelName = process.env.AI_MODEL;
const WIKI_DIR = './wiki';
const OUTPUT_REPORT = `audit/audit-${dateString()}.md`;

async function lintWiki() {
    try {
        const files = await fs.readdir(WIKI_DIR);
        let wikiContent = '';
        
        for (const file of files) {
            if (file.endsWith('.md')) {
                const content = await fs.readFile(path.join(WIKI_DIR, file), 'utf-8');
                wikiContent += `\n--- Fichier: ${file} ---\n${content}\n`;
            }
        }

        console.log("Analyse de la base de connaissances en cours...");

        const prompt = `
        Tu es un auditeur de données. Voici le contenu intégral de mon wiki Obsidian sur la société Axorus.
        Fais un "Health Check" (Audit de santé) de ces données.
        
        Rédige un rapport détaillé en Markdown qui inclut :
        1. **Les données manquantes :** Qu'est-ce qui est flou ou absent ? (ex: trous dans l'historique financier, détails cliniques manquants).
        2. **Les incohérences :** Y a-t-il des contradictions entre les différents fichiers ?
        3. **Pistes d'exploration :** Suggère 3 à 5 questions de recherche spécifiques à poser sur le web pour enrichir le wiki.
        
        Voici le wiki :
        ${wikiContent}
        `;

        const response = await ai.models.generateContent({
            model: aiModelName,
            contents: prompt,
        });

        await fs.writeFile(OUTPUT_REPORT, response.text, 'utf-8');
        console.log(`✅ Rapport d'audit généré : ${OUTPUT_REPORT}`);

    } catch (error) {
        console.error("Erreur lors de l'audit :", error);
    }
}

lintWiki();