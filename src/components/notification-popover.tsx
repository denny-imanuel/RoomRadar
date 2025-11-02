'use client';

import React, { useState, useEffect } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Bell, MessageSquare, Bookmark, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/hooks/use-user';
import type { Notification } from '@/lib/types';
import { getNotificationsForUser, markNotificationAsRead } from '@/lib/data-service';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function NotificationPopover() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function fetchNotifications() {
      if (user) {
        const userNotifications = await getNotificationsForUser(user.id);
        setNotifications(userNotifications);
        setUnreadCount(userNotifications.filter((n) => !n.read).length);
      }
    }
    fetchNotifications();
  }, [user]);

  const handleMarkAsRead = async (notificationId: string) => {
    if (!user) return;
    
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
        try {
            const updatedNotification = await markNotificationAsRead(user.id, notificationId);
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? updatedNotification : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    }
  };
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  }

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'new_message':
        return <MessageSquare className="h-5 w-5 text-primary" />;
      case 'new_booking':
      case 'booking_update':
        return <Bookmark className="h-5 w-5 text-green-500" />;
      case 'top_up_success':
      case 'withdrawal_success':
        return <Wallet className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0"
            >
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
            <h4 className="font-medium leading-none">Notifications</h4>
            <p className="text-sm text-muted-foreground">You have {unreadCount} unread notifications.</p>
        </div>
        <ScrollArea className="h-80">
            {notifications.length > 0 ? (
                notifications.map((notification) => (
                    <Link 
                        href={notification.link || '#'} 
                        key={notification.id}
                        onClick={() => handleMarkAsRead(notification.id)}
                    >
                        <div className={cn(
                            "p-4 border-b flex items-start gap-4 hover:bg-accent",
                            !notification.read && "bg-secondary/50"
                        )}>
                            <div className="mt-1">{getIcon(notification.type)}</div>
                            <div className="flex-1">
                                <p className={cn("text-sm", !notification.read && "font-semibold")}>{notification.message}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {new Date(notification.date).toLocaleString()}
                                </p>
                            </div>
                            {!notification.read && (
                                <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
                            )}
                        </div>
                    </Link>
                ))
            ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                    No notifications yet.
                </div>
            )}
        </ScrollArea>
        <div className="p-2 border-t text-center">
            <Button variant="link" size="sm" className="text-primary">
                View all notifications
            </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
