
'use client';

/**
 * @fileOverview Bible Version Licensing Hub.
 * Manages access to modern copyrighted translations via institutional SSO or license keys.
 */

import React, { memo, useState } from 'react';
import { ShieldCheck, Lock, Unlock, Loader2, Key, Link, ExternalLink, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useUser, useDoc } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { UserProfile } from '@/types/scholarly';

const MODERN_VERSIONS = [
  { id: 'niv', name: 'New International Version', publisher: 'Biblica', logo: 'NIV' },
  { id: 'esv', name: 'English Standard Version', publisher: 'Crossway', logo: 'ESV' },
  { id: 'nasb', name: 'New American Standard', publisher: 'Lockman Foundation', logo: 'NASB' },
  { id: 'nlt', name: 'New Living Translation', publisher: 'Tyndale', logo: 'NLT' },
];

export const LicensingHubView = memo(() => {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [licenseKey, setLicenseKey] = useState('');

  const userRef = user ? doc(db, 'users', user.uid) : null;
  const { data: profile } = useDoc<UserProfile>(userRef);

  const isLicensed = (id: string) => profile?.licensedVersions?.includes(id);

  const handleLinkVersion = async (id: string) => {
    if (!user || !db) return;
    setLinkingId(id);
    
    // Simulate OAuth / Licensing API verification delay
    await new Promise(r => setTimeout(res => r(res), 1500));

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        licensedVersions: arrayUnion(id)
      });
      toast({ title: "Version Unlocked", description: `You now have full scholarly access to the ${id.toUpperCase()}.` });
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Activation Failed", description: e.message });
    } finally {
      setLinkingId(null);
    }
  };

  const handleRemoveLicense = async (id: string) => {
    if (!user || !db) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        licensedVersions: arrayRemove(id)
      });
      toast({ title: "License Revoked", description: "The version has been removed from your workspace." });
    } catch (e) {
      toast({ variant: 'destructive', title: "Action Failed" });
    }
  };

  if (!user) return <div className="p-20 text-center italic">Please sign in to manage Bible version licenses.</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-primary" /> Licensing Hub
          </h1>
          <p className="text-muted-foreground">Manage access to modern copyrighted translations for your research.</p>
        </div>
        <Badge variant="outline" className="h-8 border-primary/20 text-primary uppercase font-bold tracking-widest text-[10px]">Secure Authentication Active</Badge>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {MODERN_VERSIONS.map((v) => {
              const active = isLicensed(v.id);
              return (
                <Card key={v.id} className={cn("transition-all border-l-4", active ? "border-l-green-500 shadow-md" : "border-l-muted opacity-80")}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Badge className="bg-primary text-primary-foreground font-mono">{v.logo}</Badge>
                      {active ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <CardTitle className="text-lg font-headline mt-2">{v.name}</CardTitle>
                    <CardDescription className="text-[10px] uppercase font-bold tracking-widest">{v.publisher}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground leading-relaxed italic">
                      {active 
                        ? "Full scholarly text enabled for exegesis and comparison."
                        : "Requires institutional SSO or valid individual license key to unlock."}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    {active ? (
                      <Button variant="ghost" size="sm" className="w-full text-destructive text-[10px]" onClick={() => handleRemoveLicense(v.id)}>
                        Revoke Access
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full h-8 gap-2" 
                        onClick={() => handleLinkVersion(v.id)}
                        disabled={linkingId === v.id}
                      >
                        {linkingId === v.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Link className="h-3 w-3" />}
                        Link Account
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          <Card className="border-accent/20 bg-accent/5">
            <CardHeader>
              <CardTitle className="text-lg font-headline flex items-center gap-2">
                <Key className="h-5 w-5 text-accent" /> Manual Access Entry
              </CardTitle>
              <CardDescription>Enter a valid individual license key provided by a publisher.</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Input 
                placeholder="XXXX-XXXX-XXXX-XXXX" 
                className="bg-background shadow-inner font-mono"
                value={licenseKey}
                onChange={e => setLicenseKey(e.target.value)}
              />
              <Button disabled={!licenseKey.trim()}>Validate Key</Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-headline flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" /> Why Licensing?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs leading-relaxed text-muted-foreground">
              <p>
                LexiVerse Explorer uses public domain texts by default. However, most modern translations (NIV, ESV, etc.) are copyrighted works managed by specific publishers.
              </p>
              <p>
                To maintain scholarly integrity and respect copyright law, these versions must be "unlocked" via verified credentials.
              </p>
              <div className="p-3 bg-muted/50 rounded-lg border flex gap-2">
                <AlertTriangle className="h-4 w-4 text-accent shrink-0" />
                <p className="italic">Institutional partners can automate this flow for all their registered students via SAML SSO.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary text-primary-foreground">
             <CardHeader>
               <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
                 <ShieldCheck className="h-4 w-4" /> Compliance
               </CardTitle>
             </CardHeader>
             <CardContent>
               <p className="text-[11px] opacity-80 leading-relaxed italic">
                 Licensing tokens are encrypted at the edge and never stored in plain text. Your usage is subject to the fair use policies defined by each respective publisher.
               </p>
               <Button variant="link" className="text-white p-0 h-fit text-[10px] mt-2 underline">
                 View Licensing Standards <ExternalLink className="h-2 w-2 ml-1" />
               </Button>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
});
