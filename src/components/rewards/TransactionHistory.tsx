import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  History, 
  TrendingUp, 
  TrendingDown, 
  Trophy, 
  Target, 
  Users, 
  Zap, 
  Gift, 
  Medal,
  Calendar,
  Sparkles
} from "lucide-react";
import { usePointTransactions, PointTransaction } from "@/hooks/usePointTransactions";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

export const TransactionHistory = () => {
  const { transactions, isLoading } = usePointTransactions();

  // Get icon based on source
  const getSourceIcon = (source: string) => {
    const icons: Record<string, React.ReactNode> = {
      challenge: <Trophy className="w-4 h-4" />,
      quiz: <Target className="w-4 h-4" />,
      referral: <Users className="w-4 h-4" />,
      streak: <Zap className="w-4 h-4" />,
      achievement: <Medal className="w-4 h-4" />,
      reward_redemption: <Gift className="w-4 h-4" />,
      daily_login: <Calendar className="w-4 h-4" />,
      milestone: <Sparkles className="w-4 h-4" />,
    };
    return icons[source] || <Sparkles className="w-4 h-4" />;
  };

  // Format date for grouping
  const formatDateGroup = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  };

  // Group transactions by date
  const groupedTransactions = transactions?.reduce((groups, transaction) => {
    const dateKey = formatDateGroup(transaction.created_at);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(transaction);
    return groups;
  }, {} as Record<string, PointTransaction[]>) || {};

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="w-5 h-5" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 pb-6 text-center">
          <History className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No transactions yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Complete challenges and quizzes to earn points!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          Transaction History
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] px-4 pb-4">
          {Object.entries(groupedTransactions).map(([dateGroup, dayTransactions]) => (
            <div key={dateGroup} className="mb-4">
              <div className="sticky top-0 bg-background/95 backdrop-blur py-2 mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {dateGroup}
                </span>
              </div>
              <div className="space-y-2">
                {dayTransactions.map((transaction, index) => {
                  const isEarned = transaction.transaction_type === 'earned';
                  
                  return (
                    <div 
                      key={transaction.id} 
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg transition-all",
                        "bg-muted/30 hover:bg-muted/50",
                        "animate-fade-in"
                      )}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Icon */}
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        isEarned 
                          ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" 
                          : "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
                      )}>
                        {getSourceIcon(transaction.source)}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{transaction.description}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(transaction.created_at), "h:mm a")}
                          </span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            Balance: {transaction.balance_after}
                          </span>
                        </div>
                      </div>

                      {/* Points */}
                      <div className="flex items-center gap-1.5">
                        {isEarned ? (
                          <TrendingUp className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-rose-500" />
                        )}
                        <span className={cn(
                          "font-bold text-sm",
                          isEarned ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {isEarned ? '+' : '-'}{Math.abs(transaction.points)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
