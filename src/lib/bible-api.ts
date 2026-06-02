/**
 * LexiVerse Explorer
 * Copyright (c) 2024. Licensed under CC BY-NC-SA 4.0.
 * 
 * @fileOverview Client library for interacting with the bible.helloao.org (Free Use Bible API).
 * 
 * This module provides the core data fetching logic for scriptures, translations,
 * and book metadata. It serves as the primary grounding source for the AI Study
 * Assistant, ensuring that all synthesized insights are backed by verified 
 * scriptural text.
 */

/**
 * Represents a specific Bible translation available via the API.
 */
export interface BibleVersion {
  /** Unique ID for the translation (e.g., 'kjv', 'net'). */
  id: string;
  /** Full descriptive name of the translation. */
  name: string;
  /** Primary language of the translation (ISO format). */
  language: string;
  /** Short abbreviation for display purposes. */
  abbreviation: string;
}

/**
 * Represents the structure of a chapter response from the Bible API.
 */
export interface BibleChapter {
  /** The translation ID. */
  version: string;
  /** The full name of the biblical book. */
  bookName: string;
  /** The USFM 3-letter book code. */
  bookCode: string;
  /** The chapter number. */
  chapterNumber: number;
  /** Array of block-level nodes representing scripture text and metadata. */
  chapter: Array<any>;
}

/**
 * Internal mapping of full book names to their standard 3-letter USFM codes.
 * This is used to construct API requests to the Bible provider.
 */
const BOOK_CODES: Record<string, string> = {
  "Genesis": "GEN", "Exodus": "EXO", "Leviticus": "LEV", "Numbers": "NUM", "Deuteronomy": "DEU",
  "Joshua": "JOS", "Judges": "JDG", "Ruth": "RUT", "1 Samuel": "1SA", "2 Samuel": "2SA",
  "1 Kings": "1KI", "2 Kings": "2KI", "1 Chronicles": "1CH", "2 Chronicles": "2CH",
  "Ezra": "EZR", "Nehemiah": "NEH", "Esther": "EST", "Job": "JOB", "Psalms": "PSA",
  "Proverbs": "PRO", "Ecclesiastes": "ECC", "Song of Solomon": "SNG", "Isaiah": "ISA",
  "Jeremiah": "JER", "Lamentations": "LAM", "Ezekiel": "EZK", "Daniel": "DAN",
  "Hosea": "HOS", "Joel": "JOL", "Amos": "AMO", "Obadiah": "OBA", "Jonah": "JON",
  "Micah": "MIC", "Nahum": "NAM", "Habakkuk": "HAB", "Zephaniah": "ZEP", "Haggai": "HAG",
  "Zechariah": "ZEC", "Malachi": "MAL", "Matthew": "MAT", "Mark": "MRK", "Luke": "LUK",
  "John": "JHN", "Acts": "ACT", "Romans": "ROM", "1 Corinthians": "1CO", "2 Corinthians": "2CO",
  "Galatians": "GAL", "Ephesians": "EPH", "Philippians": "PHP", "Colossians": "COL",
  "1 Thessalonians": "1TH", "2 Thessalonians": "2TH", "1 Timothy": "1TI", "2 Timothy": "2TI",
  "Titus": "TIT", "Philemon": "PHM", "Hebrews": "HEB", "James": "JAS", "1 Peter": "1PE",
  "2 Peter": "2PE", "1 John": "1JN", "2 John": "2JN", "3 John": "3JN", "Jude": "JUD",
  "Revelation": "REV"
};

/**
 * Fetches the list of all available Bible translations from the remote provider.
 * 
 * @returns {Promise<BibleVersion[]>} A promise that resolves to an array of BibleVersion objects.
 */
export async function getVersions(): Promise<BibleVersion[]> {
  try {
    const res = await fetch('https://bible.helloao.org/api/available_versions.json');
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((v: any) => ({
      id: v.id,
      name: v.name,
      language: v.language,
      abbreviation: v.id.toUpperCase()
    }));
  } catch (e) {
    console.error("Failed to fetch Bible versions", e);
    return [];
  }
}

/**
 * Parses a natural language scripture reference string into its constituent parts.
 * Supported format: "BookName Chapter:Verse" or "BookName Chapter".
 * 
 * @param {string} reference - The raw reference string (e.g., "John 3:16").
 * @returns {object | null} Object containing bookName, chapter, and optional verse, or null if invalid.
 */
export function parseReference(reference: string) {
  const match = reference.match(/^(\d?\s?[a-zA-Z\s]+)\s(\d+)(?::(\d+))?$/);
  if (!match) return null;
  return {
    bookName: match[1].trim(),
    chapter: parseInt(match[2]),
    verse: match[3] ? parseInt(match[3]) : null
  };
}

/**
 * Fetches the complete JSON content for a specific Bible chapter.
 * 
 * @param {string} version - The version ID (e.g., 'kjv').
 * @param {string} bookName - The full book name (e.g., 'John').
 * @param {number} chapter - The chapter number.
 * @returns {Promise<BibleChapter | null>} A promise resolving to the BibleChapter object or null if not found.
 */
export async function getChapterContent(version: string, bookName: string, chapter: number): Promise<BibleChapter | null> {
  const bookCode = BOOK_CODES[bookName] || bookName.toUpperCase().substring(0, 3);
  try {
    const url = `https://bible.helloao.org/api/${version}/${bookCode}/${chapter}.json`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error(`Failed to fetch ${bookName} ${chapter}`, e);
    return null;
  }
}
