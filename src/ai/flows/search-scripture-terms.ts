
'use server';
/**
 * @fileOverview A flow for searching scripture terms, integrating data from various sources.
 *
 * - searchScriptureTerm - A function that handles the scripture term search process.
 * - SearchScriptureTermInput - The input type for the searchScriptureTerm function.
 * - SearchScriptureTermOutput - The return type for the searchScriptureTerm function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SearchScriptureTermInputSchema = z.object({
  term: z.string().describe('The Greek, Hebrew, or Aramaic term to search for.'),
});
export type SearchScriptureTermInput = z.infer<typeof SearchScriptureTermInputSchema>;

const SearchScriptureTermOutputSchema = z.object({
  definition: z.string().describe('The definition of the term.'),
  lexicalData: z.string().describe('Lexical data associated with the term.'),
  transliteration: z.string().describe('The transliteration of the term.'),
  pronunciation: z.string().describe('The pronunciation of the term.'),
  rootData: z.object({
    rootTerm: z.string().describe('The root term.'),
    rootDefinition: z.string().describe('The definition of the root term.'),
    rootLexicalData: z.string().describe('Lexical data for the root term.'),
  }).optional(),
  scriptureReferences: z.array(z.string()).describe('References where the term is used in scripture.'),
});
export type SearchScriptureTermOutput = z.infer<typeof SearchScriptureTermOutputSchema>;

export async function searchScriptureTerm(input: SearchScriptureTermInput): Promise<SearchScriptureTermOutput> {
  return searchScriptureTermFlow(input);
}

export async function searchScriptureTermFlow(input: SearchScriptureTermInput): Promise<SearchScriptureTermOutput> {
  const {output} = await prompt(input);
  return output!;
}

const prompt = ai.definePrompt({
  name: 'searchScriptureTermPrompt',
  input: {
    schema: SearchScriptureTermInputSchema,
  },
  output: {
    schema: SearchScriptureTermOutputSchema,
  },
  prompt: `You are a biblical scholar specializing in ancient languages.

You will search for the provided term: '{{term}}'.

Your task is to provide the following information:
- Definition of the term.
- Lexical data associated with the term.
- Transliteration of the term.
- Pronunciation of the term.

Additionally, if possible, trace the word's roots and provide:
- The root term.
- The definition of the root term.
- Lexical data for the root term.

Finally, list all scripture references where the term is used.

Search for data from BlueLetterBible.com and the YouVersion API. Format your response according to the SearchScriptureTermOutputSchema.`,
});
