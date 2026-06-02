'use client';

/**
 * @fileOverview Dedicated Signup Portal for LexiVerse Explorer.
 * Supports Email/Password registration and Social Providers.
 * Enhanced with dual-layer (client/server) validation and age restriction (15+).
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup, GoogleAuthProvider, SAMLAuthProvider, OAuthProvider, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Globe, Building2, Loader2, ArrowLeft, ShieldCheck, Sparkles, Mail, User, Key, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { validateScholarPassword } from '@/app/actions/auth-actions';

export default function SignupPage() {
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [systemConfig, setSystemConfig] = useState<any>(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [birthday, setBirthday] = useState('');

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

  /**
   * Client-side validation for immediate user feedback.
   */
  const performClientValidation = (pass: string, name: string, emailAddr: string, bday: string) => {
    const normalizedPass = pass.toLowerCase();
    
    // 1. Identity Check
    const nameParts = name.toLowerCase().split(/\s+/).filter(p => p.length > 2);
    for (const part of nameParts) {
      if (normalizedPass.includes(part)) {
        return `Password cannot contain components of your name ("${part}").`;
      }
    }

    const emailPrefix = emailAddr.toLowerCase().split('@')[0];
    if (emailPrefix.length > 2 && normalizedPass.includes(emailPrefix)) {
      return "Password cannot contain your email username.";
    }

    // 2. Age Check (15+)
    if (!bday) return "Date of birth is required.";
    const birthDate = new Date(bday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 15) {
      return "You must be at least 15 years old to register as a scholar.";
    }

    // 3. Date Components in Password
    if (bday) {
      const [year] = bday.split('-');
      if (normalizedPass.includes(year)) return "Password cannot contain your birth year.";
    }

    // 4. Basic Length
    if (pass.length < 8) return "Password must be at least 8 characters long.";

    return null;
  };

  const handleSocialSignup = async (providerType: 'google' | 'institutional' = 'google') => {
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

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !displayName || !birthday) return;

    // 1. Fast Client-side Check
    const clientError = performClientValidation(password, displayName, email, birthday);
    if (clientError) {
      toast({ variant: "destructive", title: "Validation Error", description: clientError });
      return;
    }

    setIsAuthLoading(true);
    try {
      // 2. Authoritative Server-side Check (AJAX)
      const serverValidation = await validateScholarPassword(password, displayName, email, birthday);
      if (!serverValidation.valid) {
        toast({ 
          variant: "destructive", 
          title: "Policy Violation", 
          description: serverValidation.error || "Signup does not meet scholarly security standards." 
        });
        setIsAuthLoading(false);
        return;
      }

      // 3. Secure Account Creation
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
      
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        displayName,
        email,
        birthday,
        createdAt: serverTimestamp(),
        isAdmin: false,
        isModerator: false,
        licensedVersions: []
      });

      toast({ title: "Account Created", description: `Welcome, ${displayName}. Your workstation is ready.` });
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
          <CardContent className="space-y-6">
            <form onSubmit={handleEmailSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="name" 
                    placeholder="e.g. Dr. Jane Scholar" 
                    className="pl-10" 
                    value={displayName} 
                    onChange={e => setDisplayName(e.target.value)} 
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthday">Date of Birth</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="birthday" 
                    type="date"
                    className="pl-10" 
                    value={birthday} 
                    onChange={e => setBirthday(e.target.value)} 
                    required 
                  />
                </div>
                <p className="text-[10px] text-muted-foreground italic px-1">Registrants must be at least 15 years old.</p>
              </div>
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
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Minimum 8 characters"
                    className="pl-10" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                  />
                </div>
                <p className="text-[10px] text-muted-foreground italic px-1">Verified on-server against name, email, and birthday.</p>
              </div>
              <Button type="submit" className="w-full h-11 shadow-lg" disabled={isAuthLoading}>
                {isAuthLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Join Community
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or join with</span>
              </div>
            </div>

            <div className="grid gap-3">
              <Button 
                variant="outline" 
                className="w-full h-11 gap-3 text-sm font-bold uppercase tracking-widest border-primary/10 shadow-sm" 
                onClick={() => handleSocialSignup('google')} 
                disabled={isAuthLoading}
              >
                {isAuthLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Globe className="h-5 w-5" />}
                Signup with Google
              </Button>

              {systemConfig?.ssoConfig?.enabled && (
                <Button 
                  variant="outline" 
                  className="w-full h-11 gap-3 text-sm font-bold uppercase tracking-widest border-primary/20" 
                  onClick={() => handleSocialSignup('institutional')} 
                  disabled={isAuthLoading}
                >
                  <Building2 className="h-5 w-5 text-primary" />
                  Institutional SSO
                </Button>
              )}
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 border-t p-6 flex flex-col gap-4">
            <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
              By joining, you agree to the dual-layer security verification and minimum age policy.
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
