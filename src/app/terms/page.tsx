'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Scale, Megaphone, ExternalLink, ShieldCheck, Users, Gavel } from 'lucide-react';
import Link from 'next/link';
import { trackAdClick } from '@/components/analytics';
import { Separator } from '@/components/ui/separator';

export default function TermsOfUse() {
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
              <h1 className="text-3xl font-bold font-headline">Terms of Use</h1>
              <p className="text-muted-foreground italic">Official Scholarly Agreement (v2.0)</p>
            </div>
          </div>
          <div className="p-3 bg-primary text-primary-foreground rounded-xl shadow-lg">
             <Scale className="h-8 w-8" />
          </div>
        </header>

        <Card className="shadow-lg border-primary/10 overflow-hidden">
          <div className="h-1.5 bg-primary w-full" />
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
               <ShieldCheck className="h-6 w-6 text-primary" /> 1. Scholarly Access & Eligibility
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
            <p>
              LexiVerse Explorer ("the Platform") is a professional research environment designed for biblical scholars, seminary students, and theological institutions. 
            </p>
            <div className="p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
              <p className="font-bold text-primary mb-1">Minimum Age Requirement</p>
              <p className="text-sm">You must be at least <strong>15 years of age</strong> to register for a scholar account. Accounts created by individuals under this age will be terminated to ensure compliance with international data safety standards.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-primary/10">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
               <Users className="h-6 w-6 text-primary" /> 2. Community Conduct & Discourse
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
            <p>
              The **Social Chat Hub** and **Scholarly Wiki** are governed by principles of academic rigor and mutual respect. Users agree to:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Engage in evidence-based theological dialogue.</li>
              <li>Avoid ad hominem attacks, inflammatory language, or sectarian intolerance.</li>
              <li>Maintain the confidentiality of private peer-to-peer discourse in Direct Messages.</li>
              <li>Abstain from posting uncredited scholarly echoes or infringing on third-party intellectual property.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-primary/10">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">3. AI Synthesis & Accuracy</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
            <p>
              The Platform utilizes multiple Generative AI providers (including Google Gemini, OpenAI, and Anthropic). While we employ **Grounded Tool Calling** for linguistic precision:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground italic">
              <li>AI-generated exegesis may contain inaccuracies or "hallucinations."</li>
              <li>Users are legally and academically responsible for verifying all scripture citations against primary sources.</li>
              <li>AI responses are designed as a research aid and do not constitute definitive theological dogma.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-primary/10">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
               <Gavel className="h-6 w-6 text-primary" /> 4. Ownership & Licensing
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6">
            <div>
              <h5 className="font-bold text-primary mb-2">Public Contributions (Wiki/Chat)</h5>
              <p>
                By submitting content to the Wiki or Social Hub, you grant LexiVerse and its users a perpetual, worldwide, royalty-free license to share and adapt your work under the <strong>Creative Commons Attribution 4.0 International License (CC BY 4.0)</strong>. 
              </p>
            </div>

            <div>
              <h5 className="font-bold text-primary mb-2">Private Research (Library/Direct Messages)</h5>
              <p>
                You retain 100% ownership of your private research library, unpublished papers, and direct messages. LexiVerse does not claim any license or ownership over your private data.
              </p>
            </div>

            <Separator />

            <div className="pt-2">
              <h5 className="font-bold text-primary mb-2 uppercase text-xs tracking-widest">DMCA Takedown Procedure</h5>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We respect intellectual property rights. If you believe your copyrighted work is being infringed upon, you must use our standardized **DMCA Reporting Dialog** available within the Platform. Valid reports will trigger an automatic temporary removal pending administrative review.
              </p>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 border-t p-4 flex justify-center">
             <Link 
                href="https://creativecommons.org/licenses/by/4.0/" 
                target="_blank" 
                className="text-[10px] font-bold text-primary uppercase flex items-center gap-1 hover:underline"
              >
                View CC BY 4.0 Legal Code <ExternalLink className="h-3 w-3" />
             </Link>
          </CardFooter>
        </Card>

        <div className="mt-12 pt-8 border-t">
          <div 
            className="w-full h-24 bg-muted/20 border-2 border-dashed rounded-xl flex items-center justify-center group cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => handleAdClick('scholarly_resource_banner_terms', 'footer_banner')}
          >
            <div className="flex flex-col items-center">
              <Megaphone className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors mb-1" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Scholarly Resource Banner</span>
              <p className="text-xs text-muted-foreground italic">Your academic advertisement here</p>
            </div>
          </div>
        </div>

        <footer className="text-center text-muted-foreground text-xs pt-8 pb-12">
          <p>© 2026 LexiVerse Explorer. Dedicated to the advancement of theological research.</p>
        </footer>
      </div>
    </div>
  );
}
