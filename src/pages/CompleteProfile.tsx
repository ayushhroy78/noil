import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ProfileCompletion from "@/components/profile/ProfileCompletion";

const CompleteProfile = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if profile already complete
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("full_name, state")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile?.full_name && profile?.state) {
        navigate("/");
        return;
      }

      // Ensure profile exists
      if (!profile) {
        await supabase
          .from("user_profiles")
          .insert({ user_id: user.id });
      }

      setUserId(user.id);
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const handleComplete = () => {
    navigate("/dashboard");
  };

  if (loading || !userId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <ProfileCompletion userId={userId} onComplete={handleComplete} />;
};

export default CompleteProfile;
