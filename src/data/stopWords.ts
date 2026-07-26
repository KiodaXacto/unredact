// src/data/stopWords.ts
// Complete NLTK-style English stop word list.
// Words in this set are always visible in the article (never redacted).
// Case-insensitive — compare against lowercased tokens.

export const STOP_WORDS: ReadonlySet<string> = new Set([
  // Articles
  'a', 'an', 'the',

  // Conjunctions
  'and', 'but', 'or', 'nor', 'for', 'yet', 'so',
  'although', 'because', 'since', 'unless', 'while', 'if', 'as',
  'though', 'until', 'when', 'where', 'whether',

  // Prepositions
  'at', 'by', 'from', 'in', 'into', 'of', 'off', 'on', 'onto',
  'out', 'over', 'to', 'under', 'up', 'upon', 'with', 'within',
  'without', 'about', 'above', 'across', 'after', 'against', 'along',
  'among', 'around', 'before', 'behind', 'below', 'beneath', 'beside',
  'between', 'beyond', 'during', 'except', 'inside', 'near', 'outside',
  'past', 'since', 'through', 'throughout', 'toward', 'underneath',

  // Pronouns
  'he', 'her', 'hers', 'herself', 'him', 'himself', 'his',
  'i', 'it', 'its', 'itself', 'me', 'mine', 'my', 'myself',
  'our', 'ours', 'ourselves', 'she', 'their', 'theirs', 'them',
  'themselves', 'they', 'us', 'we', 'what', 'which', 'who', 'whom',
  'whose', 'you', 'your', 'yours', 'yourself', 'yourselves',

  // Verb forms of "to be" and auxiliaries
  'am', 'are', 'be', 'been', 'being', 'is', 'was', 'were',
  'can', 'could', 'did', 'do', 'does', 'doing', 'done', 'had',
  'has', 'have', 'having', 'may', 'might', 'must', 'need', 'ought',
  'shall', 'should', 'used', 'will', 'would',

  // Common adverbs and quantifiers
  'again', 'ago', 'also', 'any', 'back', 'both', 'down', 'each',
  'either', 'else', 'enough', 'every', 'few', 'further', 'here',
  'how', 'however', 'just', 'less', 'many', 'more', 'most',
  'much', 'never', 'no', 'not', 'now', 'often', 'once', 'only',
  'other', 'rather', 'same', 'several', 'so', 'some', 'still',
  'such', 'than', 'that', 'then', 'there', 'these', 'this',
  'those', 'thus', 'too', 'very', 'when', 'where', 'while',
  'why', 'yes', 'yet',

  // Numbers as words (small, commonly visible)
  'one', 'two', 'three', 'four', 'five',

  // Common determiners
  'all', 'another', 'any', 'both', 'each', 'either',
  'neither', 'none', 'nothing', 'own', 'same',

  // Sentence connectors
  'also', 'among', 'indeed', 'instead', 'likewise', 'meanwhile',
  'moreover', 'nevertheless', 'otherwise', 'similarly', 'therefore',
  'whereas',
]);

/**
 * Returns true if the given word (lowercased) is a stop word.
 * Used at puzzle load time to mark tokens; not called per-render.
 */
export const isStopWord = (word: string): boolean =>
  STOP_WORDS.has(word.toLowerCase());
