'use server';
/**
 * @fileOverview This flow defines and analyzes Greek or Hebrew terms based on Strong's numbers.
 * Enhanced for universal provider support and secure key routing.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DefineAndAnalyzeTermInputSchema = z.object({
  strongsNumber: z.string().describe("The Strong's number (e.g., 'G3056')."),
  model: z.string().optional().describe('The AI model identifier.'),
  apiKey: z.string().optional().describe('Optional user-provided API key.'),
});
export type DefineAndAnalyzeTermInput = z.infer<typeof DefineAndAnalyzeTermInputSchema>;

const RootInfoSchema = z.object({
  root: z.string(),
  definition: z.string(),
  lexicalData: z.string().optional(),
});

const CommentaryInsightSchema = z.object({
  commentator: z.string(),
  insight: z.string(),
  relevantVerse: z.string().optional(),
});

const VerseOccurrenceSchema = z.object({
  reference: z.string(),
  text: z.string(),
  contextualMeaning: z.string(),
  link: z.string(),
});

const DefineAndAnalyzeTermOutputSchema = z.object({
  searchStrongNumber: z.string(),
  originalWord: z.string(),
  transliteration: z.string(),
  pronunciation: z.string(),
  partOfSpeech: z.string(),
  classification: z.array(z.string()),
  definition: z.string(),
  lexicalData: z.string().optional(),
  historicalConnotations: z.string(),
  roots: z.array(RootInfoSchema).optional(),
  commentaryInsights: z.array(CommentaryInsightSchema),
  verseOccurrences: z.array(VerseOccurrenceSchema),
  summary: z.string(),
  bibliography: z.string(),
});
export type DefineAndAnalyzeTermOutput = z.infer<typeof DefineAndAnalyzeTermOutputSchema>;

export async function defineAndAnalyzeTerm(input: DefineAndAnalyzeTermInput): Promise<DefineAndAnalyzeTermOutput> {
  const selectedModel = input.model || 'googleai/gemini-2.5-flash';

  if (input.apiKey) {
    const provider = selectedModel.split('/')[0];
    if (provider === 'googleai') process.env.GEMINI_API_KEY = input.apiKey;
    else if (provider === 'openai') process.env.OPENAI_API_KEY = input.apiKey;
    else if (provider === 'anthropic') process.env.ANTHROPIC_API_KEY = input.apiKey;
    else if (provider === 'mistral') process.env.MISTRAL_API_KEY = input.apiKey;
    else if (provider === 'deepseek') process.env.DEEPSEEK_API_KEY = input.apiKey;
    else if (provider === 'xai') process.env.XAI_API_KEY = input.apiKey;
  }

  const { output } = await ai.generate({
    model: selectedModel,
    prompt: `You are an expert biblical scholar. Analyze the Strong's number: ${input.strongsNumber}.
    Tailor your response for a post-graduate seminary student. 
    Ensure original characters (Greek/Hebrew) are returned in originalWord.
    Format your response strictly as JSON adhering to DefineAndAnalyzeTermOutputSchema.`,
    output: {
      schema: DefineAndAnalyzeTermOutputSchema,
    }
  });

  if (!output) throw new Error('Lexicon engine failure.');
  return output;
}
