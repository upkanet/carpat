import { access, readdir, rm, rename } from 'fs/promises';
import path from 'path';

/**
 * Nettoie un dossier en conservant certains éléments.
 * @param {string} targetDir - Le chemin du dossier à nettoyer.
 * @param {string[]} keepList - Les noms des fichiers/dossiers à conserver.
 */
async function cleanDirectory(targetDir, keepList) {
  try {
    // Vérifie si le dossier existe
    await access(targetDir);
    
    // Lit le contenu du dossier
    const items = await readdir(targetDir);

    for (const item of items) {
      const fullPath = path.join(targetDir, item);

      // Si l'élément est dans la liste des exceptions, on l'ignore
      if (keepList.includes(item)) {
        console.log(`✅ Conservé : ${fullPath}`);
        continue;
      }

      // Supprime l'élément (fichier ou dossier) de manière récursive
      await rm(fullPath, { recursive: true, force: true });
      console.log(`🗑️  Supprimé : ${fullPath}`);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`⚠️  Le dossier ${targetDir} n'existe pas, nettoyage ignoré.`);
    } else {
      console.error(`❌ Erreur lors du nettoyage de ${targetDir}:`, error);
    }
  }
}

/**
 * Déplace tout le contenu d'un dossier vers un autre.
 * @param {string} sourceDir - Le dossier contenant les fichiers à déplacer.
 * @param {string} targetDir - Le dossier de destination.
 */
async function moveContents(sourceDir, targetDir) {
  try {
    await access(sourceDir);
    const items = await readdir(sourceDir);

    if (items.length === 0) {
      console.log(`ℹ️  Le dossier ${sourceDir} est vide, rien à déplacer.`);
      return;
    }

    for (const item of items) {
      const oldPath = path.join(sourceDir, item);
      const newPath = path.join(targetDir, item);

      // Déplace l'élément de oldPath vers newPath
      await rename(oldPath, newPath);
      console.log(`➡️  Déplacé : ${item} vers ${targetDir}`);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`⚠️  Le dossier ${sourceDir} n'existe pas, déplacement ignoré.`);
    } else {
      console.error(`❌ Erreur lors du déplacement depuis ${sourceDir}:`, error);
    }
  }
}

// Grâce aux modules ES, plus besoin d'englober ceci dans une fonction asynchrone (Top-level await)
console.log('--- Début du nettoyage ---');

await cleanDirectory('./raw', ['archives', '.gitignore']);
await cleanDirectory('./wiki', ['.gitignore']);

console.log('--- Nettoyage terminé ---');

console.log('\n--- Déplacement des archives ---');
await moveContents('./raw/archives', './raw');
console.log('\n--- Déplacement terminé ---');
