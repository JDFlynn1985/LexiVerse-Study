
'use server';
/**
 * @fileOverview AI Archaeological Site Analysis Flow.
 * Specifically handles deep historical and archaeological data for biblical locations.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ArchaeologyInputSchema = z.object({
  query: z.string().describe('The archaeological site or artifact to analyze.'),
  context: z.array(z.string()).optional().describe('RAG context excerpts.'),
});

export type ArchaeologyInput = z.infer<typeof ArchaeologyInputSchema>;

const ArchaeologyOutputSchema = z.object({
  summary: z.string().describe('A scholarly archaeological overview.'),
  findings: z.array(z.string()).describe('List of critical discoveries.'),
  context: z.string().describe('Linguistic or cultural nuances of the site.'),
  references: z.array(z.string()).describe('Cataloged sources and bibliography.'),
});

export type ArchaeologyOutput = z.infer<typeof ArchaeologyOutputSchema>;

const archaeologyPrompt = ai.definePrompt({
  name: 'archaeologyPrompt',
  input: { schema: ArchaeologyInputSchema },
  output: { schema: ArchaeologyOutputSchema },
  prompt: `You are an expert Biblical Archaeologist and Field Director. 
  Perform a deep site analysis for: {{query}}
  
  {{#if context}}
  Additional Research Context:
  ---
  {{#each context}}
  - {{{this}}}
  {{/each}}
  ---
  {{/if}}
  
  Address the user as a senior seminary researcher. Focus on excavation history, significant artifacts, and how the site informs our understanding of the biblical narrative.
  Format your response strictly as JSON adhering to ArchaeologyOutputSchema.`,
});

const archaeologyFlow = ai.defineFlow(
  {
    name: 'archaeologyFlow',
    inputSchema: ArchaeologyInputSchema,
    outputSchema: ArchaeologyOutputSchema,
  },
  async input => {
    const { output } = await archaeologyPrompt(input);
    if (!output) throw new Error('Archaeology engine failed.');
    return output;
  }
);

export async function runArchaeologyAnalysis(input: ArchaeologyInput): Promise<ArchaeologyOutput> {
  return archaeologyFlow(input);
}
