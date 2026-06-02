'use server';
/**
 * @fileOverview AI Synoptic Gospel Aligner.
 * Maps narrative events across Matthew, Mark, Luke, and John.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SynopticInputSchema = z.object({
  event: z.string().describe('The biblical event to align (e.g. "The Transfiguration").'),
});

const SynopticOutputSchema = z.object({
  eventName: z.string(),
  alignments: z.array(z.object({
    gospel: z.enum(['Matthew', 'Mark', 'Luke', 'John']),
    reference: z.string(),
    keyNuance: z.string().describe('A unique detail or emphasis in this specific gospel account.'),
  })),
  theologicalSynthesis: z.string().describe('A synthesis of why the accounts differ or agree.'),
});

export type SynopticOutput = z.infer<typeof SynopticOutputSchema>;

export async function alignSynopticGospels(event: string): Promise<SynopticOutput> {
  const { output } = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt: `Act as a New Testament Scholar. Perform a synoptic alignment for: "${event}".
    Identify the specific references in each gospel and explain the synoptic emphasis.
    Format your response strictly as JSON adhering to SynopticOutputSchema.`,
    output: { schema: SynopticOutputSchema }
  });
  return output!;
}
