import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send, User, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BottomNav } from '@/components/BottomNav';
import { useConversations, useMessages, useMessageActions, Conversation } from '@/hooks/useDirectMessages';
import { supabase } from '@/integrations/supabase/client';
import { format, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';

const Messages = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { conversations, loading: convsLoading, refetch: refetchConvs } = useConversations();
  const { messages, loading: msgsLoading } = useMessages(selectedConversation?.id || null);
  const { sendMessage, markAsRead, sending, getOrCreateConversation } = useMessageActions();

  // Handle direct message to user from URL param
  useEffect(() => {
    const toUserId = searchParams.get('to');
    if (toUserId && currentUserId && toUserId !== currentUserId) {
      handleStartConversation(toUserId);
    }
  }, [searchParams, currentUserId]);

  const handleStartConversation = async (userId: string) => {
    const convId = await getOrCreateConversation(userId);
    if (convId) {
      await refetchConvs();
      const conv = conversations.find(c => c.id === convId);
      if (conv) {
        setSelectedConversation(conv);
      } else {
        // Fetch the new conversation
        const { data } = await supabase
          .from('direct_message_conversations')
          .select('*')
          .eq('id', convId)
          .single();
        
        if (data) {
          const { data: profile } = await supabase
            .from('community_profiles')
            .select('user_id, username, avatar_url')
            .eq('user_id', userId)
            .maybeSingle();

          setSelectedConversation({
            ...data,
            other_user: profile || { user_id: userId, username: 'Unknown', avatar_url: null },
          });
        }
      }
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setCurrentUserId(user.id);
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (selectedConversation) {
      markAsRead(selectedConversation.id);
    }
  }, [selectedConversation, messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const success = await sendMessage(selectedConversation.id, newMessage.trim());
    if (success) {
      setNewMessage('');
    }
  };

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return 'Yesterday ' + format(date, 'HH:mm');
    return format(date, 'MMM d, HH:mm');
  };

  if (selectedConversation) {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-20">
        {/* Chat Header */}
        <header className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setSelectedConversation(null)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Avatar 
              className="w-10 h-10 cursor-pointer" 
              onClick={() => navigate(`/community/user/${selectedConversation.other_user?.user_id}`)}
            >
              <AvatarImage src={selectedConversation.other_user?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                <User className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">@{selectedConversation.other_user?.username}</p>
            </div>
          </div>
        </header>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {msgsLoading ? (
            <div className="space-y-3">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className={cn("flex", i % 2 === 0 ? "justify-end" : "justify-start")}>
                  <Skeleton className="h-10 w-48 rounded-2xl" />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
              <MessageCircle className="w-12 h-12 mb-3 opacity-50" />
              <p>No messages yet</p>
              <p className="text-sm">Send a message to start the conversation</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => {
                const isOwn = msg.sender_id === currentUserId;
                return (
                  <div key={msg.id} className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[75%] px-4 py-2 rounded-2xl",
                        isOwn
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted rounded-bl-sm"
                      )}
                    >
                      <p className="text-sm break-words">{msg.content}</p>
                      <p className={cn(
                        "text-[10px] mt-1",
                        isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}>
                        {formatMessageTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Message Input */}
        <div className="sticky bottom-20 bg-background border-t border-border px-4 py-3">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              disabled={sending}
            />
            <Button onClick={handleSend} disabled={sending || !newMessage.trim()}>
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/community')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Messages</h1>
          </div>
        </div>
      </header>

      {/* Conversations List */}
      <div className="p-4 space-y-3">
        {convsLoading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          ))
        ) : conversations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No conversations yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Start a conversation from a user's profile
              </p>
              <Button className="mt-4" onClick={() => navigate('/community')}>
                Discover Users
              </Button>
            </CardContent>
          </Card>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => setSelectedConversation(conv)}
            >
              <Avatar className="w-12 h-12">
                <AvatarImage src={conv.other_user?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  <User className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium truncate">@{conv.other_user?.username}</p>
                  <span className="text-xs text-muted-foreground">
                    {formatMessageTime(conv.last_message_at)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {conv.last_message || 'No messages yet'}
                </p>
              </div>
              {(conv.unread_count || 0) > 0 && (
                <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                  {conv.unread_count}
                </span>
              )}
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Messages;
