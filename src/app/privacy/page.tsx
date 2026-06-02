'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, ShieldCheck, Megaphone, Database, Lock, EyeOff, Info, Scale, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { trackAdClick } from '@/components/analytics';

export default function PrivacyPolicy() {
  const handleAdClick = (id: string, position: string) => {
    trackAdClick(id, position);
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
        <header className="flex items-center justify-between border-b pb-6">
          <div className="flex items-center gap-4">
            <Link href="/" prefetch={false}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold font-headline">Privacy Standards</h1>
              <p className="text-muted-foreground italic">LexiVerse Scholarly Privacy Policy (v2.0)</p>
            </div>
          </div>
          <div className="p-3 bg-primary text-primary-foreground rounded-xl shadow-lg">
             <ShieldCheck className="h-8 w-8" />
          </div>
        </header>

        <Card className="shadow-lg border-primary/10 overflow-hidden">
          <div className="h-1.5 bg-primary w-full" />
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
              <Scale className="h-6 w-6 text-primary" /> 1. Age Restriction & Eligibility
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
            <p>
              In accordance with international data safety standards and our commitment to a professional research environment, LexiVerse Explorer enforces a strict <strong>15+ age requirement</strong>.
            </p>
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-primary" />
                <p className="text-sm font-bold text-primary">Clause 1.1: Verification Requirement</p>
              </div>
              <p className="text-xs text-muted-foreground italic leading-relaxed">
                We collect and store your date of birth during registration solely for the purpose of age verification. Access to scholarly resources and profile creation is strictly prohibited for individuals under this age. Accounts created with birth dates indicating the user is under 15 will be blocked from creation or terminated upon discovery to safeguard minors and preserve the scholarly nature of the platform.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-primary/10 overflow-hidden">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
              <Lock className="h-6 w-6 text-primary" /> 2. Scholarly Data Minimization
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
            <p>
              LexiVerse Explorer follows the principle of data minimization. We collect:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Basic Identity</strong>: Name, Email, and Birth Date to verify the 15+ age requirement and manage your workstation profile.</li>
              <li><strong>Scholarly Metadata</strong>: Your academic designation, tradition, and institution for accurate peer-review attribution.</li>
              <li><strong>Auth Credentials</strong>: All passwords are stored as industrial-grade salted hashes via Firebase Authentication.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-primary/10">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
               <EyeOff className="h-6 w-6 text-primary" /> 3. Local-First Research (RAG Isolation)
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
            <p>
              Your most sensitive data—unpublished papers and research drafts—is stored using <strong>IndexedDB</strong> in your local browser.
            </p>
            <div className="p-4 bg-muted/50 rounded-lg border flex gap-3 items-start">
               <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
               <p className="text-sm italic text-muted-foreground">
                 "Local RAG processing ensures that your personal digital library never touches LexiVerse servers unless you explicitly choose to 'Sync to Cloud' for high-dimensional Vector Search indexing."
               </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-primary/10">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
              <Database className="h-6 w-6 text-primary" /> 4. AI Providers & API Keys
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
            <p>
              LexiVerse provides a gateway to multiple AI engines. 
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Encrypted Storage</strong>: Custom API keys (OpenAI, Anthropic, Gemini) provided in your profile are stored in your encrypted Firebase profile.</li>
              <li><strong>Ollama Integration</strong>: For maximum privacy, researchers can use Local Network Mode, routing all inference to a server within their own intranet.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-primary/10">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">5. Communication & Peer Interaction</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
            <p>
              Direct Messages and Social Chat records are stored in Firestore to enable cross-device synchronization. While we implement strict Rule-Based Access Control (RBAC), scholars should avoid sharing passwords or sensitive personal identifying information in these channels.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-primary/10">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">6. Erasure & Retention</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
            <p>
              You maintain the right to access and erase your data at any time. Terminating your account will permanently delete all Firestore records. Wiki contributions will be attributed to "Anonymous Scholar" to maintain the integrity of the community knowledge base.
            </p>
          </CardContent>
        </Card>

        <div className="mt-12 pt-8 border-t">
          <div 
            className="w-full h-24 bg-muted/20 border-2 border-dashed rounded-xl flex items-center justify-center group cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => handleAdClick('scholarly_resource_banner_privacy', 'footer_banner')}
          >
            <div className="flex flex-col items-center">
              <Megaphone className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors mb-1" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Scholarly Resource Banner</span>
              <p className="text-xs text-muted-foreground italic">Your academic advertisement here</p>
            </div>
          </div>
        </div>

        <footer className="text-center text-muted-foreground text-xs pt-8 pb-12">
          <p>© 2026 LexiVerse Explorer. Committed to Scholarly Autonomy and Privacy.</p>
        </footer>
      </div>
    </div>
  );
}
