import { program } from 'commander';
import * as cheerio from 'cheerio';
import nlp from 'compromise';
import nlpFr from 'fr-compromise';
import fs from 'fs';
import path from 'path';
import { isStopWord } from '../../src/data/stopWords';

const USER_AGENT = 'UnredactBot/1.0 (https://unredact.com; contact@unredact.com)';

function getApiBase(lang: string) {
  return `https://${lang}.wikipedia.org/api/rest_v1/page/html`;
}
function getPageviewsApi(lang: string) {
  return `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/${lang}.wikipedia/all-access/all-agents`;
}

async function fetchArticleHtml(title: string, lang: string): Promise<string> {
  const url = `${getApiBase(lang)}/${encodeURIComponent(title)}`;
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`Failed to fetch article: ${response.statusText}`);
  return response.text();
}

function cleanHtml(html: string): string {
  const $ = cheerio.load(html);
  
  // Remove reference markers, tables, images, infoboxes, etc.
  $('.mw-ref, table, img, .infobox, .thumb, .metadata, .noprint, .navbox').remove();
  
  let text = '';
  // Extract text from paragraphs
  $('p').each((_, el) => {
    const pText = $(el).text().trim();
    if (pText) {
      text += pText + '\n\n';
    }
  });
  
  return text.trim();
}

function tokenizeAndTag(text: string, lang: 'en' | 'fr') {
  const doc = lang === 'fr' ? nlpFr(text) : nlp(text);
  const regex = /([a-zA-Z0-9À-ÿ-]+)|([^a-zA-Z0-9À-ÿ-]+)/g;
  const rawMatches = [...text.matchAll(regex)];
  
  return rawMatches.map(match => {
    const val = match[0];
    const isWhitespace = /^\s+$/.test(val);
    const isPunctuation = !isWhitespace && /^[^a-zA-Z0-9À-ÿ]+$/.test(val);
    
    let pos = 'NN';
    if (!isWhitespace && !isPunctuation) {
      const matchDoc = doc.match(val);
      if (matchDoc.has('#Verb')) pos = 'VB';
      else if (matchDoc.has('#Adjective')) pos = 'JJ';
      else if (matchDoc.has('#Adverb')) pos = 'RB';
      else if (matchDoc.has('#Value')) pos = 'CD';
      else if (matchDoc.has('#Pronoun')) pos = 'PRP';
      else if (matchDoc.has('#ProperNoun')) pos = 'NNP';
    } else if (isWhitespace) {
      pos = 'SPACE';
    } else {
      pos = 'PUNCT';
    }
    
    return {
      text: val,
      pos,
      isStopWord: isWhitespace || isPunctuation ? false : isStopWord(val, lang),
      isPunctuation
    };
  });
}

async function computeDifficulty(title: string, lang: string): Promise<'straightforward' | 'challenging' | 'obscure'> {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  
  const formatDate = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '');
  
  const url = `${getPageviewsApi(lang)}/${encodeURIComponent(title)}/daily/${formatDate(start)}/${formatDate(end)}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return 'challenging';
    const data = await res.json();
    
    let totalViews = 0;
    if (data.items) {
      totalViews = data.items.reduce((sum: number, item: any) => sum + item.views, 0);
    }
    
    if (totalViews > 100000) return 'straightforward';
    if (totalViews > 10000) return 'challenging';
    return 'obscure';
  } catch {
    return 'challenging';
  }
}

async function getRandomArticleTitle(lang: string): Promise<string> {
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/random/summary`;
  console.log('Searching for a popular random article...');
  
  for (let i = 0; i < 10; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) {
      console.warn(`Failed to fetch random article: ${res.statusText}`);
      continue;
    }
    const data = await res.json();
    const title = data.title;
    
    const diff = await computeDifficulty(title, lang);
    // Prefer popular articles so the puzzle is solvable
    if (diff === 'straightforward' || diff === 'challenging') {
      console.log(`Found good article: ${title} (${diff})`);
      return title;
    }
  }
  
  // Fallback to whatever we get
  console.log('Could not find popular article, falling back to fully random.');
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`Failed to fetch fallback random article: ${res.statusText}`);
  const data = await res.json();
  return data.title;
}

