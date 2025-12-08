import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CommunityProfile {
  id: string;
  user_id: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  followers_count: number;
  following_count: number;
  created_at: string;
  updated_at: string;
}

export const useCommunityProfile = (userId?: string) => {
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  const fetchProfile = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('community_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkFollowing = async (currentUserId: string) => {
    if (!userId || userId === currentUserId) return;

    const { data } = await supabase
      .from('community_follows')
      .select('id')
      .eq('follower_id', currentUserId)
      .eq('following_id', userId)
      .maybeSingle();

    setIsFollowing(!!data);
  };

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  return { profile, loading, isFollowing, setIsFollowing, refetch: fetchProfile, checkFollowing };
};

export const useCommunityProfileActions = () => {
  const [saving, setSaving] = useState(false);

  const createProfile = async (data: {
    username: string;
    bio?: string;
    avatar_url?: string;
    banner_url?: string;
  }) => {
    setSaving(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { error } = await supabase.from('community_profiles').insert({
        user_id: user.user.id,
        username: data.username,
        bio: data.bio || null,
        avatar_url: data.avatar_url || null,
        banner_url: data.banner_url || null,
      });

      if (error) {
        if (error.code === '23505') {
          toast.error('Username already taken');
          return false;
        }
        throw error;
      }

      toast.success('Profile created!');
      return true;
    } catch (error: any) {
      console.error('Error creating profile:', error);
      toast.error(error.message || 'Failed to create profile');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = async (data: {
    username?: string;
    bio?: string;
    avatar_url?: string;
    banner_url?: string;
  }) => {
    setSaving(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('community_profiles')
        .update(data)
        .eq('user_id', user.user.id);

      if (error) {
        if (error.code === '23505') {
          toast.error('Username already taken');
          return false;
        }
        throw error;
      }

      toast.success('Profile updated!');
      return true;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const uploadImage = async (file: File, type: 'avatar' | 'banner') => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.user.id}/${type}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('community-profiles')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('community-profiles')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      return null;
    }
  };

  const followUser = async (followingId: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { error } = await supabase.from('community_follows').insert({
        follower_id: user.user.id,
        following_id: followingId,
      });

      if (error) throw error;
      toast.success('Following!');
      return true;
    } catch (error: any) {
      console.error('Error following user:', error);
      toast.error('Failed to follow user');
      return false;
    }
  };

  const unfollowUser = async (followingId: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('community_follows')
        .delete()
        .eq('follower_id', user.user.id)
        .eq('following_id', followingId);

      if (error) throw error;
      toast.success('Unfollowed');
      return true;
    } catch (error: any) {
      console.error('Error unfollowing user:', error);
      toast.error('Failed to unfollow');
      return false;
    }
  };

  return { createProfile, updateProfile, uploadImage, followUser, unfollowUser, saving };
};

export const useDiscoverUsers = (searchQuery: string = '') => {
  const [users, setUsers] = useState<CommunityProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('community_profiles')
        .select('*')
        .order('followers_count', { ascending: false })
        .limit(20);

      if (searchQuery) {
        query = query.or(`username.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return { users, loading, refetch: fetchUsers };
};
