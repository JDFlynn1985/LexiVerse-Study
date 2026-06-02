'use server';
/**
 * @fileOverview Boilerplate AI Flow Template.
 * 
 * Use this as a starting point for new research tools that require 
 * structured data synthesis from Gemini or local models.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * Define the structure of data sent to the AI.
 */
const BoilerplateInputSchema = z.object({
  query: z.string().describe('The primary research query or keyword.'),
  context: z.array(z.string()).optional().describe('Optional additional data (e.g. RAG content).'),
});

export type BoilerplateInput = z.infer<typeof BoilerplateInputSchema>;

/**
 * Define the structure of data returned by the AI.
 */
const BoilerplateOutputSchema = z.object({
  summary: z.string().describe('A high-level scholarly summary.'),
  keyPoints: z.array(z.string()).describe('List of critical findings.'),
  theologicalNuance: z.string().describe('Analysis of linguistic or theological depth.'),
  sources: z.array(z.string()).describe('Simulated or suggested bibliographic sources.'),
});

export type BoilerplateOutput = z.infer<typeof BoilerplateOutputSchema>;

/**
 * Define the Genkit prompt with Handlebars logic.
 */
const boilerplatePrompt = ai.definePrompt({
  name: 'boilerplatePrompt',
  input: { schema: BoilerplateInputSchema },
  output: { schema: BoilerplateOutputSchema },
  prompt: `You are an expert scholarly research assistant. 
  Analyze the following topic for a seminary-level audience: {{query}}
  
  {{#if context}}
  Additional Research Context:
  ---
  {{#each context}}
  - {{{this}}}
  {{/each}}
  ---
  {{/if}}
  
  Provide a formal, academically rigorous response in JSON format.`,
});

/**
 * Define the flow that executes the prompt.
 */
const boilerplateFlow = ai.defineFlow(
  {
    name: 'boilerplateFlow',
    inputSchema: BoilerplateInputSchema,
    outputSchema: BoilerplateOutputSchema,
  },
  async input => {
    const { output } = await boilerplatePrompt(input);
    if (!output) throw new Error('AI failed to generate a response.');
    return output;
  }
);

/**
 * Public wrapper function for use in Client Components.
 */
export async function runBoilerplateAnalysis(input: BoilerplateInput): Promise<BoilerplateOutput> {
  return boilerplateFlow(input);
}
