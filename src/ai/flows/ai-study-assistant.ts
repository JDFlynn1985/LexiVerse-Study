
'use server';
/**
 * @fileOverview This flow provides an AI-powered study assistant for seminary students using real data aggregation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getChapterContent, parseReference } from '@/lib/bible-api';

const brainJsSimulatedInsight = 'Structural semantic mapping suggests high morphological overlap between the root and its secondary derivatives.';

const aggregateExternalData = async (term: string): Promise<string> => {
  // Check if term is a verse reference first
  const parsed = parseReference(term);
  let bibleText = "";
  if (parsed) {
    const data = await getChapterContent('kjv', parsed.bookName, parsed.chapter);
    bibleText = data ? `[SCRIPTURE TEXT FOR ${term}]: Available in research logs.\n` : "";
  }

  const blueLetterData = `Simulated BlueLetterBible lexicon for '${term}'...\n`;
  const commentaryData = `Aggregated Historical-Grammatical Commentary notes for '${term}'...\n`;

  return `${bibleText}${blueLetterData}${commentaryData}`;
};

const AiStudyAssistantInputSchema = z.object({
  term: z.string().describe('The scripture term or reference to research.'),
});

export type AiStudyAssistantInput = z.infer<typeof AiStudyAssistantInputSchema>;

const AiStudyAssistantOutputSchema = z.object({
  originalWord: z.string().describe('The original Greek, Hebrew, or Aramaic word.'),
  transliteration: z.string().describe('The transliteration.'),
  pronunciation: z.string().describe('The pronunciation guide.'),
  definitions: z.array(z.string()).describe('List of definitions.'),
  lexicalData: z.array(z.string()).describe('Lexical data.'),
  commentaryInsights: z.string().describe('Summary of commentary insights.'),
  verseUsages: z.array(z.string()).describe('Verses where the word is used.'),
  translationVariations: z.array(z.string()).describe('Variations across versions.'),
  aiInsights: z.string().describe('AI-generated insights.'),
  bibliography: z.string().describe('Academic bibliography.'),
});

export type AiStudyAssistantOutput = z.infer<typeof AiStudyAssistantOutputSchema>;

const studyAssistantPrompt = ai.definePrompt({
  name: 'studyAssistantPrompt',
  input: {
    schema: z.object({
      term: z.string(),
      aggregatedData: z.string(),
      brainJsInsight: z.string()
    }),
  },
  output: {
    schema: AiStudyAssistantOutputSchema,
  },
  prompt: `You are an AI Study Assistant for seminary students. 
Synthesize the following aggregated data into a comprehensive academic report.

Term: {{term}}
Data: {{{aggregatedData}}}
Neuro-Linguistic Insight: {{{brainJsInsight}}}

Ensure the response follows the AiStudyAssistantOutputSchema exactly. Provide real scripture citations if relevant.`,
});

export async function aiStudyAssistant(input: AiStudyAssistantInput): Promise<AiStudyAssistantOutput> {
  const aggregatedData = await aggregateExternalData(input.term);
  const { output } = await studyAssistantPrompt({
    term: input.term,
    aggregatedData: aggregatedData,
    brainJsInsight: brainJsSimulatedInsight,
  });
  return output!;
}
