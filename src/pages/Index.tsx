import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { User, Search, LogOut, Heart, Store, Activity, Gift, Calculator, MapPin, ChevronDown, Shield, MessageSquare, Landmark, Utensils } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import Chatbot from "@/components/Chatbot";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import trackerMainImg from "@/assets/tracker-main.jpg";
import fitMealMainImg from "@/assets/fit-meal-main.jpg";
import discoverMainImg from "@/assets/discover-main.jpg";
import logoImg from "@/assets/logo.jpg";
import LocationEditDialog from "@/components/LocationEditDialog";
import { MealReminder } from "@/components/tracking/MealReminder";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userCity, setUserCity] = useState<string | null>(null);
  const [userState, setUserState] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    const checkAuthAndFetchLocation = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsLoggedIn(true);
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("city, state")
          .eq("user_id", user.id)
          .single();
        
        if (profile) {
          setUserCity(profile.city);
          setUserState(profile.state);
        }
      } else {
        setIsLoggedIn(false);
      }
    };
    
    checkAuthAndFetchLocation();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session?.user);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const requireAuth = (callback: () => void) => {
    if (!isLoggedIn) {
      toast({
        title: t('common.loginRequired'),
        description: t('common.pleaseLogin'),
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }
    callback();
  };

  const handleLocationUpdate = (city: string | null, state: string | null) => {
    setUserCity(city);
    setUserState(state);
  };

  const getDisplayLocation = () => {
    if (userCity && userState) {
      return `${userCity}, ${userState}`;
    }
    if (userState) {
      return userState;
    }
    return t('common.setLocation');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: t('common.loggedOut'),
      description: t('common.loggedOutDesc')
    });
    navigate("/auth");
  };

  const categories = [{
    id: "oil-tracker",
    title: t('categories.tracker'),
    subtitle: t('categories.trackerSubtitle'),
    image: trackerMainImg,
    color: "from-primary/20 to-primary/5",
    path: "/tracker"
  }, {
    id: "recipes",
    title: t('categories.fitMeal'),
    subtitle: t('categories.fitMealSubtitle'),
    image: fitMealMainImg,
    color: "from-success/20 to-success/5",
    path: "/fit-meal"
  }, {
    id: "discover",
    title: t('categories.discover'),
    subtitle: t('categories.discoverSubtitle'),
    image: discoverMainImg,
    color: "from-accent/20 to-accent/5",
    path: "/discover"
  }, {
    id: "register-restaurant",
    title: t('home.registerRestaurant'),
    subtitle: t('carousel.joinNetwork'),
    icon: Utensils,
    color: "from-warning/20 to-warning/5",
    path: "/restaurant-apply",
    isIconCard: true
  }];

  return (
    <div className="min-h-screen bg-background pb-24 overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] relative">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Top right blob */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        {/* Bottom left blob */}
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-success/5 rounded-full blur-3xl" />
        {/* Center subtle pattern */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/3 rounded-full blur-3xl opacity-50" />
        {/* Floating dots pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dotPattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="currentColor" className="text-foreground" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dotPattern)" />
        </svg>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md shadow-soft px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="Noil Logo" className="h-10 w-10 object-contain" />
            <LocationEditDialog 
              city={userCity} 
              state={userState} 
              onLocationUpdate={handleLocationUpdate}
            >
              <button className="flex items-center gap-1 hover:bg-secondary/50 px-2 py-1 rounded-lg transition-colors">
                <MapPin className="w-4 h-4 text-primary" />
                <p className="text-sm font-medium text-foreground">
                  {getDisplayLocation()}
                </p>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </button>
            </LocationEditDialog>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
                  <User className="w-5 h-5 text-primary" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-card border-border">
                {isLoggedIn ? (
                  <>
                    <DropdownMenuItem onClick={() => navigate("/profile?tab=health")} className="cursor-pointer">
                      <Heart className="w-4 h-4 mr-2" />
                      {t('home.healthProfile')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/restaurant-apply")} className="cursor-pointer">
                      <Store className="w-4 h-4 mr-2" />
                      {t('home.registerRestaurant')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/certified-restaurants")} className="cursor-pointer">
                      <Shield className="w-4 h-4 mr-2" />
                      {t('home.verifiedRestaurants')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/dashboard")} className="cursor-pointer">
                      <Activity className="w-4 h-4 mr-2" />
                      {t('home.realTimeDashboard')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/policy-dashboard")} className="cursor-pointer">
                      <Landmark className="w-4 h-4 mr-2" />
                      {t('home.policyMakerDashboard')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/community")} className="cursor-pointer">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      {t('common.community')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/profile?tab=rewards")} className="cursor-pointer">
                      <Gift className="w-4 h-4 mr-2" />
                      {t('home.rewardsStore')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/oil-calculator")} className="cursor-pointer">
                      <Calculator className="w-4 h-4 mr-2" />
                      {t('home.oilCalculator')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      {t('common.logout')}
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem onClick={() => navigate("/auth")} className="cursor-pointer">
                    <User className="w-4 h-4 mr-2" />
                    {t('home.loginSignup')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder={t('home.searchPlaceholder')} 
            className="w-full pl-10 pr-4 py-3 bg-secondary rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 space-y-6 max-w-md mx-auto pb-8 relative z-10">
        {/* Meal Reminders */}
        {isLoggedIn && <MealReminder />}

        {/* Categories Grid - 2x2 */}
        <div className="grid grid-cols-2 gap-4">
          {categories.map((category, index) => (
            <Card 
              key={category.id} 
              onClick={() => requireAuth(() => navigate(category.path))} 
              className="group relative overflow-hidden bg-card shadow-medium border-0 cursor-pointer hover:shadow-lg transition-all duration-500 hover:-translate-y-1 animate-in fade-in duration-700 h-48" 
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {category.isIconCard ? (
                // Icon-based card for Register Restaurant
                <div className={`absolute inset-0 bg-gradient-to-br ${category.color}`}>
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-warning/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                      <Utensils className="w-8 h-8 text-warning" />
                    </div>
                    <h3 className="text-base font-bold text-foreground mb-1">{category.title}</h3>
                    <p className="text-xs text-muted-foreground leading-tight">{category.subtitle}</p>
                  </div>
                  {/* Decorative elements */}
                  <div className="absolute top-2 right-2 w-8 h-8 bg-warning/10 rounded-full blur-xl" />
                  <div className="absolute bottom-2 left-2 w-6 h-6 bg-warning/10 rounded-full blur-lg" />
                </div>
              ) : (
                // Image-based card
                <img 
                  src={category.image} 
                  alt={category.title} 
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
              )}
            </Card>
          ))}
        </div>

        {/* Quick Actions Section */}
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-4 shadow-soft border border-border/50">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">{t('home.quickActions')}</h3>
          <div className="grid grid-cols-4 gap-3">
            <button 
              onClick={() => requireAuth(() => navigate("/profile?tab=rewards"))}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <Gift className="w-5 h-5 text-primary" />
              <span className="text-xs text-foreground font-medium">{t('home.rewardsStore').split(' ')[0]}</span>
            </button>
            <button 
              onClick={() => requireAuth(() => navigate("/oil-calculator"))}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <Calculator className="w-5 h-5 text-success" />
              <span className="text-xs text-foreground font-medium">{t('home.oilCalculator').split(' ')[0]}</span>
            </button>
            <button 
              onClick={() => requireAuth(() => navigate("/community"))}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <MessageSquare className="w-5 h-5 text-accent" />
              <span className="text-xs text-foreground font-medium">{t('common.community').slice(0, 6)}</span>
            </button>
            <button 
              onClick={() => requireAuth(() => navigate("/certified-restaurants"))}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <Shield className="w-5 h-5 text-warning" />
              <span className="text-xs text-foreground font-medium">{t('home.verifiedRestaurants').split(' ')[0]}</span>
            </button>
          </div>
        </div>

        {/* Footer Branding with decorative elements */}
        <div className="relative py-10 space-y-4 animate-in fade-in duration-700" style={{ animationDelay: '400ms' }}>
          {/* Decorative line */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-border" />
            <div className="w-2 h-2 rounded-full bg-primary/30" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-border" />
          </div>
          <h2 className="font-black text-muted-foreground/15 leading-tight text-4xl font-serif text-center">
            {t('home.footerTagline')}
          </h2>
        </div>
      </main>

      {/* Chatbot */}
      <Chatbot />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Index;
