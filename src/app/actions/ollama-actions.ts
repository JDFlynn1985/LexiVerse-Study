
'use server';

/**
 * @fileOverview Server actions for interacting with local Ollama instances using the official ollama node package.
 * Restricted to administrative use via UI placement and role checks.
 */

import { Ollama } from 'ollama';

/**
 * Fetches the list of locally available models from an Ollama server.
 * @param serverUrl The address of the Ollama server.
 */
export async function getLocalOllamaModels(serverUrl?: string) {
  const host = serverUrl || process.env.OLLAMA_URL || 'http://localhost:11434';
  const ollama = new Ollama({ host });

  try {
    const response = await ollama.list();
    return { 
      models: response.models.map(m => m.name), 
      error: null 
    };
  } catch (error: any) {
    console.error("Ollama list error:", error);
    return { 
      models: [], 
      error: error.message || "Could not connect to Ollama server." 
    };
  }
}

/**
 * Pulls (installs) a new model from the Ollama library.
 * Note: This can take a long time depending on model size and connection.
 * @param modelName Name of the model to pull (e.g., 'llama3').
 * @param serverUrl The address of the Ollama server.
 */
export async function pullOllamaModel(modelName: string, serverUrl?: string) {
  const host = serverUrl || process.env.OLLAMA_URL || 'http://localhost:11434';
  const ollama = new Ollama({ host });

  try {
    // We use a non-streaming call for simplicity in this prototype.
    // Real-world usage might require streaming progress updates.
    await ollama.pull({ model: modelName });
    return { success: true, error: null };
  } catch (error: any) {
    console.error("Ollama pull error:", error);
    return { success: false, error: error.message || "Failed to pull model." };
  }
}

/**
 * Deletes a model from the local Ollama server.
 * @param modelName Name of the model to delete.
 * @param serverUrl The address of the Ollama server.
 */
export async function deleteOllamaModel(modelName: string, serverUrl?: string) {
  const host = serverUrl || process.env.OLLAMA_URL || 'http://localhost:11434';
  const ollama = new Ollama({ host });

  try {
    await ollama.delete({ model: modelName });
    return { success: true, error: null };
  } catch (error: any) {
    console.error("Ollama delete error:", error);
    return { success: false, error: error.message || "Failed to delete model." };
  }
}

/**
 * Checks if the Ollama server is reachable.
 */
export async function pingOllama(serverUrl?: string) {
  const host = serverUrl || process.env.OLLAMA_URL || 'http://localhost:11434';
  const ollama = new Ollama({ host });

  try {
    await ollama.list();
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
