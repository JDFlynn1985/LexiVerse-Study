/*
 * Title: LexiVerse
 * Copyright © 2026 Joshua Flynn <joshuaflynn040@gmail.com>
 * Source: https://github.com/JDFlynn1985/LexiVerse
 */

/**
 * @fileOverview Universal Genkit configuration for the LexiVerse AI Hub.
 * Supports Google, OpenAI, Anthropic, Mistral, Ollama, DeepSeek, and xAI.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { ollama } from 'genkitx-ollama';
import { openAI } from 'genkitx-openai';
import { anthropic } from 'genkitx-anthropic';
import { mistral } from 'genkitx-mistral';

/**
 * The global Genkit instance.
 * Configured with stable model identifiers for the scholarly workstation.
 */
export const ai = genkit({
  plugins: [
    googleAI(),
    openAI(),
    anthropic(),
    mistral(),
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
    openAI({
      name: 'deepseek',
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com'
    }),
    openAI({
      name: 'xai',
      apiKey: process.env.XAI_API_KEY,
      baseURL: 'https://api.x.ai/v1'
    })
  ],
  model: 'googleai/gemini-1.5-flash',
});