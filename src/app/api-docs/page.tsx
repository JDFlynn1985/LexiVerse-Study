
'use client';

/**
 * @fileOverview API Documentation portal using Swagger UI.
 * Provides interactive exploration of the Scholarly Research API.
 */

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

// SwaggerUI does not support SSR out of the box
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { 
  ssr: false,
  loading: () => <div className="p-20 text-center animate-pulse">Initializing Scholarly Documentation Engine...</div>
});

export default function ApiDocs() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground p-6 shadow-md">
        <div className="container max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/api-keys">
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold font-headline flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-accent" /> API Documentation
              </h1>
              <p className="text-xs text-primary-foreground/70">Interactive Scholarly Integration Guide</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-xs font-medium">
            <ShieldCheck className="h-4 w-4 text-accent" />
            OpenAPI 3.0.0 Specification
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto py-8">
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <SwaggerUI url="/openapi.json" />
        </div>
      </main>

      <footer className="container max-w-6xl mx-auto py-8 text-center text-muted-foreground text-xs">
        <p>© 2024 LexiVerse Explorer. Dedicated to the advancement of theological research through technology.</p>
      </footer>
    </div>
  );
}
