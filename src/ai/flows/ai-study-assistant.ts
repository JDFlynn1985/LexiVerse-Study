
'use server';
/**
 * @fileOverview This flow provides an AI-powered study assistant for seminary students.
 *
 * - aiStudyAssistant - A function that orchestrates scripture term analysis and generates comprehensive academic responses.
 * - AiStudyAssistantInput - The input type for the aiStudyAssistant function.
 * - AiStudyAssistantOutput - The return type for the aiStudyAssistant function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Placeholder for Brain.js integration - actual integration would involve loading models and performing calculations.
// For this example, we'll simulate its contribution by adding a placeholder insight.
const brainJsSimulatedInsight = 'Brain.js analysis suggests a deeper theological implication in the root structure of this term.';

// Placeholder for external data aggregation. In a real application, this would involve calling
// multiple Genkit flows or external APIs (BlueLetterBible, YouVersion, commentaries, node-sword-interface, etc.).
const aggregateExternalData = async (term: string): Promise<string> => {
  // Simulate fetching data from various sources
  const blueLetterData = `BlueLetterBible data for '${term}'...\n`;
  const youversionData = `YouVersion data for '${term}'...\n`;
  const commentaryData = `Commentary insights for '${term}'...\n`;
  const rootData = `Root word analysis for '${term}'...\n`;
  const crossReferences = `Cross-references for '${term}'...\n`;
  const translations = `Translations of '${term}' across versions...\n`;

  return `${blueLetterData}\n${youversionData}\n${commentaryData}\n${rootData}\n${crossReferences}\n${translations}`;
};

const AiStudyAssistantInputSchema = z.object({
  term: z.string().describe('The scripture term to research (e.g., a Greek or Hebrew word).'),
  // Add other relevant input fields as needed, e.g., specific Bible version, commentary preference, etc.
});

export type AiStudyAssistantInput = z.infer<typeof AiStudyAssistantInputSchema>;

const AiStudyAssistantOutputSchema = z.object({
  originalWord: z.string().describe('The original Greek, Hebrew, or Aramaic word.'),
  transliteration: z.string().describe('The transliteration of the original word.'),
  pronunciation: z.string().describe('The pronunciation guide for the original word.'),
  definitions: z.array(z.string()).describe('A list of definitions for the term.'),
  lexicalData: z.array(z.string()).describe('Lexical data associated with the term.'),
  rootAnalysis: z.object({
    rootWord: z.string().describe('The root word.'),
    rootDefinition: z.string().describe('The definition of the root word.'),
    rootLexicalData: z.array(z.string()).describe('Lexical data for the root word.'),
  }).optional().describe('Analysis of the word root, if available.'),
  commentaryInsights: z.string().describe('Summary of insights from commentaries.'),
  verseUsages: z.array(z.string()).describe('List of verses where the word is used.'),
  translationVariations: z.array(z.string()).describe('How the word is translated across different Bible versions.'),
  aiInsights: z.string().describe('AI-generated insights and analysis, including simulated Brain.js output.'),
  bibliography: z.string().describe('A formatted bibliography of all sources used.'),
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
  prompt: `You are an AI Study Assistant for seminary students, specializing in advanced biblical research. Your task is to analyze scripture terms by synthesizing information from various sources into a cohesive, academically structured response.

Original Term: {{term}}

Aggregated Data from External Sources:
---\n{{{aggregatedData}}}
---

Brain.js Simulated Insight:
---
{{{brainJsInsight}}}
---

Based on the provided term and all the aggregated data, generate a comprehensive report following the structure defined by the AiStudyAssistantOutputSchema. Ensure the response is academically rigorous, suitable for a seminary student. Pay close attention to:

1.  **Original Word, Transliteration, and Pronunciation:** Provide these at the beginning.
2.  **Definitions and Lexical Data:** Clearly present these for the main term.
3.  **Root Analysis:** Include detailed information about the root word if available.
4.  **Commentary and Contextual Insights:** Summarize historical and linguistic context.
5.  **Verse Usages and Translation Variations:** List where the word appears and how it's translated.
6.  **AI Insights:** Integrate the provided Brain.js insight with your own analysis, explaining its theological implications.
7.  **Bibliography:** Generate a properly formatted bibliography citing all sources used (simulated or actual) in a format suitable for academic papers.

Structure your response strictly according to the AiStudyAssistantOutputSchema fields. Do not invent data not supported by the aggregated information or the Brain.js insight, but synthesize and present it coherently.`,
});

export async function aiStudyAssistant(input: AiStudyAssistantInput): Promise<AiStudyAssistantOutput> {
  return aiStudyAssistantFlow(input);
}

export async function aiStudyAssistantFlow(input: AiStudyAssistantInput): Promise<AiStudyAssistantOutput> {
  const aggregatedData = await aggregateExternalData(input.term);
  const { output } = await studyAssistantPrompt({
    term: input.term,
    aggregatedData: aggregatedData,
    brainJsInsight: brainJsSimulatedInsight,
  });
  return output!;
}
