
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

export async function traceWordRootsFlow(input: TraceWordRootsInput): Promise<TraceWordRootsOutput> {
  const {output} = await traceWordRootsPrompt(input);
  return output!;
}

const traceWordRootsPrompt = ai.definePrompt({
  name: 'traceWordRootsPrompt',
  input: {
    schema: z.object({
      word: TraceWordRootsInputSchema.shape.word,
      language: TraceWordRootsInputSchema.shape.language,
    }),
  },
  output: {
    schema: TraceWordRootsOutputSchema,
  },
  prompt: `You are an expert etymologist specializing in biblical languages. Your task is to trace the roots of a given word and provide detailed information about each root.

Provide the original word, its language, and an array of its root words. For each root word, include its definition and lexical data.

If the word is {{word}} in {{language}}, find its etymological roots and provide the following information for each root:

Root Word: {{language.word}}
Definition: {{language.definition}}
Lexical Data: {{language.lexicalData}}

Ensure the output is a JSON object matching the TraceWordRootsOutputSchema.`,
});
