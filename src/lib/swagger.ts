
import { createSwaggerSpec } from 'next-swagger-doc';

/**
 * @fileOverview Configuration for Automated OpenAPI Specification Generation.
 * Scans API routes for JSDoc comments and generates a standard Swagger document.
 */

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: 'src/app/api', // Scan this folder
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'LexiVerse Scholarly Research API',
        version: '1.0.0',
        description: 'Advanced RESTful API for external scholarly research integration with LexiVerse Explorer. This API allows third-party tools to leverage the LexiVerse AI engine and RAG context.',
        contact: {
          name: 'LexiVerse Engineering',
          url: 'https://lexiverse.app',
        },
      },
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'LV-TOKEN',
            description: 'Provide your personal API key (starting with lv_) obtained from the API Portal.'
          },
        },
        schemas: {
          ResearchOutput: {
            type: 'object',
            properties: {
              originalWord: { type: 'string', description: 'The word in its original alphabet.' },
              transliteration: { type: 'string', description: 'Phonetic transliteration.' },
              pronunciation: { type: 'string', description: 'Pronunciation guide.' },
              definitions: { type: 'array', items: { type: 'string' }, description: 'Scholarly definitions.' },
              lexicalData: { type: 'array', items: { type: 'string' }, description: 'Morphological data.' },
              commentaryInsights: { type: 'string', description: 'Synthesized historical commentary.' },
              verseUsages: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    text: { type: 'string' },
                    url: { type: 'string' }
                  }
                },
                description: 'Relevant verses with scholarly links.'
              },
              translationVariations: { type: 'array', items: { type: 'string' }, description: 'Comparison across versions.' },
              aiInsights: { type: 'string', description: 'Deep theological synthesis.' },
              bibliography: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    text: { type: 'string' },
                    url: { type: 'string' }
                  }
                },
                description: 'SBL-style bibliographic entries.'
              }
            }
          }
        }
      },
      security: [],
    },
  });
  return spec;
};
