

'use server';
/**
 * @fileOverview This flow searches online commentaries for historical and linguistic context related to a given word and its roots.
 *
 * - searchCommentariesForContext - A function that searches commentaries for context.
 * - SearchCommentariesInput - The input type for the searchCommentariesForContext function.
 * - SearchCommentariesOutput - The return type for the searchCommentariesForContext function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SearchCommentariesInputSchema = z.object({
  word: z.string().describe('The word to search for (e.g., Greek/Hebrew word or its transliteration).'),
  language: z.string().describe('The language of the word (e.g., "Greek", "Hebrew", "Aramaic").'),
  rootWord: z.string().optional().describe('An optional root word to focus the commentary search.'),
});
export type SearchCommentariesInput = z.infer<typeof SearchCommentariesInputSchema>;

const CommentaryInsightSchema = z.object({
  commentator: z.string().describe('Name of the commentator or commentary source.'),
  insight: z.string().describe('The extracted historical or linguistic insight.'),
  relevantVerse: z.string().optional().describe('The Bible verse reference the insight relates to.'),
});

const SearchCommentariesOutputSchema = z.object({
  searchWord: z.string().describe('The word that was searched for.'),
  language: z.string().describe('The language of the word.'),
  rootWord: z.string().optional().describe('The root word searched, if provided.'),
  commentarySummary: z.string().describe('A synthesized overview of historical and linguistic context from commentaries.'),
  specificInsights: z.array(CommentaryInsightSchema).describe('Detailed insights extracted from commentaries.'),
  bibliography: z.string().optional().describe('A list of simulated sources used for the commentary search.'),
});
export type SearchCommentariesOutput = z.infer<typeof SearchCommentariesOutputSchema>;

export async function searchCommentariesForContext(input: SearchCommentariesInput): Promise<SearchCommentariesOutput> {
  return searchCommentariesFlow(input);
}

const searchCommentariesPrompt = ai.definePrompt({
  name: 'searchCommentariesPrompt',
  input: {
    schema: z.object({
      word: SearchCommentariesInputSchema.shape.word,
      language: SearchCommentariesInputSchema.shape.language,
      rootWord: SearchCommentariesInputSchema.shape.rootWord,
    }),
  },
  output: {
    schema: SearchCommentariesOutputSchema,
  },
  prompt: `You are an expert biblical historian and commentator researcher. Your task is to find and synthesize historical and linguistic context for a given word from various online commentaries.

Search Word: {{word}}
Language: {{language}}
Root Word (Optional): {{rootWord ?? 'N/A'}}

Simulate searching prominent online commentaries (e.g., Jamieson, Fausset, Brown; Scofield; Keil & Delitzsch; Expositor's Greek Testament) for information related to the provided word and its root (if specified). Focus on:
1.  Historical background and context.
2.  Linguistic nuances and etymological connections.
3.  Theological interpretations relevant to the word's usage.

Extract specific insights, noting the commentator and the insight itself. If possible, include the relevant Bible verse reference.

Then, synthesize these findings into a cohesive summary.

Format your response as a JSON object adhering strictly to the SearchCommentariesOutputSchema. Include a simulated bibliography of sources typically used for such analysis.`,
});

const searchCommentariesFlow = ai.defineFlow(
  {
    name: 'searchCommentariesFlow',
    inputSchema: SearchCommentariesInputSchema,
    outputSchema: SearchCommentariesOutputSchema,
  },
  async input => {
    // In a real implementation, this would involve queries to commentary databases or web scraping.
    // For this example, we rely on the prompt to simulate the data and perform the summarization.
    const { output } = await searchCommentariesPrompt(input);
    return output!;
  }
);
