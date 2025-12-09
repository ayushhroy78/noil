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
              {category.id === "oil-tracker" && (
                // Tracker Tile - Teal/Cyan gradient with oil meter
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-cyan-500">
                  {/* Floating oil drops */}
                  <div className="absolute top-3 right-3 w-4 h-6 bg-white/20 rounded-full blur-[1px] animate-pulse" />
                  <div className="absolute top-8 right-8 w-3 h-4 bg-white/15 rounded-full blur-[1px]" style={{ animationDelay: '200ms' }} />
                  <div className="absolute bottom-12 right-4 w-2 h-3 bg-white/20 rounded-full blur-[1px]" />
                  
                  {/* Oil Meter Illustration */}
                  <div className="absolute bottom-2 right-2 w-20 h-24 opacity-90">
                    <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                      {/* Bottle shape */}
                      <path d="M30 15 L30 25 L20 35 L20 85 Q20 95 30 95 L50 95 Q60 95 60 85 L60 35 L50 25 L50 15 Z" 
                        fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.5)" strokeWidth="2"/>
                      {/* Oil level */}
                      <path d="M22 50 L22 83 Q22 93 30 93 L50 93 Q58 93 58 83 L58 50 Z" 
                        fill="rgba(255,255,255,0.4)"/>
                      {/* Bottle cap */}
                      <rect x="28" y="8" width="24" height="10" rx="3" fill="rgba(255,255,255,0.3)"/>
                      {/* Measurement lines */}
                      <line x1="62" y1="45" x2="68" y2="45" stroke="rgba(255,255,255,0.4)" strokeWidth="2"/>
                      <line x1="62" y1="60" x2="68" y2="60" stroke="rgba(255,255,255,0.4)" strokeWidth="2"/>
                      <line x1="62" y1="75" x2="68" y2="75" stroke="rgba(255,255,255,0.4)" strokeWidth="2"/>
                    </svg>
                  </div>
                  
                  {/* Badge */}
                  <div className="absolute bottom-3 left-3 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                    <span className="text-[10px] font-semibold text-white">{t('tracker.dailyGoal')}</span>
                  </div>
                  
                  {/* Text content */}
                  <div className="absolute top-4 left-4 z-10">
                    <h3 className="text-lg font-bold text-white mb-1 drop-shadow-md">{category.title}</h3>
                    <p className="text-xs text-white/80 leading-tight max-w-[100px]">{category.subtitle}</p>
                  </div>
                  
                  {/* Decorative circles */}
                  <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                </div>
              )}

              {category.id === "recipes" && (
                // Fit Meal Tile - Green/Emerald gradient with food icons
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500">
                  {/* Floating leaves */}
                  <div className="absolute top-4 right-4 w-6 h-6 opacity-60">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.5 2 2 6.5 2 12c0 3.5 2 6.5 5 8 0-4 3-8 5-10 2 2 5 6 5 10 3-1.5 5-4.5 5-8 0-5.5-4.5-10-10-10z" 
                        fill="rgba(255,255,255,0.4)"/>
                    </svg>
                  </div>
                  <div className="absolute bottom-16 right-6 w-4 h-4 opacity-50 rotate-45">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.5 2 2 6.5 2 12c0 3.5 2 6.5 5 8 0-4 3-8 5-10 2 2 5 6 5 10 3-1.5 5-4.5 5-8 0-5.5-4.5-10-10-10z" 
                        fill="rgba(255,255,255,0.4)"/>
                    </svg>
                  </div>
                  
                  {/* Salad Bowl Illustration */}
                  <div className="absolute bottom-1 right-1 w-24 h-24 opacity-90">
                    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                      {/* Bowl */}
                      <ellipse cx="50" cy="70" rx="40" ry="15" fill="rgba(255,255,255,0.25)"/>
                      <path d="M10 55 Q10 85 50 85 Q90 85 90 55" fill="rgba(255,255,255,0.3)" stroke="rgba(255,255,255,0.5)" strokeWidth="2"/>
                      {/* Vegetables */}
                      <circle cx="35" cy="50" r="10" fill="rgba(255,255,255,0.35)"/>
                      <circle cx="55" cy="45" r="8" fill="rgba(255,255,255,0.3)"/>
                      <circle cx="70" cy="52" r="9" fill="rgba(255,255,255,0.35)"/>
                      <ellipse cx="45" cy="40" rx="12" ry="6" fill="rgba(255,255,255,0.25)" transform="rotate(-15 45 40)"/>
                      {/* Fork */}
                      <path d="M20 25 L20 45 M15 25 L15 35 M25 25 L25 35" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  
                  {/* Badges */}
                  <div className="absolute bottom-3 left-3 flex gap-1">
                    <div className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                      <span className="text-[10px] font-semibold text-white">{t('fitMeal.lowOil')}</span>
                    </div>
                  </div>
                  
                  {/* Text content */}
                  <div className="absolute top-4 left-4 z-10">
                    <h3 className="text-lg font-bold text-white mb-1 drop-shadow-md">{category.title}</h3>
                    <p className="text-xs text-white/80 leading-tight max-w-[100px]">{category.subtitle}</p>
                  </div>
                  
                  {/* Decorative circles */}
                  <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full blur-xl" />
                </div>
              )}

              {category.id === "discover" && (
                // Discover Tile - Purple/Violet gradient with wellness icons
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500">
                  {/* Stars */}
                  <div className="absolute top-5 right-6 text-white/40">✦</div>
                  <div className="absolute top-10 right-3 text-white/30 text-sm">✦</div>
                  <div className="absolute bottom-20 right-8 text-white/25 text-xs">✦</div>
                  
                  {/* Wellness Heart Illustration */}
                  <div className="absolute bottom-2 right-2 w-20 h-20 opacity-90">
                    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                      {/* Heart shape */}
                      <path d="M40 70 C20 50 5 35 5 22 C5 12 15 5 25 5 C32 5 38 10 40 15 C42 10 48 5 55 5 C65 5 75 12 75 22 C75 35 60 50 40 70Z" 
                        fill="rgba(255,255,255,0.25)" stroke="rgba(255,255,255,0.5)" strokeWidth="2"/>
                      {/* Pulse line */}
                      <path d="M20 38 L30 38 L35 28 L40 48 L45 33 L50 38 L60 38" 
                        stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      {/* Sparkle */}
                      <circle cx="60" cy="20" r="3" fill="rgba(255,255,255,0.4)"/>
                      <path d="M60 15 L60 25 M55 20 L65 20" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
                    </svg>
                  </div>
                  
                  {/* Badges */}
                  <div className="absolute bottom-3 left-3 flex gap-1">
                    <div className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                      <span className="text-[10px] font-semibold text-white">{t('discover.learn')}</span>
                    </div>
                  </div>
                  
                  {/* Text content */}
                  <div className="absolute top-4 left-4 z-10">
                    <h3 className="text-lg font-bold text-white mb-1 drop-shadow-md">{category.title}</h3>
                    <p className="text-xs text-white/80 leading-tight max-w-[100px]">{category.subtitle}</p>
                  </div>
                  
                  {/* Decorative circles */}
                  <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-white/10 rounded-full blur-xl" />
                </div>
              )}

              {category.isIconCard && (
                // Register Restaurant Tile - Olive gradient with Fork & Knife
                <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #808000 0%, #6B8E23 50%, #556B2F 100%)' }}>
                  {/* Decorative floating elements */}
                  <div className="absolute top-3 right-3 w-8 h-8 bg-white/10 rounded-full blur-sm" />
                  <div className="absolute bottom-16 left-4 w-6 h-6 bg-white/10 rounded-full blur-sm" />
                  
                  {/* Fork & Knife Illustration */}
                  <div className="absolute bottom-1 right-1 w-24 h-24 opacity-90">
                    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                      {/* Fork */}
                      <g transform="translate(20, 8)">
                        {/* Fork tines */}
                        <rect x="8" y="0" width="3" height="22" rx="1.5" fill="white" opacity="0.85"/>
                        <rect x="14" y="0" width="3" height="22" rx="1.5" fill="white" opacity="0.85"/>
                        <rect x="20" y="0" width="3" height="22" rx="1.5" fill="white" opacity="0.85"/>
                        <rect x="26" y="0" width="3" height="22" rx="1.5" fill="white" opacity="0.85"/>
                        {/* Fork neck */}
                        <path d="M8 22 Q8 32 18.5 32 Q29 32 29 22" fill="white" opacity="0.85"/>
                        {/* Fork handle */}
                        <rect x="15" y="32" width="7" height="50" rx="3" fill="white" opacity="0.85"/>
                      </g>
                      
                      {/* Knife */}
                      <g transform="translate(52, 8)">
                        {/* Knife blade */}
                        <path d="M5 0 L5 38 Q5 43 10 43 L18 43 L18 5 Q18 2 14 0 Z" fill="white" opacity="0.85"/>
                        {/* Knife handle */}
                        <rect x="5" y="43" width="13" height="40" rx="3" fill="white" opacity="0.8"/>
                        {/* Handle details */}
                        <rect x="8" y="48" width="7" height="3" rx="1" fill="#556B2F" opacity="0.4"/>
                        <rect x="8" y="55" width="7" height="3" rx="1" fill="#556B2F" opacity="0.4"/>
                        <rect x="8" y="62" width="7" height="3" rx="1" fill="#556B2F" opacity="0.4"/>
                      </g>
                    </svg>
                  </div>
                  
                  {/* Text content */}
                  <div className="absolute top-4 left-4 z-10">
                    <h3 className="text-lg font-bold text-white mb-1 drop-shadow-md">{category.title}</h3>
                    <p className="text-xs text-white/80 leading-tight max-w-[100px]">{category.subtitle}</p>
                  </div>
                  
                  {/* Badge */}
                  <div className="absolute bottom-3 left-3 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                    <span className="text-[10px] font-semibold text-white">Partner</span>
                  </div>
                  
                  {/* Decorative circles */}
                  <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                </div>
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
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-all hover:scale-105 group"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow"
                   style={{ background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #2dd4bf 100%)' }}>
                <Gift className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-foreground font-medium">{t('home.rewardsStore').split(' ')[0]}</span>
            </button>
            <button 
              onClick={() => requireAuth(() => navigate("/oil-calculator"))}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-all hover:scale-105 group"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow"
                   style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)' }}>
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-foreground font-medium">{t('home.oilCalculator').split(' ')[0]}</span>
            </button>
            <button 
              onClick={() => requireAuth(() => navigate("/community"))}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-all hover:scale-105 group"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow"
                   style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #a78bfa 100%)' }}>
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-foreground font-medium">{t('common.community')}</span>
            </button>
            <button 
              onClick={() => requireAuth(() => navigate("/certified-restaurants"))}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-all hover:scale-105 group"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow"
                   style={{ background: 'linear-gradient(135deg, #808000 0%, #6B8E23 50%, #556B2F 100%)' }}>
                <Shield className="w-5 h-5 text-white" />
              </div>
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
