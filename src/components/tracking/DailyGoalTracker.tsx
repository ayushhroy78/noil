import { useState } from "react";
import { Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DailyGoalTrackerProps {
  todayConsumption: number;
}

export const DailyGoalTracker = ({ todayConsumption }: DailyGoalTrackerProps) => {
  const [dailyLimit, setDailyLimit] = useState(() => {
    const saved = localStorage.getItem("dailyOilLimit");
    return saved ? parseInt(saved) : 30;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [tempLimit, setTempLimit] = useState(dailyLimit.toString());

  const percentage = Math.min((todayConsumption / dailyLimit) * 100, 100);
  const circumference = 2 * Math.PI * 80;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getStatusColor = () => {
    if (percentage < 80) return "hsl(var(--chart-2))"; // Green
    if (percentage < 100) return "hsl(var(--chart-3))"; // Yellow
    return "hsl(var(--chart-1))"; // Red
  };

  const handleSave = () => {
    const newLimit = parseInt(tempLimit);
    if (newLimit > 0 && newLimit <= 200) {
      setDailyLimit(newLimit);
      localStorage.setItem("dailyOilLimit", newLimit.toString());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setTempLimit(dailyLimit.toString());
    setIsEditing(false);
  };

  return (
    <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background rounded-3xl p-8 overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-4 left-4 w-8 h-8 rounded-full border-2 border-primary/30" />
      <div className="absolute top-12 left-12 w-4 h-4 rounded-full bg-primary/20" />
      <div className="absolute bottom-8 left-8 w-6 h-6 rounded-full border-2 border-primary/20" />
      <div className="absolute top-6 right-8 w-5 h-5 rounded-full bg-primary/30" />
      <div className="absolute top-16 right-4 w-8 h-8 rounded-full border-2 border-primary/20" />
      <div className="absolute bottom-12 right-12 w-4 h-4 rounded-full bg-primary/25" />
      <div className="absolute bottom-6 right-20 w-10 h-10 rounded-full border-2 border-primary/15" />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Track Your Daily Oil Use</h2>
        
        {/* Circular Progress */}
        <div className="relative w-64 h-64 my-6">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="128"
              cy="128"
              r="80"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="12"
              opacity="0.3"
            />
            {/* Progress circle */}
            <circle
              cx="128"
              cy="128"
              r="80"
              fill="none"
              stroke={getStatusColor()}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* Oil bottle icon */}
            <div className="mb-2">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-primary">
                <path d="M9 2L7 6H17L15 2H9Z" fill="currentColor" opacity="0.3"/>
                <path d="M7 6H17C18.1 6 19 6.9 19 8V20C19 21.1 18.1 22 17 22H7C5.9 22 5 21.1 5 20V8C5 6.9 5.9 6 7 6Z" fill="currentColor"/>
                <circle cx="12" cy="14" r="2" fill="white" opacity="0.5"/>
              </svg>
            </div>
            
            {/* Consumption display */}
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">
                {Math.round(todayConsumption)} ml
                <span className="text-muted-foreground"> / {dailyLimit} ml</span>
              </div>
              <div className="text-sm text-muted-foreground mt-1 font-medium">Daily Goal</div>
            </div>
            
            {percentage >= 100 && (
              <div className="mt-2 text-xs font-semibold text-destructive">
                Goal Exceeded!
              </div>
            )}
          </div>
        </div>

        {/* Edit daily limit */}
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <span className="text-sm text-muted-foreground">Daily Limit: {dailyLimit} ml</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-7 px-2"
              >
                <Edit2 className="w-3 h-3" />
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={tempLimit}
                onChange={(e) => setTempLimit(e.target.value)}
                className="w-20 h-8 text-sm"
                min="1"
                max="200"
              />
              <span className="text-sm text-muted-foreground">ml</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                className="h-7 px-2"
              >
                <Check className="w-3 h-3 text-green-500" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="h-7 px-2"
              >
                <X className="w-3 h-3 text-destructive" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
