'use client';

/**
 * @fileOverview Dedicated Signup Portal for LexiVerse Explorer.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup, GoogleAuthProvider, SAMLAuthProvider, OAuthProvider } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, Building2, Loader2, ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [systemConfig, setSystemConfig] = useState<any>(null);

  useEffect(() => {
    if (user && !authLoading) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!db) return;
    return onSnapshot(doc(db, 'system', 'config'), (snap) => {
      if (snap.exists()) setSystemConfig(snap.data());
    });
  }, [db]);

  const handleSignup = async (providerType: 'google' | 'institutional' = 'google') => {
    setIsAuthLoading(true);
    try {
      let provider;
      if (providerType === 'google') {
        provider = new GoogleAuthProvider();
      } else {
        const sso = systemConfig?.ssoConfig;
        if (!sso?.providerId) throw new Error("Institutional SSO not configured.");
        provider = sso.type === 'saml' ? new SAMLAuthProvider(sso.providerId) : new OAuthProvider(sso.providerId);
      }
      
      const result = await signInWithPopup(auth, provider);
      toast({ title: "Account Initialized", description: `Welcome to the community, ${result.user.displayName || 'Scholar'}.` });
      router.push('/');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Signup Failed", description: error.message });
    } finally {
      setIsAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold font-headline">Join the LexiVerse</h1>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Expand your biblical research with grounded AI synthesis and collaborative peer-review.
          </p>
        </div>

        <Card className="shadow-2xl border-primary/10 overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto p-4 bg-accent/10 rounded-full w-fit mb-4">
              <Sparkles className="h-8 w-8 text-accent" />
            </div>
            <CardTitle className="text-2xl font-headline">Create Scholar Account</CardTitle>
            <CardDescription>Link your identity to start syncing your research library.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full h-12 gap-3 text-sm font-bold uppercase tracking-widest shadow-lg" 
              onClick={() => handleSignup('google')} 
              disabled={isAuthLoading}
            >
              {isAuthLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Globe className="h-5 w-5" />}
              Signup with Google
            </Button>

            {systemConfig?.ssoConfig?.enabled && (
              <Button 
                variant="outline" 
                className="w-full h-12 gap-3 text-sm font-bold uppercase tracking-widest border-primary/20" 
                onClick={() => handleSignup('institutional')} 
                disabled={isAuthLoading}
              >
                <Building2 className="h-5 w-5 text-primary" />
                Institutional SSO
              </Button>
            )}
          </CardContent>
          <CardFooter className="bg-muted/30 border-t p-6 flex flex-col gap-4">
            <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
              By joining, you agree to the CC BY 4.0 licensing terms for public contributions.
            </p>
            <div className="flex justify-between w-full text-xs font-bold text-primary pt-2">
               <Link href="/login" className="hover:underline">Already a member?</Link>
               <Link href="/" className="flex items-center gap-1 hover:underline">
                 <ArrowLeft className="h-3 w-3" /> Back
               </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
