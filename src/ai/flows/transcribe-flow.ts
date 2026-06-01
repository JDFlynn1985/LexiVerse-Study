'use server';
/**
 * @fileOverview AI Multimodal Transcription flow for voice research.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TranscriptionInputSchema = z.object({
  audioPart: z.string().describe("The audio data as a base64 encoded string."),
});

export type TranscriptionInput = z.infer<typeof TranscriptionInputSchema>;

const TranscriptionOutputSchema = z.object({
  transcript: z.string().describe("The transcribed text."),
  confidence: z.number().optional(),
});

export type TranscriptionOutput = z.infer<typeof TranscriptionOutputSchema>;

export async function transcribeAudio(input: TranscriptionInput): Promise<TranscriptionOutput> {
  return transcribeAudioFlow(input);
}

const transcribeAudioFlow = ai.defineFlow(
  {
    name: 'transcribeAudioFlow',
    inputSchema: TranscriptionInputSchema,
    outputSchema: TranscriptionOutputSchema,
  },
  async (input) => {
    const { text } = await ai.generate({
      prompt: [
        { media: { url: `data:audio/mp3;base64,${input.audioPart}` } },
        { text: "Act as a specialized biblical language transcriber. Convert the following audio into precise scholarly text. If Greek or Hebrew terms are used, preserve their original meaning in the transcription." }
      ],
    });
    
    return { transcript: text || "", confidence: 0.95 };
  }
);
