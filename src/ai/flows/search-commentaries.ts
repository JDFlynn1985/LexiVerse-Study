'use server';
/**
 * @fileOverview This flow searches online commentaries for historical and linguistic context related to a given word and its roots.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SearchCommentariesInputSchema = z.object({
  word: z.string().describe('The word to search for (e.g., Greek/Hebrew word or its transliteration).'),
  language: z.string().describe('The language of the word (e.g., "Greek", "Hebrew", "Aramaic").'),
  rootWord: z.string().optional().describe('An optional root word to focus the commentary search.'),
  model: z.string().optional().describe('The AI model to use for analysis.'),
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
  const selectedModel = input.model || 'googleai/gemini-2.5-flash';

  const { output } = await ai.generate({
    model: selectedModel,
    prompt: `You are an expert biblical historian and researcher. Find and synthesize historical and linguistic context for the word "${input.word}" (${input.language}).
    Always provide your analysis in a tone appropriate for a seminary student, prioritizing academic rigor and theological precision.
    ${input.rootWord ? `Focus on its connection to the root: ${input.rootWord}.` : ''}
    
    Search prominent online commentaries (e.g., JFB, Keil & Delitzsch, Expositor's, and modern critical works). 
    Extract specific insights and provide an academic summary.
    Format your response strictly as JSON adhering to the SearchCommentariesOutputSchema.`,
    output: {
      schema: SearchCommentariesOutputSchema,
    }
  });

  if (!output) {
    throw new Error('Commentary engine failed to synthesize insights.');
  }

  return output;
}
