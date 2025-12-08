import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, MapPin, Calendar, Settings, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BottomNav } from '@/components/BottomNav';
import { useCommunityProfile, useCommunityProfileActions } from '@/hooks/useCommunityProfile';
import { useCommunityPosts } from '@/hooks/useCommunity';
import CommunityPostCard from '@/components/community/CommunityPostCard';
import { CommunityProfileSetup } from '@/components/community/CommunityProfileSetup';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';

const CommunityUserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const targetUserId = userId || currentUserId;
  const isOwnProfile = targetUserId === currentUserId;

  const { profile, loading, refetch } = useCommunityProfile(targetUserId || undefined);
  const { followUser, unfollowUser } = useCommunityProfileActions();
  const { posts, loading: postsLoading } = useCommunityPosts('all', 'new');

  // Filter posts by this user
  const userPosts = posts.filter(p => p.user_id === targetUserId);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setCurrentUserId(data.user.id);
      } else {
        navigate('/auth');
      }
    };
    fetchCurrentUser();
  }, [navigate]);

  useEffect(() => {
    const checkFollowing = async () => {
      if (!currentUserId || !targetUserId || currentUserId === targetUserId) return;
      
      const { data } = await supabase
        .from('community_follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)
        .maybeSingle();
      
      setIsFollowing(!!data);
    };
    checkFollowing();
  }, [currentUserId, targetUserId]);

  const handleFollowToggle = async () => {
    if (!targetUserId) return;
    setActionLoading(true);
    
    if (isFollowing) {
      const success = await unfollowUser(targetUserId);
      if (success) setIsFollowing(false);
    } else {
      const success = await followUser(targetUserId);
      if (success) setIsFollowing(true);
    }
    
    setActionLoading(false);
    refetch();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="h-32 bg-muted" />
        <div className="px-4 -mt-10">
          <Skeleton className="w-20 h-20 rounded-full border-4 border-background" />
          <Skeleton className="h-6 w-32 mt-4" />
          <Skeleton className="h-4 w-48 mt-2" />
        </div>
        <BottomNav />
      </div>
    );
  }

  // Show profile setup if viewing own profile and no profile exists
  if (isOwnProfile && !profile) {
    return (
      <div className="min-h-screen bg-background pb-20 pt-4 px-4">
        <CommunityProfileSetup onComplete={refetch} />
        <BottomNav />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <Card className="p-8 text-center">
          <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium">User not found</p>
          <p className="text-muted-foreground">This user hasn't set up their profile yet</p>
          <Button className="mt-4" onClick={() => navigate('/community')}>
            Back to Community
          </Button>
        </Card>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Banner */}
      <div className="relative h-32 bg-gradient-to-r from-primary/20 to-primary/40">
        {profile.banner_url && (
          <img 
            src={profile.banner_url} 
            alt="Banner" 
            className="w-full h-full object-cover"
          />
        )}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        {isOwnProfile && (
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <CommunityProfileSetup 
                existingProfile={profile}
                onComplete={() => {
                  setShowEditDialog(false);
                  refetch();
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Profile Info */}
      <div className="px-4 -mt-10 relative">
        <div className="flex justify-between items-end">
          <Avatar className="w-20 h-20 border-4 border-background">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xl">
              {profile.username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          {!isOwnProfile && (
            <Button
              variant={isFollowing ? "outline" : "default"}
              disabled={actionLoading}
              onClick={handleFollowToggle}
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isFollowing ? 'Following' : 'Follow'}
            </Button>
          )}
        </div>

        <div className="mt-3">
          <h1 className="text-xl font-bold">@{profile.username}</h1>
          {profile.bio && (
            <p className="text-muted-foreground mt-1">{profile.bio}</p>
          )}
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <span><strong className="text-foreground">{profile.following_count}</strong> following</span>
            <span><strong className="text-foreground">{profile.followers_count}</strong> followers</span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Joined {format(new Date(profile.created_at), 'MMMM yyyy')}</span>
          </div>
        </div>
      </div>

      {/* User's Posts */}
      <div className="px-4 mt-6">
        <h2 className="font-semibold mb-3">Posts</h2>
        {postsLoading ? (
          <div className="space-y-3">
            {Array(2).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : userPosts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No posts yet
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {userPosts.map((post) => (
              <CommunityPostCard
                key={post.id}
                post={post}
                currentUserId={currentUserId}
                onClick={() => navigate(`/community/${post.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default CommunityUserProfile;
