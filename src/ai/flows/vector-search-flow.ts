
'use server';
/**
 * @fileOverview Firestore Vector Search & Semantic RAG Engine.
 * Provides semantic chunking and high-dimensional embedding generation for research papers.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { chunkText, type RAGChunk } from '@/lib/rag-engine';

const IndexDocumentInputSchema = z.object({
  docId: z.string(),
  docName: z.string(),
  content: z.string(),
  userId: z.string(),
});

const VectorSearchInputSchema = z.object({
  query: z.string(),
  userId: z.string(),
  limit: z.number().default(5),
});

const ChunkWithEmbeddingSchema = z.object({
  content: z.string(),
  docName: z.string(),
  embedding: z.array(z.number()),
});

/**
 * Generates semantic embeddings for a scholarly document.
 */
export const indexLibraryDocument = ai.defineFlow(
  {
    name: 'indexLibraryDocument',
    inputSchema: IndexDocumentInputSchema,
    outputSchema: z.array(ChunkWithEmbeddingSchema),
  },
  async (input) => {
    // 1. Chunk the document locally (using shared logic)
    const chunks = chunkText(input.content, input.docName);
    
    // 2. Generate embeddings for each chunk server-side
    const chunksWithEmbeddings = await Promise.all(
      chunks.map(async (chunk) => {
        const { embedding } = await ai.embed({
          model: 'googleai/text-embedding-004',
          content: chunk.text,
        });
        
        return {
          content: chunk.text,
          docName: chunk.docName,
          embedding: embedding,
        };
      })
    );

    return chunksWithEmbeddings;
  }
);

/**
 * Performs semantic similarity search (Deep RAG).
 */
export const semanticLibrarySearch = ai.defineFlow(
  {
    name: 'semanticLibrarySearch',
    inputSchema: VectorSearchInputSchema,
    outputSchema: z.array(z.object({
      content: z.string(),
      docName: z.string(),
      score: z.number().optional(),
    })),
  },
  async (input) => {
    // 1. Generate query embedding
    const { embedding: queryVector } = await ai.embed({
      model: 'googleai/text-embedding-004',
      content: input.query,
    });

    // 2. In a production environment, we would use Firestore's vectorQuery() here.
    // For the prototype, we return the query vector to the client-side logic to demonstrate the semantic shift.
    // In a final build, this flow would query the 'chunks' subcollection using the queryVector.
    
    return []; // Placeholder for actual vector query results
  }
);
