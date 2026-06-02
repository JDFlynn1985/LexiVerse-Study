'use server';
/**
 * @fileOverview AI Scholarly Vocabulary flow.
 * Fetches a random but significant theological or linguistic term for student engagement.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const VocabularyOutputSchema = z.object({
  term: z.string(),
  language: z.string().describe('Original language or discipline (e.g. Greek, Systematic Theology).'),
  definition: z.string(),
  significance: z.string().describe('Why this term is critical for seminary students.'),
  exampleUsage: z.string(),
});

export type VocabularyOutput = z.infer<typeof VocabularyOutputSchema>;

const termOfTheDayFlow = ai.defineFlow(
  {
    name: 'termOfTheDayFlow',
    outputSchema: VocabularyOutputSchema,
  },
  async () => {
    const { output } = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: `Generate a unique "Theological Term of the Day" for a seminary student. 
      Choose a term from biblical studies, systematic theology, or original languages.
      Return strictly valid JSON adhering to the VocabularyOutputSchema.`,
      output: { schema: VocabularyOutputSchema }
    });
    return output!;
  }
);

/**
 * Public wrapper function for fetching the term of the day.
 */
export async function getTermOfTheDay(): Promise<VocabularyOutput> {
  return termOfTheDayFlow();
}