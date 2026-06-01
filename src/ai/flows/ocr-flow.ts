'use server';
/**
 * @fileOverview AI OCR flow for extracting text from images.
 * Uses Gemini's multimodal capabilities to perform high-accuracy transcription.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const OCRInputSchema = z.object({
  imagePart: z.string().describe("The image as a data URI that must include a MIME type and use Base64 encoding."),
});

export type OCRInput = z.infer<typeof OCRInputSchema>;

const OCROutputSchema = z.object({
  text: z.string().describe("The complete text extracted from the image."),
});

export type OCROutput = z.infer<typeof OCROutputSchema>;

/**
 * Extracts text from an image using Gemini.
 */
export async function extractTextFromImage(input: OCRInput): Promise<OCROutput> {
  return extractTextFromImageFlow(input);
}

const extractTextFromImageFlow = ai.defineFlow(
  {
    name: 'extractTextFromImageFlow',
    inputSchema: OCRInputSchema,
    outputSchema: OCROutputSchema,
  },
  async (input) => {
    const { text } = await ai.generate({
      prompt: [
        { media: { url: input.imagePart } },
        { text: "Act as a specialized epigrapher and paleographer. Extract all text visible in this image accurately, preserving line breaks and formatting as much as possible. If the text is in an ancient language like Greek or Hebrew, transcribe it precisely." }
      ],
    });
    
    return { text: text || "" };
  }
);
