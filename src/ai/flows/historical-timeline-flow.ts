'use server';
/**
 * @fileOverview AI Historical Context & Timeline Generator.
 * Constructs chronological timelines for biblical events, integrating archaeological and extra-biblical data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const HistoricalTimelineInputSchema = z.object({
  topic: z.string().describe('The biblical event, period, or figure to map (e.g., "The Babylonian Exile", "Life of Paul").'),
});

export type HistoricalTimelineInput = z.infer<typeof HistoricalTimelineInputSchema>;

const TimelineItemSchema = z.object({
  date: z.string().describe('The approximate or specific date/period.'),
  event: z.string().describe('The event or discovery.'),
  description: z.string().describe('Significance and details.'),
  sourceType: z.enum(['Biblical', 'Archaeological', 'Extra-Biblical']).describe('The primary source for this data.'),
});

const HistoricalTimelineOutputSchema = z.object({
  topic: z.string(),
  summary: z.string().describe('A high-level historical overview.'),
  timeline: z.array(TimelineItemSchema).describe('Chronological list of milestones.'),
  archaeologicalContext: z.string().describe('Details on relevant archaeological finds.'),
  scholarlyAnalysis: z.string().describe('Analysis of historical reliability and scholarly debate.'),
});

export type HistoricalTimelineOutput = z.infer<typeof HistoricalTimelineOutputSchema>;

const historicalTimelinePrompt = ai.definePrompt({
  name: 'historicalTimelinePrompt',
  input: {
    schema: HistoricalTimelineInputSchema,
  },
  output: {
    schema: HistoricalTimelineOutputSchema,
  },
  prompt: `You are an expert Biblical Archaeologist and Historian. 
Construct a detailed historical timeline and context report for: {{topic}}.

Requirements:
1. Include specific dates or date ranges (BCE/CE).
2. Distinguish between biblical narrative events and external archaeological verification.
3. Provide a summary of the cultural and political environment of the time.
4. Highlight major scholarly debates regarding chronology or historicity.
5. Ensure the data is academically sound for a seminary context.

Format strictly as JSON adhering to the HistoricalTimelineOutputSchema.`,
});

const historicalTimelineFlow = ai.defineFlow(
  {
    name: 'historicalTimelineFlow',
    inputSchema: HistoricalTimelineInputSchema,
    outputSchema: HistoricalTimelineOutputSchema,
  },
  async input => {
    const { output } = await historicalTimelinePrompt(input);
    return output!;
  }
);

/**
 * Generates a historical timeline and context report for a biblical topic.
 */
export async function generateHistoricalTimeline(input: HistoricalTimelineInput): Promise<HistoricalTimelineOutput> {
  return historicalTimelineFlow(input);
}
