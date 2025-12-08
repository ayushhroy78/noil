import { Activity, Book, Home, ShoppingBag, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session?.user);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const handleNavigation = (path: string) => {
    // Home is always accessible
    if (path === "/") {
      navigate(path);
      return;
    }
    
    // Other routes require auth
    if (!isLoggedIn) {
      toast({
        title: "Login Required",
        description: "Please login to access this feature.",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }
    
    navigate(path);
  };

  const navItems = [
    { icon: Activity, label: "Tracker", path: "/tracker" },
    { icon: Book, label: "Recipes", path: "/fit-meal" },
    { icon: Home, label: "Home", path: "/" },
    { icon: ShoppingBag, label: "Store", path: "/oilhub" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card shadow-nav border-t border-border z-50">
      <div className="max-w-md mx-auto flex items-center justify-around px-4 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => handleNavigation(item.path)}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-300 ease-out ${
                isActive
                  ? "text-foreground bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <Icon className="w-6 h-6 transition-colors duration-300 ease-out" />
              <span className="text-xs font-medium transition-colors duration-300 ease-out">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
