'use client';

/**
 * @fileOverview Dedicated Login Portal for LexiVerse Explorer.
 * Supports Email/Password, Google, and Institutional SSO.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup, GoogleAuthProvider, SAMLAuthProvider, OAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Globe, Building2, Loader2, ArrowLeft, ShieldCheck, GraduationCap, Mail, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [systemConfig, setSystemConfig] = useState<any>(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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

  const handleSocialLogin = async (providerType: 'google' | 'institutional' = 'google') => {
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
      toast({ title: "Authenticated", description: `Welcome back, ${result.user.displayName || 'Scholar'}.` });
      router.push('/');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Authentication Failed", description: error.message });
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Welcome Back", description: "Successfully signed in to your research workstation." });
      router.push('/');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Login Failed", description: "Invalid email or password. Please try again." });
    } finally {
      setIsAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-primary text-primary-foreground rounded-2xl mb-4 shadow-xl">
             <GraduationCap className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold font-headline">LexiVerse Explorer</h1>
          <p className="text-muted-foreground italic">Sign in to your research workstation.</p>
        </div>

        <Card className="shadow-2xl border-primary/10 overflow-hidden">
          <div className="h-1.5 bg-primary w-full" />
          <CardHeader>
            <CardTitle className="text-xl font-headline">Scholarly Identity</CardTitle>
            <CardDescription>Enter your credentials to access your library and archives.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="scholar@example.edu" 
                    className="pl-10" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link 
                    href="/forgot-password" 
                    className="text-[10px] font-bold text-primary uppercase hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type="password" 
                    className="pl-10" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-11 shadow-lg" disabled={isAuthLoading}>
                {isAuthLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Sign In
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="grid gap-3">
              <Button 
                variant="outline" 
                className="w-full h-11 gap-3 text-sm font-bold uppercase tracking-widest border-primary/10" 
                onClick={() => handleSocialLogin('google')} 
                disabled={isAuthLoading}
              >
                {isAuthLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Globe className="h-5 w-5" />}
                Google
              </Button>

              {systemConfig?.ssoConfig?.enabled && (
                <Button 
                  variant="outline" 
                  className="w-full h-11 gap-3 text-sm font-bold uppercase tracking-widest border-primary/20" 
                  onClick={() => handleSocialLogin('institutional')} 
                  disabled={isAuthLoading}
                >
                  <Building2 className="h-5 w-5 text-primary" />
                  {systemConfig.ssoConfig.label}
                </Button>
              )}
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 border-t p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground italic">
               <ShieldCheck className="h-4 w-4 text-primary" />
               Secure encrypted authentication via Firebase.
            </div>
            <div className="flex justify-between w-full text-xs font-bold text-primary">
               <Link href="/signup" className="hover:underline">Create Account</Link>
               <Link href="/" className="flex items-center gap-1 hover:underline">
                 <ArrowLeft className="h-3 w-3" /> Dashboard
               </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
