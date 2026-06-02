/**
 * LexiVerse Explorer
 * Copyright (c) 2024. Licensed under CC BY-NC-SA 4.0.
 * 
 * @fileOverview IndexedDB wrapper for local scholarly document persistence.
 * 
 * Enables researchers to maintain a local network-isolated library of papers 
 * that can be used as RAG context without uploading data to the cloud.
 */

const DB_NAME = 'LexiVerseResearchDB';
const STORE_NAME = 'documents';
const DB_VERSION = 1;

export interface IDBDocument {
  id: string;
  name: string;
  type: string;
  content: string;
  uploadDate: string;
  synced: boolean;
}

/**
 * Initializes and opens the local IndexedDB instance.
 * @returns {Promise<IDBDatabase>}
 */
export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Saves a scholarly document to the local store.
 * @param {IDBDocument} doc - The document to persist.
 */
export async function saveLocalDocument(doc: IDBDocument): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(doc);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieves all locally stored research documents.
 * @returns {Promise<IDBDocument[]>}
 */
export async function getAllLocalDocuments(): Promise<IDBDocument[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Removes a document from the local research library.
 * @param {string} id - The document ID to delete.
 */
export async function deleteLocalDocument(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
