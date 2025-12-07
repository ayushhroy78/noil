import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, differenceInDays, isToday, parseISO, subDays } from "date-fns";

export interface CheckIn {
  id: string;
  user_id: string;
  user_challenge_id: string;
  check_in_date: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  oil_type: string | null;
  oil_quantity_ml: number | null;
  cooking_method: string | null;
  photo_url: string | null;
  photo_uploaded_at: string | null;
  photo_exif_date: string | null;
  ingredients_used: string[] | null;
  alternative_ingredients: string[] | null;
  cooking_notes: string | null;
  energy_level: number | null;
  mood: string | null;
  cravings_notes: string | null;
  is_verified: boolean;
  verification_score: number;
  flagged_suspicious: boolean;
  flag_reason: string | null;
  entry_timestamp: string;
  created_at: string;
}

export interface Streak {
  id: string;
  user_id: string;
  user_challenge_id: string;
  current_streak: number;
  best_streak: number;
  last_check_in_date: string | null;
  streak_start_date: string | null;
  total_check_ins: number;
  missed_days: number;
}

export interface DailyPrompt {
  id: string;
  prompt_text: string;
  expected_detail: string | null;
  user_response: string | null;
  response_verified: boolean;
}

const PROGRESSIVE_PROMPTS = [
  { day: 1, prompt: "What cooking oil did you use today?", detail: "oil_type" },
  { day: 2, prompt: "How much oil (in ml) did you estimate using?", detail: "oil_quantity" },
  { day: 3, prompt: "What cooking method did you use (frying, sautéing, steaming)?", detail: "cooking_method" },
  { day: 4, prompt: "Did you try any oil alternatives today (like air frying)?", detail: "alternatives" },
  { day: 5, prompt: "What ingredients went into your main dish?", detail: "ingredients" },
  { day: 6, prompt: "How's your energy level compared to before the challenge?", detail: "energy" },
  { day: 7, prompt: "Share a photo of your healthiest meal today!", detail: "photo" },
];

const RANDOM_VERIFICATION_PROMPTS = [
  "What color was your main vegetable today?",
  "Did you cook for just yourself or others?",
  "What time did you have this meal?",
  "Was this a hot or cold dish?",
  "What's one spice you used today?",
  "Did you use a non-stick pan or regular pan?",
  "What was the main protein in your meal?",
  "How long did cooking take?",
];

