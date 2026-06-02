'use server';
/**
 * @fileOverview This flow defines and analyzes Greek or Hebrew terms based on Strong's numbers.
 * Enhanced with Structured Lexicon Fetching for 100% linguistic accuracy.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getStrongsData } from '@/lib/lexicon-api';

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
  isVerifiedSource: z.boolean().describe('True if the data was pulled from the structured lexicon registry.'),
});
export type DefineAndAnalyzeTermOutput = z.infer<typeof DefineAndAnalyzeTermOutputSchema>;

const fetchStrongsDataTool = ai.defineTool({
  name: 'fetchStrongsData',
  description: 'Fetches structured linguistic data for a Strongs number from the LexiVerse registry.',
  inputSchema: z.object({ number: z.string() }),
  outputSchema: z.any(),
  fn: async (input) => {
    return await getStrongsData(input.number);
  }
});

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
    tools: [fetchStrongsDataTool],
    prompt: `You are an expert biblical scholar. 
    Analyze the Strong's number: ${input.strongsNumber}.
    
    CRITICAL INSTRUCTION:
    Use the fetchStrongsData tool to get the EXACT linguistic data for this number. 
    Use the tool results as the primary source of truth for originalWord, transliteration, morphology, and definition.
    
    Tailor your response for a post-graduate seminary student. 
    Provide a deep scholarly summary of how this word functions theologicaly.
    
    Format your response strictly as JSON adhering to DefineAndAnalyzeTermOutputSchema.`,
    output: {
      schema: DefineAndAnalyzeTermOutputSchema,
    }
  });

  if (!output) throw new Error('Lexicon engine failure.');
  return output;
}
