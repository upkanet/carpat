import { GoogleGenAI } from '@google/genai';
import fs from 'fs/promises';
import path from 'path';
import pdf from 'pdf-extraction';
import 'dotenv/config';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const aiModelName = process.env.AI_MODEL;
const RAW_DIR = './raw';
const ARCHIVE_DIR = path.join(RAW_DIR, 'archives');
const WIKI_DIR = './wiki';
const ASSETS_DIR = './wiki/assets';

async function compileWiki() {
    try {
        const files = await fs.readdir(RAW_DIR);
        let rawContent = '';
        const filesToArchive = [];
        const multimodalParts = [];
        
        // S'assurer que les dossiers existent
        await fs.mkdir(ASSETS_DIR, { recursive: true });

        for (const file of files) {
            const filePath = path.join(RAW_DIR, file);
            const stats = await fs.stat(filePath);
            
            if (stats.isFile()) {
                const ext = path.extname(file).toLowerCase();

                if (ext === '.md' || ext === '.txt') {
                    const content = await fs.readFile(filePath, 'utf-8');
                    rawContent += `\n--- Source: ${file} ---\n${content}\n`;
                    filesToArchive.push({ name: file, type: 'text' });
                } 
                else if (ext === '.pdf') {
                    console.log(`Préparation du PDF (Texte & Images) : ${file}...`);
                    const pdfBuffer = await fs.readFile(filePath);
                    
                    multimodalParts.push({
                        inlineData: { 
                            data: pdfBuffer.toString("base64"), 
                            mimeType: "application/pdf" 
                        }
                    });
                    
                    rawContent += `\n--- Fichier PDF joint pour analyse intégrale : ${file} ---\n`;
                    filesToArchive.push({ name: file, type: 'pdf' }); // On archive simplement
                }
                else if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
                    console.log(`Analyse visuelle de : ${file}...`);
                    const imageBuffer = await fs.readFile(filePath);
                    
                    let mimeType = 'image/jpeg';
                    if (ext === '.png') mimeType = 'image/png';
                    if (ext === '.webp') mimeType = 'image/webp';

                    multimodalParts.push({
                        inlineData: { data: imageBuffer.toString("base64"), mimeType }
                    });
                    
                    // On donne à l'IA le nom exact du fichier pour qu'elle puisse créer le lien !
                    rawContent += `\n--- Image jointe disponible : ${file} ---\n`;
                    filesToArchive.push({ name: file, type: 'image' });
                }
            }
        }

        if (!rawContent && multimodalParts.length === 0) return;

        const promptText = `
        Tu es un expert en architecture de l'information. 
        Compile un wiki sur Axorus à partir des textes et images fournis.
        
        IMPORTANT POUR LES IMAGES :
        Si une image fournie est pertinente pour un article (ex: un schéma technique, un logo, une photo d'équipe), 
        tu DOIS l'insérer dans le corps de l'article en utilisant la syntaxe Obsidian : ![[NomDuFichier]]
        Exemple : Si le fichier s'appelle "schema_implant.png", écris ![[schema_implant.png]] à l'endroit opportun.
        
        Réponds uniquement en JSON :
        [{"filename": "Article.md", "content": "# Titre\\n![[image.png]]\\nTexte..."}]
        
        Données : ${rawContent}
        `;

        const response = await ai.models.generateContent({
            model: aiModelName,
            contents: [promptText, ...multimodalParts],
            config: { responseMimeType: "application/json" }
        });

        const wikiFiles = JSON.parse(response.text);
        await fs.mkdir(WIKI_DIR, { recursive: true });
        
        for (const file of wikiFiles) {
            await fs.writeFile(path.join(WIKI_DIR, file.filename), file.content);
            console.log(`✅ Wiki mis à jour : ${file.filename}`);
        }

        // Archivage intelligent
        await fs.mkdir(ARCHIVE_DIR, { recursive: true });
        for (const fileObj of filesToArchive) {
            const oldPath = path.join(RAW_DIR, fileObj.name);
            if (fileObj.type === 'image') {
                // Pour les images : on les copie dans assets pour Obsidian, et on les archive
                await fs.copyFile(oldPath, path.join(ASSETS_DIR, fileObj.name));
            }
            await fs.rename(oldPath, path.join(ARCHIVE_DIR, fileObj.name));
        }

    } catch (error) { console.error("Erreur :", error); }
}
compileWiki();