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
 * @fileOverview Client library for interacting with the bible.helloao.org (Free Use Bible API).
 */

export interface BibleVersion {
  id: string;
  name: string;
  language: string;
  abbreviation: string;
}

export interface BibleChapter {
  version: string;
  bookName: string;
  bookCode: string;
  chapterNumber: number;
  chapter: Array<any>;
}

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

export function parseReference(reference: string) {
  const match = reference.match(/^(\d?\s?[a-zA-Z\s]+)\s(\d+)(?::(\d+))?$/);
  if (!match) return null;
  return {
    bookName: match[1].trim(),
    chapter: parseInt(match[2]),
    verse: match[3] ? parseInt(match[3]) : null
  };
}

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
