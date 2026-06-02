
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
        description: 'Advanced RESTful API for external scholarly research integration with LexiVerse Explorer.',
        contact: {
          name: 'LexiVerse Engineering',
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
      },
      security: [],
    },
  });
  return spec;
};
