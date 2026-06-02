
'use client';

/**
 * @fileOverview In-App Notification Center for scholarly status changes and peer interactions.
 */

import React, { useState, useEffect } from 'react';
import { Bell, BellDot, CheckCircle2, MessageCircle, AlertCircle, Trash2, Loader2 } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useUser, useMemoFirebase, useCollection } from '@/firebase';
import { collection, query, where, orderBy, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { ScholarlyNotification } from '@/types/scholarly';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export function NotificationCenter() {
  const db = useFirestore();
  const { user } = useUser();
  const [unreadCount, setUnreadCount] = useState(0);

  const notifQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'users', user.uid, 'notifications'),
      orderBy('createdAt', 'desc')
    );
  }, [db, user?.uid]);

  const { data: notifications, loading } = useCollection<ScholarlyNotification>(notifQuery);

  useEffect(() => {
    if (notifications) {
      setUnreadCount(notifications.filter(n => !n.read).length);
    }
  }, [notifications]);

  const markAsRead = async (id: string) => {
    if (!db || !user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'notifications', id), { read: true });
    } catch (e) { console.error("Mark read failed", e); }
  };

  const deleteNotif = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!db || !user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'notifications', id));
    } catch (e) { console.error("Delete failed", e); }
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
          {unreadCount > 0 ? <BellDot className="h-5 w-5 text-primary" /> : <Bell className="h-5 w-5" />}
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[8px] bg-destructive">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 shadow-2xl">
        <DropdownMenuLabel className="p-4 border-b bg-muted/30">
          <div className="flex justify-between items-center">
            <span className="font-headline text-lg">Notifications</span>
            {unreadCount > 0 && <Badge variant="secondary" className="text-[10px]">{unreadCount} New</Badge>}
          </div>
        </DropdownMenuLabel>
        <ScrollArea className="max-h-[400px]">
          <div className="py-2">
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary h-6 w-6" /></div>
            ) : notifications.length === 0 ? (
              <div className="p-10 text-center space-y-2 opacity-30 italic">
                <Bell className="h-8 w-8 mx-auto" />
                <p className="text-xs">No active alerts.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <DropdownMenuItem 
                  key={n.id} 
                  className={cn(
                    "p-4 cursor-pointer focus:bg-muted transition-colors flex gap-3 items-start border-l-4",
                    n.read ? "border-l-transparent" : "border-l-primary bg-primary/5"
                  )}
                  onClick={() => markAsRead(n.id!)}
                >
                  <div className="mt-1">
                    {n.type === 'wiki_status' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    {n.type === 'peer_interaction' && <MessageCircle className="h-4 w-4 text-primary" />}
                    {n.type === 'system' && <AlertCircle className="h-4 w-4 text-accent" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="font-bold text-xs leading-none">{n.title}</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">{n.message}</p>
                    <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-tighter">
                      {n.createdAt?.seconds ? new Date(n.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100" 
                    onClick={(e) => deleteNotif(e, n.id!)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </DropdownMenuItem>
              ))
            )}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
