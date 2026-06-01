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
  model: z.string().optional().describe('The AI model to use for analysis.'),
});
export type DefineAndAnalyzeTermInput = z.infer<typeof DefineAndAnalyzeTermInputSchema>;

const RootInfoSchema = z.object({
  root: z.string().describe('The root word or number.'),
  definition: z.string().describe('The definition of the root word.'),
  lexicalData: z.string().optional().describe('Lexical data associated with the root word.'),
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
  lexicalData: z.string().optional().describe('Lexical data associated with the term.'),
  roots: z.array(RootInfoSchema).optional().describe('Information about the root words, if available.'),
  commentaryInsights: z.array(CommentaryInsightSchema).describe('Detailed insights extracted from commentaries.'),
  scriptureReferences: z.array(z.string()).describe('References where the term is used in scripture.'),
  blueLetterBibleData: z.string().optional().describe('Data fetched from BlueLetterBible.com.'),
  summary: z.string().describe('A synthesized overview of historical and linguistic context from commentaries and word analysis.'),
  bibliography: z.string().describe('A formatted bibliography of all sources used.'),
});
export type DefineAndAnalyzeTermOutput = z.infer<typeof DefineAndAnalyzeTermOutputSchema>;

export async function defineAndAnalyzeTerm(input: DefineAndAnalyzeTermInput): Promise<DefineAndAnalyzeTermOutput> {
  // Use the requested model or fall back to the app default
  const selectedModel = input.model || 'googleai/gemini-2.5-flash';
  
  const { output } = await ai.generate({
    model: selectedModel,
    prompt: `You are an expert biblical scholar specializing in ancient languages (Greek, Hebrew, and Aramaic). Your task is to perform a comprehensive analysis of a given Strong's number.

Strong's Number: ${input.strongsNumber}

Simulate searching BlueLetterBible.com and tracing roots. Provide:
1. The original word, transliteration, and pronunciation.
2. The definition and lexical data.
3. Word roots and their meanings.
4. Historical and linguistic context from classic commentaries (JFB, Matthew Henry, Keil & Delitzsch, etc.).
5. A list of scripture references.
6. A summary synthesizing the data.
7. A properly formatted SBL bibliography.

Format your response strictly as JSON adhering to the DefineAndAnalyzeTermOutputSchema.`,
    output: {
      schema: DefineAndAnalyzeTermOutputSchema,
    }
  });

  if (!output) {
    throw new Error('AI failed to generate a valid scholarly analysis for this term.');
  }

  return output;
}
