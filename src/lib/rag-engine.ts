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
 * Provides semantic chunking and weighted relevance ranking for scholarly papers.
 * Enhanced with TF-IDF inspired keyword frequency scoring.
 */

export interface RAGChunk {
  text: string;
  sourceName: string;
  score?: number;
}

/**
 * Simple browser-safe tokenizer.
 * Splits text into unique lowercase words, filtering out noise.
 */
function tokenize(text: string): string[] {
  if (!text) return [];
  // Academic stop words
  const stopWords = new Set(['the', 'and', 'for', 'was', 'with', 'that', 'this', 'from', 'but', 'his', 'her', 'they', 'are']);
  
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !stopWords.has(t));
}

/**
 * Chunks text into smaller overlapping segments to preserve semantic context.
 * Optimized for theological and linguistic document structures.
 */
export function chunkText(text: string, sourceName: string, size: number = 800, overlap: number = 150): RAGChunk[] {
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
 * Uses a weighted keyword frequency approach (TF) for local ranking.
 * @param query The user's research query.
 * @param allChunks Every chunk currently indexed in the local library.
 * @param topK Maximum number of chunks to return.
 */
export function selectRelevantChunks(query: string, allChunks: RAGChunk[], topK: number = 5): RAGChunk[] {
  if (allChunks.length === 0 || !query.trim()) return [];
  
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return allChunks.slice(0, topK);
  
  const scoredChunks = allChunks.map(chunk => {
    const chunkTokens = tokenize(chunk.text);
    const chunkTokenCount = chunkTokens.length;
    
    let score = 0;
    queryTokens.forEach(qToken => {
      const occurrences = chunkTokens.filter(t => t === qToken).length;
      if (occurrences > 0) {
        // Boost score based on frequency relative to chunk size
        const termFrequency = occurrences / chunkTokenCount;
        score += (1 + termFrequency) * (occurrences > 1 ? 1.5 : 1.0);
      }
    });

    return { ...chunk, score };
  });

  // Sort by score descending, filter out non-matches, and take top K
  return scoredChunks
    .filter(c => c.score! > 0)
    .sort((a, b) => b.score! - a.score!)
    .slice(0, topK);
}
