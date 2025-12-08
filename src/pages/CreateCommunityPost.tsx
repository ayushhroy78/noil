import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BottomNav } from "@/components/BottomNav";
import { useCommunityActions, PostType } from "@/hooks/useCommunity";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const postSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200, "Title too long"),
  body: z.string().min(20, "Body must be at least 20 characters").max(5000, "Body too long"),
  post_type: z.enum(['question', 'success_story', 'tip', 'recipe']),
  tags: z.string().optional(),
});

type PostFormData = z.infer<typeof postSchema>;

const postTypeOptions = [
  { value: 'question', label: 'Question', description: 'Ask the community for help or advice' },
  { value: 'success_story', label: 'Success Story', description: 'Share your healthy cooking wins' },
  { value: 'tip', label: 'Tip / Hack', description: 'Share a helpful tip or trick' },
  { value: 'recipe', label: 'Recipe Discussion', description: 'Discuss a recipe or cooking method' },
];

const CreateCommunityPost = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { createPost } = useCommunityActions();
  const [submitting, setSubmitting] = useState(false);

  // Get prefilled type from URL params (for context-aware shortcuts)
  const prefilledType = searchParams.get('type') as PostType | null;

  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: "",
      body: "",
      post_type: prefilledType || 'question',
      tags: "",
    },
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
      }
    };
    checkAuth();
  }, [navigate]);

  const onSubmit = async (data: PostFormData) => {
    setSubmitting(true);
    
    const tags = data.tags
      ? data.tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
      : [];

    const postId = await createPost({
      title: data.title,
      body: data.body,
      post_type: data.post_type as PostType,
      tags,
    });

    setSubmitting(false);
    
    if (postId) {
      navigate(`/community/${postId}`);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/community")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">Create Post</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Post Type */}
            <FormField
              control={form.control}
              name="post_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Post Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select post type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {postTypeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div>
                            <div className="font-medium">{opt.label}</div>
                            <div className="text-xs text-muted-foreground">{opt.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="What's your post about?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Body */}
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Body</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share your thoughts, questions, or tips..."
                      className="min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="cooking, health, oil-reduction (comma separated)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={submitting}
            >
              {submitting ? "Creating..." : "Create Post"}
            </Button>
          </form>
        </Form>
      </main>

      <BottomNav />
    </div>
  );
};

export default CreateCommunityPost;
