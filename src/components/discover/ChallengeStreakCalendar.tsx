import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Flame, Trophy, Target, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, isBefore, startOfDay } from "date-fns";

interface ChallengeStreakCalendarProps {
  streak: {
    current_streak: number;
    best_streak: number;
    last_check_in_date: string | null;
    streak_start_date: string | null;
    total_check_ins: number;
    missed_days: number;
  } | null;
  calendarData: Record<string, { hasCheckIn: boolean; count: number; verified: boolean }>;
  challengeStartDate?: string;
}

export const ChallengeStreakCalendar = ({
  streak,
  calendarData,
  challengeStartDate,
}: ChallengeStreakCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getDayStatus = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const dayData = calendarData[dateStr];
    const today = startOfDay(new Date());
    const challengeStart = challengeStartDate ? startOfDay(new Date(challengeStartDate)) : null;

    // Future date
    if (isBefore(today, date)) {
      return "future";
    }

    // Before challenge started
    if (challengeStart && isBefore(date, challengeStart)) {
      return "before-challenge";
    }

    // Has check-in
    if (dayData?.hasCheckIn) {
      return dayData.verified ? "verified" : "checked-in";
    }

    // Today without check-in
    if (isToday(date)) {
      return "pending";
    }

    // Past day without check-in (missed)
    if (challengeStart && isBefore(date, today) && !isBefore(date, challengeStart)) {
      return "missed";
    }

    return "none";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-success text-success-foreground";
      case "checked-in":
        return "bg-primary text-primary-foreground";
      case "pending":
        return "bg-warning/20 text-warning border-2 border-warning";
      case "missed":
        return "bg-destructive/20 text-destructive";
      case "future":
      case "before-challenge":
        return "bg-muted/30 text-muted-foreground";
      default:
        return "bg-card text-muted-foreground";
    }
  };

  return (
    <div className="space-y-4">
      {/* Streak Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame className="w-4 h-4 text-primary" />
              <span className="text-2xl font-bold text-primary">
                {streak?.current_streak || 0}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Current Streak</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="w-4 h-4 text-warning" />
              <span className="text-2xl font-bold text-warning">
                {streak?.best_streak || 0}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Best Streak</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="w-4 h-4 text-success" />
              <span className="text-2xl font-bold text-success">
                {streak?.total_check_ins || 0}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Total Check-ins</p>
          </CardContent>
        </Card>
      </div>

      {/* Missed Days Warning */}
      {streak && streak.missed_days > 0 && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <p className="text-sm text-destructive">
            {streak.missed_days} missed day{streak.missed_days > 1 ? "s" : ""} so far
          </p>
        </div>
      )}

      {/* Calendar */}
      <Card className="shadow-soft">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Check-in Calendar
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium min-w-[100px] text-center">
                {format(currentMonth, "MMMM yyyy")}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-muted-foreground py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-start-${i}`} className="aspect-square" />
            ))}

            {/* Days */}
            {days.map((day) => {
              const status = getDayStatus(day);
              const dateStr = format(day, "yyyy-MM-dd");
              const dayData = calendarData[dateStr];

              return (
                <div
                  key={dateStr}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs relative transition-colors ${getStatusColor(status)}`}
                >
                  <span className="font-medium">{format(day, "d")}</span>
                  
                  {/* Meal count indicator */}
                  {dayData && dayData.count > 0 && (
                    <div className="absolute -bottom-0.5 flex gap-0.5">
                      {Array.from({ length: Math.min(dayData.count, 4) }).map((_, i) => (
                        <div
                          key={i}
                          className="w-1 h-1 rounded-full bg-current opacity-60"
                        />
                      ))}
                    </div>
                  )}

                  {/* Verified checkmark */}
                  {status === "verified" && (
                    <CheckCircle2 className="w-3 h-3 absolute -top-0.5 -right-0.5" />
                  )}
                </div>
              );
            })}

            {/* Empty cells for days after month ends */}
            {Array.from({ length: 6 - monthEnd.getDay() }).map((_, i) => (
              <div key={`empty-end-${i}`} className="aspect-square" />
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-success" />
              <span>Verified</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-primary" />
              <span>Checked In</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-warning/50 border border-warning" />
              <span>Today</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-destructive/30" />
              <span>Missed</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
