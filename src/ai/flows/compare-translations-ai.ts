'use server';
/**
 * @fileOverview AI Grounded Translation Comparison Flow.
 * Analyzes word or passage differences across versions using real source text.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CompareTranslationsInputSchema = z.object({
  word: z.string().describe('The word or verse reference to compare.'),
  language: z.string().optional().describe('The source language (for word analysis).'),
  versions: z.array(z.string()).describe('A list of Bible versions to compare.'),
  groundedTexts: z.record(z.string()).optional().describe('Real text content for each version to ground the analysis.'),
});
export type CompareTranslationsInput = z.infer<typeof CompareTranslationsInputSchema>;

const TranslationDetailSchema = z.object({
  version: z.string().describe('The name of the Bible version.'),
  translation: z.string().describe('The rendered text in this version.'),
  originalWord: z.string().optional().describe('The original Greek/Hebrew word (if word analysis).'),
  transliteration: z.string().optional().describe('Transliteration.'),
  pronunciation: z.string().optional().describe('Pronunciation.'),
  notes: z.string().optional().describe('Linguistic or theological nuances about this specific rendering.'),
});

const CompareTranslationsOutputSchema = z.object({
  originalWord: z.string().describe('The input term or reconstructed original alphabet.'),
  language: z.string().describe('Reconstructed source language.'),
  versionsCompared: z.array(z.string()).describe('List of versions analyzed.'),
  translations: z.array(TranslationDetailSchema).describe('Details of each rendering.'),
  summary: z.string().describe('Deep scholarly synthesis of the translational differences and their theological impact.'),
  bibliography: z.string().optional().describe('Academic sources and version details.'),
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
  prompt: `You are an expert biblical scholar and translation auditor. 
Your task is to compare '{{word}}' across multiple versions. 

{{#if groundedTexts}}
[PRIMARY SOURCE CONTEXT]: 
Use these EXACT wordings as the basis for your analysis:
{{#each groundedTexts}}
- {{@key}}: {{{this}}}
{{/each}}
{{/if}}

Requirements:
1. If this is a word analysis, provide the word in its original GREEK or HEBREW alphabet.
2. If this is a passage comparison, focus on the theological shift caused by different word choices (e.g., Formal vs Functional equivalence).
3. Identify the translational philosophy of each version involved (e.g., KJV literalism vs NIV dynamic equivalence).
4. Address the user as a senior seminary student.

Format your response strictly as JSON adhering to CompareTranslationsOutputSchema.`,
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
 * Retrieves and compares word or passage translations across Bible versions.
 */
export async function compareTranslations(input: CompareTranslationsInput): Promise<CompareTranslationsOutput> {
  return compareTranslationsFlow(input);
}
