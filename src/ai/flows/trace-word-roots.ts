'use server';
/**
 * @fileOverview A flow for tracing word roots and their etymological data.
 *
 * - traceWordRoots - A function that traces the roots of a given word.
 * - TraceWordRootsInput - The input type for the traceWordRoots function.
 * - TraceWordRootsOutput - The return type for the traceWordRoots function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TraceWordRootsInputSchema = z.object({
  word: z.string().describe('The word to trace the roots of.'),
  language: z.enum(['greek', 'hebrew', 'aramaic']).describe('The language of the word.'),
});
export type TraceWordRootsInput = z.infer<typeof TraceWordRootsInputSchema>;

const RootDataSchema = z.object({
  root: z.string().describe('The root word.'),
  definition: z.string().describe('The definition of the root word.'),
  lexicalData: z.string().describe('Lexical data associated with the root word.'),
});

const TraceWordRootsOutputSchema = z.object({
  originalWord: z.string().describe('The original word provided by the user.'),
  language: z.enum(['greek', 'hebrew', 'aramaic']).describe('The language of the original word.'),
  roots: z.array(RootDataSchema).describe('An array of root words and their associated data.'),
});
export type TraceWordRootsOutput = z.infer<typeof TraceWordRootsOutputSchema>;

export async function traceWordRoots(input: TraceWordRootsInput): Promise<TraceWordRootsOutput> {
  return traceWordRootsFlow(input);
}

const traceWordRootsPrompt = ai.definePrompt({
  name: 'traceWordRootsPrompt',
  input: {
    schema: TraceWordRootsInputSchema,
  },
  output: {
    schema: TraceWordRootsOutputSchema,
  },
  prompt: `You are an expert etymologist specializing in biblical languages. Your task is to trace the roots of a given word and provide detailed information about each root.

Provide the original word, its language, and an array of its root words. For each root word, include its definition and lexical data.

Input Word: {{{word}}}
Language: {{language}}

Analyze the etymological roots and provide the following information for each root identified:
- Root Word
- Definition
- Lexical Data

Ensure the output is a JSON object matching the TraceWordRootsOutputSchema.`,
});

const traceWordRootsFlow = ai.defineFlow(
  {
    name: 'traceWordRootsFlow',
    inputSchema: TraceWordRootsInputSchema,
    outputSchema: TraceWordRootsOutputSchema,
  },
  async input => {
    const {output} = await traceWordRootsPrompt(input);
    return output!;
  }
);
