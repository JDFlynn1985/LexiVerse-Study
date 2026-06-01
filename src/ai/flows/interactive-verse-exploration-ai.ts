
'use server';
/**
 * @fileOverview This flow provides an interactive AI experience for exploring scripture verses and terms.
 *
 * - interactiveVerseExplorationAI - A function that orchestrates interactive AI questioning about scripture.
 * - InteractiveVerseExplorationAIInput - The input type for the interactiveVerseExplorationAI function.
 * - InteractiveVerseExplorationAIOutput - The return type for the interactiveVerseExplorationAI function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
// Assuming bibleGet and getVerseByReference are correctly imported and functional.
// import { bibleGet } from '@/lib/bible-get';
// import { getVerseByReference } from '@/lib/bible-api';

// Mock implementations for bibleGet and getVerseByReference for now.
// In a real application, these would fetch data from actual APIs or local storage.
const bibleGet = async (query: string) => {
  console.log(`Mock bibleGet called with query: ${query}`);
  // Simulate fetching verse data
  return {
    verses: [
      {
        book: 'Genesis',
        chapter: 1,
        verse: 1,
        text: 'In the beginning God created the heavens and the earth.',
        version: 'KJV',
      },
    ],
    crossReferences: ['John 1:1', 'Hebrews 1:10'],
  };
};

const getVerseByReference = async (reference: string) => {
  console.log(`Mock getVerseByReference called with reference: ${reference}`);
  // Simulate fetching a specific verse
  if (reference === 'Genesis 1:1') {
    return {
      book: 'Genesis',
      chapter: 1,
      verse: 1,
      text: 'In the beginning God created the heavens and the earth.',
      version: 'KJV',
    };
  }
  return null;
};

// Mock Whisper.js integration
const whisperTranscribe = async (audioBlob: Blob): Promise<string> => {
  console.log('Mock Whisper.js: Transcribing audio...');
  // Simulate transcription
  return new Promise((resolve) => {
    setTimeout(() => {
      const transcription = "What is the meaning of 'logos'?"; // Example transcription
      console.log(`Mock Whisper.js: Transcription complete - "${transcription}"`);
      resolve(transcription);
    }, 1500); // Simulate network delay
  });
};

// Define tool for searching verses and cross-references
const searchBibleVerseTool = ai.defineTool({
  name: 'searchBibleVerse',
  description: 'Searches for a Bible verse or passage and retrieves cross-references.',
  inputSchema: z.object({
    reference: z.string().describe('The Bible reference (e.g., "Genesis 1:1", "John 3:16").'),
  }),
  // Use the output schema from the actual bibleGet function if available, otherwise define a mock one.
  outputSchema: z.object({
    verses: z.array(z.object({
      book: z.string(),
      chapter: z.number(),
      verse: z.number(),
      text: z.string(),
      version: z.string(),
    })),
    crossReferences: z.array(z.string()),
  }),
  fn: async (input) => {
    // In a real implementation, this would call bibleGet or a similar function.
    const data = await bibleGet(input.reference);
    return data;
  },
});

// Define tool for fetching a specific verse by reference
const getVerseTool = ai.defineTool({
  name: 'getVerse',
  description: 'Fetches a specific Bible verse or passage by its reference.',
  inputSchema: z.object({
    reference: z.string().describe('The Bible reference (e.g., "Genesis 1:1").'),
  }),
  outputSchema: z.object({
    book: z.string(),
    chapter: z.number(),
    verse: z.number(),
    text: z.string(),
    version: z.string(),
  }).optional(), // Make output optional as reference might not be found
  fn: async (input) => {
    // In a real implementation, this would call getVerseByReference or a similar function.
    const verse = await getVerseByReference(input.reference);
    return verse ?? undefined; // Return undefined if not found
  },
});

// Define the input schema for the flow
const InteractiveVerseExplorationAIInputSchema = z.object({
  term: z.string().describe('The term or concept the user is asking about.'),
  history: z.array(z.object({ role: z.enum(['user', 'model']), content: z.string() })).describe('The conversation history to maintain context.').optional(),
  question: z.string().describe('The follow-up question from the user.'),
  audioInput: z.instanceof(Blob).describe('Optional audio input for voice interaction.').optional(), // Added audioInput
});

export type InteractiveVerseExplorationAIInput = z.infer<typeof InteractiveVerseExplorationAIInputSchema>;

// Define the output schema for the flow
const InteractiveVerseExplorationAIOutputSchema = z.object({
  response: z.string().describe('The AI s response to the user s question.'),
});

export type InteractiveVerseExplorationAIOutput = z.infer<typeof InteractiveVerseExplorationAIOutput>;

/**
 * Orchestrates interactive AI questioning about scripture, including voice input and verse exploration.
 */
const interactiveVerseExplorationAIFlow = ai.defineFlow(
  {
    name: 'interactiveVerseExplorationAIFlow',
    inputSchema: InteractiveVerseExplorationAIInputSchema,
    outputSchema: InteractiveVerseExplorationAIOutputSchema,
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

    // Define the prompt for the AI model, including system instructions and available tools
    const systemPrompt = `You are a helpful assistant designed to provide in-depth information about biblical terms and verses.
   You have access to extensive linguistic data, historical context, and commentary from various sources.
   You can also explore specific Bible verses and their cross-references.
   When asked a question, provide a comprehensive answer. Use the provided tools to fetch specific biblical data when relevant.
   If the user is asking a follow-up question, use the provided conversation history to maintain context and provide a relevant response.
   Always structure your responses academically, as if addressing a seminary student, and include a bibliography of all sources used.
   The current term of focus is: '${input.term}'.`;

    const response = await ai.chat({
      model: 'googleai/gemini-2.5-pro-001', // Using a capable model for complex Q&A and tool use
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      tools: [searchBibleVerseTool, getVerseTool], // Include the tools
      toolChoice: 'auto', // Let the model decide when to use tools
    });

    // The response from ai.chat can be text or a tool call. We need to handle both.
    // For simplicity here, we assume the model directly responds with text or a tool call
    // that we would then execute and feed back. For this example, we'll just return the text content.
    // A full implementation would involve a loop to execute tools and get responses.

    return { response: response.text() };
  }
);

/**
 * Wrapper function to call the interactiveVerseExplorationAIFlow.
 *
 * @param input The input parameters for the flow.
 * @returns The AI's response to the user's query.
 */
export async function interactiveVerseExplorationAI(input: InteractiveVerseExplorationAIInput): Promise<InteractiveVerseExplorationAIOutput> {
  return interactiveVerseExplorationAIFlow(input);
}
