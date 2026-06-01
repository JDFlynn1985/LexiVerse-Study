'use server';
/**
 * @fileOverview AI Bibliography and Citation Formatter for scholarly research.
 * Converts raw citations into specific academic styles like SBL, Turabian, APA, and MLA,
 * supporting full bibliography entries, footnotes, and inline citations.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FormatBibliographyInputSchema = z.object({
  items: z.array(z.string()).describe('The list of raw citations or source descriptions to format.'),
  style: z.enum(['SBL', 'Turabian', 'Chicago', 'APA', 'MLA']).default('SBL').describe('The desired bibliography style.'),
  formatType: z.enum(['bibliography', 'footnote', 'inline']).default('bibliography').describe('The specific formatting type required.'),
});

export type FormatBibliographyInput = z.infer<typeof FormatBibliographyInputSchema>;

const FormatBibliographyOutputSchema = z.object({
  formattedOutput: z.string().describe('The complete, professionally formatted output string.'),
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
  prompt: `You are an expert academic librarian and bibliography specialist for a theological seminary. 
Your task is to take source information and format it perfectly according to the requested style and format type for a seminary student's paper.

Style: {{style}}
Format Type: {{formatType}} (Note: bibliography is full entry, footnote is for bottom of page, inline is parenthetical)
Raw Items:
---
{{#each items}}
- {{{this}}}
{{/each}}
---

Requirements:
1. Apply the strict rules of the {{style}} style (e.g., SBL 2nd Edition, Turabian 9th).
2. If Format Type is 'footnote', use the specific note format for that style.
3. If Format Type is 'inline', use the parenthetical format.
4. If Format Type is 'bibliography', ensure proper alphabetization and full publication details.
5. Provide helpful formatting notes to guide the seminary student in applying these citations correctly in their work.

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
 * Formats citations into specific academic styles and types (Bib, Footnote, Inline).
 */
export async function formatBibliography(input: FormatBibliographyInput): Promise<FormatBibliographyOutput> {
  return formatBibliographyFlow(input);
}
