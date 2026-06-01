
'use server';
/**
 * @fileOverview This flow provides an interactive AI experience for exploring scripture verses and terms using real data from bible.helloao.org.
 *
 * - interactiveVerseExplorationAI - A function that orchestrates interactive AI questioning about scripture.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getChapterContent, parseReference } from '@/lib/bible-api';

// Define tool for searching verses
const searchBibleVerseTool = ai.defineTool({
  name: 'searchBibleVerse',
  description: 'Searches for a Bible verse or passage and retrieves the full text using the Free Use Bible API.',
  inputSchema: z.object({
    reference: z.string().describe('The Bible reference (e.g., "Genesis 1:1", "John 3:16").'),
    version: z.string().default('kjv').describe('The Bible version code (e.g., "kjv", "net").'),
  }),
  outputSchema: z.object({
    text: z.string(),
    reference: z.string(),
    found: z.boolean(),
  }),
  fn: async (input) => {
    const parsed = parseReference(input.reference);
    if (!parsed) return { text: "Invalid reference format.", reference: input.reference, found: false };

    const data = await getChapterContent(input.version, parsed.bookName, parsed.chapter);
    if (!data) return { text: "Passage not found.", reference: input.reference, found: false };

    // Find the specific verse text if provided
    let verseText = "";
    if (parsed.verse) {
      // The API content is a tree of blocks. We flatten it for the LLM.
      const findVerse = (nodes: any[]): string => {
        for (const node of nodes) {
          if (node.type === 'verse' && node.number === parsed.verse) {
            return node.content.map((c: any) => c.text).join(' ');
          }
          if (node.content && Array.isArray(node.content)) {
            const found = findVerse(node.content);
            if (found) return found;
          }
        }
        return "";
      };
      verseText = findVerse(data.chapter as any);
    } else {
      // Return full chapter if no verse specified
      const extractText = (nodes: any[]): string => {
        return nodes.map(node => {
          if (node.text) return node.text;
          if (node.content && Array.isArray(node.content)) return extractText(node.content);
          return "";
        }).join(' ');
      };
      verseText = extractText(data.chapter as any);
    }

    return {
      text: verseText || "Text content could not be extracted.",
      reference: input.reference,
      found: !!verseText,
    };
  },
});

const InteractiveVerseExplorationAIInputSchema = z.object({
  term: z.string().describe('The term or concept the user is asking about.'),
  history: z.array(z.object({ role: z.enum(['user', 'model']), content: z.string() })).describe('The conversation history.').optional(),
  question: z.string().describe('The follow-up question from the user.'),
});

const InteractiveVerseExplorationAIOutputSchema = z.object({
  response: z.string().describe('The AI response.'),
});

export type InteractiveVerseExplorationAIInput = z.infer<typeof InteractiveVerseExplorationAIInputSchema>;
export type InteractiveVerseExplorationAIOutput = z.infer<typeof InteractiveVerseExplorationAIOutputSchema>;

const interactiveVerseExplorationAIFlow = ai.defineFlow(
  {
    name: 'interactiveVerseExplorationAIFlow',
    inputSchema: InteractiveVerseExplorationAIInputSchema,
    outputSchema: InteractiveVerseExplorationAIOutputSchema,
  },
  async input => {
    const messages = [];

    if (input.history) {
      for (const turn of input.history) {
        messages.push({ role: turn.role, content: turn.content });
      }
    }

    messages.push({ role: 'user', content: input.question });

    const systemPrompt = `You are an expert biblical scholar. 
    You have access to a tool to fetch the actual text of Bible verses. 
    Use this tool whenever the user asks about a specific passage or reference.
    Always quote the scripture you are discussing.
    Structure your response academically for a seminary student.
    The current focus is: '${input.term}'.`;

    const response = await ai.chat({
      model: 'googleai/gemini-2.5-pro-001',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      tools: [searchBibleVerseTool],
    });

    return { response: response.text() };
  }
);

export async function interactiveVerseExplorationAI(input: InteractiveVerseExplorationAIInput): Promise<InteractiveVerseExplorationAIOutput> {
  return interactiveVerseExplorationAIFlow(input);
}
