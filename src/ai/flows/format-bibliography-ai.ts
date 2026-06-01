'use server';
/**
 * @fileOverview AI Bibliography Formatter for scholarly and academic research.
 * Converts raw citations into specific academic styles like SBL, Turabian, APA, and MLA.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FormatBibliographyInputSchema = z.object({
  items: z.array(z.string()).describe('The list of raw citations or source descriptions to format.'),
  style: z.enum(['SBL', 'Turabian', 'Chicago', 'APA', 'MLA']).default('SBL').describe('The desired bibliography style.'),
});

export type FormatBibliographyInput = z.infer<typeof FormatBibliographyInputSchema>;

const FormatBibliographyOutputSchema = z.object({
  formattedBibliography: z.string().describe('The complete, professionally formatted bibliography string.'),
  styleApplied: z.string(),
  formattingNotes: z.array(z.string()).describe('Specific notes about the formatting applied for the chosen style.'),
});

export type FormatBibliographyOutput = z.infer<typeof FormatBibliographyOutputSchema>;

const formatBibliographyPrompt = ai.definePrompt({
  name: 'formatBibliographyPrompt',
  input: {
    schema: FormatBibliographyInputSchema,
  },
  output: {
    schema: FormatBibliographyOutputSchema,
  },
  prompt: `You are an expert academic librarian and bibliography specialist. 
Your task is to take a list of raw citations and format them perfectly according to the requested style.

Style: {{style}}
Raw Items:
---
{{#each items}}
- {{{this}}}
{{/each}}
---

Requirements:
1. Apply the strict rules of the {{style}} style (e.g., SBL 2nd Edition for Biblical Studies, Turabian 9th, etc.).
2. Ensure proper alphabetization by author last name.
3. Handle original language titles (Greek/Hebrew) correctly if present.
4. If a raw item is missing information (like a publisher or year), use the most academically appropriate placeholder (e.g., "n.p." or "n.d.") or infer it if obvious from the context.
5. Provide a list of any specific formatting nuances you applied for this style.

Format your response strictly as JSON adhering to the FormatBibliographyOutputSchema.`,
});

const formatBibliographyFlow = ai.defineFlow(
  {
    name: 'formatBibliographyFlow',
    inputSchema: FormatBibliographyInputSchema,
    outputSchema: FormatBibliographyOutputSchema,
  },
  async input => {
    const { output } = await formatBibliographyPrompt(input);
    return output!;
  }
);

/**
 * Formats a list of citations into a specific academic style.
 */
export async function formatBibliography(input: FormatBibliographyInput): Promise<FormatBibliographyOutput> {
  return formatBibliographyFlow(input);
}
