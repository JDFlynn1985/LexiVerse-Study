'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Scale, Megaphone, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { trackAdClick } from '@/components/analytics';

export default function TermsOfUse() {
  const handleAdClick = (id: string, position: string) => {
    trackAdClick(id, position);
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between border-b pb-6">
          <div className="flex items-center gap-4">
            <Link href="/" prefetch={false}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold font-headline">Terms of Use</h1>
              <p className="text-muted-foreground italic">Standard Scholarly Agreement</p>
            </div>
          </div>
          <Scale className="h-10 w-10 text-primary opacity-20" />
        </header>

        <Card className="shadow-sm border-primary/10">
          <CardHeader>
            <CardTitle className="font-headline text-xl">1. Acceptance of Terms</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
            <p>
              By accessing or using LexiVerse Explorer ("the App"), you agree to be bound by these Terms of Use and all applicable academic integrity standards. This platform is designed for seminary students, biblical scholars, and theological researchers.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-primary/10">
          <CardHeader>
            <CardTitle className="font-headline text-xl">2. AI Accuracy and Disclaimer</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
            <p>
              The App utilizes GenAI (Generative Artificial Intelligence) to synthesize data from lexicons, commentaries, and research papers. While the App strives for academic rigor:
            </p>
            <ul className="list-disc pl-5">
              <li>AI-generated insights may contain inaccuracies or "hallucinations."</li>
              <li>Users are responsible for verifying all scripture citations and linguistic data against primary sources.</li>
              <li>AI responses should be treated as a research aid, not as definitive theological dogma.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-primary/10">
          <CardHeader>
            <CardTitle className="font-headline text-xl">3. Academic Integrity</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
            <p>
              Users must adhere to the plagiarism policies of their respective academic institutions. The AI Integrity Scanner is a tool to assist with proper attribution, but the ultimate responsibility for citation accuracy and originality rests with the user.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-primary/10">
          <CardHeader>
            <CardTitle className="font-headline text-xl">4. Ownership and Licensing of Your Content</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
            <div className="space-y-6">
              <div>
                <h5 className="font-bold text-primary mb-2">1. Ownership and Licensing of Your Content</h5>
                <p>
                  You retain ownership of all text, images, videos, or other materials you submit to our platform ("User Content"). However, by submitting User Content to the platform, you agree to make it available to the public under the terms of the Creative Commons Attribution 4.0 International License (CC BY 4.0).
                </p>
              </div>

              <div>
                <h5 className="font-bold text-primary mb-2">2. What This Means for You and Others</h5>
                <div className="space-y-3">
                  <p>
                    <strong className="text-foreground">Grant to the Platform and Public:</strong> You grant us, and all other users of this platform, a worldwide, royalty-free, non-exclusive, perpetual license to share, copy, distribute, transmit, adapt, and build upon your content for any purpose, including commercial purposes.
                  </p>
                  <p>
                    <strong className="text-foreground">Attribution Required:</strong> Anyone who uses, remixes, or distributes your content must give you appropriate credit, provide a link to the CC BY 4.0 license, and indicate if changes were made.
                  </p>
                </div>
              </div>

              <div>
                <h5 className="font-bold text-primary mb-2">3. Your Warranties</h5>
                <p>
                  By submitting content, you represent and warrant that you own the rights to the content, or have obtained all necessary permissions, to grant this CC BY 4.0 license. You agree not to submit any content that infringes upon the copyright, trademark, or intellectual property rights of any third party.
                </p>
              </div>

              <div className="pt-4 border-t">
                <p className="italic text-xs text-muted-foreground flex items-center gap-1">
                  For full details on how this license operates, please review the 
                  <a 
                    href="https://creativecommons.org/licenses/by/4.0/legalcode" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-primary font-bold underline inline-flex items-center gap-1"
                  >
                    Creative Commons CC BY 4.0 Legal Code <ExternalLink className="h-3 w-3" />
                  </a>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-primary/10">
          <CardHeader>
            <CardTitle className="font-headline text-xl">5. Prohibited Uses</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
            <p>
              Users may not use the App to generate hate speech, promote religious intolerance, or engage in any activity that violates the ethical standards of scholarly theological research.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-primary/10">
          <CardHeader>
            <CardTitle className="font-headline text-xl">6. Limitation of Liability</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
            <p>
              LexiVerse Explorer is provided "as is." We are not liable for any loss of research data, academic consequences resulting from AI use, or service interruptions.
            </p>
          </CardContent>
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

        <footer className="text-center text-muted-foreground text-xs pt-8">
          <p>© 2026 Joshua Flynn. Supporting the Scholarly Community.</p>
        </footer>
      </div>
    </div>
  );
}
