
/**
 * @fileOverview Integration with Google Drive and Google Docs APIs for research export.
 */

import { AiStudyAssistantOutput } from '@/ai/flows/ai-study-assistant';

/**
 * Uploads a report to Google Drive as a text file.
 */
export async function exportToGoogleDrive(accessToken: string, data: AiStudyAssistantOutput) {
  const metadata = {
    name: `${data.originalWord}-research.txt`,
    mimeType: 'text/plain',
  };

  const content = `LexiVerse Research: ${data.originalWord}\n\n${data.aiInsights}\n\nBibliography:\n${data.bibliography}`;
  const file = new Blob([content], { type: 'text/plain' });

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });

  if (!response.ok) throw new Error('Failed to upload to Google Drive');
  return response.json();
}

/**
 * Creates a new Google Doc with the research report content.
 */
export async function exportToGoogleDocs(accessToken: string, data: AiStudyAssistantOutput) {
  // 1. Create the Doc
  const createResponse = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title: `LexiVerse Research: ${data.originalWord}` }),
  });

  if (!createResponse.ok) throw new Error('Failed to create Google Doc');
  const doc = await createResponse.json();

  // 2. Insert content
  const updateResponse = await fetch(`https://docs.googleapis.com/v1/documents/${doc.documentId}:batchUpdate`, {
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requests: [
        {
          insertText: {
            location: { index: 1 },
            text: `${data.originalWord}\n\n${data.aiInsights}\n\nBibliography:\n${data.bibliography}`
          }
        }
      ]
    }),
  });

  if (!updateResponse.ok) throw new Error('Failed to populate Google Doc');
  return doc;
}