// Ensure unlimited-index.json is updated when new puzzles are added
function updateUnlimitedIndex(dateStr: string, difficulty: string, category: string) {
  const indexPath = path.resolve(__dirname, '../../public/data/unlimited-index.json');
  let index: any[] = [];
  if (fs.existsSync(indexPath)) {
    index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  }
  
  if (!index.find((p: any) => p.id === dateStr)) {
    index.push({ id: dateStr, difficulty, category });
    index.sort((a, b) => b.id.localeCompare(a.id)); // Newest first
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
    console.log(`Updated unlimited-index.json with ${dateStr}`);
  }
}

// Ensure archive-index.json is updated when new puzzles are added
function updateArchiveIndex(dateStr: string, difficulty: string, tokens: any[]) {
  const indexPath = path.resolve(__dirname, '../../public/data/archive-index.json');
  let index: any[] = [];
  if (fs.existsSync(indexPath)) {
    index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  }
  
  if (!index.find((p: any) => p.id === dateStr)) {
    const wordCount = tokens.filter(t => !t.isPunctuation && t.pos !== 'SPACE').length;
    index.push({ id: dateStr, date: dateStr, difficulty, wordCount });
    index.sort((a, b) => b.id.localeCompare(a.id)); // Newest first
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
    console.log(`Updated archive-index.json with ${dateStr}`);
  }
}

async function generatePuzzle(dateStr: string, requestedTitle: string | null, category: string, lang: 'en' | 'fr') {
  const articleTitle = requestedTitle ? requestedTitle.replace(/_/g, ' ') : await getRandomArticleTitle(lang);

  console.log(`\n--- Generating puzzle for ${dateStr} (${lang.toUpperCase()}) ---`);
  console.log(`Fetching article: ${articleTitle}...`);
  const html = await fetchArticleHtml(articleTitle, lang);
  
  console.log('Cleaning HTML...');
  const text = cleanHtml(html);
  
  const paragraphs = text.split('\n\n').slice(0, 20);
  const truncatedText = paragraphs.join('\n\n');
  
  console.log('Tokenizing and tagging (this might take a moment)...');
  const tokens = tokenizeAndTag(truncatedText, lang);
  
  console.log('Computing difficulty based on pageviews...');
  const difficulty = await computeDifficulty(articleTitle, lang);
  
  const firstLetter = articleTitle.charAt(0).toUpperCase();
  const sampleSentence = paragraphs[0]?.split('. ')[0] + '.' || '';
  
  const puzzle = {
    id: dateStr,
    title: articleTitle,
    normalizedTitle: articleTitle.toLowerCase(),
    alternateTitles: [articleTitle.split(' ')[0].toLowerCase()],
    category: category,
    difficulty,
    firstLetter,
    sampleSentence,
    fullTextRaw: truncatedText,
    categoriesList: [category.split(' – ')[0] || 'General'],
    tokens
  };
  
  const puzzlesDir = path.resolve(__dirname, '../../public/data/puzzles');
  if (!fs.existsSync(puzzlesDir)) {
    fs.mkdirSync(puzzlesDir, { recursive: true });
  }
  
  const outPath = path.join(puzzlesDir, `${dateStr}-${lang}.json`);
  fs.writeFileSync(outPath, JSON.stringify(puzzle, null, 2));
  console.log(`✅ Saved puzzle to ${outPath}`);
  
  // Only update index with the ID (without language suffix), 
  // since the index is shared, and DailyRoute will append -en or -fr
  updateUnlimitedIndex(dateStr, difficulty, category);
  updateArchiveIndex(dateStr, difficulty, tokens);
}

async function main() {
  program
    .option('-d, --date <date>', 'Start date for puzzles (YYYY-MM-DD)', new Date().toISOString().slice(0, 10))
    .option('-a, --article <title>', 'Wikipedia article title (optional, picks random if omitted)')
    .option('-c, --category <category>', 'Category string', 'General')
    .option('-b, --batch <days>', 'Number of days to generate in batch', '1')
    .option('-l, --lang <lang>', 'Language code (en or fr)', 'en')
    .parse(process.argv);

  const options = program.opts();
  const batchSize = parseInt(options.batch, 10);
  const lang = options.lang as 'en' | 'fr';
  
  let currentDate = new Date(options.date);
  
  for (let i = 0; i < batchSize; i++) {
    const dateStr = currentDate.toISOString().slice(0, 10);
    
    // Only pass the requested article for the first item if batch > 1, 
    // otherwise the same article would be used for all 7 days!
    const article = (i === 0) ? options.article : null;
    
    await generatePuzzle(dateStr, article, options.category, lang);
    
    // Increment date by 1 day
    currentDate.setDate(currentDate.getDate() + 1);
  }
}

main().catch(console.error);
