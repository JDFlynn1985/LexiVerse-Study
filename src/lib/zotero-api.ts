
/**
 * LexiVerse Explorer
 * Copyright (c) 2024. Licensed under CC BY-NC-SA 4.0.
 * 
 * @fileOverview Zotero Web API Connector for bidirectional scholarly synchronization.
 */

const BASE_URL = 'https://api.zotero.org';

export interface ZoteroCollection {
  key: string;
  name: string;
  parentCollection: string | boolean;
}

export interface ZoteroItem {
  key: string;
  version: number;
  data: {
    itemType: string;
    title: string;
    creators: any[];
    abstractNote: string;
    publication: string;
    date: string;
    url: string;
    tags: any[];
    collections: string[];
    notes?: string;
  };
}

/**
 * Fetches the user's collections from Zotero.
 */
export async function fetchZoteroCollections(userId: string, apiKey: string): Promise<ZoteroCollection[]> {
  const url = `${BASE_URL}/users/${userId}/collections`;
  const res = await fetch(url, {
    headers: { 'Zotero-API-Key': apiKey }
  });
  if (!res.ok) throw new Error('Zotero fetch failed');
  const data = await res.json();
  return data.map((d: any) => ({
    key: d.key,
    name: d.data.name,
    parentCollection: d.data.parentCollection
  }));
}

/**
 * Fetches items from a specific collection or the whole library.
 */
export async function fetchZoteroItems(userId: string, apiKey: string, collectionKey?: string): Promise<ZoteroItem[]> {
  const url = collectionKey 
    ? `${BASE_URL}/users/${userId}/collections/${collectionKey}/items`
    : `${BASE_URL}/users/${userId}/items`;
    
  const res = await fetch(url, {
    headers: { 'Zotero-API-Key': apiKey }
  });
  if (!res.ok) throw new Error('Zotero items fetch failed');
  return await res.json();
}

/**
 * Creates a new research item in Zotero.
 */
export async function createZoteroItem(userId: string, apiKey: string, data: any, collectionKey?: string) {
  const url = `${BASE_URL}/users/${userId}/items`;
  
  const payload = [{
    itemType: 'journalArticle',
    title: `LexiVerse Research: ${data.originalWord || data.title}`,
    creators: [{ creatorType: 'author', firstName: 'LexiVerse', lastName: 'AI Engine' }],
    abstractNote: data.aiInsights || data.summary || '',
    publication: 'LexiVerse Explorer: Research Lab',
    date: new Date().toISOString(),
    url: 'https://lexiverse.app',
    tags: [{ tag: 'lexiverse-research' }, { tag: 'ai-synthesis' }],
    collections: collectionKey ? [collectionKey] : []
  }];

  const res = await fetch(url, {
    method: 'POST',
    headers: { 
      'Zotero-API-Key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to create Zotero item');
  }
  return res.json();
}
