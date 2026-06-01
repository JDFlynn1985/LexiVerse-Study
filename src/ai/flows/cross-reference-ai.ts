'use server';
/**
 * @fileOverview AI flow for identifying "Covert" cross-references (semantic links).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CovertReferenceInputSchema = z.object({
  text: z.string().describe('The scholarly text to analyze for semantic links.'),
});

const CovertReferenceOutputSchema = z.object({
  covertLinks: z.array(z.object({
    sourceFragment: z.string().describe('The part of the text that implies a link.'),
    suggestedScripture: z.string().describe('The scripture reference implied.'),
    theologicalBasis: z.string().describe('Why this link is semantically relevant.'),
  })),
});

export type CovertReferenceOutput = z.infer<typeof CovertReferenceOutputSchema>;

export async function findCovertLinks(text: string): Promise<CovertReferenceOutput> {
  return covertReferenceFlow({ text });
}

const covertReferenceFlow = ai.defineFlow(
  {
    name: 'covertReferenceFlow',
    inputSchema: CovertReferenceInputSchema,
    outputSchema: CovertReferenceOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      prompt: `Analyze the following scholarly text for "Covert" cross-references. 
      Look for theological echoes, allusions, or semantic alignments that refer to specific scriptures WITHOUT explicitly naming them.
      
      Text:
      ---
      {{{text}}}
      ---`,
      output: { schema: CovertReferenceOutputSchema }
    });
    return output!;
  }
);
