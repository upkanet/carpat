# carpat
LLM Knowledge Database from Andrej Karpathy's idea

## Utilisation
Ouvrir Obsidian et cliquer sur Ouvrir, choisir la racine
Ajouter en vrac les fichiers sources dans /raw
Lire les nouveaux du raw, mettre à jour le wiki et archiver les fichiers déjà intégrés : `node compile.js`
Vérifier le wiki et générer un rapport d'audit dans /audit : `node lint.js`
Interroger le wiki : `node query.js "C'est qui le patron ?"`

## Configuration
Renseigner dans .env les informations suivantes
La clé API récupérée dans Google AI Studio
GEMINI_API_KEY=
Le nom du model à utiliser
AI_MODEL=