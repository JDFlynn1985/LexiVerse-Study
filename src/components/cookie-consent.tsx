'use client';

/**
 * @fileOverview Cookie Consent Management component for privacy compliance.
 */

import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/language-provider';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Info, ChevronRight, Settings } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export type CookieConsentPreferences = {
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
  timestamp: string;
};

const CONSENT_KEY = 'lexiverse_cookie_consent';

export function CookieConsent() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [prefs, setPrefs] = useState<CookieConsentPreferences>({
    analytics: false,
    functional: false,
    marketing: false,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    const savedConsent = localStorage.getItem(CONSENT_KEY);
    if (!savedConsent) {
      setIsOpen(true);
    } else {
      setPrefs(JSON.parse(savedConsent));
    }
  }, []);

  const handleSave = (newPrefs: CookieConsentPreferences) => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(newPrefs));
    setPrefs(newPrefs);
    setIsOpen(false);
    // Reload analytics and other dynamic scripts if needed
    window.location.reload(); 
  };

  const handleAcceptAll = () => {
    handleSave({
      analytics: true,
      functional: true,
      marketing: true,
      timestamp: new Date().toISOString()
    });
  };

  const handleRejectAll = () => {
    handleSave({
      analytics: false,
      functional: false,
      marketing: false,
      timestamp: new Date().toISOString()
    });
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-primary p-6 text-primary-foreground">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="h-8 w-8 text-accent" />
              <DialogTitle className="text-2xl font-headline">{t.cookies.title}</DialogTitle>
            </div>
            <DialogDescription className="text-primary-foreground/80 text-sm leading-relaxed">
              {t.cookies.description}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {showCustom ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <Label className="text-base font-bold">{t.cookies.categories.necessary.title}</Label>
                  <p className="text-xs text-muted-foreground">{t.cookies.categories.necessary.desc}</p>
                </div>
                <Switch checked disabled />
              </div>
              <Separator />
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <Label className="text-base font-bold">{t.cookies.categories.analytics.title}</Label>
                  <p className="text-xs text-muted-foreground">{t.cookies.categories.analytics.desc}</p>
                </div>
                <Switch 
                  checked={prefs.analytics} 
                  onCheckedChange={(val) => setPrefs({...prefs, analytics: val})} 
                />
              </div>
              <Separator />
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <Label className="text-base font-bold">{t.cookies.categories.functional.title}</Label>
                  <p className="text-xs text-muted-foreground">{t.cookies.categories.functional.desc}</p>
                </div>
                <Switch 
                  checked={prefs.functional} 
                  onCheckedChange={(val) => setPrefs({...prefs, functional: val})} 
                />
              </div>
              <Separator />
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <Label className="text-base font-bold">{t.cookies.categories.marketing.title}</Label>
                  <p className="text-xs text-muted-foreground">{t.cookies.categories.marketing.desc}</p>
                </div>
                <Switch 
                  checked={prefs.marketing} 
                  onCheckedChange={(val) => setPrefs({...prefs, marketing: val})} 
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
               <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground italic">
                 <Info className="h-4 w-4 shrink-0 text-primary" />
                 {t.cookies.categories.necessary.desc}
               </div>
               <Button variant="outline" className="justify-between group" onClick={() => setShowCustom(true)}>
                 <span className="flex items-center gap-2">
                   <Settings className="h-4 w-4" /> {t.cookies.customize}
                 </span>
                 <ChevronRight className="h-4 w-4 opacity-30 group-hover:opacity-100 transition-opacity" />
               </Button>
            </div>
          )}
        </div>

        <DialogFooter className="bg-muted/30 p-4 border-t gap-2 sm:gap-0 flex-col sm:flex-row">
          {showCustom ? (
            <Button className="w-full sm:w-auto" onClick={() => handleSave(prefs)}>
              {t.cookies.save}
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={handleRejectAll}>
                {t.cookies.reject_all}
              </Button>
              <Button className="w-full sm:w-auto font-bold" onClick={handleAcceptAll}>
                {t.cookies.accept_all}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
