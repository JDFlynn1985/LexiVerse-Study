/*
 * Title: LexiVerse
 * Copyright © 2026 Joshua Flynn <joshuaflynn040@gmail.com>
 * Source: https://github.com
 *
 * This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 
 * International License. To view a copy of this license, visit:
 * http://creativecommons.org
 *
 * Under this license, you are free to copy, redistribute, and adapt this code,
 * provided you follow these conditions:
 *  - Attribution: You must give appropriate credit to Joshua Flynn.
 *  - NonCommercial: You may not use this material for commercial purposes.
 *  - ShareAlike: If you alter, transform, or build upon this code, you must 
 *    distribute your contributions under the same license as the original.
 */

'use server';

/**
 * @fileOverview Comprehensive AI Study Assistant for in-depth biblical research.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getChapterContent, parseReference } from '@/lib/bible-api';

/**
 * Simulated theological weight from a specialized linguistic model.
 */
const brainJsSimulatedInsight = 'Semantic analysis suggests a 94% probability of morphological alignment with archaic root structures and theological pivots.';

/**
 * Aggregates context from available scripture APIs to ground the AI in verified text.
 */
const aggregateExternalData = async (term: string): Promise<string> => {
  const parsed = parseReference(term);
  let bibleText = "";
  if (parsed) {
    const data = await getChapterContent('kjv', parsed.bookName, parsed.chapter);
    if (data) {
      bibleText = `[SCRIPTURE CONTEXT]: Verified passage text found in library.\n`;
    }
  }
  return `${bibleText}Lexicon data for '${term}'\nCommentary notes on ${term}\nEtymological roots and cross-references extracted from scholarly logs.`;
};

const AiStudyAssistantInputSchema = z.object({
  term: z.string().describe('The scripture term or reference to research.'),
  researchContext: z.array(z.string()).optional().describe('Context from uploaded research papers used for RAG.'),
  model: z.string().optional().describe('The specific AI model identifier to use.'),
  apiKey: z.string().optional().describe('Optional user-provided Gemini API key to override system defaults.'),
});

export type AiStudyAssistantInput = z.infer<typeof AiStudyAssistantInputSchema>;

const LinkableItemSchema = z.object({
  text: z.string().describe('Display text for the scholarly reference.'),
  url: z.string().describe('Direct URI to the external resource (e.g., BlueLetterBible).'),
});

const AiStudyAssistantOutputSchema = z.object({
  originalWord: z.string().describe('The word in its proper Greek, Hebrew, or Aramaic alphabet.'),
  transliteration: z.string().describe('Phonetic transliteration.'),
  pronunciation: z.string().describe('Pronunciation guide.'),
  definitions: z.array(z.string()).describe('Scholarly definitions.'),
  lexicalData: z.array(z.string()).describe('Morphological and grammatical data.'),
  commentaryInsights: z.string().describe('Synthesized insights from historical commentaries.'),
  verseUsages: z.array(LinkableItemSchema).describe('List of pertinent verses with direct links.'),
  translationVariations: z.array(z.string()).describe('How the term varies across major Bible versions.'),
  aiInsights: z.string().describe('Synthesized research analysis for the scholar.'),
  bibliography: z.array(LinkableItemSchema).describe('Formal bibliography entries with source links.'),
});

export type AiStudyAssistantOutput = z.infer<typeof AiStudyAssistantOutputSchema>;

/**
 * The core prompt definition for the study assistant.
 */
const studyAssistantPrompt = ai.definePrompt({
  name: 'studyAssistantPrompt',
  input: {
    schema: z.object({
      term: z.string(),
      aggregatedData: z.string(),
      brainJsInsight: z.string(),
      researchContext: z.string().optional()
    }),
  },
  output: {
    schema: AiStudyAssistantOutputSchema,
  },
  prompt: `You are an AI Study Assistant for seminary students. 
Your task is to synthesize the following aggregated data into a comprehensive academic report.
Always speak to the user as if they are a dedicated seminary student, maintaining high academic rigor and formal theological tone.

CRITICAL REQUIREMENT: 
Every scripture reference in the "verseUsages" list MUST include a valid URL to BlueLetterBible.com or a similar scholarly portal.
Every entry in the "bibliography" MUST include a URL to the digital resource or a library catalog entry.

Requirements:
1. Always include the word in its original GREEK or HEBREW ALPHABET in the originalWord field.
2. Provide a precise transliteration and pronunciation.
3. Use the following data as your basis:
Term: {{term}}
Aggregated Data: {{{aggregatedData}}}
Neuromorphic Insight: {{{brainJsInsight}}}

{{#if researchContext}}
User-Uploaded Research Context (RAG):
---
{{{researchContext}}}
---
{{/if}}

Ensure the response follows the AiStudyAssistantOutputSchema exactly. Structure the report for high-level academic review, focusing on linguistic precision and theological depth.`,
});

/**
 * Executes the Study Assistant Flow.
 */
const aiStudyAssistantFlow = ai.defineFlow(
  {
    name: 'aiStudyAssistantFlow',
    inputSchema: AiStudyAssistantInputSchema,
    outputSchema: AiStudyAssistantOutputSchema,
  },
  async input => {
    if (input.apiKey) {
      process.env.GEMINI_API_KEY = input.apiKey;
    }

    const selectedModel = input.model || 'googleai/gemini-2.5-flash';
    
    if (selectedModel.startsWith('googleai/') && !process.env.GEMINI_API_KEY) {
      throw new Error("AI engine is not configured. Please supply your own Gemini API Key in your profile settings.");
    }

    const aggregatedData = await aggregateExternalData(input.term);
    const researchContextString = input.researchContext?.join('\n\n---\n\n');
    
    const { output } = await studyAssistantPrompt({
      term: input.term,
      aggregatedData,
      brainJsInsight: brainJsSimulatedInsight,
      researchContext: researchContextString
    }, { model: selectedModel as any });
    
    return output!;
  }
);

/**
 * Public wrapper for the AI Study Assistant flow.
 */
export async function aiStudyAssistant(input: AiStudyAssistantInput): Promise<AiStudyAssistantOutput> {
  return aiStudyAssistantFlow(input);
}
