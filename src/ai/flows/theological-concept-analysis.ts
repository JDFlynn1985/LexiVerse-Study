'use server';
/**
 * @fileOverview AI Theological Concept Mapper.
 * Enhanced with influence scoring for density map visualization.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TheologicalConceptInputSchema = z.object({
  concept: z.string().describe('The theological concept to analyze (e.g., "Justification").'),
});

export type TheologicalConceptInput = z.infer<typeof TheologicalConceptInputSchema>;

const KeyVerseSchema = z.object({
  reference: z.string(),
  significance: z.string(),
});

const TheologicalConceptOutputSchema = z.object({
  concept: z.string(),
  etymology: z.string(),
  definition: z.string(),
  historicalDevelopment: z.array(z.object({
    period: z.string(),
    keyDevelopment: z.string(),
    notableFigures: z.array(z.string()),
    influenceScore: z.number().describe('A score from 0-100 representing the theological weight or influence of this period.')
  })),
  keyVerses: z.array(KeyVerseSchema),
  academicSynthesis: z.string(),
  bibliography: z.string(),
});

export type TheologicalConceptOutput = z.infer<typeof TheologicalConceptOutputSchema>;

const theologicalConceptPrompt = ai.definePrompt({
  name: 'theologicalConceptPrompt',
  input: { schema: TheologicalConceptInputSchema },
  output: { schema: TheologicalConceptOutputSchema },
  prompt: `You are a Systematic Theologian. Analyze: {{concept}}.
  For each historical period, assign an influenceScore (0-100) representing how much this era shaped the modern understanding of the concept.
  Format your response strictly as JSON adhering to TheologicalConceptOutputSchema.`,
});

export async function analyzeTheologicalConcept(input: TheologicalConceptInput): Promise<TheologicalConceptOutput> {
  const { output } = await theologicalConceptPrompt(input);
  return output!;
}
