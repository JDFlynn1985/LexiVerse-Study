
'use server';
/**
 * @fileOverview AI Biblical Geography & Spatial Narrative Flow.
 * Analyzes the topographical and theological significance of biblical locations.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GeographyInputSchema = z.object({
  query: z.string().describe('The biblical location or region to analyze (e.g., "Sea of Galilee", "Mount Sinai").'),
  context: z.array(z.string()).optional().describe('Additional RAG context from research papers.'),
});

export type GeographyInput = z.infer<typeof GeographyInputSchema>;

const GeographyOutputSchema = z.object({
  location: z.string(),
  summary: z.string().describe('A scholarly topographical and historical overview.'),
  sites: z.array(z.object({
    name: z.string(),
    coordinates: z.string().describe('Approximate Latitude/Longitude or grid reference.'),
    significance: z.string().describe('Scriptural or historical importance.'),
  })).describe('Critical sites within the region.'),
  theologicalNuance: z.string().describe('Analysis of how the geography informs the theological narrative.'),
  sources: z.array(z.string()).describe('Cartographic and academic references.'),
});

export type GeographyOutput = z.infer<typeof GeographyOutputSchema>;

const geographyPrompt = ai.definePrompt({
  name: 'geographyPrompt',
  input: { schema: GeographyInputSchema },
  output: { schema: GeographyOutputSchema },
  prompt: `You are an expert Biblical Geographer and Historical Cartographer. 
  Perform a deep spatial analysis for: {{query}}
  
  {{#if context}}
  Scholarly Research Context:
  ---
  {{#each context}}
  - {{{this}}}
  {{/each}}
  ---
  {{/if}}
  
  Address the user as a senior seminary researcher. Focus on topographical features, modern archaeological identification, and how the terrain impacts the biblical events occurring there.
  Format your response strictly as JSON adhering to GeographyOutputSchema.`,
});

const geographyFlow = ai.defineFlow(
  {
    name: 'geographyFlow',
    inputSchema: GeographyInputSchema,
    outputSchema: GeographyOutputSchema,
  },
  async input => {
    const { output } = await geographyPrompt(input);
    if (!output) throw new Error('Geography engine failed to synthesize data.');
    return output;
  }
);

/**
 * Executes a geographical and topographical analysis of biblical regions.
 */
export async function runGeographyAnalysis(input: GeographyInput): Promise<GeographyOutput> {
  return geographyFlow(input);
}
