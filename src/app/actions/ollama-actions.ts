
'use server';

/**
 * @fileOverview Server actions for interacting with local Ollama instances using the official ollama node package.
 */

import { Ollama } from 'ollama';

/**
 * Fetches the list of locally available models from an Ollama server.
 * @param serverUrl The address of the Ollama server (e.g., http://localhost:11434).
 */
export async function getLocalOllamaModels(serverUrl?: string) {
  const host = serverUrl || process.env.OLLAMA_URL || 'http://localhost:11434';
  const ollama = new Ollama({ host });

  try {
    const response = await ollama.list();
    // Return just the names for easy management in UI
    return { 
      models: response.models.map(m => m.name), 
      error: null 
    };
  } catch (error: any) {
    console.error("Ollama detection error:", error);
    return { 
      models: [], 
      error: error.message || "Could not connect to Ollama server. Ensure it is running and accessible." 
    };
  }
}

/**
 * Checks if the Ollama server is reachable.
 */
export async function pingOllama(serverUrl?: string) {
  const host = serverUrl || process.env.OLLAMA_URL || 'http://localhost:11434';
  const ollama = new Ollama({ host });

  try {
    // Just a simple list check to verify connection
    await ollama.list();
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
