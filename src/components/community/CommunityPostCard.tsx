import { ArrowUp, MessageSquare, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CommunityPost, useCommunityActions } from "@/hooks/useCommunity";
import { formatDistanceToNow } from "date-fns";

interface CommunityPostCardProps {
  post: CommunityPost;
  currentUserId: string | null;
  onClick: () => void;
}

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

const CommunityPostCard = ({ post, currentUserId, onClick }: CommunityPostCardProps) => {
  const { vote } = useCommunityActions();

  const handleVote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await vote(post.id);
  };

  // Truncate body for preview
  const previewBody = post.body.length > 150 
    ? post.body.slice(0, 150) + "..." 
    : post.body;

  return (
    <article
      className="bg-card rounded-xl overflow-hidden cursor-pointer hover:bg-card/80 transition-colors border border-border/50"
      onClick={onClick}
    >
      {/* Post Image */}
      {post.image_url && (
        <div className="relative aspect-video bg-muted">
          <img 
            src={post.image_url} 
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Badge className={`${postTypeBadgeStyles[post.post_type]} text-xs`}>
            {postTypeLabels[post.post_type]}
          </Badge>
          {post.image_url && (
            <ImageIcon className="w-3 h-3 text-muted-foreground" />
          )}
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </span>
        </div>

        <h3 className="font-semibold text-foreground line-clamp-2">
          {post.title}
        </h3>

        <p className="text-sm text-muted-foreground line-clamp-2">
          {previewBody}
        </p>

        <div className="flex items-center gap-4 pt-2">
          <Button
            variant={post.user_voted ? "default" : "outline"}
            size="sm"
            onClick={handleVote}
            className="gap-1 h-8"
          >
            <ArrowUp className="w-3 h-3" />
            {post.vote_count}
          </Button>

          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            {post.comment_count}
          </span>

          <span className="text-xs text-muted-foreground ml-auto">
            by {post.author_name}
          </span>
        </div>
      </div>
    </article>
  );
};

export default CommunityPostCard;
