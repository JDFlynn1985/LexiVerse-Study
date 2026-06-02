
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { ollama } from 'genkitx-ollama';

/**
 * Genkit instance configured with Google AI and Ollama for local inference.
 * Supports multiple local models as specified in system settings.
 * The serverAddress can be configured via environment variables for local network deployments.
 */
export const ai = genkit({
  plugins: [
    googleAI(),
    ollama({
      models: [
        { name: 'llama3' },
        { name: 'llama3.1' },
        { name: 'llama3.2' },
        { name: 'mistral' },
        { name: 'gemma' },
        { name: 'gemma2' },
        { name: 'phi3' },
        { name: 'codellama' }
      ],
      serverAddress: process.env.OLLAMA_URL || 'http://localhost:11434',
    }),
  ],
  model: 'googleai/gemini-2.5-flash',
});
