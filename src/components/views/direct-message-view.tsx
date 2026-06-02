
'use client';

/**
 * @fileOverview Direct Messaging View.
 * Enables private peer-to-peer scholarly discourse.
 */

import React, { memo, useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, User, Search, Loader2, ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { sanitizeHtml } from '@/lib/sanitization';

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
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch unique conversations for the current user
  useEffect(() => {
    if (!db || !user) return;

    const q = query(
      collection(db, 'direct_messages'),
      where('participants', 'array-contains', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const allMsgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Extract unique peer users from messages
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

  // Fetch messages for selected user
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
      await addDoc(collection(db, 'direct_messages'), msgData);
    } catch (e) {
      console.error("DM Send failed", e);
    }
  };

  if (!user) return <div className="p-20 text-center italic">Please sign in to access private discourse.</div>;

  return (
    <div className="h-[calc(100vh-12rem)] flex gap-6 animate-in fade-in duration-500">
      {/* Sidebar: Conversations */}
      <Card className="w-80 flex flex-col shadow-lg border-primary/10 overflow-hidden">
        <CardHeader className="bg-primary/5 py-4 border-b">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
            <MessageCircle className="h-4 w-4" /> Peer Conversations
          </CardTitle>
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
              {conversations.length === 0 && (
                <div className="p-10 text-center opacity-30 italic text-xs">No private threads yet.</div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Main Chat Area */}
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
              <Button variant="ghost" size="icon" onClick={() => setSelectedUser(null)} className="md:hidden">
                 <ArrowLeft className="h-4 w-4" />
              </Button>
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
                          <div className={cn("text-[8px] mt-1 opacity-60", isOwn ? "text-right" : "text-left")}>
                            {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                          </div>
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
            <div>
              <h3 className="text-xl font-headline font-bold">Select a Colleague</h3>
              <p className="text-sm italic">Initiate private discourse with other scholars.</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
});
