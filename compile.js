import { GoogleGenAI } from '@google/genai';
import fs from 'fs/promises';
import path from 'path';
import pdf from 'pdf-extraction'; // Le sauveur, moderne et compatible ESM !
import 'dotenv/config';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const aiModelName = process.env.AI_MODEL;
const RAW_DIR = './raw';
const ARCHIVE_DIR = path.join(RAW_DIR, 'archives');
const WIKI_DIR = './wiki';

async function compileWiki() {
    try {
        const files = await fs.readdir(RAW_DIR);
        let rawContent = '';
        const filesToArchive = [];
        
        for (const file of files) {
            const filePath = path.join(RAW_DIR, file);
            const stats = await fs.stat(filePath);
            
            if (stats.isFile()) {
                // Traitement des fichiers Markdown et Texte
                if (file.endsWith('.md') || file.endsWith('.txt')) {
                    const content = await fs.readFile(filePath, 'utf-8');
                    rawContent += `\n--- Source: ${file} ---\n${content}\n`;
                    filesToArchive.push(file);
                } 
                // Traitement des fichiers PDF
                else if (file.toLowerCase().endsWith('.pdf')) {
                    console.log(`Extraction du texte du PDF : ${file}...`);
                    
                    const dataBuffer = await fs.readFile(filePath);
                    const pdfData = await pdf(dataBuffer); // Extraction propre
                    
                    rawContent += `\n--- Source: ${file} (Texte extrait du PDF) ---\n${pdfData.text}\n`;
                    filesToArchive.push(file);
                }
            }
        }

        if (!rawContent) {
            console.log("Aucune nouvelle donnée brute trouvée dans le dossier raw/.");
            return;
        }

        console.log(`Lecture de ${filesToArchive.length} fichier(s). Envoi à Gemini pour compilation...`);

        const prompt = `
        Tu es un expert en architecture de l'information. Voici des notes brutes concernant la société medtech Axorus.
        Ton objectif est de synthétiser ces informations et de créer une base de connaissances (un wiki).
        Extrais les concepts clés (ex: Technologie, Historique, Dirigeants, Concurrents) et rédige un article complet pour chacun.
        Utilise la syntaxe Obsidian [[Nom_du_Fichier]] pour créer des liens entre les concepts.
        
        TU DOIS RÉPONDRE UNIQUEMENT AVEC UN OBJET JSON VALIDE au format suivant, sans bloc de code markdown autour :
        [
          {
            "filename": "NomDuConcept.md",
            "content": "# Titre\\nContenu en markdown avec des [[Liens]]..."
          }
        ]
        
        Voici les données brutes :
        ${rawContent}
        `;

        const response = await ai.models.generateContent({
            model: aiModelName,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });

        const wikiFiles = JSON.parse(response.text);

        await fs.mkdir(WIKI_DIR, { recursive: true });
        
        for (const file of wikiFiles) {
            const filePath = path.join(WIKI_DIR, file.filename);
            await fs.writeFile(filePath, file.content, 'utf-8');
            console.log(`✅ Fichier Wiki mis à jour/créé : ${file.filename}`);
        }

        console.log("Archivage des données brutes...");
        await fs.mkdir(ARCHIVE_DIR, { recursive: true });

        for (const file of filesToArchive) {
            const oldPath = path.join(RAW_DIR, file);
            const newPath = path.join(ARCHIVE_DIR, file);
            await fs.rename(oldPath, newPath);
            console.log(`📦 Fichier archivé : ${file}`);
        }

        console.log("Compilation et archivage terminés avec succès !");

    } catch (error) {
        console.error("Erreur lors de la compilation :", error);
    }
}

compileWiki();