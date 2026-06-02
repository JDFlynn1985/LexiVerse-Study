
'use client';

/**
 * @fileOverview Zotero Hub View.
 * Command center for managing bidirectional research synchronization.
 */

import React, { memo, useState, useEffect } from 'react';
import { Database, Link, Unlink, Loader2, BookOpen, RefreshCw, FolderOpen, Send, Download, Info, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFirestore, useUser, useDoc } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { fetchZoteroCollections, fetchZoteroItems, createZoteroItem, type ZoteroCollection, type ZoteroItem } from '@/lib/zotero-api';
import { saveLocalDocument } from '@/lib/idb';
import { sanitizeHtml } from '@/lib/sanitization';
import { cn } from '@/lib/utils';
import { UserProfile } from '@/types/scholarly';
import { Separator } from '@/components/ui/separator';

export const ZoteroHubView = memo(() => {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const userRef = user ? doc(db, 'users', user.uid) : null;
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(userRef);

  const [userId, setUserId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [collections, setCollections] = useState<ZoteroCollection[]>([]);
  const [items, setItems] = useState<ZoteroItem[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.preferences?.zoteroUserId) {
      setUserId(profile.preferences.zoteroUserId);
      setApiKey(profile.preferences.zoteroApiKey || '');
      handleRefresh(profile.preferences.zoteroUserId, profile.preferences.zoteroApiKey || '');
    }
  }, [profile]);

  const handleLink = async () => {
    if (!user || !userId || !apiKey) return;
    setIsSyncing(true);
    try {
      // 1. Verify credentials by fetching
      await fetchZoteroCollections(userId, apiKey);
      
      // 2. Persist to Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        'preferences.zoteroUserId': userId,
        'preferences.zoteroApiKey': apiKey
      });
      
      toast({ title: "Zotero Linked", description: "Your research library is now accessible." });
      handleRefresh(userId, apiKey);
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Authentication Failed", description: "Please verify your Zotero User ID and API Key." });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRefresh = async (uid = userId, key = apiKey) => {
    if (!uid || !key) return;
    setIsSyncing(true);
    try {
      const [cols, itms] = await Promise.all([
        fetchZoteroCollections(uid, key),
        fetchZoteroItems(uid, key, selectedCollection || undefined)
      ]);
      setCollections(cols);
      setItems(itms);
    } catch (e) {
      console.error("Refresh failed", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportToLibrary = async (item: ZoteroItem) => {
    try {
      const cleanContent = sanitizeHtml(item.data.abstractNote || "No abstract available.");
      await saveLocalDocument({
        id: `zotero-${item.key}`,
        name: `Zotero: ${item.data.title}`,
        type: 'zotero-item',
        content: cleanContent,
        uploadDate: new Date().toISOString(),
        synced: true
      });
      toast({ title: "Imported to Library", description: "Item abstract added to RAG context." });
    } catch (e) {
      toast({ variant: 'destructive', title: "Import Failed" });
    }
  };

  const isLinked = !!profile?.preferences?.zoteroUserId;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
            <Database className="h-8 w-8 text-primary" /> Zotero Scholarly Hub
          </h1>
          <p className="text-muted-foreground">Manage bidirectional synchronization with your Zotero research collections.</p>
        </div>
        {isLinked && (
          <Button variant="outline" size="sm" onClick={() => handleRefresh()} disabled={isSyncing} className="h-8 gap-2">
            {isSyncing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            Refresh Library
          </Button>
        )}
      </header>

      {!isLinked ? (
        <Card className="max-w-2xl mx-auto shadow-xl border-primary/20 overflow-hidden">
          <div className="h-1.5 bg-primary w-full" />
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center gap-2">
              <Link className="h-5 w-5 text-primary" /> Link Zotero Account
            </CardTitle>
            <CardDescription>
              Connect your Zotero library to push research results and pull bibliographic context.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Zotero User ID</Label>
                <Input placeholder="e.g. 1234567" value={userId} onChange={e => setUserId(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input type="password" placeholder="Paste Zotero API Key..." value={apiKey} onChange={e => setApiKey(e.target.value)} />
              </div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg border flex gap-3 items-start">
               <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
               <p className="text-xs text-muted-foreground leading-relaxed italic">
                 Your credentials are stored securely in your scholarly profile. You can obtain your API Key from the Zotero website under <code className="font-bold">Settings > Feeds/API</code>.
               </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full h-11" onClick={handleLink} disabled={isSyncing || !userId || !apiKey}>
              {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              Authorize Scholarly Connection
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-md border-primary/10">
              <CardHeader className="pb-3 bg-primary/5">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" /> My Collections
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <div className="divide-y">
                    <div 
                      className={cn("p-4 cursor-pointer hover:bg-muted/50 transition-colors text-sm font-medium", !selectedCollection && "bg-primary/5 text-primary")}
                      onClick={() => { setSelectedCollection(null); handleRefresh(userId, apiKey); }}
                    >
                      Entire Library
                    </div>
                    {collections.map(col => (
                      <div 
                        key={col.key} 
                        className={cn("p-4 cursor-pointer hover:bg-muted/50 transition-colors text-sm pl-8 border-l-4", selectedCollection === col.key ? "border-l-primary bg-primary/5 text-primary" : "border-l-transparent")}
                        onClick={() => { setSelectedCollection(col.key); handleRefresh(userId, apiKey); }}
                      >
                        {col.name}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="border-accent/20 bg-accent/5">
               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold uppercase text-accent flex items-center gap-2">
                     <CheckCircle2 className="h-4 w-4" /> Connection Active
                  </CardTitle>
               </CardHeader>
               <CardContent className="text-[10px] text-muted-foreground leading-relaxed italic">
                  Linked to User ID: <span className="font-mono">{userId}</span>. Bidirectional sync is enabled for your research workstation.
               </CardContent>
               <CardFooter>
                  <Button variant="ghost" size="sm" className="w-full text-destructive text-[10px] uppercase font-bold" onClick={() => {}}>
                     <Unlink className="h-3 w-3 mr-2" /> Disconnect Zotero
                  </Button>
               </CardFooter>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-xl border-primary/10 overflow-hidden h-[600px] flex flex-col">
              <CardHeader className="bg-muted/20 pb-4 border-b">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-headline flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" /> Bibliographic Items
                  </CardTitle>
                  <Badge variant="outline">{items.length} Items</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="divide-y">
                    {items.map(item => (
                      <div key={item.key} className="p-4 flex flex-col gap-2 group hover:bg-muted/30 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <Badge variant="secondary" className="text-[9px] uppercase mb-1">{item.data.itemType}</Badge>
                            <h4 className="text-sm font-bold text-primary leading-tight">{item.data.title}</h4>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {item.data.creators?.[0]?.lastName || 'Unknown Author'} • {item.data.date?.split('-')[0] || 'n.d.'}
                            </p>
                          </div>
                          <Button variant="outline" size="sm" className="h-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleImportToLibrary(item)}>
                            <Download className="h-3 w-3 mr-2" /> Import Context
                          </Button>
                        </div>
                        {item.data.abstractNote && (
                          <p className="text-[11px] text-muted-foreground italic line-clamp-2 leading-relaxed">
                            "{item.data.abstractNote}"
                          </p>
                        )}
                      </div>
                    ))}
                    {items.length === 0 && !isSyncing && (
                      <div className="py-40 text-center opacity-30 italic flex flex-col items-center gap-4">
                        <BookOpen className="h-12 w-12" />
                        <p>No items found in this collection.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="bg-muted/30 border-t p-4 flex justify-between">
                 <p className="text-[10px] text-muted-foreground italic">
                   Importing an item pulls its abstract and metadata into your LexiVerse Context.
                 </p>
                 <Button size="sm" className="gap-2 h-8" disabled>
                   <Send className="h-3 w-3" /> Push Draft to Zotero
                 </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
});
