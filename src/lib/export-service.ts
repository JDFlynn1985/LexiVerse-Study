/**
 * @fileOverview Centralized service for exporting research results to various formats.
 * This service handles the transformation of scholarly data into portable document formats,
 * supporting advanced features like hyperlinked scriptures, bibliographic entries, 
 * and user-defined highlight preservation through complex text segmentation.
 *
 * Supported formats: PDF, DOCX, Markdown, RTF, Plain Text.
 */

import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, ExternalHyperlink, ShadingType } from 'docx';
import { AiStudyAssistantOutput } from '@/ai/flows/ai-study-assistant';

export type ExportFormat = 'pdf' | 'docx' | 'markdown' | 'rtf' | 'txt' | 'gdrive' | 'gdocs';

/**
 * Splits a block of text into segments based on a list of highlight strings.
 * This ensures that when exporting to formats like PDF or DOCX, the exact strings 
 * highlighted by the scholar in the UI are preserved with visual markers.
 *
 * @param text The full text content to be segmented.
 * @param highlights Array of strings representing the text fragments to be highlighted.
 * @returns Array of objects containing text segments and their highlight status.
 */
function splitByHighlights(text: string, highlights: string[]) {
  if (!highlights || highlights.length === 0) return [{ text, isHighlighted: false }];
  
  // Sort highlights by length descending to ensure we match longest possible strings first
  const sorted = [...highlights].sort((a, b) => b.length - a.length);
  const segments: { text: string; isHighlighted: boolean }[] = [];
  let currentIndex = 0;

  while (currentIndex < text.length) {
    let earliestMatch = -1;
    let matchedString = "";

    for (const h of sorted) {
      const idx = text.indexOf(h, currentIndex);
      if (idx !== -1 && (earliestMatch === -1 || idx < earliestMatch)) {
        earliestMatch = idx;
        matchedString = h;
      }
    }

    if (earliestMatch === -1) {
      segments.push({ text: text.substring(currentIndex), isHighlighted: false });
      break;
    }

    if (earliestMatch > currentIndex) {
      segments.push({ text: text.substring(currentIndex, earliestMatch), isHighlighted: false });
    }

    segments.push({ text: matchedString, isHighlighted: true });
    currentIndex = earliestMatch + matchedString.length;
  }

  return segments;
}

/**
 * Generates and triggers a browser download for a PDF report.
 * Uses jsPDF to create a structured scholarly report with support for color-coded
 * highlights and clickable resource links.
 * 
 * @param data The AI-generated research output.
 * @param highlights User-defined highlights from the research session.
 */
export async function exportToPDF(data: AiStudyAssistantOutput, highlights: string[] = []) {
  const doc = new jsPDF();
  const title = data.originalWord || "Research Report";
  
  // Document Header
  doc.setFontSize(22);
  doc.setTextColor(48, 25, 52); // Deep Indigo
  doc.text(title, 20, 30);
  
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text(`${data.transliteration} | ${data.pronunciation}`, 20, 40);
  
  let y = 60;
  doc.setFontSize(14);
  doc.setTextColor(48, 25, 52);
  doc.text("AI Insights:", 20, y);
  y += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - (margin * 2);
  
  // Simplified line-by-line rendering for PDF text with segments
  const splitInsights = doc.splitTextToSize(data.aiInsights, maxWidth);
  
  splitInsights.forEach((line: string) => {
    if (y > 270) { doc.addPage(); y = 20; }
    
    let currentX = margin;
    const lineSegments = splitByHighlights(line, highlights);
    
    lineSegments.forEach(seg => {
      const textWidth = doc.getTextWidth(seg.text);
      if (seg.isHighlighted) {
        doc.setFillColor(255, 255, 0); // Yellow highlight
        doc.rect(currentX, y - 4, textWidth, 6, 'F');
      }
      doc.text(seg.text, currentX, y);
      currentX += textWidth;
    });
    
    y += 6;
  });

  // Verse References Section
  y += 10;
  doc.setFontSize(14);
  doc.setTextColor(48, 25, 52);
  doc.text("Verse Occurrences:", 20, y);
  y += 10;
  doc.setFontSize(10);
  data.verseUsages.forEach(v => {
    if (y > 280) { doc.addPage(); y = 20; }
    doc.setTextColor(0, 0, 255); // Blue link
    doc.text(v.text, 25, y);
    doc.link(25, y - 5, doc.getTextWidth(v.text), 6, { url: v.url });
    y += 8;
  });

  // Bibliography Section
  y += 10;
  doc.setFontSize(14);
  doc.setTextColor(48, 25, 52);
  doc.text("Bibliography:", 20, y);
  y += 10;
  doc.setFontSize(9);
  data.bibliography.forEach(b => {
    if (y > 280) { doc.addPage(); y = 20; }
    doc.setTextColor(0, 0, 255);
    doc.text(b.text, 25, y);
    doc.link(25, y - 5, doc.getTextWidth(b.text), 5, { url: b.url });
    y += 8;
  });
  
  doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}

/**
 * Generates and triggers a browser download for a Microsoft Word (.docx) document.
 * Leverages the docx library to produce professional academic files with
 * hyperlinked references and bibliographic lists.
 * 
 * @param data The AI-generated research output.
 * @param highlights User-defined highlights to be converted to shading.
 */
