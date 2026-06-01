'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ShieldCheck, Megaphone } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between border-b pb-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold font-headline">Privacy Policy</h1>
              <p className="text-muted-foreground italic">Last Updated: May 2024</p>
            </div>
          </div>
          <ShieldCheck className="h-10 w-10 text-primary opacity-20" />
        </header>

        <Card className="shadow-sm border-primary/10">
          <CardHeader>
            <CardTitle className="font-headline text-xl">1. Data Collection and Usage</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
            <p>
              LexiVerse Explorer ("the App") collects basic profile information through Google Authentication, including your name, email address, and profile picture. This data is used solely to provide a personalized study environment and manage your research profile.
            </p>
            <p>
              We use <strong>Firebase (Google Cloud)</strong> to store your study preferences, research history, and any notes or papers you choose to upload to your digital library.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-primary/10">
          <CardHeader>
            <CardTitle className="font-headline text-xl">2. Google Workspace Integration</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
            <p>
              The App requests specific scopes to interact with your Google Drive, Google Docs, and Google Sheets. These permissions are used exclusively to:
            </p>
            <ul className="list-disc pl-5">
              <li>Create and manage a "LexiVerse Research" folder.</li>
              <li>Sync your research notes and papers to your personal Google Drive.</li>
              <li>Export bibliographies and study logs to Google Docs and Sheets.</li>
            </ul>
            <p>
              The App does not access, modify, or delete files outside of the "LexiVerse Research" folder or files explicitly created by the App.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-primary/10">
          <CardHeader>
            <CardTitle className="font-headline text-xl">3. AI Processing and Content</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
            <p>
              When using the Scholar AI Engine, the text of your queries and context from your uploaded papers is processed via <strong>Google Gemini API</strong>. This data is handled according to Google's Enterprise Privacy standards. If you provide a custom API key, your usage is subject to the terms of your individual Google AI account.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-primary/10">
          <CardHeader>
            <CardTitle className="font-headline text-xl">4. Your Rights</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
            <p>
              You maintain full ownership of your research data. You may delete your account and associated data from the App at any time through the settings panel. Deleting your account from LexiVerse will not delete your files in Google Drive, which must be managed through Google services.
            </p>
          </CardContent>
        </Card>

        {/* Banner Ad Placeholder */}
        <div className="mt-12 pt-8 border-t">
          <div className="w-full h-24 bg-muted/20 border-2 border-dashed rounded-xl flex items-center justify-center group cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex flex-col items-center">
              <Megaphone className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors mb-1" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Scholarly Resource Banner</span>
              <p className="text-xs text-muted-foreground italic">Your academic advertisement here</p>
            </div>
          </div>
        </div>

        <footer className="text-center text-muted-foreground text-xs pt-8">
          <p>© 2024 LexiVerse Explorer. Dedicated to Academic Excellence and Privacy.</p>
        </footer>
      </div>
    </div>
  );
}
