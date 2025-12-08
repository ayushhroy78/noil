import { useState } from 'react';
import { Search, User, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDiscoverUsers, useCommunityProfileActions } from '@/hooks/useCommunityProfile';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export const UserDiscovery = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { users, loading, refetch } = useDiscoverUsers(searchQuery);
  const { followUser, unfollowUser } = useCommunityProfileActions();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setCurrentUserId(data.user.id);
        // Fetch who the user is following
        const { data: follows } = await supabase
          .from('community_follows')
          .select('following_id')
          .eq('follower_id', data.user.id);
        
        if (follows) {
          setFollowingIds(new Set(follows.map(f => f.following_id)));
        }
      }
    };
    fetchCurrentUser();
  }, []);

  const handleFollow = async (userId: string) => {
    setActionLoading(userId);
    const isFollowing = followingIds.has(userId);
    
    if (isFollowing) {
      const success = await unfollowUser(userId);
      if (success) {
        setFollowingIds(prev => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      }
    } else {
      const success = await followUser(userId);
      if (success) {
        setFollowingIds(prev => new Set(prev).add(userId));
      }
    }
    setActionLoading(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Discover Users
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No users found</p>
            </div>
          ) : (
            users.map((user) => (
              <div 
                key={user.id} 
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/community/user/${user.user_id}`)}
              >
                <Avatar className="w-12 h-12">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <User className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">@{user.username}</p>
                  {user.bio && (
                    <p className="text-sm text-muted-foreground truncate">{user.bio}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {user.followers_count} followers
                  </p>
                </div>
                {currentUserId && currentUserId !== user.user_id && (
                  <Button
                    variant={followingIds.has(user.user_id) ? "outline" : "default"}
                    size="sm"
                    disabled={actionLoading === user.user_id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFollow(user.user_id);
                    }}
                  >
                    {followingIds.has(user.user_id) ? 'Following' : 'Follow'}
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
