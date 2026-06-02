
import { NextResponse } from 'next/server';
import { getApiDocs } from '@/lib/swagger';

/**
 * @fileOverview Dynamic OpenAPI JSON Endpoint.
 * Serves the generated specification to Swagger UI and external automated documentation tools.
 */

export async function GET() {
  const spec = await getApiDocs();
  return NextResponse.json(spec);
}
