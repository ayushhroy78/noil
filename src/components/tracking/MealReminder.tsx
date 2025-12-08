import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, X, Utensils, Coffee, Sun, Moon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MealStatus {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
}

const mealConfig = {
  breakfast: {
    icon: Coffee,
    label: "Breakfast",
    startHour: 6,
    endHour: 10,
    reminderHour: 10,
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  lunch: {
    icon: Sun,
    label: "Lunch",
    startHour: 12,
    endHour: 15,
    reminderHour: 14,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  dinner: {
    icon: Moon,
    label: "Dinner",
    startHour: 18,
    endHour: 22,
    reminderHour: 20,
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
};

export const MealReminder = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mealStatus, setMealStatus] = useState<MealStatus>({
    breakfast: false,
    lunch: false,
    dinner: false,
  });
  const [dismissedReminders, setDismissedReminders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkMealStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      const today = new Date().toISOString().split("T")[0];
      
      const { data: logs } = await supabase
        .from("daily_logs")
        .select("notes, created_at")
        .eq("user_id", user.id)
        .eq("log_date", today);

      // Check notes for meal mentions or time-based logging
      const loggedMeals: MealStatus = {
        breakfast: false,
        lunch: false,
        dinner: false,
      };

      if (logs) {
        logs.forEach((log) => {
          const notes = (log.notes || "").toLowerCase();
          const logTime = new Date(log.created_at);
          const hour = logTime.getHours();

          // Check by notes
          if (notes.includes("breakfast") || notes.includes("morning")) {
            loggedMeals.breakfast = true;
          }
          if (notes.includes("lunch") || notes.includes("afternoon")) {
            loggedMeals.lunch = true;
          }
          if (notes.includes("dinner") || notes.includes("evening") || notes.includes("night")) {
            loggedMeals.dinner = true;
          }

          // Check by time of logging
          if (hour >= 6 && hour < 11) loggedMeals.breakfast = true;
          if (hour >= 11 && hour < 16) loggedMeals.lunch = true;
          if (hour >= 17 && hour < 23) loggedMeals.dinner = true;
        });
      }

      setMealStatus(loggedMeals);
      setLoading(false);

      // Load dismissed reminders from localStorage
      const dismissed = localStorage.getItem(`dismissed_meal_reminders_${today}`);
      if (dismissed) {
        setDismissedReminders(JSON.parse(dismissed));
      }
    };

    checkMealStatus();
    
    // Refresh every 5 minutes
    const interval = setInterval(checkMealStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const dismissReminder = (meal: string) => {
    const today = new Date().toISOString().split("T")[0];
    const newDismissed = [...dismissedReminders, meal];
    setDismissedReminders(newDismissed);
    localStorage.setItem(`dismissed_meal_reminders_${today}`, JSON.stringify(newDismissed));
  };

  const logMeal = (meal: string) => {
    navigate("/tracker", { state: { prefillNote: meal } });
  };

  const getMissedMeals = () => {
    const currentHour = new Date().getHours();
    const missedMeals: string[] = [];

    Object.entries(mealConfig).forEach(([meal, config]) => {
      const isMealLogged = mealStatus[meal as keyof MealStatus];
      const isPastReminderTime = currentHour >= config.reminderHour;
      const isNotDismissed = !dismissedReminders.includes(meal);
      const isNotTooLate = currentHour < 24; // Don't show past midnight

      if (!isMealLogged && isPastReminderTime && isNotDismissed && isNotTooLate) {
        // Only show if we're past the meal window
        if (currentHour >= config.endHour) {
          missedMeals.push(meal);
        }
      }
    });

    return missedMeals;
  };

  if (loading || !userId) return null;

  const missedMeals = getMissedMeals();

  if (missedMeals.length === 0) return null;

  return (
    <div className="space-y-2">
      {missedMeals.map((meal) => {
        const config = mealConfig[meal as keyof typeof mealConfig];
        const Icon = config.icon;

        return (
          <Card 
            key={meal} 
            className={`border-0 shadow-soft ${config.bgColor} animate-in slide-in-from-top-2 duration-300`}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full bg-card/50`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Bell className={`w-4 h-4 ${config.color}`} />
                    <p className="font-medium text-sm text-foreground">
                      Did you miss logging {config.label.toLowerCase()}?
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Track your oil usage to maintain your health score
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2"
                    onClick={() => dismissReminder(meal)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => logMeal(config.label)}
                  >
                    <Utensils className="w-3 h-3 mr-1" />
                    Log Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MealReminder;
