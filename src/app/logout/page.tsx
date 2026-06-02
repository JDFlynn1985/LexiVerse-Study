'use client';

/**
 * @fileOverview Secure Logout Handler for LexiVerse Explorer.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { Loader2, LogOut, GraduationCap } from 'lucide-react';

export default function LogoutPage() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function performLogout() {
      // Small delay for visual transition
      await new Promise(r => setTimeout(r, 1000));
      await signOut(auth);
      router.push('/');
    }
    performLogout();
  }, [auth, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="text-center space-y-6 animate-in fade-in duration-700">
        <div className="p-4 bg-primary text-primary-foreground rounded-2xl inline-block shadow-xl">
           <GraduationCap className="h-12 w-12" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold font-headline flex items-center justify-center gap-3">
             <LogOut className="h-6 w-6 text-primary" /> Terminating Session
          </h1>
          <p className="text-muted-foreground text-sm italic">Synchronizing research state and signing out...</p>
        </div>
        <div className="flex justify-center">
           <Loader2 className="h-6 w-6 text-primary animate-spin" />
        </div>
      </div>
    </div>
  );
}
