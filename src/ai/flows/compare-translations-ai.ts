'use server';
/**
 * @fileOverview This flow compares the translation of a given word across various Bible versions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CompareTranslationsInputSchema = z.object({
  word: z.string().describe('The word to search for translations (e.g., Greek/Hebrew word or its transliteration).'),
  language: z.string().describe('The source language of the word (e.g., "Greek", "Hebrew").'),
  versions: z.array(z.string()).describe('A list of Bible versions to compare.'),
});
export type CompareTranslationsInput = z.infer<typeof CompareTranslationsInputSchema>;

const TranslationDetailSchema = z.object({
  version: z.string().describe('The name of the Bible version.'),
  translation: z.string().describe('How the word is translated in this version.'),
  originalWord: z.string().optional().describe('The original Greek/Hebrew word found in this version.'),
  transliteration: z.string().optional().describe('The transliteration of the original word.'),
  notes: z.string().optional().describe('Nuances about this translation.'),
});

const CompareTranslationsOutputSchema = z.object({
  originalWord: z.string().describe('The original input word.'),
  language: z.string().describe('The source language of the word.'),
  versionsCompared: z.array(z.string()).describe('The list of versions compared.'),
  translations: z.array(TranslationDetailSchema).describe('Details of how the word is translated in each specified version.'),
  summary: z.string().describe('AI summary comparing translations.'),
  bibliography: z.string().optional().describe('Simulated sources used for comparison.'),
});
export type CompareTranslationsOutput = z.infer<typeof CompareTranslationsOutputSchema>;

const compareTranslationsPrompt = ai.definePrompt({
  name: 'compareTranslationsPrompt',
  input: {
    schema: CompareTranslationsInputSchema,
  },
  output: {
    schema: CompareTranslationsOutputSchema,
  },
  prompt: `You are an expert biblical linguist and translator. Compare the translation of '{{word}}' ({{language}}) across these versions: {{#each versions}}{{{this}}}, {{/each}}.
Your analysis must be structured for a seminary student, focusing on the translational philosophy and theological nuance of each version.

Simulate fetching translations and providing original terms. Highlight theological nuances and differences in translation philosophy.
Address the user as a fellow scholar-in-training.

Format strictly as JSON adhering to CompareTranslationsOutputSchema.`,
});

const compareTranslationsFlow = ai.defineFlow(
  {
    name: 'compareTranslationsFlow',
    inputSchema: CompareTranslationsInputSchema,
    outputSchema: CompareTranslationsOutputSchema,
  },
  async input => {
    const { output } = await compareTranslationsPrompt(input);
    return output!;
  }
);

/**
 * Retrieves and compares word translations across Bible versions.
 */
export async function compareTranslations(input: CompareTranslationsInput): Promise<CompareTranslationsOutput> {
  return compareTranslationsFlow(input);
}
