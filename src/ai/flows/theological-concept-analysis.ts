'use server';
/**
 * @fileOverview AI Theological Concept Mapper.
 * Performs deep analysis of systemic theological terms, mapping historical developments and key scriptural foundations.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TheologicalConceptInputSchema = z.object({
  concept: z.string().describe('The theological concept to analyze (e.g., "Justification", "Atonement").'),
});

export type TheologicalConceptInput = z.infer<typeof TheologicalConceptInputSchema>;

const KeyVerseSchema = z.object({
  reference: z.string().describe('Bible verse reference.'),
  significance: z.string().describe('How this verse informs the concept.'),
});

const TheologicalConceptOutputSchema = z.object({
  concept: z.string(),
  etymology: z.string().describe('Linguistic origins of the term.'),
  definition: z.string().describe('A formal academic definition.'),
  historicalDevelopment: z.array(z.object({
    period: z.string(),
    keyDevelopment: z.string(),
    notableFigures: z.array(z.string()),
  })).describe('Timeline of how the concept evolved in Christian thought.'),
  keyVerses: z.array(KeyVerseSchema).describe('Crucial scriptural foundations.'),
  academicSynthesis: z.string().describe('A synthesized overview for seminary-level research.'),
  bibliography: z.string().describe('Academic sources for further reading.'),
});

export type TheologicalConceptOutput = z.infer<typeof TheologicalConceptOutputSchema>;

const theologicalConceptPrompt = ai.definePrompt({
  name: 'theologicalConceptPrompt',
  input: {
    schema: TheologicalConceptInputSchema,
  },
  output: {
    schema: TheologicalConceptOutputSchema,
  },
  prompt: `You are a Systematic Theologian and Church Historian. 
Analyze the following concept for a post-graduate seminary audience.

Concept: {{concept}}

Requirements:
1. Trace the etymological roots in Greek/Hebrew/Latin where applicable.
2. Provide a rigorous historical breakdown (Patristic, Medieval, Reformation, Modern).
3. Identify at least 3-5 primary scriptural anchors with concise significance.
4. Synthesize the major tensions and developments in the concept's history.
5. Provide a bibliography in SBL style.

Format strictly as JSON adhering to the TheologicalConceptOutputSchema.`,
});

const theologicalConceptFlow = ai.defineFlow(
  {
    name: 'theologicalConceptFlow',
    inputSchema: TheologicalConceptInputSchema,
    outputSchema: TheologicalConceptOutputSchema,
  },
  async input => {
    const { output } = await theologicalConceptPrompt(input);
    return output!;
  }
);

/**
 * Analyzes complex theological concepts and their historical development.
 */
export async function analyzeTheologicalConcept(input: TheologicalConceptInput): Promise<TheologicalConceptOutput> {
  return theologicalConceptFlow(input);
}
