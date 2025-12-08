import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUp, Flag, Trash2, MessageSquare, Send, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BottomNav } from "@/components/BottomNav";
import { useCommunityPost, useCommunityActions } from "@/hooks/useCommunity";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import ReportDialog from "@/components/community/ReportDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const postTypeBadgeStyles: Record<string, string> = {
  question: "bg-blue-100 text-blue-700",
  success_story: "bg-green-100 text-green-700",
  tip: "bg-amber-100 text-amber-700",
  recipe: "bg-purple-100 text-purple-700",
};

const postTypeLabels: Record<string, string> = {
  question: "Question",
  success_story: "Success Story",
  tip: "Tip",
  recipe: "Recipe",
};

const CommunityPost = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { post, comments, loading, refetch } = useCommunityPost(postId);
  const { vote, addComment, deletePost, deleteComment, reportContent } = useCommunityActions();
  
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ postId: string | null; commentId: string | null }>({ postId: null, commentId: null });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUserId(user.id);
      
      // Check if admin
      const { data: hasRole } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });
      setIsAdmin(!!hasRole);
    };
    checkAuth();
  }, [navigate]);

  const handleVote = async () => {
    if (!post) return;
    await vote(post.id);
    refetch();
  };

  const handleSubmitComment = async () => {
    if (!post || !newComment.trim()) return;
    setSubmitting(true);
    const success = await addComment(post.id, newComment.trim());
    if (success) {
      setNewComment("");
    }
    setSubmitting(false);
  };

  const handleDeletePost = async () => {
    if (!post) return;
    const success = await deletePost(post.id);
    if (success) {
      navigate("/community");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    await deleteComment(commentId);
    refetch();
  };

  const openReportDialog = (postId: string | null, commentId: string | null) => {
    setReportTarget({ postId, commentId });
    setReportOpen(true);
  };

  const handleReport = async (reason: string) => {
    await reportContent(reportTarget.postId, reportTarget.commentId, reason);
    setReportOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
          <Skeleton className="h-6 w-32" />
        </header>
        <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-10 w-full" />
        </main>
        <BottomNav />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/community")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">Post not found</p>
        </main>
        <BottomNav />
      </div>
    );
  }

  const isOwner = userId === post.user_id;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/community")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openReportDialog(post.id, null)}>
                <Flag className="w-4 h-4 mr-2" />
                Report
              </DropdownMenuItem>
              {(isOwner || isAdmin) && (
                <DropdownMenuItem 
                  onClick={handleDeletePost}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-6">
        {/* Post content */}
        <article className="bg-card rounded-xl p-4 space-y-4">
          <Badge className={postTypeBadgeStyles[post.post_type]}>
            {postTypeLabels[post.post_type]}
          </Badge>
          
          <h1 className="text-xl font-bold text-foreground">{post.title}</h1>
          
          <p className="text-muted-foreground text-sm">
            by {post.author_name} • {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </p>
          
          <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
            {post.body}
          </div>

          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {post.tags.map((tag, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Vote button */}
          <div className="flex items-center gap-4 pt-2 border-t border-border">
            <Button
              variant={post.user_voted ? "default" : "outline"}
              size="sm"
              onClick={handleVote}
              className="gap-1"
            >
              <ArrowUp className="w-4 h-4" />
              {post.vote_count}
            </Button>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              {post.comment_count} comments
            </span>
          </div>
        </article>

        {/* Comment input */}
        <div className="bg-card rounded-xl p-4 space-y-3">
          <h3 className="font-medium text-foreground">Add a comment</h3>
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            className="min-h-[80px]"
          />
          <Button
            onClick={handleSubmitComment}
            disabled={!newComment.trim() || submitting}
            className="gap-1"
          >
            <Send className="w-4 h-4" />
            {submitting ? "Posting..." : "Post Comment"}
          </Button>
        </div>

        {/* Comments list */}
        <div className="space-y-3">
          <h3 className="font-medium text-foreground">
            Comments ({comments.length})
          </h3>
          
          {comments.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="bg-card rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {comment.author_name} • {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openReportDialog(null, comment.id)}>
                        <Flag className="w-4 h-4 mr-2" />
                        Report
                      </DropdownMenuItem>
                      {(userId === comment.user_id || isAdmin) && (
                        <DropdownMenuItem 
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-foreground whitespace-pre-wrap">{comment.body}</p>
              </div>
            ))
          )}
        </div>
      </main>

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        onSubmit={handleReport}
      />

      <BottomNav />
    </div>
  );
};

export default CommunityPost;
