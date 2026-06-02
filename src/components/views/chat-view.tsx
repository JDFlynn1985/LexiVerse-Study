
/*
 * Title: LexiVerse
 * Copyright © 2026 Joshua Flynn <joshuaflynn040@gmail.com>
 * Source: https://github.com/JDFlynn1985/LexiVerse
 *
 * This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 
 * International License. To view a copy of this license, visit:
 * http://creativecommons.org
 *
 * @fileOverview Modular Chat Hub for scholarly discourse with automated DMCA reporting.
 */

'use client';

import React, { memo } from 'react';
import { MessageSquare, Users, Building2, Send, ShieldAlert } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { UserProfile } from '@/types/scholarly';
import { useLanguage } from '@/components/language-provider';
import { DMCADialog } from '@/components/dmca-dialog';

interface ChatViewProps {
  chatMode: 'global' | 'institutional';
  setChatMode: (mode: 'global' | 'institutional') => void;
  userProfile: UserProfile | null;
  userInstitutionName: string;
  messages: any[];
  user: any;
  newMessage: string;
  setNewMessage: (msg: string) => void;
  chatAgreed: boolean;
  setChatAgreed: (val: boolean) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
}

export const ChatView = memo(({ 
  chatMode, 
  setChatMode, 
  userProfile, 
  userInstitutionName, 
  messages, 
  user, 
  newMessage, 
  setNewMessage, 
  chatAgreed,
  setChatAgreed,
  handleSendMessage, 
  chatEndRef 
}: ChatViewProps) => {
  const { t } = useLanguage();

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col gap-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-primary" /> Social Chat Hub
          </h1>
          <p className="text-muted-foreground">Engage in peer discourse and institutional seminars.</p>
        </div>
        <div className="flex p-1 bg-muted rounded-lg w-fit self-end">
          <Button variant={chatMode === 'global' ? 'secondary' : 'ghost'} size="sm" onClick={() => setChatMode('global')} className="gap-2">
            <Users className="h-4 w-4" /> Global
          </Button>
          <Button variant={chatMode === 'institutional' ? 'secondary' : 'ghost'} size="sm" onClick={() => setChatMode('institutional')} className="gap-2" disabled={!userProfile?.institutionId}>
            <Building2 className="h-4 w-4" /> {userProfile?.institutionId ? 'My Institution' : 'Institution Required'}
          </Button>
        </div>
      </header>

      <Card className="flex-1 flex flex-col shadow-xl border-primary/10 overflow-hidden bg-card/30 backdrop-blur-sm">
        <CardHeader className="bg-primary/5 py-3 border-b">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="bg-background/50 border-primary/20">
              {chatMode === 'global' ? 'DISCOURSE: GLOBAL CHANNEL' : `SEMINAR: ${userInstitutionName}`}
            </Badge>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> Live Feed Active
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full px-6 py-6">
            <div className="space-y-6">
              {[...(messages || [])].reverse().map((msg, i) => {
                if (msg.status === 'removed_dmca') {
                  return (
                    <div key={msg.id || i} className="flex justify-center py-2">
                      <Badge variant="outline" className="text-[10px] text-muted-foreground italic border-dashed px-4 py-1">
                        Content removed for copyright review
                      </Badge>
                    </div>
                  );
                }

                const isOwn = msg.senderUid === user?.uid;
                return (
                  <div key={msg.id || i} className={cn("flex gap-3 group", isOwn ? "flex-row-reverse" : "flex-row")}>
                    <Avatar className="h-9 w-9 shrink-0 border-2 border-background shadow-sm">
                      <AvatarImage src={msg.senderPhotoURL} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">{msg.senderName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className={cn("flex flex-col max-w-[80%] gap-1", isOwn ? "items-end" : "items-start")}>
                      <div className="flex items-center gap-2 px-1">
                        <span className="text-[11px] font-bold">{msg.senderName}</span>
                        <Badge variant="ghost" className="text-[9px] h-4 px-1.5 uppercase tracking-tighter opacity-60">
                          {msg.senderDesignation}
                        </Badge>
                      </div>
                      <div className={cn("p-3 rounded-2xl text-sm shadow-sm border relative", isOwn ? "bg-primary text-primary-foreground rounded-tr-none border-primary" : "bg-background rounded-tl-none border-border")}>
                        <p className="leading-relaxed">{msg.content}</p>
                        
                        {/* Inline DMCA Report Tool */}
                        {!isOwn && (
                          <div className="absolute top-0 -right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                             <DMCADialog 
                               contentId={msg.id} 
                               contentType="chat" 
                               trigger={<Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive"><ShieldAlert className="h-3 w-3" /></Button>}
                             />
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] text-muted-foreground px-1">
                        {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending...'}
                        {chatMode === 'global' && msg.senderInstitutionName && ` • ${msg.senderInstitutionName}`}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
              {messages?.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 opacity-20 text-center space-y-4">
                  <MessageSquare className="h-16 w-16" />
                  <p className="italic">The scholarly discourse begins with a single word.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="p-4 bg-muted/30 border-t flex flex-col gap-3">
          <form onSubmit={handleSendMessage} className="flex gap-2 w-full">
            <Input 
              placeholder={user ? "Share your scholarly insights..." : "Please sign in to participate..."} 
              className="h-11 rounded-xl bg-background border-primary/20 shadow-inner"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              disabled={!user}
            />
            <Button type="submit" disabled={!user || !newMessage.trim() || !chatAgreed} className="h-11 w-11 rounded-xl shrink-0 shadow-lg">
              <Send className="h-5 w-5" />
            </Button>
          </form>
          <div className="flex items-center gap-2 px-1">
            <Checkbox 
              id="chat-license" 
              checked={chatAgreed} 
              onCheckedChange={(val) => setChatAgreed(!!val)} 
              disabled={!user}
            />
            <label htmlFor="chat-license" className="text-[10px] text-muted-foreground cursor-pointer select-none">
              {t.contribution.license_agreement}
            </label>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
});
