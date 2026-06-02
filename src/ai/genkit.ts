/**
 * LexiVerse Explorer
 * Copyright (c) 2026 Joshua Flynn (joshuaflynn040@gmail.com).
 * Licensed under CC BY-NC-SA 4.0.
 * 
 * @fileOverview Central Genkit configuration and initialization for the LexiVerse AI Hub.
 *
 * This module exports the global `ai` instance used for all generative tasks.
 * It is configured with a hybrid architecture supporting both Cloud (Google Gemini)
 * and Local (Ollama) inference models, enabling researchers to work in 
 * connected or network-isolated environments.
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
