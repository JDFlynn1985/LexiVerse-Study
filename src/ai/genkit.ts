/*
 * Title: LexiVerse
 * Copyright © 2026 Joshua Flynn <joshuaflynn040@gmail.com>
 * Source: https://github.com
 *
 * This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 
 * International License. To view a copy of this license, visit:
 * http://creativecommons.org
 *
 * Under this license, you are free to copy, redistribute, and adapt this code,
 * provided you follow these conditions:
 *  - Attribution: You must give appropriate credit to Joshua Flynn.
 *  - NonCommercial: You may not use this material for commercial purposes.
 *  - ShareAlike: If you alter, transform, or build upon this code, you must 
 *    distribute your contributions under the same license as the original.
 */

/**
 * @fileOverview Central Genkit configuration and initialization for the LexiVerse AI Hub.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { ollama } from 'genkitx-ollama';

/**
 * The global Genkit instance.
 * 
 * Plugins:
 * - googleAI: Provides access to Gemini 1.5 and 2.5 series models.
 * - ollama: Provides a bridge to local LLMs via an Ollama server (default: localhost:11434).
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
