
/**
 * @fileOverview Centralized service for exporting research results to various formats.
 */

import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { AiStudyAssistantOutput } from '@/ai/flows/ai-study-assistant';

export type ExportFormat = 'pdf' | 'docx' | 'markdown';

/**
 * Generates and triggers a browser download for a PDF report.
 */
export async function exportToPDF(data: AiStudyAssistantOutput) {
  const doc = new jsPDF();
  const title = data.originalWord || "Research Report";
  
  doc.setFontSize(22);
  doc.text(title, 20, 30);
  
  doc.setFontSize(14);
  doc.text(`${data.transliteration} | ${data.pronunciation}`, 20, 40);
  
  doc.setFontSize(12);
  doc.text("Definitions:", 20, 55);
  let y = 65;
  data.definitions.forEach(def => {
    doc.text(`- ${def}`, 25, y);
    y += 10;
  });

  doc.text("AI Insights:", 20, y + 10);
  const splitInsights = doc.splitTextToSize(data.aiInsights, 170);
  doc.text(splitInsights, 20, y + 20);
  
  doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}

/**
 * Generates and triggers a browser download for a Word document.
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
        new Paragraph({ text: "Definitions", heading: HeadingLevel.HEADING_2 }),
        ...data.definitions.map(def => new Paragraph({ text: def, bullet: { level: 0 } })),
        new Paragraph({ text: "AI Insights", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: data.aiInsights }),
        new Paragraph({ text: "Bibliography", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: data.bibliography }),
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

## Definitions
${data.definitions.map(d => `- ${d}`).join('\n')}

## Bibliography
${data.bibliography}
`;
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.md`;
  a.click();
}
