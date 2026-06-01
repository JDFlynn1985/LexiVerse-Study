'use server';
/**
 * @fileOverview AI Academic Integrity Assistant.
 * Scans text for potential uncredited scholarly phrasing and suggests proper citations.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AcademicIntegrityInputSchema = z.object({
  text: z.string().describe('The research text to analyze for uncredited sources.'),
  style: z.enum(['SBL', 'Turabian', 'Chicago', 'APA', 'MLA']).default('SBL').describe('The desired citation style.'),
  researchContext: z.array(z.string()).optional().describe('Context from the user\'s uploaded papers to check for self-plagiarism or internal consistency.'),
});

export type AcademicIntegrityInput = z.infer<typeof AcademicIntegrityInputSchema>;

const IntegrityFindingSchema = z.object({
  problematicText: z.string().describe('The specific fragment that appears uncredited or poorly paraphrased.'),
  potentialSource: z.string().describe('The likely scholarly source or type of source identified.'),
  citationSuggestion: z.string().describe('The properly formatted citation suggestion according to the requested style.'),
  explanation: z.string().describe('Reasoning for the flag (e.g., "Standard scholarly definition needing citation").'),
});

const AcademicIntegrityOutputSchema = z.object({
  analysisSummary: z.string().describe('A high-level summary of the text\'s academic integrity.'),
  findings: z.array(IntegrityFindingSchema).describe('List of specific fragments that require attribution.'),
  integrityScore: z.number().min(0).max(100).describe('An estimate of how well the text is currently cited (100 = excellent).'),
  improvementSteps: z.array(z.string()).describe('Actionable steps to improve the scholarly quality of the draft.'),
});

export type AcademicIntegrityOutput = z.infer<typeof AcademicIntegrityOutputSchema>;

const academicIntegrityPrompt = ai.definePrompt({
  name: 'academicIntegrityPrompt',
  input: {
    schema: AcademicIntegrityInputSchema,
  },
  output: {
    schema: AcademicIntegrityOutputSchema,
  },
  prompt: `You are an expert Academic Dean and integrity officer specializing in biblical and theological research.
Your task is to scan the provided text for "scholarly echo"—phrasing that is likely derived from standard commentaries, lexicons, or theological works but is not properly cited.
Address the user as a seminary student who is learning to navigate the complexities of academic attribution.

Style: {{style}}
Text to Analyze:
---
{{{text}}}
---

{{#if researchContext}}
User's Knowledge Base Context (for comparison):
---
{{#each researchContext}}
- {{{this}}}
{{/each}}
---
{{/if}}

Requirements:
1. Identify specific strings that are too close to common scholarly definitions or interpretations without attribution.
2. For each identified string, suggest the most likely source or source type (e.g., BDAG Lexicon, Calvin's Institutes, modern commentaries).
3. Provide a PERFECTLY formatted citation suggestion in {{style}} style for that source.
4. Calculate a "Integrity Score" (0-100).
5. Explain your findings in a way that helps the seminary student improve their scholarly voice while maintaining integrity.

Format your response strictly as JSON adhering to the AcademicIntegrityOutputSchema.`,
});

const academicIntegrityFlow = ai.defineFlow(
  {
    name: 'academicIntegrityFlow',
    inputSchema: AcademicIntegrityInputSchema,
    outputSchema: AcademicIntegrityOutputSchema,
  },
  async input => {
    const { output } = await academicIntegrityPrompt(input);
    return output!;
  }
);

/**
 * Scans research text for potential plagiarism or missing citations.
 */
export async function checkIntegrity(input: AcademicIntegrityInput): Promise<AcademicIntegrityOutput> {
  return academicIntegrityFlow(input);
}
