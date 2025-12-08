import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, MessageSquare, TrendingUp, Clock, User, Users, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BottomNav } from "@/components/BottomNav";
import { useCommunityPosts, PostType, SortOption } from "@/hooks/useCommunity";
import CommunityPostCard from "@/components/community/CommunityPostCard";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { UserDiscovery } from "@/components/community/UserDiscovery";
import { useCommunityProfile } from "@/hooks/useCommunityProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Community = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<PostType | 'all'>('all');
  const [sort, setSort] = useState<SortOption>('new');
  const [userId, setUserId] = useState<string | null>(null);
  const [showDiscovery, setShowDiscovery] = useState(false);
  const { posts, loading } = useCommunityPosts(filter, sort);
  const { profile } = useCommunityProfile(userId || undefined);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUserId(user.id);
    };
    checkAuth();
  }, [navigate]);

  const filterTabs = [
    { value: 'all', label: 'All' },
    { value: 'question', label: 'Questions' },
    { value: 'success_story', label: 'Success Stories' },
    { value: 'tip', label: 'Tips' },
    { value: 'recipe', label: 'Recipes' },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Community</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate('/messages')}
              >
                <Mail className="w-4 h-4" />
              </Button>
              <Sheet open={showDiscovery} onOpenChange={setShowDiscovery}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Users className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:w-96 p-0">
                  <div className="p-4">
                    <UserDiscovery />
                  </div>
                </SheetContent>
              </Sheet>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(profile ? `/community/user/${userId}` : '/community/profile')}
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
              <Button
                size="sm"
                onClick={() => navigate("/community/new")}
                className="gap-1"
              >
                <Plus className="w-4 h-4" />
                Post
              </Button>
            </div>
          </div>

          {/* Filter tabs */}
          <Tabs value={filter} onValueChange={(v) => setFilter(v as PostType | 'all')}>
            <TabsList className="w-full h-auto flex-wrap gap-1 bg-transparent p-0">
              {filterTabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="text-xs px-3 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Sort options */}
          <div className="flex gap-2 mt-3">
            <Button
              variant={sort === 'new' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setSort('new')}
              className="gap-1 text-xs"
            >
              <Clock className="w-3 h-3" />
              New
            </Button>
            <Button
              variant={sort === 'top' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setSort('top')}
              className="gap-1 text-xs"
            >
              <TrendingUp className="w-3 h-3" />
              Top
            </Button>
          </div>
        </div>
      </header>

      {/* Posts feed */}
      <main className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl p-4 space-y-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              No posts yet. Be the first to share!
            </p>
            <Button onClick={() => navigate("/community/new")}>
              Create Post
            </Button>
          </div>
        ) : (
          posts.map((post) => (
            <CommunityPostCard
              key={post.id}
              post={post}
              currentUserId={userId}
              onClick={() => navigate(`/community/${post.id}`)}
            />
          ))
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Community;
