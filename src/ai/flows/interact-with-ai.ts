
'use server';
/**
 * @fileOverview This flow allows users to ask follow-up questions to the AI about a specific term or its analysis.
 * Supports custom model selection.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const whisperTranscribe = async (audioData: string): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const transcription = "Explain the eschatological significance of this root word."; 
      resolve(transcription);
    }, 1500);
  });
};

const InteractWithAIInputSchema = z.object({
  term: z.string().describe('The term or concept the user is asking about.'),
  history: z.array(z.object({ role: z.enum(['user', 'model']), content: z.string() })).describe('The conversation history to maintain context.').optional(),
  question: z.string().describe('The follow-up question from the user.'),
  audioBase64: z.string().describe('Optional base64 audio string for voice interaction simulation.').optional(),
  model: z.string().optional().default('googleai/gemini-2.5-flash').describe('The AI model to use for this interaction.'),
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

    if (input.audioBase64) {
      try {
        const transcription = await whisperTranscribe(input.audioBase64);
        userQuestion = transcription; 
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
      model: input.model as any, 
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
