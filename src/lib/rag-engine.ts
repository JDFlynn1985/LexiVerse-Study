
/*
 * Title: LexiVerse
 * Copyright © 2026 Joshua Flynn <joshuaflynn040@gmail.com>
 * Source: https://github.com/JDFlynn1985/LexiVerse
 *
 * This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 
 * International License. To view a copy of this license, visit:
 * http://creativecommons.org
 */

/**
 * @fileOverview Advanced RAG (Retrieval-Augmented Generation) Engine.
 * Provides semantic chunking and relevance ranking for network-isolated scholarly papers.
 * Optimized for browser-side execution without Node.js dependencies.
 */

export interface RAGChunk {
  text: string;
  sourceName: string;
  score?: number;
}

/**
 * Simple browser-safe tokenizer.
 * Splits text into unique lowercase words, filtering out short tokens.
 */
function tokenize(text: string): string[] {
  if (!text) return [];
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);
}

/**
 * Chunks text into smaller overlapping segments to preserve semantic context.
 */
export function chunkText(text: string, sourceName: string, size: number = 600, overlap: number = 100): RAGChunk[] {
  const chunks: RAGChunk[] = [];
  let start = 0;

  if (!text) return [];

  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    chunks.push({
      text: text.substring(start, end),
      sourceName: sourceName
    });
    if (end === text.length) break;
    start += (size - overlap);
  }

  return chunks;
}

/**
 * Selects the top-k most relevant chunks based on a search term.
 * Uses a keyword overlap approach for local ranking.
 */
export function selectRelevantChunks(query: string, allChunks: RAGChunk[], topK: number = 5): RAGChunk[] {
  if (allChunks.length === 0 || !query.trim()) return [];
  
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return allChunks.slice(0, topK);
  
  const scoredChunks = allChunks.map(chunk => {
    const chunkTokens = new Set(tokenize(chunk.text));
    let score = 0;
    
    queryTokens.forEach(qToken => {
      if (chunkTokens.has(qToken)) {
        score += 1;
      }
    });

    return { ...chunk, score };
  });

  // Sort by score descending and take top K
  return scoredChunks
    .filter(c => c.score! > 0)
    .sort((a, b) => b.score! - a.score!)
    .slice(0, topK);
}
