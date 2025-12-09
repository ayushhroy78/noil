import { Activity, Book, Home, Compass, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
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
    if (path === "/home") {
      navigate(path);
      return;
    }
    
    // Other routes require auth
    if (!isLoggedIn) {
      toast({
        title: t('common.loginRequired'),
        description: t('common.pleaseLogin'),
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }
    
    navigate(path);
  };

  const navItems = [
    { icon: Activity, labelKey: "nav.tracker", path: "/tracker" },
    { icon: Book, labelKey: "nav.recipes", path: "/fit-meal" },
    { icon: Home, labelKey: "nav.home", path: "/home" },
    { icon: Compass, labelKey: "nav.discover", path: "/discover" },
    { icon: User, labelKey: "nav.profile", path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card shadow-nav border-t border-border z-50">
      <div className="max-w-md mx-auto grid grid-cols-5 items-center px-2 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path === "/home" && location.pathname === "/");
          const isHome = item.path === "/home";
          return (
            <button
              key={item.labelKey}
              onClick={() => handleNavigation(item.path)}
              className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl transition-all duration-300 ease-out ${
                isActive
                  ? "text-foreground bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              } ${isHome ? "mx-auto" : ""}`}
            >
              <Icon className="w-6 h-6 transition-colors duration-300 ease-out" />
              <span className="text-xs font-medium transition-colors duration-300 ease-out">{t(item.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
