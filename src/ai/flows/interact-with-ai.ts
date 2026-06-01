
'use server';
/**
 * @fileOverview This flow allows users to ask follow-up questions to the AI about a specific term or its analysis.
 *
 * - interactWithAI - A function that handles the interactive AI questioning process.
 * - InteractWithAIInput - The input type for the interactWithAI function.
 * - InteractWithAIOutput - The return type for the interactWithAI function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Mock Whisper.js integration
const whisperTranscribe = async (audioBlob: Blob): Promise<string> => {
  console.log('Mock Whisper.js: Transcribing audio...');
  // Simulate transcription
  return new Promise((resolve) => {
    setTimeout(() => {
      const transcription = "Can you elaborate on the theological implications of the root word?"; // Example transcription
      console.log(`Mock Whisper.js: Transcription complete - "${transcription}"`);
      resolve(transcription);
    }, 1500); // Simulate network delay
  });
};


// Define the input schema for the flow
const InteractWithAIInputSchema = z.object({
  term: z.string().describe('The term or concept the user is asking about.'),
  history: z.array(z.object({ role: z.enum(['user', 'model']), content: z.string() })).describe('The conversation history to maintain context.').optional(),
  question: z.string().describe('The follow-up question from the user.'),
  audioInput: z.instanceof(Blob).describe('Optional audio input for voice interaction.').optional(), // Added audioInput
});

export type InteractWithAIInput = z.infer<typeof InteractWithAIInputSchema>;

// Define the output schema for the flow
const InteractWithAIOutputSchema = z.object({
  response: z.string().describe('The AI s response to the user s question.'),
});

export type InteractWithAIOutput = z.infer<typeof InteractWithAIOutputSchema>;

/**
 * A Genkit flow that allows users to ask follow-up questions to the AI about a specific term or its analysis,
 * with support for voice input.
 */
const interactWithAIFlow = ai.defineFlow(
  {
    name: 'interactWithAIFlow',
    inputSchema: InteractWithAIInputSchema,
    outputSchema: InteractWithAIOutputSchema,
  },
  async input => {
    let userQuestion = input.question;

    // If audio input is provided, transcribe it first
    if (input.audioInput) {
      try {
        const transcription = await whisperTranscribe(input.audioInput);
        userQuestion = transcription; // Use the transcribed text as the user's question
      } catch (error) {
        console.error("Error transcribing audio:", error);
        // Optionally, inform the user about the transcription failure
        return { response: "I encountered an error processing your voice input. Please try again or type your question." };
      }
    }

    const messages = [];

    // Add previous conversation history if available
    if (input.history) {
      for (const turn of input.history) {
        messages.push({ role: turn.role, content: turn.content });
      }
    }

    // Add the current user question
    messages.push({ role: 'user', content: userQuestion });

    // Define the prompt for the AI model, including system instructions
    const systemPrompt = `You are a helpful assistant designed to provide in-depth information about biblical terms.
   You have access to extensive linguistic data, historical context, and commentary from various sources.
   When asked a question about a term, provide a comprehensive answer.
   If the user is asking a follow-up question, use the provided conversation history to maintain context and provide a relevant response.
   Always structure your responses academically, as if addressing a seminary student, and include a bibliography of all sources used.
   The current term of focus is: '${input.term}'.`;

    const response = await ai.chat({ // Using ai.chat for conversational interactions
      model: 'googleai/gemini-2.5-pro-001', // Using a more capable model for complex Q&A
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
    });

    // The response from ai.chat directly returns the content as a string
    return { response: response.text() };
  }
);

/**
 * Wrapper function to call the interactWithAIFlow.
 *
 * @param input The input parameters for the flow.
 * @returns The AI's response to the user's follow-up question.
 */
export async function interactWithAI(input: InteractWithAIInput): Promise<InteractWithAIOutput> {
  return interactWithAIFlow(input);
}
