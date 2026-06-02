
'use server';
/**
 * @fileOverview AI Audio Exegesis Hub (TTS).
 * Converts scholarly research reports into high-fidelity audio using Gemini 2.5 Flash TTS.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';
import wav from 'wav';

const AudioExegesisInputSchema = z.object({
  text: z.string().describe('The research text to convert to speech.'),
  voice: z.enum(['Algenib', 'Achernar', 'Sirius']).default('Algenib'),
});

export type AudioExegesisInput = z.infer<typeof AudioExegesisInputSchema>;

const AudioExegesisOutputSchema = z.object({
  mediaUri: z.string().describe('Data URI of the generated WAV audio.'),
});

export type AudioExegesisOutput = z.infer<typeof AudioExegesisOutputSchema>;

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const audioFlow = ai.defineFlow(
  {
    name: 'audioExegesisFlow',
    inputSchema: AudioExegesisInputSchema,
    outputSchema: AudioExegesisOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: input.voice },
          },
        },
      },
      prompt: `Act as a formal academic narrator. Read the following scholarly research report with clarity and appropriate emphasis: \n\n${input.text}`,
    });

    if (!media) throw new Error('TTS generation failed.');

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    const wavBase64 = await toWav(audioBuffer);

    return {
      mediaUri: `data:audio/wav;base64,${wavBase64}`,
    };
  }
);

/**
 * Generates an audio version of a research report.
 */
export async function generateAudioExegesis(input: AudioExegesisInput): Promise<AudioExegesisOutput> {
  return audioFlow(input);
}
