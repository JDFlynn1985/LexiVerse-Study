import { createSwaggerSpec } from 'next-swagger-doc';

/**
 * @fileOverview Configuration for Automated OpenAPI Specification Generation.
 * Scans API routes for JSDoc comments and generates a standard Swagger document.
 * Updated for API v1.2 with mandatory Clause 1.1 age compliance notes.
 */

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: 'src/app/api', // Scan this folder
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'LexiVerse Scholarly Research API',
        version: '1.2.0',
        description: 'Advanced RESTful API for external scholarly research integration. This API allows third-party tools to leverage the LexiVerse AI engine, grounded lexical data, and Gospel alignment tools. Access is restricted to scholars age 15+ in compliance with Clause 1.1.',
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
            description: 'Provide your personal API key (starting with lv_) obtained from the API Portal. Key generation requires a verified scholar account.'
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
          },
          LexiconOutput: {
            type: 'object',
            properties: {
              number: { type: 'string' },
              word: { type: 'string' },
              transliteration: { type: 'string' },
              definition: { type: 'string' },
              morphology: { type: 'string' },
              occurrences: { type: 'number' }
            }
          },
          SynopticOutput: {
            type: 'object',
            properties: {
              eventName: { type: 'string' },
              alignments: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    gospel: { type: 'string' },
                    reference: { type: 'string' },
                    keyNuance: { type: 'string' }
                  }
                }
              },
              theologicalSynthesis: { type: 'string' }
            }
          }
        }
      },
      security: [],
    },
  });
  return spec;
};
