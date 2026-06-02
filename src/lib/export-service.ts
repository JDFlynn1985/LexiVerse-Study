/**
 * @fileOverview Centralized service for exporting research results to various formats.
 * Updated to support hyperlinked scriptures and bibliographic entries across all formats, including RTF and TXT.
 */

import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, ExternalHyperlink } from 'docx';
import { AiStudyAssistantOutput } from '@/ai/flows/ai-study-assistant';

export type ExportFormat = 'pdf' | 'docx' | 'markdown' | 'rtf' | 'txt' | 'gdrive' | 'gdocs';

/**
 * Generates and triggers a browser download for a PDF report.
 * Uses jsPDF's internal link mechanism for clickable resources.
 */
export async function exportToPDF(data: AiStudyAssistantOutput) {
  const doc = new jsPDF();
  const title = data.originalWord || "Research Report";
  
  doc.setFontSize(22);
  doc.setTextColor(48, 25, 52); // Deep Indigo
  doc.text(title, 20, 30);
  
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text(`${data.transliteration} | ${data.pronunciation}`, 20, 40);
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("Definitions:", 20, 55);
  let y = 65;
  data.definitions.forEach(def => {
    doc.text(`- ${def}`, 25, y);
    y += 8;
  });

  y += 10;
  doc.setFontSize(14);
  doc.setTextColor(48, 25, 52);
  doc.text("Verse Occurrences:", 20, y);
  y += 10;
  doc.setFontSize(10);
  data.verseUsages.forEach(v => {
    doc.setTextColor(0, 0, 255); // Link blue
    doc.text(v.text, 25, y);
    doc.link(25, y - 5, doc.getTextWidth(v.text), 6, { url: v.url });
    y += 8;
  });

  y += 10;
  doc.setFontSize(14);
  doc.setTextColor(48, 25, 52);
  doc.text("AI Insights:", 20, y);
  y += 10;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  const splitInsights = doc.splitTextToSize(data.aiInsights, 170);
  doc.text(splitInsights, 20, y);
  y += (splitInsights.length * 5) + 10;

  doc.setFontSize(14);
  doc.setTextColor(48, 25, 52);
  doc.text("Bibliography:", 20, y);
  y += 10;
  doc.setFontSize(9);
  data.bibliography.forEach(b => {
    doc.setTextColor(0, 0, 255);
    doc.text(b.text, 25, y);
    doc.link(25, y - 5, doc.getTextWidth(b.text), 5, { url: b.url });
    y += 8;
  });
  
  doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}

/**
 * Generates and triggers a browser download for a Word document.
 * Uses ExternalHyperlink for scripture and bibliography links.
 */
export async function exportToWord(data: AiStudyAssistantOutput) {
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
        new Paragraph({ text: "AI Insights", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: data.aiInsights }),
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
 * Generates and triggers a browser download for a Markdown file.
 * Uses standard Markdown [text](url) syntax for links.
 */
export async function exportToMarkdown(data: AiStudyAssistantOutput) {
  const title = data.originalWord || "Research";
  const content = `---
title: ${title}
transliteration: ${data.transliteration}
tags: #lexiverse #bible-study #scholarship
date: ${new Date().toISOString()}
---

# ${title}

${data.aiInsights}

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
 * Uses basic RTF control words for styling and native hyperlinks.
 */
export async function exportToRTF(data: AiStudyAssistantOutput) {
  const title = data.originalWord || "Research";
  let content = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}} \\f0\\fs28 \\b ${title}\\b0 \\line `;
  content += `\\fs20 ${data.transliteration} | ${data.pronunciation} \\line \\line `;
  
  content += `\\b AI Insights\\b0 \\line ${data.aiInsights.replace(/\n/g, '\\line ')} \\line \\line `;
  
  content += `\\b Verse Occurrences\\b0 \\line `;
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
 * Includes explicit URLs in brackets next to text for maximum accessibility.
 */
export async function exportToText(data: AiStudyAssistantOutput) {
  const title = data.originalWord || "Research";
  let content = `${title}\n`;
  content += `${data.transliteration} | ${data.pronunciation}\n\n`;
  content += `AI INSIGHTS:\n${data.aiInsights}\n\n`;
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
