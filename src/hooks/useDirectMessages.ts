import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Conversation {
  id: string;
  participant_one: string;
  participant_two: string;
  last_message_at: string;
  created_at: string;
  other_user?: {
    user_id: string;
    username: string;
    avatar_url: string | null;
  };
  last_message?: string;
  unread_count?: number;
}

export interface DirectMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;
      setCurrentUserId(user.user.id);

      const { data, error } = await supabase
        .from('direct_message_conversations')
        .select('*')
        .or(`participant_one.eq.${user.user.id},participant_two.eq.${user.user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Fetch other user profiles and last messages
      const enrichedConversations = await Promise.all(
        (data || []).map(async (conv) => {
          const otherUserId = conv.participant_one === user.user.id 
            ? conv.participant_two 
            : conv.participant_one;

          const { data: profile } = await supabase
            .from('community_profiles')
            .select('user_id, username, avatar_url')
            .eq('user_id', otherUserId)
            .maybeSingle();

          const { data: lastMsg } = await supabase
            .from('direct_messages')
            .select('content, is_read, sender_id')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const { count } = await supabase
            .from('direct_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .neq('sender_id', user.user.id);

          return {
            ...conv,
            other_user: profile || { user_id: otherUserId, username: 'Unknown', avatar_url: null },
            last_message: lastMsg?.content,
            unread_count: count || 0,
          };
        })
      );

      setConversations(enrichedConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return { conversations, loading, currentUserId, refetch: fetchConversations };
};

export const useMessages = (conversationId: string | null) => {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Real-time subscription
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as DirectMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  return { messages, loading, refetch: fetchMessages };
};

export const useMessageActions = () => {
  const [sending, setSending] = useState(false);

  const getOrCreateConversation = async (otherUserId: string): Promise<string | null> => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // Check for existing conversation (either direction)
      const { data: existing } = await supabase
        .from('direct_message_conversations')
        .select('id')
        .or(
          `and(participant_one.eq.${user.user.id},participant_two.eq.${otherUserId}),and(participant_one.eq.${otherUserId},participant_two.eq.${user.user.id})`
        )
        .maybeSingle();

      if (existing) return existing.id;

      // Create new conversation
      const { data: newConv, error } = await supabase
        .from('direct_message_conversations')
        .insert({
          participant_one: user.user.id,
          participant_two: otherUserId,
        })
        .select('id')
        .single();

      if (error) throw error;
      return newConv.id;
    } catch (error: any) {
      console.error('Error getting/creating conversation:', error);
      toast.error('Failed to start conversation');
      return null;
    }
  };

  const sendMessage = async (conversationId: string, content: string): Promise<boolean> => {
    setSending(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { error } = await supabase.from('direct_messages').insert({
        conversation_id: conversationId,
        sender_id: user.user.id,
        content,
      });

      if (error) throw error;

      // Update last_message_at
      await supabase
        .from('direct_message_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      return true;
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      return false;
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.user.id)
        .eq('is_read', false);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  return { getOrCreateConversation, sendMessage, markAsRead, sending };
};
