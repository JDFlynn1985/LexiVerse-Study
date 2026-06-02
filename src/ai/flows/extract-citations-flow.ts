'use server';
/**
 * @fileOverview AI Bibliographic Citation Scanner.
 * Identifies and structures raw citations from scholarly text.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractionInputSchema = z.object({
  text: z.string().describe('The block of research text containing potential citations.'),
});

export type ExtractionInput = z.infer<typeof ExtractionInputSchema>;

const CitationSchema = z.object({
  author: z.string().describe('Primary author or editor.'),
  title: z.string().describe('Title of the work.'),
  year: z.string().optional().describe('Year of publication.'),
  sourceType: z.enum(['Primary (Scripture)', 'Secondary (Commentary)', 'Journal', 'Book', 'Other']),
  sblFormat: z.string().describe('The SBL-formatted bibliographic entry.'),
});

const ExtractionOutputSchema = z.object({
  citations: z.array(CitationSchema).describe('List of structured citations identified in the text.'),
  summary: z.string().describe('A brief overview of the source diversity.'),
});

export type ExtractionOutput = z.infer<typeof ExtractionOutputSchema>;

const extractionPrompt = ai.definePrompt({
  name: 'extractionPrompt',
  input: { schema: ExtractionInputSchema },
  output: { schema: ExtractionOutputSchema },
  prompt: `You are an expert Academic Librarian. 
  Analyze the following research text and extract every unique scholarly citation.
  
  Text:
  ---
  {{{text}}}
  ---
  
  For each citation:
  1. Identify the author and title.
  2. Determine the source type.
  3. Generate a PERFECT SBL 2nd Edition bibliography entry.
  
  Format your response strictly as JSON adhering to ExtractionOutputSchema.`,
});

const extractionFlow = ai.defineFlow(
  {
    name: 'extractionFlow',
    inputSchema: ExtractionInputSchema,
    outputSchema: ExtractionOutputSchema,
  },
  async input => {
    const { output } = await extractionPrompt(input);
    if (!output) throw new Error('Extraction engine failed.');
    return output;
  }
);

export async function extractCitations(text: string): Promise<ExtractionOutput> {
  return extractionFlow({ text });
}
