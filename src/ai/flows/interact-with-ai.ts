'use server';

/*
 * Title: LexiVerse
 * Copyright © 2026 Joshua Flynn <joshuaflynn040@gmail.com>
 * Source: https://github.com/JDFlynn1985/LexiVerse
 *
 * This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 
 * International License. To view a copy of this license, visit:
 * http://creativecommons.org
 */

/**
 * @fileOverview This flow allows users to ask follow-up questions to the AI about a specific term or its analysis.
 * Features real Multimodal Transcription integration using Gemini.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * Real Multimodal Transcription using Gemini.
 * @param audioBase64 The audio data as a base64 encoded string.
 * @param model The multimodal model to use.
 * @returns The transcribed scholarly query.
 */
const transcribeScholarlyAudio = async (audioBase64: string, model: string): Promise<string> => {
  const { text } = await ai.generate({
    model: model as any,
    prompt: [
      { media: { url: `data:audio/mp3;base64,${audioBase64}` } },
      { text: "Precisely transcribe this scholarly research query. If any Greek or Hebrew terms are used, preserve them accurately in the transcription. Return ONLY the transcribed text." }
    ]
  });
  return text || "Audio transcription failed.";
};

const InteractWithAIInputSchema = z.object({
  term: z.string().describe('The term or concept the user is asking about.'),
  history: z.array(z.object({ role: z.enum(['user', 'model']), content: z.string() })).describe('The conversation history to maintain context.').optional(),
  question: z.string().describe('The follow-up question from the user.'),
  audioBase64: z.string().describe('Optional base64 audio string for voice interaction.').optional(),
  model: z.string().optional().default('googleai/gemini-1.5-flash').describe('The AI model to use for this interaction.'),
});

export type InteractWithAIInput = z.infer<typeof InteractWithAIInputSchema>;

const InteractWithAIOutputSchema = z.object({
  response: z.string().describe('The AI response to the user question.'),
});

export type InteractWithAIOutput = z.infer<typeof InteractWithAIOutputSchema>;

const interactWithAIFlow = ai.defineFlow(
  {
    name: 'interactWithAIFlow',
    inputSchema: InteractWithAIInputSchema,
    outputSchema: InteractWithAIOutputSchema,
  },
  async input => {
    let userQuestion = input.question;

    // Perform real transcription if audio is provided
    if (input.audioBase64) {
      try {
        userQuestion = await transcribeScholarlyAudio(input.audioBase64, input.model || 'googleai/gemini-1.5-flash'); 
      } catch (error) {
        return { response: "I encountered an error processing your voice input. Please try again or type your question." };
      }
    }

    const messages = [];

    if (input.history) {
      for (const turn of input.history) {
        messages.push({ role: turn.role, content: turn.content });
      }
    }

    messages.push({ role: 'user', content: userQuestion });

    const systemPrompt = `You are a helpful assistant designed to provide in-depth information about biblical terms.
   You have access to extensive linguistic data, historical context, and commentary from various sources.
   When asked a question about a term, provide a comprehensive answer.
   Always structure your responses academically, as if addressing a seminary student, and include a bibliography of all sources used.
   The current term of focus is: '${input.term}'.`;

    const response = await ai.chat({ 
      model: (input.model || 'googleai/gemini-1.5-flash') as any, 
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
    });

    return { response: response.text };
  }
);

export async function interactWithAI(input: InteractWithAIInput): Promise<InteractWithAIOutput> {
  return interactWithAIFlow(input);
}