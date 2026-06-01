/**
 * @fileOverview Algorithms for identifying overt and covert cross-references in scholarly text.
 */

const BOOK_NAMES = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth",
  "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra",
  "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon",
  "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
  "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah",
  "Malachi", "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians",
  "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians",
  "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James",
  "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"
];

/**
 * Identifies Overt Cross-References (explicit citations).
 */
export function findOvertReferences(text: string): string[] {
  const references: string[] = [];
  const bookPattern = BOOK_NAMES.join('|').replace(/ /g, '\\s');
  const regex = new RegExp(`(${bookPattern})\\s(\\d+)(?::(\\d+))?`, 'gi');
  
  let match;
  while ((match = regex.exec(text)) !== null) {
    references.push(match[0]);
  }
  
  return Array.from(new Set(references)); // Unique refs
}

/**
 * Covert references are handled by AI (see src/ai/flows/cross-reference-ai.ts).
 * This helper provides a skeleton for identifying key theological terms that might trigger covert checks.
 */
export function identifyTheologicalKeywords(text: string): string[] {
  const keywords = ["eschatology", "soteriology", "justification", "sanctification", "logos", "covenant"];
  return keywords.filter(k => text.toLowerCase().includes(k.toLowerCase()));
}
