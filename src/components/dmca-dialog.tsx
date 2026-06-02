
/*
 * Title: LexiVerse
 * Copyright © 2026 Joshua Flynn <joshuaflynn040@gmail.com>
 * Source: https://github.com/JDFlynn1985/LexiVerse
 *
 * This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 
 * International License. To view a copy of this license, visit:
 * http://creativecommons.org
 *
 * @fileOverview Standardized DMCA Complaint Form and Automatic Takedown Trigger.
 */

'use client';

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ShieldAlert, Loader2, Send } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface DMCADialogProps {
  contentId: string;
  contentType: 'wiki' | 'chat';
  trigger?: React.ReactNode;
  onTakedownComplete?: () => void;
}

export function DMCADialog({ contentId, contentType, trigger, onTakedownComplete }: DMCADialogProps) {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    complainantName: user?.displayName || '',
    complainantEmail: user?.email || '',
    complainantAddress: '',
    infringementDescription: '',
    digitalSignature: '',
    agreedToAccuracy: false,
    agreedToOwnership: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.digitalSignature || !form.agreedToAccuracy || !form.agreedToOwnership) return;
    
    setIsSubmitting(true);
    try {
      // 1. Log the formal complaint
      await addDoc(collection(db, 'dmca_complaints'), {
        contentId,
        contentType,
        complainantName: form.complainantName,
        complainantEmail: form.complainantEmail,
        complainantAddress: form.complainantAddress,
        infringementDescription: form.infringementDescription,
        digitalSignature: form.digitalSignature,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // 2. Automatic Takedown (Update content status to hidden/flagged)
      const collectionName = contentType === 'wiki' ? 'wiki_entries' : 'messages';
      await updateDoc(doc(db, collectionName, contentId), {
        status: 'removed_dmca',
        dmcaTakedownAt: serverTimestamp()
      });

      toast({
        title: "Complaint Submitted",
        description: "Content has been automatically removed pending administrative investigation."
      });

      setIsOpen(false);
      if (onTakedownComplete) onTakedownComplete();
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Submission Failed", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10"><ShieldAlert className="h-4 w-4 mr-2" /> Report DMCA</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive mb-2">
            <ShieldAlert className="h-5 w-5" />
            <DialogTitle className="font-headline text-xl">Copyright Infringement Notice</DialogTitle>
          </div>
          <DialogDescription className="text-xs leading-relaxed">
            Please provide the following information to file a formal DMCA complaint. <strong>Filing a false report may result in legal consequences.</strong> Upon submission, the content will be automatically removed pending review.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Full Legal Name</Label>
              <Input 
                required 
                value={form.complainantName} 
                onChange={e => setForm({...form, complainantName: e.target.value})} 
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email Address</Label>
              <Input 
                required 
                type="email" 
                value={form.complainantEmail} 
                onChange={e => setForm({...form, complainantEmail: e.target.value})} 
                placeholder="scholar@example.edu"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Physical Address / Contact Info</Label>
            <Input 
              required 
              value={form.complainantAddress} 
              onChange={e => setForm({...form, complainantAddress: e.target.value})} 
              placeholder="City, State, Zip, Phone"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Description of Infringement</Label>
            <Textarea 
              required 
              className="min-h-[100px] text-xs"
              value={form.infringementDescription} 
              onChange={e => setForm({...form, infringementDescription: e.target.value})} 
              placeholder="Identify the copyrighted work and describe how it has been infringed..."
            />
          </div>

          <div className="space-y-3 bg-muted/50 p-4 rounded-lg border text-[10px]">
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="accuracy" 
                checked={form.agreedToAccuracy} 
                onCheckedChange={v => setForm({...form, agreedToAccuracy: !!v})} 
              />
              <Label htmlFor="accuracy" className="leading-snug">
                I have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.
              </Label>
            </div>
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="ownership" 
                checked={form.agreedToOwnership} 
                onCheckedChange={v => setForm({...form, agreedToOwnership: !!v})} 
              />
              <Label htmlFor="ownership" className="leading-snug">
                The information in this notification is accurate, and under penalty of perjury, I am authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.
              </Label>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Digital Signature (Type Full Name)</Label>
            <Input 
              required 
              className="font-signature italic"
              value={form.digitalSignature} 
              onChange={e => setForm({...form, digitalSignature: e.target.value})} 
              placeholder="Your full legal name as signature"
            />
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button 
              type="submit" 
              variant="destructive" 
              className="w-full" 
              disabled={isSubmitting || !form.digitalSignature || !form.agreedToAccuracy || !form.agreedToOwnership}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              File Complaint & Remove Content
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
