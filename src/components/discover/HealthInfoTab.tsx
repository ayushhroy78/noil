import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Lightbulb, AlertTriangle, ChefHat, Heart, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface HealthContent {
  id: string;
  title: string;
  category: string;
  preview: string;
  content: string;
  tags: string[];
}

export const HealthInfoTab = () => {
  const [contents, setContents] = useState<HealthContent[]>([]);
  const [selectedContent, setSelectedContent] = useState<HealthContent | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: "did_you_know", label: "Did You Know?", icon: Lightbulb },
    { id: "myths_facts", label: "Myths vs Facts", icon: BookOpen },
    { id: "hidden_oil", label: "Hidden Oil Alerts", icon: AlertTriangle },
    { id: "cooking_tips", label: "Cooking Tips", icon: ChefHat },
    { id: "health_risks", label: "Health Risks", icon: Heart },
  ];

  useEffect(() => {
    fetchHealthContent();
  }, [selectedCategory]);

  const fetchHealthContent = async () => {
    try {
      let query = supabase.from("health_content").select("*");

      if (selectedCategory) {
        query = query.eq("category", selectedCategory);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      setContents(data || []);
    } catch (error) {
      console.error("Error fetching health content:", error);
      toast.error("Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = categories.find((c) => c.id === category);
    if (!cat) return BookOpen;
    return cat.icon;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "did_you_know":
        return "bg-primary/10 text-primary border-primary/20";
      case "myths_facts":
        return "bg-secondary/10 text-secondary-foreground border-secondary/20";
      case "hidden_oil":
        return "bg-warning/10 text-warning border-warning/20";
      case "cooking_tips":
        return "bg-success/10 text-success border-success/20";
      case "health_risks":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (selectedContent) {
    const Icon = getCategoryIcon(selectedContent.category);
    
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setSelectedContent(null)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="shadow-medium">
          <CardContent className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground mb-2">{selectedContent.title}</h2>
                <Badge className={getCategoryColor(selectedContent.category)}>
                  {categories.find((c) => c.id === selectedContent.category)?.label}
                </Badge>
              </div>
            </div>

            <div className="prose prose-sm max-w-none">
              <p className="text-foreground whitespace-pre-line leading-relaxed">
                {selectedContent.content}
              </p>
            </div>

            {selectedContent.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                {selectedContent.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Healthy Life Info</h2>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory(null)}
        >
          All
        </Button>
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
            >
              <Icon className="w-4 h-4 mr-1" />
              {cat.label}
            </Button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {contents.map((content) => {
            const Icon = getCategoryIcon(content.category);
            
            return (
              <Card
                key={content.id}
                className="shadow-soft hover:shadow-medium transition-shadow cursor-pointer"
                onClick={() => setSelectedContent(content)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">{content.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{content.preview}</p>
                      <Badge className={`${getCategoryColor(content.category)} mt-2`} variant="outline">
                        {categories.find((c) => c.id === content.category)?.label}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
