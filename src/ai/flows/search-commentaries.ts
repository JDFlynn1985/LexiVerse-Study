'use server';
/**
 * @fileOverview Verified Commentary Aggregator Flow.
 * Specifically searches for and synthesizes insights from primary historical scholarly works.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SearchCommentariesInputSchema = z.object({
  query: z.string().describe('The Bible passage or scholarly term to research.'),
  language: z.string().optional().describe('Source language if term-based.'),
  model: z.string().optional().describe('The AI model to use for synthesis.'),
});
export type SearchCommentariesInput = z.infer<typeof SearchCommentariesInputSchema>;

const HistoricalWorkSchema = z.object({
  source: z.string().describe('Name of the work (e.g., Jamieson-Fausset-Brown, Matthew Henry).'),
  era: z.string().describe('Historical period of the work.'),
  insight: z.string().describe('The specific extracted commentary text or synthesis.'),
  tradition: z.string().describe('The theological tradition (e.g., Reformed, Methodist, Anglican).'),
});

const SearchCommentariesOutputSchema = z.object({
  searchQuery: z.string(),
  summary: z.string().describe('A synthesized scholarly overview of the aggregated historical views.'),
  historicalWorks: z.array(HistoricalWorkSchema).describe('Structured insights from verified historical commentators.'),
  academicSynthesis: z.string().describe('Modern scholarly synthesis of these historical perspectives.'),
  bibliography: z.string().describe('Formatted SBL-style bibliographic entries for the aggregated works.'),
});
export type SearchCommentariesOutput = z.infer<typeof SearchCommentariesOutputSchema>;

export async function runCommentaryAggregation(input: SearchCommentariesInput): Promise<SearchCommentariesOutput> {
  const selectedModel = input.model || 'googleai/gemini-2.5-flash';

  const { output } = await ai.generate({
    model: selectedModel,
    prompt: `You are an expert Librarian and Bibliographer specializing in historical Bible commentaries.
    Your task is to AGGREGATE insights for: "${input.query}".
    
    CRITICAL REQUIREMENT:
    You must specifically look for and synthesize text from primary historical works such as:
    - Jamieson-Fausset-Brown (JFB)
    - Matthew Henry's Commentary
    - Keil & Delitzsch Commentary on the Old Testament
    - John Calvin's Commentaries
    - Expositor's Bible
    
    Structure your response to show the diversity of theological traditions (e.g., how a 17th-century Reformed view differs from a 19th-century Anglican view).
    
    Format your response strictly as JSON adhering to SearchCommentariesOutputSchema.`,
    output: {
      schema: SearchCommentariesOutputSchema,
    }
  });

  if (!output) throw new Error('Commentary Aggregator failed to synthesize data.');
  return output;
}
