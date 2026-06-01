'use server';
/**
 * @fileOverview AI Writing Assistant for scholarly and academic refinement.
 * Provides spell-checking, grammar correction, and academic tone adjustment.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const WritingAssistantInputSchema = z.object({
  text: z.string().describe('The text to be analyzed and improved.'),
  mode: z.enum(['academic', 'pastoral', 'concise']).default('academic').describe('The desired tone of the output.'),
});

export type WritingAssistantInput = z.infer<typeof WritingAssistantInputSchema>;

const WritingAssistantOutputSchema = z.object({
  originalText: z.string(),
  improvedText: z.string().describe('The refined version of the text.'),
  corrections: z.array(z.object({
    original: z.string(),
    replacement: z.string(),
    reason: z.string(),
  })).describe('Specific grammar or spelling corrections made.'),
  suggestions: z.array(z.string()).describe('Stylistic or academic suggestions for further improvement.'),
});

export type WritingAssistantOutput = z.infer<typeof WritingAssistantOutputSchema>;

const writingAssistantPrompt = ai.definePrompt({
  name: 'writingAssistantPrompt',
  input: {
    schema: WritingAssistantInputSchema,
  },
  output: {
    schema: WritingAssistantOutputSchema,
  },
  prompt: `You are an expert academic editor specializing in biblical studies and theology. 
Refine the following text for a seminary-level audience.

Tone: {{mode}}
Text:
---
{{{text}}}
---

Your goal is to:
1. Fix all spelling and grammar errors.
2. Enhance the vocabulary to be academically rigorous yet clear.
3. Ensure biblical terms are used correctly in context.
4. Provide a list of specific corrections and stylistic suggestions.

Format your response strictly as JSON adhering to the WritingAssistantOutputSchema.`,
});

const writingAssistantFlow = ai.defineFlow(
  {
    name: 'writingAssistantFlow',
    inputSchema: WritingAssistantInputSchema,
    outputSchema: WritingAssistantOutputSchema,
  },
  async input => {
    const { output } = await writingAssistantPrompt(input);
    return output!;
  }
);

/**
 * Refines text for academic quality, fixing grammar and spelling.
 */
export async function refineWriting(input: WritingAssistantInput): Promise<WritingAssistantOutput> {
  return writingAssistantFlow(input);
}