export const useChallengeTracking = (userId: string, userChallengeId: string | null) => {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [dailyPrompt, setDailyPrompt] = useState<DailyPrompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [todayCheckIns, setTodayCheckIns] = useState<CheckIn[]>([]);

  const initializeStreak = useCallback(async () => {
    if (!userId || !userChallengeId) return null;
    
    const today = format(new Date(), "yyyy-MM-dd");
    
    // Check if streak exists
    const { data: existingStreak, error: checkError } = await supabase
      .from("challenge_streaks")
      .select("*")
      .eq("user_challenge_id", userChallengeId)
      .maybeSingle();
    
    if (checkError) {
      console.error("Error checking streak:", checkError);
      return null;
    }
    
    if (existingStreak) {
      return existingStreak as Streak;
    }
    
    // Create new streak
    const { data: newStreak, error: insertError } = await supabase
      .from("challenge_streaks")
      .insert({
        user_id: userId,
        user_challenge_id: userChallengeId,
        current_streak: 0,
        best_streak: 0,
        last_check_in_date: null,
        streak_start_date: today,
        total_check_ins: 0,
        missed_days: 0,
      })
      .select()
      .single();
    
    if (insertError) {
      console.error("Error creating streak:", insertError);
      return null;
    }
    
    return newStreak as Streak;
  }, [userId, userChallengeId]);

  const fetchData = useCallback(async () => {
    if (!userId || !userChallengeId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch all check-ins for this challenge
      const { data: checkInsData, error: checkInsError } = await supabase
        .from("challenge_check_ins")
        .select("*")
        .eq("user_challenge_id", userChallengeId)
        .order("check_in_date", { ascending: false });

      if (checkInsError) throw checkInsError;
      
      // Type assertion for the data
      const typedCheckIns = (checkInsData || []) as CheckIn[];
      setCheckIns(typedCheckIns);

      // Filter today's check-ins
      const today = format(new Date(), "yyyy-MM-dd");
      setTodayCheckIns(typedCheckIns.filter(c => c.check_in_date === today));

      // Fetch or initialize streak
      let streakData = await initializeStreak();
      setStreak(streakData);

      // Fetch today's prompt
      const { data: promptData, error: promptError } = await supabase
        .from("challenge_daily_prompts")
        .select("*")
        .eq("user_challenge_id", userChallengeId)
        .eq("prompt_date", today)
        .maybeSingle();

      if (promptError) throw promptError;
      setDailyPrompt(promptData as DailyPrompt | null);

    } catch (error) {
      console.error("Error fetching challenge tracking data:", error);
    } finally {
      setLoading(false);
    }
  }, [userId, userChallengeId, initializeStreak]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addCheckIn = async (checkInData: {
    meal_type: "breakfast" | "lunch" | "dinner" | "snack";
    oil_type?: string;
    oil_quantity_ml?: number;
    cooking_method?: string;
    ingredients_used?: string[];
    alternative_ingredients?: string[];
    cooking_notes?: string;
    energy_level?: number;
    mood?: string;
    cravings_notes?: string;
    photo_url?: string;
    photo_exif_date?: string;
  }) => {
    if (!userId || !userChallengeId) {
      toast.error("No active challenge");
      return null;
    }

    try {
      // Check for suspicious patterns
      const verificationResult = analyzeCheckIn(checkInData, checkIns);

      const { data, error } = await supabase
        .from("challenge_check_ins")
        .insert({
          user_id: userId,
          user_challenge_id: userChallengeId,
          ...checkInData,
          photo_uploaded_at: checkInData.photo_url ? new Date().toISOString() : null,
          verification_score: verificationResult.score,
          flagged_suspicious: verificationResult.suspicious,
          flag_reason: verificationResult.reason,
        })
        .select()
        .single();

      if (error) throw error;

      // Update streak
      await updateStreak();

      toast.success("Check-in recorded!");
      await fetchData();
      return data;
    } catch (error: any) {
      console.error("Error adding check-in:", error);
      if (error.code === "23505") {
        toast.error("You've already logged this meal type for today");
      } else {
        toast.error("Failed to save check-in");
      }
      return null;
    }
  };

  const analyzeCheckIn = (
    newCheckIn: any,
    existingCheckIns: CheckIn[]
  ): { score: number; suspicious: boolean; reason: string | null } => {
    let score = 50; // Base score
    let suspicious = false;
    let reasons: string[] = [];

    // Check 1: Photo verification (+20 points)
    if (newCheckIn.photo_url) {
      score += 20;
    }

    // Check 2: Detailed responses (+10 points each)
    if (newCheckIn.oil_quantity_ml) score += 10;
    if (newCheckIn.cooking_method) score += 10;
    if (newCheckIn.ingredients_used?.length > 0) score += 10;

    // Check 3: Variation in entries (suspicious if too uniform)
    if (existingCheckIns.length >= 5) {
      const recentEntries = existingCheckIns.slice(0, 5);
      const sameOilCount = recentEntries.filter(
        e => e.oil_quantity_ml === newCheckIn.oil_quantity_ml
      ).length;
      
      if (sameOilCount >= 4) {
        suspicious = true;
        reasons.push("Uniform oil quantities detected");
        score -= 20;
      }

      // Check for same cooking method pattern
      const sameCookingCount = recentEntries.filter(
        e => e.cooking_method === newCheckIn.cooking_method
      ).length;
      
      if (sameCookingCount >= 5 && newCheckIn.cooking_method) {
        suspicious = true;
        reasons.push("Same cooking method every day");
        score -= 10;
      }
    }

    // Check 4: Time validation (entries at odd hours are suspicious)
    const hour = new Date().getHours();
    if (
      (newCheckIn.meal_type === "breakfast" && (hour < 5 || hour > 12)) ||
      (newCheckIn.meal_type === "lunch" && (hour < 11 || hour > 16)) ||
      (newCheckIn.meal_type === "dinner" && (hour < 17 || hour > 23))
    ) {
      reasons.push("Entry time doesn't match meal type");
      score -= 10;
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      suspicious,
      reason: reasons.length > 0 ? reasons.join("; ") : null,
    };
  };

  const updateStreak = async () => {
    if (!userId || !userChallengeId) return;

    const today = format(new Date(), "yyyy-MM-dd");

    try {
      // Get current streak
      const { data: currentStreak, error: fetchError } = await supabase
        .from("challenge_streaks")
        .select("*")
        .eq("user_challenge_id", userChallengeId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!currentStreak) {
        // Create new streak with first check-in
        const { error: insertError } = await supabase.from("challenge_streaks").insert({
          user_id: userId,
          user_challenge_id: userChallengeId,
          current_streak: 1,
          best_streak: 1,
          last_check_in_date: today,
          streak_start_date: today,
          total_check_ins: 1,
          missed_days: 0,
        });
        
        if (insertError && insertError.code !== "23505") {
          throw insertError;
        }
      } else {
        const typedStreak = currentStreak as Streak;
        const lastDate = typedStreak.last_check_in_date;
        
        if (lastDate === today) {
          // Already checked in today, just increment total
          await supabase
            .from("challenge_streaks")
            .update({
              total_check_ins: (typedStreak.total_check_ins || 0) + 1,
            })
            .eq("id", typedStreak.id);
        } else if (!lastDate) {
          // First check-in ever for this streak (lastDate is null)
          await supabase
            .from("challenge_streaks")
            .update({
              current_streak: 1,
              best_streak: 1,
              last_check_in_date: today,
              streak_start_date: today,
              total_check_ins: 1,
            })
            .eq("id", typedStreak.id);
        } else {
          const daysDiff = differenceInDays(parseISO(today), parseISO(lastDate));
          
          if (daysDiff === 1) {
            // Consecutive day
            const newStreak = (typedStreak.current_streak || 0) + 1;
            await supabase
              .from("challenge_streaks")
              .update({
                current_streak: newStreak,
                best_streak: Math.max(typedStreak.best_streak || 0, newStreak),
                last_check_in_date: today,
                total_check_ins: (typedStreak.total_check_ins || 0) + 1,
              })
              .eq("id", typedStreak.id);
          } else if (daysDiff > 1) {
            // Streak broken
            await supabase
              .from("challenge_streaks")
              .update({
                current_streak: 1,
                last_check_in_date: today,
                streak_start_date: today,
                total_check_ins: (typedStreak.total_check_ins || 0) + 1,
                missed_days: (typedStreak.missed_days || 0) + daysDiff - 1,
              })
              .eq("id", typedStreak.id);
          }
        }
      }
    } catch (error) {
      console.error("Error updating streak:", error);
    }
  };

  const uploadMealPhoto = async (file: File): Promise<string | null> => {
    if (!userId) return null;

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("meal-photos")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("meal-photos")
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Failed to upload photo");
      return null;
    }
  };

  const generateDailyPrompt = useCallback(async (challengeStartDate: string) => {
    if (!userId || !userChallengeId) return null;

    const today = format(new Date(), "yyyy-MM-dd");
    
    // First check if prompt exists for today
    const { data: existingPrompt, error: checkError } = await supabase
      .from("challenge_daily_prompts")
      .select("*")
      .eq("user_challenge_id", userChallengeId)
      .eq("prompt_date", today)
      .maybeSingle();
    
    if (checkError) {
      console.error("Error checking prompt:", checkError);
      return null;
    }
    
    if (existingPrompt) {
      setDailyPrompt(existingPrompt as DailyPrompt);
      return existingPrompt;
    }

    const dayNumber = differenceInDays(new Date(), parseISO(challengeStartDate)) + 1;

    // Get progressive prompt based on day
    const progressivePrompt = PROGRESSIVE_PROMPTS.find(p => p.day === dayNumber) 
      || PROGRESSIVE_PROMPTS[(dayNumber - 1) % PROGRESSIVE_PROMPTS.length];

    // Add a random verification prompt for days after week 1
    const randomPrompt = RANDOM_VERIFICATION_PROMPTS[
      Math.floor(Math.random() * RANDOM_VERIFICATION_PROMPTS.length)
    ];

    const promptText = dayNumber <= 7 
      ? progressivePrompt.prompt 
      : randomPrompt;

    try {
      const { data, error } = await supabase
        .from("challenge_daily_prompts")
        .insert({
          user_id: userId,
          user_challenge_id: userChallengeId,
          prompt_date: today,
          prompt_text: promptText,
          expected_detail: progressivePrompt?.detail || "verification",
        })
        .select()
        .single();

      if (error) {
        // If duplicate key error, fetch existing
        if (error.code === "23505") {
          const { data: existing } = await supabase
            .from("challenge_daily_prompts")
            .select("*")
            .eq("user_challenge_id", userChallengeId)
            .eq("prompt_date", today)
            .single();
          
          if (existing) {
            setDailyPrompt(existing as DailyPrompt);
            return existing;
          }
        }
        throw error;
      }
      
      setDailyPrompt(data as DailyPrompt);
      return data;
    } catch (error) {
      console.error("Error generating prompt:", error);
      return null;
    }
  }, [userId, userChallengeId]);

  const answerDailyPrompt = async (promptId: string, response: string) => {
    try {
      const { error } = await supabase
        .from("challenge_daily_prompts")
        .update({
          user_response: response,
          response_verified: true,
        })
        .eq("id", promptId);

      if (error) throw error;

      toast.success("Response recorded!");
      await fetchData();
    } catch (error) {
      console.error("Error answering prompt:", error);
      toast.error("Failed to save response");
    }
  };

  const getCalendarData = () => {
    const calendarMap: Record<string, { 
      hasCheckIn: boolean; 
      count: number; 
      verified: boolean 
    }> = {};

    checkIns.forEach(checkIn => {
      const date = checkIn.check_in_date;
      if (!calendarMap[date]) {
        calendarMap[date] = { hasCheckIn: false, count: 0, verified: false };
      }
      calendarMap[date].hasCheckIn = true;
      calendarMap[date].count++;
      if (checkIn.is_verified) {
        calendarMap[date].verified = true;
      }
    });

    return calendarMap;
  };

  return {
    checkIns,
    todayCheckIns,
    streak,
    dailyPrompt,
    loading,
    addCheckIn,
    uploadMealPhoto,
    generateDailyPrompt,
    answerDailyPrompt,
    getCalendarData,
    refetch: fetchData,
  };
};
