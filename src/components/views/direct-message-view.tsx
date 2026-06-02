'use client';

/**
 * @fileOverview Direct Messaging View.
 * Enables private peer-to-peer scholarly discourse.
 * Enhanced with Colleague Search and Automated Notifications.
 */

import React, { memo, useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, User, Search, Loader2, ArrowLeft, Users, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, limit } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { sanitizeHtml } from '@/lib/sanitization';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface DirectMessageViewProps {
  initialRecipient?: { uid: string; displayName: string; photoURL: string } | null;
}

export const DirectMessageView = memo(({ initialRecipient }: DirectMessageViewProps) => {
  const db = useFirestore();
  const { user } = useUser();
  const [messages, setChatMessages] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(initialRecipient || null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!db || !user) return;

    const q = query(
      collection(db, 'direct_messages'),
      where('participants', 'array-contains', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const allMsgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const peers: Record<string, any> = {};
      allMsgs.forEach((m: any) => {
        const peerUid = m.senderUid === user.uid ? m.receiverUid : m.senderUid;
        if (!peers[peerUid]) {
          peers[peerUid] = {
            uid: peerUid,
            displayName: m.senderUid === user.uid ? (m.receiverName || 'Scholar') : (m.senderName || 'Scholar'),
            photoURL: m.senderUid === user.uid ? m.receiverPhotoURL : m.senderPhotoURL,
            lastMessage: m.content,
            timestamp: m.createdAt
          };
        }
      });

      setConversations(Object.values(peers));
      setIsLoading(false);
    });

    return () => unsub();
  }, [db, user]);

  useEffect(() => {
    if (!db || !user || !selectedUser) {
      setChatMessages([]);
      return;
    }

    const q = query(
      collection(db, 'direct_messages'),
      where('participants', 'array-contains', user.uid),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const filtered = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((m: any) => m.participants.includes(selectedUser.uid));
      setChatMessages(filtered);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => unsub();
  }, [db, user, selectedUser]);

  const handleUserSearch = async (val: string) => {
    setUserSearchTerm(val);
    if (val.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const q = query(
        collection(db, 'users'),
        where('displayName', '>=', val),
        where('displayName', '<=', val + '\uf8ff'),
        limit(5)
      );
      const snap = await getDocs(q);
      setSearchResults(snap.docs.map(d => ({ uid: d.id, ...d.data() })).filter(u => u.uid !== user?.uid));
    } catch (e) {
      console.error("User search failed", e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const sanitized = sanitizeHtml(newMessage);
    if (!user || !selectedUser || !sanitized.trim()) return;

    const msgData = {
      content: sanitized.trim(),
      senderUid: user.uid,
      senderName: sanitizeHtml(user.displayName || 'Scholar'),
      senderPhotoURL: user.photoURL || '',
      receiverUid: selectedUser.uid,
      receiverName: sanitizeHtml(selectedUser.displayName),
      receiverPhotoURL: selectedUser.photoURL || '',
      participants: [user.uid, selectedUser.uid].sort(),
      createdAt: serverTimestamp()
    };

    setNewMessage('');
    try {
      // 1. Send the Message
      await addDoc(collection(db, 'direct_messages'), msgData);
      
      // 2. Create Notification for Receiver
      await addDoc(collection(db, 'users', selectedUser.uid, 'notifications'), {
        userId: selectedUser.uid,
        title: "New Private Message",
        message: `${user.displayName || 'A scholar'} sent you a direct message.`,
        type: 'peer_interaction',
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error("DM Send failed", e);
    }
  };

  if (!user) return <div className="p-20 text-center italic">Please sign in to access private discourse.</div>;

  return (
    <div className="h-[calc(100vh-12rem)] flex gap-6 animate-in fade-in duration-500">
      <Card className="w-80 flex flex-col shadow-lg border-primary/10 overflow-hidden">
        <CardHeader className="bg-primary/5 py-4 border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
              <MessageCircle className="h-4 w-4" /> Conversations
            </CardTitle>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle className="font-headline">Discover Colleagues</DialogTitle>
                  <DialogDescription>Search the registry to initiate a new discourse.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="relative">
                    <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search by name..." 
                      className="pl-8" 
                      value={userSearchTerm}
                      onChange={(e) => handleUserSearch(e.target.value)}
                    />
                  </div>
                  <ScrollArea className="max-h-[300px]">
                    <div className="space-y-2">
                      {isSearching ? (
                        <div className="flex justify-center py-4"><Loader2 className="animate-spin h-5 w-5 opacity-30" /></div>
                      ) : searchResults.map((u) => (
                        <div 
                          key={u.uid} 
                          className="p-3 flex items-center gap-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                          onClick={() => { setSelectedUser(u); setUserSearchTerm(''); setSearchResults([]); }}
                        >
                          <Avatar className="h-8 w-8 border">
                            <AvatarImage src={u.photoURL} />
                            <AvatarFallback>{u.displayName?.[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-bold">{u.displayName}</p>
                            <p className="text-[10px] text-muted-foreground">{u.designation || 'Scholar'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="divide-y">
              {conversations.map((peer) => (
                <div 
                  key={peer.uid} 
                  className={cn(
                    "p-4 cursor-pointer transition-all hover:bg-muted/50 flex gap-3 items-center",
                    selectedUser?.uid === peer.uid ? "bg-primary/5 border-l-4 border-primary" : ""
                  )}
                  onClick={() => setSelectedUser(peer)}
                >
                  <Avatar className="h-10 w-10 border shadow-sm">
                    <AvatarImage src={peer.photoURL} />
                    <AvatarFallback>{peer.displayName?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-bold text-sm truncate">{peer.displayName}</p>
                    <p className="text-[10px] text-muted-foreground truncate italic">"{peer.lastMessage}"</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="flex-1 flex flex-col shadow-xl border-primary/10 overflow-hidden bg-card/30 backdrop-blur-sm">
        {selectedUser ? (
          <>
            <CardHeader className="bg-background/80 py-3 border-b flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8 border">
                  <AvatarImage src={selectedUser.photoURL} />
                  <AvatarFallback>{selectedUser.displayName?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-sm font-bold">{selectedUser.displayName}</CardTitle>
                  <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Secure Private Discourse</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              <ScrollArea className="h-full px-6 py-6">
                <div className="space-y-4">
                  {messages.map((msg, i) => {
                    const isOwn = msg.senderUid === user.uid;
                    return (
                      <div key={msg.id || i} className={cn("flex gap-2", isOwn ? "flex-row-reverse" : "flex-row")}>
                        <div className={cn("max-w-[75%] p-3 rounded-2xl text-sm shadow-sm border", isOwn ? "bg-primary text-primary-foreground rounded-tr-none border-primary" : "bg-background rounded-tl-none border-border")}>
                          {msg.content}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter className="p-4 border-t bg-muted/20">
              <form onSubmit={handleSendMessage} className="flex gap-2 w-full">
                <Input 
                  placeholder="Type a private message..." 
                  value={newMessage} 
                  onChange={e => setNewMessage(e.target.value)}
                  className="rounded-xl bg-background shadow-inner h-11"
                />
                <Button type="submit" disabled={!newMessage.trim()} className="rounded-xl h-11 px-6 shadow-md">
                   <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardFooter>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-20 py-20">
            <MessageCircle className="h-20 w-20" />
            <h3 className="text-xl font-headline font-bold">Select a Colleague</h3>
          </div>
        )}
      </Card>
    </div>
  );
});