export async function exportToWord(data: AiStudyAssistantOutput, highlights: string[] = []) {
  const insightSegments = splitByHighlights(data.aiInsights, highlights);

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: data.originalWord,
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `${data.transliteration} | ${data.pronunciation}`, italic: true }),
          ],
        }),
        new Paragraph({ text: "AI Insights", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({
          children: insightSegments.map(seg => new TextRun({
            text: seg.text,
            shading: seg.isHighlighted ? { type: ShadingType.REVERSE_DIAGONAL_STRIPE, color: "FFFF00", fill: "FFFF00" } : undefined,
          })),
        }),
        new Paragraph({ text: "Verse Occurrences", heading: HeadingLevel.HEADING_2 }),
        ...data.verseUsages.map(v => new Paragraph({
          children: [
            new ExternalHyperlink({
              children: [new TextRun({ text: v.text, color: "0000FF", underline: {} })],
              link: v.url
            })
          ],
          bullet: { level: 0 }
        })),
        new Paragraph({ text: "Bibliography", heading: HeadingLevel.HEADING_2 }),
        ...data.bibliography.map(b => new Paragraph({
          children: [
            new ExternalHyperlink({
              children: [new TextRun({ text: b.text, color: "0000FF", underline: {} })],
              link: b.url
            })
          ],
          bullet: { level: 0 }
        })),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.originalWord.toLowerCase().replace(/\s+/g, '-')}.docx`;
  a.click();
}

/**
 * Generates and triggers a browser download for a Markdown (.md) file.
 * Optimized for use in personal knowledge management tools like Obsidian.
 * 
 * @param data The AI-generated research output.
 * @param highlights User-defined highlights converted to ==highlight== syntax.
 */
export async function exportToMarkdown(data: AiStudyAssistantOutput, highlights: string[] = []) {
  const title = data.originalWord || "Research";
  
  let processedInsights = data.aiInsights;
  highlights.forEach(h => {
    const escaped = h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    processedInsights = processedInsights.replace(new RegExp(escaped, 'g'), `==${h}==`);
  });

  const content = `---
title: ${title}
transliteration: ${data.transliteration}
tags: #lexiverse #bible-study #scholarship
date: ${new Date().toISOString()}
---

# ${title}

${processedInsights}

## Verse Occurrences
${data.verseUsages.map(v => `- [${v.text}](${v.url})`).join('\n')}

## Bibliography
${data.bibliography.map(b => `- [${b.text}](${b.url})`).join('\n')}
`;
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.md`;
  a.click();
}

/**
 * Generates and triggers a browser download for a Rich Text Format (.rtf) file.
 * Provides legacy compatibility for older scholarly word processors.
 */
export async function exportToRTF(data: AiStudyAssistantOutput, highlights: string[] = []) {
  const title = data.originalWord || "Research";
  let content = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}} {\\colortbl;\\red0\\green0\\blue0;\\red255\\green255\\blue0;} \\f0\\fs28 \\b ${title}\\b0 \\line `;
  content += `\\fs20 ${data.transliteration} | ${data.pronunciation} \\line \\line `;
  
  content += `\\b AI Insights\\b0 \\line `;
  
  const segments = splitByHighlights(data.aiInsights, highlights);
  segments.forEach(seg => {
    const text = seg.text.replace(/\n/g, '\\line ');
    if (seg.isHighlighted) {
      content += `{\\cb2 ${text}}`;
    } else {
      content += text;
    }
  });
  
  content += `\\line \\line \\b Verse Occurrences\\b0 \\line `;
  data.verseUsages.forEach(v => {
    content += `{\\field{\\*\\fldinst{HYPERLINK "${v.url}"}}{\\fldrslt{${v.text}}}} \\line `;
  });
  
  content += `\\line \\b Bibliography\\b0 \\line `;
  data.bibliography.forEach(b => {
    content += `{\\field{\\*\\fldinst{HYPERLINK "${b.url}"}}{\\fldrslt{${b.text}}}} \\line `;
  });
  
  content += `}`;
  
  const blob = new Blob([content], { type: 'application/rtf' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.rtf`;
  a.click();
}

/**
 * Generates and triggers a browser download for a Plain Text (.txt) file.
 * Includes explicit highlight markers for environments without rich formatting.
 */
export async function exportToText(data: AiStudyAssistantOutput, highlights: string[] = []) {
  const title = data.originalWord || "Research";
  
  let processedInsights = data.aiInsights;
  highlights.forEach(h => {
    processedInsights = processedInsights.replace(new RegExp(h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), `[[HIGHLIGHT: ${h}]]`);
  });

  let content = `${title}\n`;
  content += `${data.transliteration} | ${data.pronunciation}\n\n`;
  content += `AI INSIGHTS:\n${processedInsights}\n\n`;
  content += `VERSE OCCURRENCES:\n`;
  data.verseUsages.forEach(v => {
    content += `- ${v.text} [${v.url}]\n`;
  });
  content += `\nBIBLIOGRAPHY:\n`;
  data.bibliography.forEach(b => {
    content += `- ${b.text} [${b.url}]\n`;
  });
  
  const blob = new Blob([content], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.txt`;
  a.click();
}
