'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser } from '@/hooks/use-user';
import { Search, Send, CircleUser, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import React, { useEffect, useState, useCallback } from 'react';
import type { Message, User, Conversation, WithId } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams } from 'next/navigation';
import { getConversationsForUser, getMessagesForConversation, sendMessage } from '@/lib/data-service';

function MessagesPageSkeleton() {
  return (
    <div className="h-[calc(100vh-8rem)] grid md:grid-cols-3 lg:grid-cols-4 gap-4">
      <Card className="md:col-span-1 lg:col-span-1 flex flex-col">
        <div className="p-4 border-b">
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-9 w-full" />
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>
      <Card className="md:col-span-2 lg:col-span-3 flex flex-col h-full">
         <div className="flex items-center gap-4 p-4 border-b">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
          <div className="flex-1 p-4 space-y-4">
            <div className="flex justify-start gap-2"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-12 w-48" /></div>
            <div className="flex justify-end gap-2"><Skeleton className="h-12 w-48" /><Skeleton className="h-8 w-8 rounded-full" /></div>
            <div className="flex justify-start gap-2"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-16 w-64" /></div>
            <div className="flex justify-end gap-2"><Skeleton className="h-12 w-32" /><Skeleton className="h-8 w-8 rounded-full" /></div>
          </div>
          <div className="p-4 border-t">
            <Skeleton className="h-10 w-full" />
          </div>
      </Card>
    </div>
  );
}

export default function MessagesPage() {
  const { user } = useUser();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(true);
  const [conversations, setConversations] = useState<WithId<Conversation>[]>([]);
  const [messages, setMessages] = useState<WithId<Message>[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<WithId<Conversation> | null>(null);
  const [participants, setParticipants] = useState<Record<string, User>>({});
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    async function fetchConversations() {
        if (user) {
            setIsLoading(true);
            const { conversations, participants } = await getConversationsForUser(user.id);
            setConversations(conversations);
            setParticipants(participants);

            const recipientId = searchParams.get('recipientId');
            let convoToSelect = null;
            if (recipientId) {
                convoToSelect = conversations.find(c => c.participants.includes(recipientId)) || null;
            }
            if (!convoToSelect && conversations.length > 0) {
                convoToSelect = conversations[0];
            }
            setSelectedConversation(convoToSelect);
            setIsLoading(false);
        }
    }
    fetchConversations();
  }, [user, searchParams]);

  useEffect(() => {
    async function fetchMessages() {
        if (selectedConversation) {
            const conversationMessages = await getMessagesForConversation(selectedConversation.id);
            setMessages(conversationMessages);
        } else {
            setMessages([]);
        }
    }
    fetchMessages();
  }, [selectedConversation]);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedConversation || !newMessage.trim()) return;

    const newMsg = await sendMessage(selectedConversation.id, user.id, newMessage.trim());
    
    setMessages(prev => [...prev, newMsg]);
    setNewMessage('');

    // Update conversation list with new last message
    setConversations(prev => prev.map(c => 
        c.id === selectedConversation.id 
        ? { ...c, lastMessage: { text: newMsg.text, senderId: newMsg.senderId, timestamp: newMsg.timestamp }} 
        : c
    ));
  };

  const getOtherParticipant = (convo: WithId<Conversation>) => {
    if (!user) return undefined;
    const otherId = convo.participants.find(p => p !== user.id);
    return otherId ? participants[otherId] : undefined;
  };

  if (isLoading) {
    return <MessagesPageSkeleton />;
  }

  if (!user) return null;

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-center">
        <MessageSquare className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold">No Messages Yet</h2>
        <p className="text-muted-foreground">
          When you contact a landlord or a tenant replies, your messages will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] grid md:grid-cols-3 lg:grid-cols-4 gap-4">
      <Card className="md:col-span-1 lg:col-span-1 flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-2xl font-bold font-headline">Messages</h1>
           <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search conversations..." className="pl-8" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2">
            {conversations.map((convo) => {
              const otherParticipant = getOtherParticipant(convo);
              if (!otherParticipant) return null;
              return (
                <button
                  key={convo.id}
                  onClick={() => setSelectedConversation(convo)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-all hover:bg-accent',
                    selectedConversation?.id === convo.id ? 'bg-accent' : ''
                  )}
                >
                  <Avatar>
                    <AvatarImage src={otherParticipant.profilePicture} alt={otherParticipant.name} />
                    <AvatarFallback><CircleUser/></AvatarFallback>
                  </Avatar>
                  <div className="flex-1 truncate">
                    <p className="font-medium">{`${otherParticipant.firstName} ${otherParticipant.lastName}`}</p>
                    <p className="text-sm text-muted-foreground truncate">{convo.lastMessage.text}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </ScrollArea>
      </Card>

      {selectedConversation ? (
        <Card className="md:col-span-2 lg:col-span-3 flex flex-col h-full">
          <div className="flex items-center gap-4 p-4 border-b">
            <Avatar>
              <AvatarImage src={getOtherParticipant(selectedConversation)?.profilePicture} alt={getOtherParticipant(selectedConversation)?.name} />
              <AvatarFallback><CircleUser /></AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{getOtherParticipant(selectedConversation)?.name}</h2>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex items-end gap-2',
                    message.senderId === user.id ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.senderId !== user.id && (
                    <Avatar className="h-8 w-8">
                       <AvatarImage src={getOtherParticipant(selectedConversation)?.profilePicture} />
                      <AvatarFallback><CircleUser /></AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      'max-w-xs rounded-lg p-3 text-sm md:max-w-md',
                      message.senderId === user.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary'
                    )}
                  >
                    <p>{message.text}</p>
                    <p className={cn("text-xs mt-1 text-right", message.senderId === user.id ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                       {new Date(message.timestamp as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 border-t">
            <form className="flex items-center gap-2" onSubmit={handleSendMessage}>
              <Input 
                placeholder="Type a message..." 
                className="flex-1"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <Button type="submit" size="icon">
                <Send className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </div>
        </Card>
      ) : (
        <Card className="md:col-span-2 lg:col-span-3 flex flex-col h-full items-center justify-center text-center">
            <MessageSquare className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold">Select a Conversation</h2>
            <p className="text-muted-foreground">
              Choose a conversation from the left to view messages.
            </p>
        </Card>
      )}
    </div>
  );
}
