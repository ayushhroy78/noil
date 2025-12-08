import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type PostType = 'question' | 'success_story' | 'tip' | 'recipe';
export type SortOption = 'new' | 'top';

export interface CommunityPost {
  id: string;
  user_id: string;
  title: string;
  body: string;
  post_type: PostType;
  tags: string[];
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  is_hidden: boolean;
  vote_count: number;
  comment_count: number;
  user_voted: boolean;
  author_name?: string;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
  is_deleted: boolean;
  author_name?: string;
}

export interface CreatePostData {
  title: string;
  body: string;
  post_type: PostType;
  tags?: string[];
}

export function useCommunityPosts(
  filter: PostType | 'all' = 'all',
  sort: SortOption = 'new',
  page: number = 1,
  pageSize: number = 10
) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      let query = supabase
        .from('community_posts')
        .select('*')
        .eq('is_deleted', false)
        .eq('is_hidden', false);

      if (filter !== 'all') {
        query = query.eq('post_type', filter);
      }

      if (sort === 'new') {
        query = query.order('created_at', { ascending: false });
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data: postsData, error } = await query;

      if (error) throw error;

      // Fetch vote counts and comment counts
      const postIds = postsData?.map(p => p.id) || [];
      
      const [votesResult, commentsResult, userVotesResult] = await Promise.all([
        supabase
          .from('community_votes')
          .select('post_id, value')
          .in('post_id', postIds),
        supabase
          .from('community_comments')
          .select('post_id')
          .in('post_id', postIds)
          .eq('is_deleted', false),
        userId 
          ? supabase
              .from('community_votes')
              .select('post_id')
              .in('post_id', postIds)
              .eq('user_id', userId)
          : Promise.resolve({ data: [] })
      ]);

      // Calculate vote counts
      const voteCounts: Record<string, number> = {};
      votesResult.data?.forEach(v => {
        voteCounts[v.post_id] = (voteCounts[v.post_id] || 0) + v.value;
      });

      // Calculate comment counts
      const commentCounts: Record<string, number> = {};
      commentsResult.data?.forEach(c => {
        commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1;
      });

      // Track user votes
      const userVotes = new Set(userVotesResult.data?.map(v => v.post_id));

      // Fetch author names from user_profiles
      const userIds = [...new Set(postsData?.map(p => p.user_id) || [])];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const profileMap: Record<string, string> = {};
      profiles?.forEach(p => {
        profileMap[p.user_id] = p.full_name || `User ${p.user_id.slice(0, 6)}`;
      });

      const enrichedPosts: CommunityPost[] = (postsData || []).map(post => ({
        ...post,
        post_type: post.post_type as PostType,
        tags: post.tags || [],
        vote_count: voteCounts[post.id] || 0,
        comment_count: commentCounts[post.id] || 0,
        user_voted: userVotes.has(post.id),
        author_name: profileMap[post.user_id] || `User ${post.user_id.slice(0, 6)}`
      }));

      // Sort by top if needed (after getting vote counts)
      if (sort === 'top') {
        enrichedPosts.sort((a, b) => b.vote_count - a.vote_count);
      }

      setPosts(enrichedPosts);
      setHasMore(postsData?.length === pageSize);
    } catch (error: any) {
      toast({
        title: "Error loading posts",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [filter, sort, page, pageSize, toast]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('community-posts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'community_posts' },
        () => fetchPosts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPosts]);

  return { posts, loading, hasMore, refetch: fetchPosts };
}

export function useCommunityPost(postId: string | undefined) {
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPost = useCallback(async () => {
    if (!postId) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      const { data: postData, error } = await supabase
        .from('community_posts')
        .select('*')
        .eq('id', postId)
        .eq('is_deleted', false)
        .eq('is_hidden', false)
        .single();

      if (error) throw error;

      // Fetch comments
      const { data: commentsData } = await supabase
        .from('community_comments')
        .select('*')
        .eq('post_id', postId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      // Fetch vote count
      const { data: votes } = await supabase
        .from('community_votes')
        .select('value')
        .eq('post_id', postId);

      const voteCount = votes?.reduce((sum, v) => sum + v.value, 0) || 0;

      // Check if user voted
      const { data: userVote } = userId
        ? await supabase
            .from('community_votes')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', userId)
            .maybeSingle()
        : { data: null };

      // Fetch author names
      const userIds = [
        postData.user_id,
        ...(commentsData?.map(c => c.user_id) || [])
      ];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, full_name')
        .in('user_id', [...new Set(userIds)]);

      const profileMap: Record<string, string> = {};
      profiles?.forEach(p => {
        profileMap[p.user_id] = p.full_name || `User ${p.user_id.slice(0, 6)}`;
      });

      setPost({
        ...postData,
        post_type: postData.post_type as PostType,
        tags: postData.tags || [],
        vote_count: voteCount,
        comment_count: commentsData?.length || 0,
        user_voted: !!userVote,
        author_name: profileMap[postData.user_id] || `User ${postData.user_id.slice(0, 6)}`
      });

      setComments(
        (commentsData || []).map(c => ({
          ...c,
          author_name: profileMap[c.user_id] || `User ${c.user_id.slice(0, 6)}`
        }))
      );
    } catch (error: any) {
      toast({
        title: "Error loading post",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [postId, toast]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  // Realtime for comments and votes
  useEffect(() => {
    if (!postId) return;

    const channel = supabase
      .channel(`post-${postId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'community_comments', filter: `post_id=eq.${postId}` },
        () => fetchPost()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'community_votes', filter: `post_id=eq.${postId}` },
        () => fetchPost()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, fetchPost]);

  return { post, comments, loading, refetch: fetchPost };
}

export function useCommunityActions() {
  const { toast } = useToast();

  const createPost = async (data: CreatePostData): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please login to create a post");

      const { data: newPost, error } = await supabase
        .from('community_posts')
        .insert({
          user_id: user.id,
          title: data.title,
          body: data.body,
          post_type: data.post_type,
          tags: data.tags || []
        })
        .select('id')
        .single();

      if (error) throw error;

      toast({ title: "Post created successfully!" });
      return newPost.id;
    } catch (error: any) {
      toast({
        title: "Error creating post",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const vote = async (postId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please login to vote");

      // Check if already voted
      const { data: existing } = await supabase
        .from('community_votes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // Remove vote
        await supabase
          .from('community_votes')
          .delete()
          .eq('id', existing.id);
      } else {
        // Add vote
        await supabase
          .from('community_votes')
          .insert({
            post_id: postId,
            user_id: user.id,
            value: 1
          });
      }

      return true;
    } catch (error: any) {
      toast({
        title: "Error voting",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const addComment = async (postId: string, body: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please login to comment");

      const { error } = await supabase
        .from('community_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          body
        });

      if (error) throw error;

      toast({ title: "Comment added!" });
      return true;
    } catch (error: any) {
      toast({
        title: "Error adding comment",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const deletePost = async (postId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('community_posts')
        .update({ is_deleted: true })
        .eq('id', postId);

      if (error) throw error;

      toast({ title: "Post deleted" });
      return true;
    } catch (error: any) {
      toast({
        title: "Error deleting post",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteComment = async (commentId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('community_comments')
        .update({ is_deleted: true })
        .eq('id', commentId);

      if (error) throw error;

      toast({ title: "Comment deleted" });
      return true;
    } catch (error: any) {
      toast({
        title: "Error deleting comment",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const reportContent = async (
    postId: string | null,
    commentId: string | null,
    reason: string
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please login to report");

      const { error } = await supabase
        .from('community_reports')
        .insert({
          post_id: postId,
          comment_id: commentId,
          reported_by: user.id,
          reason
        });

      if (error) throw error;

      toast({ title: "Report submitted. Thank you for helping keep our community safe." });
      return true;
    } catch (error: any) {
      toast({
        title: "Error submitting report",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const hidePost = async (postId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('community_posts')
        .update({ is_hidden: true })
        .eq('id', postId);

      if (error) throw error;

      toast({ title: "Post hidden" });
      return true;
    } catch (error: any) {
      toast({
        title: "Error hiding post",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    createPost,
    vote,
    addComment,
    deletePost,
    deleteComment,
    reportContent,
    hidePost
  };
}
