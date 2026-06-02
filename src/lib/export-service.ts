
/**
 * @fileOverview Centralized service for exporting research results to various formats.
 */

import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, ExternalHyperlink, ShadingType } from 'docx';
import { AiStudyAssistantOutput } from '@/ai/flows/ai-study-assistant';

export type ExportFormat = 'pdf' | 'docx' | 'markdown' | 'rtf' | 'txt' | 'bibtex' | 'gdrive' | 'gdocs';

/**
 * Splits a block of text into segments based on a list of highlight strings.
 */
function splitByHighlights(text: string, highlights: string[]) {
  if (!highlights || highlights.length === 0) return [{ text, isHighlighted: false }];
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

export async function exportToPDF(data: AiStudyAssistantOutput, highlights: string[] = []) {
  const doc = new jsPDF();
  const title = data.originalWord || "Research Report";
  doc.setFontSize(22);
  doc.setTextColor(48, 25, 52);
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
  const splitInsights = doc.splitTextToSize(data.aiInsights, maxWidth);
  splitInsights.forEach((line: string) => {
    if (y > 270) { doc.addPage(); y = 20; }
    let currentX = margin;
    const lineSegments = splitByHighlights(line, highlights);
    lineSegments.forEach(seg => {
      const textWidth = doc.getTextWidth(seg.text);
      if (seg.isHighlighted) {
        doc.setFillColor(255, 255, 0);
        doc.rect(currentX, y - 4, textWidth, 6, 'F');
      }
      doc.text(seg.text, currentX, y);
      currentX += textWidth;
    });
    y += 6;
  });
  y += 10;
  doc.setFontSize(14);
  doc.setTextColor(48, 25, 52);
  doc.text("Verse Occurrences:", 20, y);
  y += 10;
  doc.setFontSize(10);
  data.verseUsages.forEach(v => {
    if (y > 280) { doc.addPage(); y = 20; }
    doc.setTextColor(0, 0, 255);
    doc.text(v.text, 25, y);
    doc.link(25, y - 5, doc.getTextWidth(v.text), 6, { url: v.url });
    y += 8;
  });
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

export async function exportToWord(data: AiStudyAssistantOutput, highlights: string[] = []) {
  const insightSegments = splitByHighlights(data.aiInsights, highlights);
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({ text: data.originalWord, heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ children: [new TextRun({ text: `${data.transliteration} | ${data.pronunciation}`, italic: true })] }),
        new Paragraph({ text: "AI Insights", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ children: insightSegments.map(seg => new TextRun({
          text: seg.text,
          shading: seg.isHighlighted ? { type: ShadingType.REVERSE_DIAGONAL_STRIPE, color: "FFFF00", fill: "FFFF00" } : undefined,
        })) }),
        new Paragraph({ text: "Verse Occurrences", heading: HeadingLevel.HEADING_2 }),
        ...data.verseUsages.map(v => new Paragraph({
          children: [new ExternalHyperlink({ children: [new TextRun({ text: v.text, color: "0000FF", underline: {} })], link: v.url })],
          bullet: { level: 0 }
        })),
        new Paragraph({ text: "Bibliography", heading: HeadingLevel.HEADING_2 }),
        ...data.bibliography.map(b => new Paragraph({
          children: [new ExternalHyperlink({ children: [new TextRun({ text: b.text, color: "0000FF", underline: {} })], link: b.url })],
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

export async function exportToMarkdown(data: AiStudyAssistantOutput, highlights: string[] = []) {
  const title = data.originalWord || "Research";
  let processedInsights = data.aiInsights;
  highlights.forEach(h => {
    processedInsights = processedInsights.replace(new RegExp(h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), `==${h}==`);
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

export async function exportToText(data: AiStudyAssistantOutput, highlights: string[] = []) {
  const title = data.originalWord || "Research";
  let content = `${title}\n${data.transliteration} | ${data.pronunciation}\n\nAI INSIGHTS:\n${data.aiInsights}\n\nVERSE OCCURRENCES:\n${data.verseUsages.map(v => `- ${v.text} [${v.url}]`).join('\n')}\n\nBIBLIOGRAPHY:\n${data.bibliography.map(b => `- ${b.text} [${b.url}]`).join('\n')}`;
  const blob = new Blob([content], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.txt`;
  a.click();
}

/**
 * Generates and triggers a browser download for a BibTeX file.
 * Optimized for Zotero and academic citation managers.
 */
export async function exportToBibTeX(data: AiStudyAssistantOutput) {
  const citeKey = data.originalWord.toLowerCase().replace(/\s+/g, '') + new Date().getFullYear();
  const content = `@article{${citeKey},
  author = {LexiVerse AI Hub},
  title = {Scholarly Analysis of ${data.originalWord}},
  journal = {LexiVerse Explorer},
  year = {${new Date().getFullYear()}},
  note = {${data.transliteration} | ${data.pronunciation}. ${data.aiInsights.substring(0, 150).replace(/\n/g, ' ')}...},
  url = {https://lexiverse.app}
}`;
  const blob = new Blob([content], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${citeKey}.bib`;
  a.click();
}
