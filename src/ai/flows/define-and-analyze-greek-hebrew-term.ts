
'use server';
/**
 * @fileOverview This flow defines and analyzes Greek or Hebrew terms based on Strong's numbers.
 *
 * - defineAndAnalyzeTerm - A function that takes a Strong's number and retrieves detailed information about the term.
 * - DefineAndAnalyzeTermInput - The input type for the defineAndAnalyzeTerm function.
 * - DefineAndAnalyzeTermOutput - The return type for the defineAndAnalyzeTerm function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DefineAndAnalyzeTermInputSchema = z.object({
  strongsNumber: z.string().describe("The Strong's number for the Greek, Hebrew, or Aramaic term (e.g., 'G1234' or 'H5678')."),
});
export type DefineAndAnalyzeTermInput = z.infer<typeof DefineAndAnalyzeTermInputSchema>;

const RootInfoSchema = z.object({
  root: z.string().describe('The root word or number.'),
  definition: z.string().describe('The definition of the root word.'),
  lexicalData: z.string().describe('Lexical data associated with the root word.'),
});

const CommentaryInsightSchema = z.object({
  commentator: z.string().describe('Name of the commentator or commentary source.'),
  insight: z.string().describe('The extracted historical or linguistic insight.'),
  relevantVerse: z.string().optional().describe('The Bible verse reference the insight relates to.'),
});

const DefineAndAnalyzeTermOutputSchema = z.object({
  searchStrongNumber: z.string().describe("The Strong's number that was searched for."),
  originalWord: z.string().describe('The original Greek, Hebrew, or Aramaic word.'),
  transliteration: z.string().describe('The transliteration of the original word.'),
  pronunciation: z.string().describe('The pronunciation guide for the original word.'),
  definition: z.string().describe('The primary definition of the term.'),
  lexicalData: z.string().describe('Lexical data associated with the term.'),
  roots: z.array(RootInfoSchema).optional().describe('Information about the root words, if available.'),
  commentaryInsights: z.array(CommentaryInsightSchema).describe('Detailed insights extracted from commentaries.'),
  scriptureReferences: z.array(z.string()).describe('References where the term is used in scripture.'),
  blueLetterBibleData: z.string().describe('Data fetched from BlueLetterBible.com.'),
  summary: z.string().describe('A synthesized overview of historical and linguistic context from commentaries and word analysis.'),
  bibliography: z.string().describe('A formatted bibliography of all sources used.'),
});
export type DefineAndAnalyzeTermOutput = z.infer<typeof DefineAndAnalyzeTermOutputSchema>;

export async function defineAndAnalyzeTerm(input: DefineAndAnalyzeTermInput): Promise<DefineAndAnalyzeTermOutput> {
  return defineAndAnalyzeTermFlow(input);
}

export async function defineAndAnalyzeTermFlow(input: DefineAndAnalyzeTermInput): Promise<DefineAndAnalyzeTermOutput> {
  // In a real implementation, this would involve specific API calls or web scraping for BlueLetterBible and commentaries.
  // For this example, we rely on the prompt to simulate data retrieval and synthesis.
  const { output } = await defineAndAnalyzeTermPrompt(input);
  return output!;
}

const defineAndAnalyzeTermPrompt = ai.definePrompt({
  name: 'defineAndAnalyzeTermPrompt',
  input: {
    schema: z.object({
      strongsNumber: DefineAndAnalyzeTermInputSchema.shape.strongsNumber,
    }),
  },
  output: {
    schema: DefineAndAnalyzeTermOutputSchema,
  },
  prompt: `You are an expert biblical scholar specializing in ancient languages (Greek, Hebrew, and Aramaic). Your task is to perform a comprehensive analysis of a given Strong's number.

Strong's Number: {{strongsNumber}}

Simulate the following actions:

1.  **Search BlueLetterBible.com**: Retrieve the term, its definition, lexical data, transliteration, pronunciation, and scripture references.
2.  **Trace Word Roots**: Identify and retrieve the definition and lexical data for the word's roots (including Aramaic roots if applicable).
3.  **Search Online Commentaries**: Find historical and linguistic context for the word and its roots, extracting specific insights from commentators.

Synthesize all gathered information into a single, cohesive academic report. The report should include:
- The original word (Greek, Hebrew, or Aramaic).
- Its transliteration and pronunciation.
- Its definition and lexical data.
- Detailed information about its root(s), including definition and lexical data.
- Specific insights from commentaries, noting the commentator and relevant verses.
- A list of scripture references where the term is used.
- A section summarizing the data from BlueLetterBible.com.
- An overall summary synthesizing historical, linguistic, and contextual information.
- A formatted bibliography citing all simulated sources used (e.g., BlueLetterBible.com, specific commentaries like Jamieson, Fausset, Brown; Expositor's Greek Testament, etc.).

Format your response as a JSON object adhering strictly to the DefineAndAnalyzeTermOutputSchema. Ensure all fields are populated based on the simulated data gathering and analysis.`,
});
