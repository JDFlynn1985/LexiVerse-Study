
'use server';
/**
 * @fileOverview This flow defines and analyzes Greek or Hebrew terms based on Strong's numbers.
 * Enhanced to provide full verse text, contextual nuances, part of speech, and classifications (Person, Place, Event, Promise, Command).
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

const VerseOccurrenceSchema = z.object({
  reference: z.string().describe('The Bible reference (e.g., "John 3:16").'),
  text: z.string().describe('The full text of the verse.'),
  contextualMeaning: z.string().describe('Specific nuance or meaning of the term in this specific context.'),
  link: z.string().describe('An internal routing link parameter for Verse Explorer.'),
});

const DefineAndAnalyzeTermOutputSchema = z.object({
  searchStrongNumber: z.string().describe("The Strong's number that was searched for."),
  originalWord: z.string().describe('The original Greek, Hebrew, or Aramaic word in its proper alphabet.'),
  transliteration: z.string().describe('The transliteration of the original word.'),
  pronunciation: z.string().describe('The pronunciation guide for the original word.'),
  partOfSpeech: z.string().describe('The grammatical part of speech (e.g., Noun, Verb, Adjective).'),
  classification: z.array(z.enum(['Person', 'Place', 'Event', 'Promise', 'Command', 'Concept', 'Object', 'Action'])).describe('The classification of the term (is it a person, place, event, etc.).'),
  definition: z.string().describe('The primary dictionary-style definition of the term.'),
  lexicalData: z.string().optional().describe('Deep lexical data (morphology, usage) associated with the term.'),
  historicalConnotations: z.string().describe('Analysis of historical and cultural connotations of the term.'),
  roots: z.array(RootInfoSchema).optional().describe('Information about the root words, if available.'),
  commentaryInsights: z.array(CommentaryInsightSchema).describe('Detailed insights extracted from commentaries.'),
  verseOccurrences: z.array(VerseOccurrenceSchema).describe('List of verses where the word is used, including full text and contextual meanings.'),
  blueLetterBibleData: z.string().optional().describe('Data fetched from BlueLetterBible.com.'),
  summary: z.string().describe('A synthesized overview (AI Overview) of historical and linguistic context.'),
  bibliography: z.string().describe('A formatted SBL bibliography of all sources used.'),
});
export type DefineAndAnalyzeTermOutput = z.infer<typeof DefineAndAnalyzeTermOutputSchema>;

export async function defineAndAnalyzeTerm(input: DefineAndAnalyzeTermInput): Promise<DefineAndAnalyzeTermOutput> {
  // Check for API Configuration Readiness
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("AI engine is not configured. Please add a Gemini API Key in System Settings to enable Lexicon analysis.");
  }

  const selectedModel = input.model || 'googleai/gemini-2.5-flash';
  
  const { output } = await ai.generate({
    model: selectedModel,
    prompt: `You are an expert biblical scholar specializing in ancient languages. Perform a comprehensive analysis of the Strong's number: ${input.strongsNumber}.
Your analysis must be tailored for a seminary student, assuming a high level of linguistic interest and theological depth. 

Requirements:
1. Provide the original word IN ITS PROPER GREEK, HEBREW, OR ARAMAIC ALPHABET (e.g., λόγος or בְּרֵאשִׁית).
2. Provide a precise transliteration and a phonetic pronunciation guide.
3. Identify the PART OF SPEECH clearly (e.g., Noun, Verb, Adjective).
4. Classify the term: indicate if it primarily refers to a PERSON, PLACE, EVENT, PROMISE, or COMMAND. If multiple apply or it's a general concept, list them.
5. Provide a detailed dictionary entry and lexical breakdown using standard scholarly references.
6. Synthesize an "AI Overview" summary of the term's theological significance in a formal, academic tone.
7. Deeply explore the historical and cultural connotations (how it was understood in its original time).
8. Find MAJOR verses where this term is used. For each verse:
   - Provide the full text of the verse.
   - Provide the specific nuance of the term in that context.
   - Provide a simulated reference link for our "Verse Explorer".
9. Trace etymological roots with precision.
10. Provide insights from classical scholarly commentaries.
11. Format an SBL bibliography.

Speak as a mentor to a seminary student throughout the response. Format your response strictly as JSON adhering to the DefineAndAnalyzeTermOutputSchema.`,
    output: {
      schema: DefineAndAnalyzeTermOutputSchema,
    }
  });

  if (!output) {
    throw new Error('AI failed to generate a valid scholarly analysis for this term.');
  }

  return output;
}
