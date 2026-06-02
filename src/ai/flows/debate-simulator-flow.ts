
'use server';
/**
 * @fileOverview AI Theological Debate Simulator.
 * Orchestrates a scholarly dialogue between two historical figures on a specific topic.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DebateInputSchema = z.object({
  topic: z.string().describe('The theological topic or question to debate (e.g. "Free Will vs Predestination").'),
  figureA: z.string().describe('The first historical scholar (e.g. "Augustine").'),
  figureB: z.string().describe('The second historical scholar (e.g. "Pelagius").'),
});

export type DebateInput = z.infer<typeof DebateInputSchema>;

const DialogueTurnSchema = z.object({
  speaker: z.string(),
  content: z.string(),
  citation: z.string().describe('A likely primary source citation from the figure\'s actual works.'),
});

const DebateOutputSchema = z.object({
  title: z.string(),
  openingContext: z.string().describe('Historical setting and significance of the debate.'),
  dialogue: z.array(DialogueTurnSchema),
  scholarlySynthesis: z.string().describe('Analysis of the divergence and agreement between the two views.'),
  bibliography: z.array(z.string()),
});

export type DebateOutput = z.infer<typeof DebateOutputSchema>;

const debatePrompt = ai.definePrompt({
  name: 'debatePrompt',
  input: { schema: DebateInputSchema },
  output: { schema: DebateOutputSchema },
  prompt: `You are an expert Historical Theologian.
  Simulate a rigorous, respectful, and academically sound dialogue between {{figureA}} and {{figureB}} regarding the topic: "{{topic}}".
  
  Requirements:
  1. Each figure must speak in their characteristic scholarly style and theological tradition.
  2. Figures must address each other's points directly.
  3. Include bracketed citations for their claims (e.g., [City of God, XI.13]).
  4. Provide a closing academic synthesis that explains the impact of this debate on Christian thought.
  
  Format strictly as JSON adhering to DebateOutputSchema.`,
});

const debateFlow = ai.defineFlow(
  {
    name: 'debateFlow',
    inputSchema: DebateInputSchema,
    outputSchema: DebateOutputSchema,
  },
  async input => {
    const { output } = await debatePrompt(input);
    if (!output) throw new Error('Scholarly Dialogue engine failed.');
    return output;
  }
);

/**
 * Runs a simulated scholarly dialogue between two historical figures.
 */
export async function runScholarlyDebate(input: DebateInput): Promise<DebateOutput> {
  return debateFlow(input);
}
