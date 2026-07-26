import { program } from 'commander';
import * as cheerio from 'cheerio';
import nlp from 'compromise';
import fs from 'fs';
import path from 'path';
import { isStopWord } from '../../src/data/stopWords';

const API_BASE = 'https://en.wikipedia.org/api/rest_v1/page/html';
const PAGEVIEWS_API = 'https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/all-agents';

async function fetchArticleHtml(title: string): Promise<string> {
  const url = `${API_BASE}/${encodeURIComponent(title)}`;
  const response = await fetch(url);
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

function tokenizeAndTag(text: string) {
  // Use compromise to get POS tags
  const doc = nlp(text);
  
  // The tokenize process needs to split words and punctuation carefully,
  // preserving spaces as separate tokens.
  const regex = /([a-zA-Z0-9À-ÿ-]+)|([^a-zA-Z0-9À-ÿ-]+)/g;
  const rawMatches = [...text.matchAll(regex)];
  
  const tokens = rawMatches.map(match => {
    const val = match[0];
    const isWhitespace = /^\s+$/.test(val);
    const isPunctuation = !isWhitespace && /^[^a-zA-Z0-9À-ÿ]+$/.test(val);
    
    let pos = 'NN'; // Default noun
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
      isStopWord: isWhitespace || isPunctuation ? false : isStopWord(val),
      isPunctuation
    };
  });
  
  return tokens;
}

async function computeDifficulty(title: string): Promise<'straightforward' | 'challenging' | 'obscure'> {
  // Check pageviews over the last 30 days as a proxy for obscurity
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  
  const formatDate = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '');
  
  const url = `${PAGEVIEWS_API}/${encodeURIComponent(title)}/daily/${formatDate(start)}/${formatDate(end)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return 'challenging'; // fallback
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

async function main() {
  program
    .requiredOption('-d, --date <date>', 'Puzzle date (YYYY-MM-DD)')
    .requiredOption('-a, --article <title>', 'Wikipedia article title')
    .option('-c, --category <category>', 'Category string', 'General')
    .parse(process.argv);

  const options = program.opts();
  const dateStr = options.date;
  const articleTitle = options.article.replace(/_/g, ' ');

  console.log(`Fetching article: ${articleTitle}...`);
  const html = await fetchArticleHtml(articleTitle);
  
  console.log('Cleaning HTML...');
  const text = cleanHtml(html);
  
  // Cut to reasonable length if too long (e.g. first 20 paragraphs)
  const paragraphs = text.split('\n\n').slice(0, 20);
  const truncatedText = paragraphs.join('\n\n');
  
  console.log('Tokenizing and tagging (this might take a moment)...');
  const tokens = tokenizeAndTag(truncatedText);
  
  console.log('Computing difficulty based on pageviews...');
  const difficulty = await computeDifficulty(articleTitle);
  
  const firstLetter = articleTitle.charAt(0).toUpperCase();
  const sampleSentence = paragraphs[0]?.split('. ')[0] + '.' || '';
  
  const puzzle = {
    id: dateStr,
    title: articleTitle,
    normalizedTitle: articleTitle.toLowerCase(),
    alternateTitles: [articleTitle.split(' ')[0].toLowerCase()], // Simple guess for alt title
    category: options.category,
    difficulty,
    firstLetter,
    sampleSentence,
    fullTextRaw: truncatedText,
    categoriesList: [options.category.split(' – ')[0] || 'General'],
    tokens
  };
  
  const outPath = path.resolve(__dirname, `../../public/data/puzzles/${dateStr}.json`);
  fs.writeFileSync(outPath, JSON.stringify(puzzle, null, 2));
  console.log(`✅ Saved puzzle to ${outPath}`);
}

main().catch(console.error);
