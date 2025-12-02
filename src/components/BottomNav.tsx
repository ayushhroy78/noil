import { Activity, Book, Home, ShoppingBag, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

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
              onClick={() => navigate(item.path)}
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
