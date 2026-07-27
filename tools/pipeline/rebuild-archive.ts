import fs from 'fs';
import path from 'path';

const puzzlesDir = path.resolve(__dirname, '../../public/data/puzzles');
const archiveIndexPath = path.resolve(__dirname, '../../public/data/archive-index.json');

const files = fs.readdirSync(puzzlesDir);
const enFiles = files.filter(f => f.endsWith('-en.json'));

const archiveIndex = [];

for (const file of enFiles) {
  const data = JSON.parse(fs.readFileSync(path.join(puzzlesDir, file), 'utf-8'));
  const id = data.id; // e.g. 2026-07-23
  
  // word count
  const wordCount = data.tokens.filter((t: any) => !t.isPunctuation && t.pos !== 'SPACE').length;
  
  archiveIndex.push({
    id,
    date: id,
    difficulty: data.difficulty,
    wordCount
  });
}

archiveIndex.sort((a, b) => b.id.localeCompare(a.id));
fs.writeFileSync(archiveIndexPath, JSON.stringify(archiveIndex, null, 2));
console.log('Rebuilt archive-index.json with', archiveIndex.length, 'entries');
