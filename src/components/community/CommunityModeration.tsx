import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Report {
  id: string;
  post_id: string | null;
  comment_id: string | null;
  reason: string;
  status: string;
  created_at: string;
  reported_by: string;
}

export function CommunityModeration() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('community_reports')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading reports",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const updateReportStatus = async (reportId: string, status: 'reviewed' | 'dismissed') => {
    try {
      const { error } = await supabase
        .from('community_reports')
        .update({ status })
        .eq('id', reportId);

      if (error) throw error;
      
      toast({ title: `Report ${status}` });
      fetchReports();
    } catch (error: any) {
      toast({
        title: "Error updating report",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const hidePost = async (postId: string, reportId: string) => {
    try {
      const { error: postError } = await supabase
        .from('community_posts')
        .update({ is_hidden: true })
        .eq('id', postId);

      if (postError) throw postError;

      await updateReportStatus(reportId, 'reviewed');
      toast({ title: "Post hidden and report reviewed" });
    } catch (error: any) {
      toast({
        title: "Error hiding post",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteComment = async (commentId: string, reportId: string) => {
    try {
      const { error: commentError } = await supabase
        .from('community_comments')
        .update({ is_deleted: true })
        .eq('id', commentId);

      if (commentError) throw commentError;

      await updateReportStatus(reportId, 'reviewed');
      toast({ title: "Comment deleted and report reviewed" });
    } catch (error: any) {
      toast({
        title: "Error deleting comment",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading reports...</div>;
  }

  if (reports.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Community Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No open reports. The community is healthy!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Community Reports
          <Badge variant="destructive">{reports.length} open</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {reports.map((report) => (
          <div key={report.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline">
                {report.post_id ? 'Post' : 'Comment'} Report
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
              </span>
            </div>

            <p className="text-sm">
              <strong>Reason:</strong> {report.reason}
            </p>

            <div className="flex flex-wrap gap-2">
              {report.post_id && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => hidePost(report.post_id!, report.id)}
                  className="gap-1"
                >
                  <EyeOff className="w-3 h-3" />
                  Hide Post
                </Button>
              )}
              
              {report.comment_id && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteComment(report.comment_id!, report.id)}
                  className="gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete Comment
                </Button>
              )}
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateReportStatus(report.id, 'dismissed')}
                className="gap-1"
              >
                <XCircle className="w-3 h-3" />
                Dismiss
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// TODO: Future integration hooks
// - Reward points for helpful posts (capped per day)
// - Scaling rewards by Habit Stability Score (HSS)
// - AI summarizer for discussions
// - Topic channels
