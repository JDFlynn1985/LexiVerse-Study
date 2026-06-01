
'use server';
/**
 * @fileOverview This flow compares the translation of a given word across various Bible versions.
 *
 * - compareTranslations - A function that retrieves and compares word translations.
 * - CompareTranslationsInput - The input type for the compareTranslations function.
 * - CompareTranslationsOutput - The return type for the compareTranslations function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CompareTranslationsInputSchema = z.object({
  word: z.string().describe('The word to search for translations (e.g., Greek/Hebrew word or its transliteration).'),
  language: z.string().describe('The source language of the word (e.g., "Greek", "Hebrew", "Aramaic").'),
  versions: z.array(z.string()).describe('A list of Bible versions to compare (e.g., ["KJV", "NIV", "ESV", "NASB"]).'),
});
export type CompareTranslationsInput = z.infer<typeof CompareTranslationsInputSchema>;

const TranslationDetailSchema = z.object({
  version: z.string().describe('The name of the Bible version.'),
  translation: z.string().describe('How the word is translated in this version.'),
  originalWord: z.string().optional().describe('The original Greek/Hebrew word found in this version.'),
  transliteration: z.string().optional().describe('The transliteration of the original word.'),
  notes: z.string().optional().describe('Any specific nuances or contextual notes about this translation.'),
});

const CompareTranslationsOutputSchema = z.object({
  originalWord: z.string().describe('The original input word.'),
  language: z.string().describe('The source language of the word.'),
  versionsCompared: z.array(z.string()).describe('The list of Bible versions that were compared.'),
  translations: z.array(TranslationDetailSchema).describe('Details of how the word is translated in each specified version.'),
  summary: z.string().describe('An AI-generated summary comparing the translations, highlighting key differences and similarities.'),
  bibliography: z.string().optional().describe('A list of simulated sources used for comparison.'),
});
export type CompareTranslationsOutput = z.infer<typeof CompareTranslationsOutputSchema>;

export async function compareTranslations(input: CompareTranslationsInput): Promise<CompareTranslationsOutput> {
  return compareTranslationsFlow(input);
}

export async function compareTranslationsFlow(input: CompareTranslationsInput): Promise<CompareTranslationsOutput> {
  // In a real implementation, this would involve API calls to YouVersion, Bible-get-node, or other translation data sources.
  // For this example, we rely on the prompt to simulate the data and perform the comparison.
  const { output } = await compareTranslationsPrompt(input);
  return output!;
}

const compareTranslationsPrompt = ai.definePrompt({
  name: 'compareTranslationsPrompt',
  input: {
    schema: z.object({
      word: CompareTranslationsInputSchema.shape.word,
      language: CompareTranslationsInputSchema.shape.language,
      versions: CompareTranslationsInputSchema.shape.versions,
    }),
  },
  output: {
    schema: CompareTranslationsOutputSchema,
  },
  prompt: `You are an expert biblical linguist and translator. Your task is to compare the translation of a given word across various Bible versions.

You will be provided with:
- The word: {{word}}
- Its source language: {{language}}
- A list of Bible versions to compare: {{versions}}

Simulate fetching the translations of this word in each specified version. For each version, provide:
1.  The translated word in that version.
2.  The original Greek/Hebrew word used in that version (if identifiable).
3.  The transliteration of that original word.
4.  Any relevant contextual notes or nuances about that specific translation.

After presenting the details for each version, provide a comprehensive summary that highlights the key similarities, differences, and potential theological implications of the various translations.

Format your response as a JSON object adhering strictly to the CompareTranslationsOutputSchema. Include a simulated bibliography of sources typically used for such analysis (e.g., academic commentaries, lexicons, Bible version websites).`,
});
