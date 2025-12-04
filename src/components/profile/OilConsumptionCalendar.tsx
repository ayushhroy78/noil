import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useOilCalendar, DayData } from "@/hooks/useOilCalendar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  ChevronLeft, 
  ChevronRight, 
  Droplets, 
  Flame, 
  Trophy, 
  Target, 
  TrendingDown, 
  TrendingUp,
  Calendar as CalendarIcon,
  Sparkles,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OilConsumptionCalendarProps {
  userId: string;
}

const motivationalMessages = [
  "Small steps lead to big changes! Keep tracking your oil usage.",
  "Consistency is key to a healthier lifestyle.",
  "You're building great habits one day at a time!",
  "Every drop counts towards your health goals.",
  "Mindful cooking starts with mindful tracking.",
];

export const OilConsumptionCalendar = ({ userId }: OilConsumptionCalendarProps) => {
  const { toast } = useToast();
  const {
    currentMonth,
    stats,
    isLoading,
    getDayData,
    getConsumptionLevel,
    goToPrevMonth,
    goToNextMonth,
    goToToday,
    dailyGoal,
    setDailyGoal,
    refetch,
  } = useOilCalendar(userId);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [entryDialogOpen, setEntryDialogOpen] = useState(false);
  const [newAmount, setNewAmount] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    const dayData = getDayData(date);
    setNewAmount(dayData.hasData ? dayData.amount_ml.toString() : "");
    setNewNotes(dayData.notes || "");
    setEntryDialogOpen(true);
  };

  const handleAddEntry = async () => {
    if (!selectedDate || !newAmount) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("daily_logs").insert({
        user_id: userId,
        log_date: format(selectedDate, "yyyy-MM-dd"),
        amount_ml: parseFloat(newAmount),
        notes: newNotes || null,
        source: "calendar",
      });

      if (error) throw error;

      toast({
        title: "Entry added",
        description: `Logged ${newAmount}ml for ${format(selectedDate, "MMM d, yyyy")}`,
      });

      setEntryDialogOpen(false);
      setNewAmount("");
      setNewNotes("");
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add entry",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getColorClasses = (level: "optimal" | "moderate" | "high" | "none", hasData: boolean) => {
    if (!hasData) return "bg-muted/30 hover:bg-muted/50";
    switch (level) {
      case "optimal":
        return "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200";
      case "moderate":
        return "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 hover:bg-amber-200";
      case "high":
        return "bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 hover:bg-rose-200";
      default:
        return "bg-muted/30 hover:bg-muted/50";
    }
  };

  const trackingProgress = (stats.daysTracked / stats.daysInMonth) * 100;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-48 bg-muted/50 animate-pulse rounded-lg" />
        <div className="h-64 bg-muted/50 animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/50 dark:to-emerald-900/30 border-emerald-200/50">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <CalendarIcon className="h-4 w-4 text-emerald-600" />
              <span className="text-xs text-muted-foreground">Days Tracked</span>
            </div>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{stats.daysTracked}</p>
            <p className="text-xs text-muted-foreground">of {stats.daysInMonth} days</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 border-blue-200/50">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Droplets className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-muted-foreground">Daily Average</span>
            </div>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.dailyAverage}ml</p>
            <p className="text-xs text-muted-foreground">Goal: {dailyGoal}ml</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/30 border-purple-200/50">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-purple-600" />
              <span className="text-xs text-muted-foreground">This Month</span>
            </div>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{stats.totalThisMonth}ml</p>
            <div className="flex items-center gap-1 text-xs">
              {stats.comparisonWithLastMonth !== 0 && (
                <>
                  {stats.comparisonWithLastMonth < 0 ? (
                    <TrendingDown className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <TrendingUp className="h-3 w-3 text-rose-600" />
                  )}
                  <span className={stats.comparisonWithLastMonth < 0 ? "text-emerald-600" : "text-rose-600"}>
                    {Math.abs(stats.comparisonWithLastMonth)}% vs last month
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/50 dark:to-orange-900/30 border-orange-200/50">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="h-4 w-4 text-orange-600" />
              <span className="text-xs text-muted-foreground">Streak</span>
            </div>
            <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">{stats.trackingStreak} days</p>
            <p className="text-xs text-muted-foreground">Keep it up!</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Tracking Progress</span>
            <span className="text-xs text-muted-foreground">
              {stats.daysTracked}/{stats.daysInMonth} days ({Math.round(trackingProgress)}%)
            </span>
          </div>
          <Progress value={trackingProgress} className="h-2" />
        </CardContent>
      </Card>

      {/* Best Day & Motivation */}
      <div className="grid grid-cols-2 gap-3">
        {stats.bestDay && (
          <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-4 w-4 text-yellow-600" />
                <span className="text-xs font-medium">Best Day</span>
              </div>
              <p className="text-sm font-bold">{format(stats.bestDay.date, "MMM d")}</p>
              <p className="text-xs text-muted-foreground">{stats.bestDay.amount}ml consumed</p>
            </CardContent>
          </Card>
        )}

        <Card className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-pink-600" />
              <span className="text-xs font-medium">Daily Tip</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{randomMessage}</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              {format(currentMonth, "MMMM yyyy")}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={goToToday}>
                Today
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const dayData = getDayData(day);
              const level = getConsumptionLevel(dayData.amount_ml);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isCurrentDay = isToday(day);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "aspect-square p-1 rounded-lg text-center transition-all relative",
                    isCurrentMonth ? getColorClasses(level, dayData.hasData) : "opacity-30 bg-muted/20",
                    isCurrentDay && "ring-2 ring-primary ring-offset-1",
                    "hover:scale-105 active:scale-95"
                  )}
                >
                  <span className="text-xs font-medium">{format(day, "d")}</span>
                  {dayData.hasData && isCurrentMonth && (
                    <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2">
                      <Droplets className="h-2.5 w-2.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-emerald-200" />
              <span className="text-muted-foreground">Optimal</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-amber-200" />
              <span className="text-muted-foreground">Moderate</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-rose-200" />
              <span className="text-muted-foreground">High</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Goal Setting */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Daily Goal</p>
              <p className="text-xs text-muted-foreground">Set your target oil consumption</p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(Number(e.target.value))}
                className="w-20 h-8 text-center"
              />
              <span className="text-sm text-muted-foreground">ml</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Add Button */}
      <Button 
        className="w-full" 
        onClick={() => {
          setSelectedDate(new Date());
          setNewAmount("");
          setNewNotes("");
          setEntryDialogOpen(true);
        }}
      >
        <Plus className="h-4 w-4 mr-2" />
        Log Today's Oil Consumption
      </Button>

      {/* Entry Dialog */}
      <Dialog open={entryDialogOpen} onOpenChange={setEntryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDate && format(selectedDate, "MMMM d, yyyy")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Amount (ml)</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="Enter amount in ml"
                />
              </div>
              <div className="flex gap-2 mt-2">
                {[5, 10, 15, 20, 25].map((amt) => (
                  <Button
                    key={amt}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setNewAmount(amt.toString())}
                  >
                    {amt}ml
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Notes (optional)</label>
              <Textarea
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="e.g., Used for breakfast, mustard oil..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEntryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEntry} disabled={isSubmitting || !newAmount}>
              {isSubmitting ? "Saving..." : "Add Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
