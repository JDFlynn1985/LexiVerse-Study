'use client';

/**
 * @fileOverview Password Recovery Portal for LexiVerse Explorer.
 * Allows scholars to request a password reset email via Firebase Auth.
 */

import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, Mail, ShieldCheck, GraduationCap, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const auth = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setIsSent(true);
      toast({ 
        title: "Reset Email Sent", 
        description: "Please check your inbox for instructions to recover your account." 
      });
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Request Failed", 
        description: error.message || "An error occurred while processing your request." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-primary text-primary-foreground rounded-2xl mb-4 shadow-xl">
             <GraduationCap className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold font-headline">LexiVerse Recovery</h1>
          <p className="text-muted-foreground italic">Restoring access to your scholarly workspace.</p>
        </div>

        <Card className="shadow-2xl border-primary/10 overflow-hidden">
          <div className="h-1.5 bg-primary w-full" />
          <CardHeader>
            <CardTitle className="text-xl font-headline">Password Recovery</CardTitle>
            <CardDescription>
              {isSent 
                ? "A recovery link has been dispatched to your email address." 
                : "Enter your registered email to receive a secure reset link."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isSent ? (
              <form onSubmit={handleResetRequest} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Registered Email</Label>
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
                <Button type="submit" className="w-full h-11 shadow-lg" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Dispatch Reset Link
                </Button>
              </form>
            ) : (
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 space-y-4">
                <div className="flex items-center gap-3 text-primary">
                  <ShieldCheck className="h-6 w-6" />
                  <p className="text-sm font-bold">Email Dispatched Successfully</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  If an account exists for <strong>{email}</strong>, a reset link will arrive shortly. Please check your spam folder if you do not see it within a few minutes.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-muted/30 border-t p-6">
            <Link href="/login" className="flex items-center gap-2 text-xs font-bold text-primary hover:underline">
              <ArrowLeft className="h-3 w-3" /> Back to Login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
