import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Search, Gift, Calculator, Shield, MessageSquare, Utensils, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { TopNav } from "@/components/TopNav";
import Chatbot from "@/components/Chatbot";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import trackerMainImg from "@/assets/tracker-main.jpg";
import fitMealMainImg from "@/assets/fit-meal-main.jpg";
import discoverMainImg from "@/assets/discover-main.jpg";
import { MealReminder } from "@/components/tracking/MealReminder";

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
        {/* Animated gradient orbs */}
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -left-32 w-80 h-80 bg-success/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 -right-16 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Floating oil drops */}
        <div className="absolute top-1/4 right-8 opacity-20 animate-float">
          <svg width="32" height="40" viewBox="0 0 40 50" className="text-primary fill-current">
            <path d="M20 0C20 0 0 20 0 32C0 42 9 50 20 50C31 50 40 42 40 32C40 20 20 0 20 0Z" />
          </svg>
        </div>
        <div className="absolute top-2/3 left-6 opacity-15 animate-float" style={{ animationDelay: '1.5s' }}>
          <svg width="20" height="25" viewBox="0 0 40 50" className="text-success fill-current">
            <path d="M20 0C20 0 0 20 0 32C0 42 9 50 20 50C31 50 40 42 40 32C40 20 20 0 20 0Z" />
          </svg>
        </div>
        <div className="absolute top-1/2 right-1/4 opacity-10 animate-float-slow" style={{ animationDelay: '2.5s' }}>
          <svg width="24" height="30" viewBox="0 0 40 50" className="text-primary fill-current">
            <path d="M20 0C20 0 0 20 0 32C0 42 9 50 20 50C31 50 40 42 40 32C40 20 20 0 20 0Z" />
          </svg>
        </div>
        <div className="absolute bottom-1/3 left-1/4 opacity-12 animate-float" style={{ animationDelay: '3s' }}>
          <svg width="18" height="22" viewBox="0 0 40 50" className="text-accent fill-current">
            <path d="M20 0C20 0 0 20 0 32C0 42 9 50 20 50C31 50 40 42 40 32C40 20 20 0 20 0Z" />
          </svg>
        </div>

        {/* Decorative pinging circles */}
        <div className="absolute top-40 left-1/3 w-3 h-3 bg-primary/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
        <div className="absolute top-3/4 right-1/3 w-2 h-2 bg-success/25 rounded-full animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-10 w-4 h-4 bg-accent/15 rounded-full animate-ping" style={{ animationDuration: '5s', animationDelay: '2s' }} />

        {/* Subtle wave pattern at bottom */}
        <svg className="absolute bottom-0 left-0 w-full h-24 opacity-[0.04]" preserveAspectRatio="none" viewBox="0 0 1440 120">
          <path d="M0,60 C360,120 720,0 1080,60 C1260,90 1380,75 1440,60 L1440,120 L0,120 Z" className="fill-primary" />
        </svg>

        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      {/* Header */}
      <TopNav />

      {/* Search Bar */}
      <div className="sticky top-[60px] z-40 bg-card/95 backdrop-blur-md px-4 py-2 border-b border-border/30">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder={t('home.searchPlaceholder')} 
            className="w-full pl-10 pr-4 py-3 bg-secondary rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
          />
        </div>
      </div>

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
              className="group relative overflow-hidden bg-card shadow-medium border-0 cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] animate-in fade-in duration-700 h-48 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)]" 
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Hover glow overlay */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-20 ${
                category.id === "oil-tracker" ? "shadow-[inset_0_0_30px_rgba(20,184,166,0.3)]" :
                category.id === "recipes" ? "shadow-[inset_0_0_30px_rgba(16,185,129,0.3)]" :
                category.id === "discover" ? "shadow-[inset_0_0_30px_rgba(139,92,246,0.3)]" :
                "shadow-[inset_0_0_30px_rgba(107,142,35,0.3)]"
              }`} />
              
              {category.id === "oil-tracker" && (
                // Tracker Tile - Teal/Cyan gradient with oil meter
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-cyan-500 transition-all duration-500 group-hover:from-primary/90 group-hover:via-primary/80 group-hover:to-cyan-400">
                  {/* Animated glow ring */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/20 rounded-full blur-3xl animate-pulse" />
                  </div>
                  {/* Floating oil drops */}
                  <div className="absolute top-3 right-3 w-4 h-6 bg-white/20 rounded-full blur-[1px] animate-pulse group-hover:scale-125 transition-transform duration-300" />
                  <div className="absolute top-8 right-8 w-3 h-4 bg-white/15 rounded-full blur-[1px] group-hover:scale-125 transition-transform duration-300" style={{ animationDelay: '200ms' }} />
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
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 transition-all duration-500 group-hover:from-emerald-400 group-hover:via-green-400 group-hover:to-teal-400">
                  {/* Animated glow ring */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/20 rounded-full blur-3xl animate-pulse" />
                  </div>
                  {/* Floating leaves */}
                  <div className="absolute top-4 right-4 w-6 h-6 opacity-60 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.5 2 2 6.5 2 12c0 3.5 2 6.5 5 8 0-4 3-8 5-10 2 2 5 6 5 10 3-1.5 5-4.5 5-8 0-5.5-4.5-10-10-10z" 
                        fill="rgba(255,255,255,0.4)"/>
                    </svg>
                  </div>
                  <div className="absolute bottom-16 right-6 w-4 h-4 opacity-50 rotate-45 group-hover:scale-125 group-hover:rotate-90 transition-all duration-300">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.5 2 2 6.5 2 12c0 3.5 2 6.5 5 8 0-4 3-8 5-10 2 2 5 6 5 10 3-1.5 5-4.5 5-8 0-5.5-4.5-10-10-10z" 
                        fill="rgba(255,255,255,0.4)"/>
                    </svg>
                  </div>
                  
                  {/* Salad Bowl Illustration */}
                  <div className="absolute bottom-1 right-1 w-24 h-24 opacity-90 group-hover:scale-110 transition-transform duration-500">
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
                    <div className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full group-hover:bg-white/30 transition-colors duration-300">
                      <span className="text-[10px] font-semibold text-white">{t('fitMeal.lowOil')}</span>
                    </div>
                  </div>
                  
                  {/* Text content */}
                  <div className="absolute top-4 left-4 z-10">
                    <h3 className="text-lg font-bold text-white mb-1 drop-shadow-md group-hover:drop-shadow-lg transition-all duration-300">{category.title}</h3>
                    <p className="text-xs text-white/80 leading-tight max-w-[100px]">{category.subtitle}</p>
                  </div>
                  
                  {/* Decorative circles */}
                  <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:w-24 group-hover:h-24 group-hover:bg-white/20 transition-all duration-500" />
                </div>
              )}

              {category.id === "discover" && (
                // Discover Tile - Purple/Violet gradient with wellness icons
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 transition-all duration-500 group-hover:from-violet-400 group-hover:via-purple-400 group-hover:to-indigo-400">
                  {/* Animated glow ring */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/20 rounded-full blur-3xl animate-pulse" />
                  </div>
                  {/* Stars */}
                  <div className="absolute top-5 right-6 text-white/40 group-hover:scale-150 group-hover:text-white/60 transition-all duration-300">✦</div>
                  <div className="absolute top-10 right-3 text-white/30 text-sm group-hover:scale-150 group-hover:text-white/50 transition-all duration-300" style={{ transitionDelay: '50ms' }}>✦</div>
                  <div className="absolute bottom-20 right-8 text-white/25 text-xs group-hover:scale-150 group-hover:text-white/40 transition-all duration-300" style={{ transitionDelay: '100ms' }}>✦</div>
                  
                  {/* Wellness Heart Illustration */}
                  <div className="absolute bottom-2 right-2 w-20 h-20 opacity-90 group-hover:scale-110 transition-transform duration-500">
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
                    <div className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full group-hover:bg-white/30 transition-colors duration-300">
                      <span className="text-[10px] font-semibold text-white">{t('discover.learn')}</span>
                    </div>
                  </div>
                  
                  {/* Text content */}
                  <div className="absolute top-4 left-4 z-10">
                    <h3 className="text-lg font-bold text-white mb-1 drop-shadow-md group-hover:drop-shadow-lg transition-all duration-300">{category.title}</h3>
                    <p className="text-xs text-white/80 leading-tight max-w-[100px]">{category.subtitle}</p>
                  </div>
                  
                  {/* Decorative circles */}
                  <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-white/10 rounded-full blur-xl group-hover:w-32 group-hover:h-32 group-hover:bg-white/20 transition-all duration-500" />
                </div>
              )}

              {category.isIconCard && (
                // Register Restaurant Tile - Olive gradient with Fork & Knife
                <div className="absolute inset-0 transition-all duration-500" style={{ background: 'linear-gradient(135deg, #808000 0%, #6B8E23 50%, #556B2F 100%)' }}>
                  {/* Animated glow ring */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/20 rounded-full blur-3xl animate-pulse" />
                  </div>
                  {/* Decorative floating elements */}
                  <div className="absolute top-3 right-3 w-8 h-8 bg-white/10 rounded-full blur-sm group-hover:scale-125 group-hover:bg-white/20 transition-all duration-300" />
                  <div className="absolute bottom-16 left-4 w-6 h-6 bg-white/10 rounded-full blur-sm group-hover:scale-125 group-hover:bg-white/20 transition-all duration-300" />
                  
                  {/* Fork & Knife Illustration */}
                  <div className="absolute bottom-1 right-1 w-24 h-24 opacity-90 group-hover:scale-110 transition-transform duration-500">
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
                    <h3 className="text-lg font-bold text-white mb-1 drop-shadow-md group-hover:drop-shadow-lg transition-all duration-300">{category.title}</h3>
                    <p className="text-xs text-white/80 leading-tight max-w-[100px]">{category.subtitle}</p>
                  </div>
                  
                  {/* Badge */}
                  <div className="absolute bottom-3 left-3 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full group-hover:bg-white/30 transition-colors duration-300">
                    <span className="text-[10px] font-semibold text-white">Partner</span>
                  </div>
                  
                  {/* Decorative circles */}
                  <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:w-28 group-hover:h-28 group-hover:bg-white/20 transition-all duration-500" />
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Quick Actions Section */}
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-4 shadow-soft border border-border/50">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">{t('home.quickActions')}</h3>
          <div className="grid grid-cols-5 gap-2">
            <button 
              onClick={() => requireAuth(() => navigate("/profile?tab=rewards"))}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-all hover:scale-105 group"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow"
                   style={{ background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #2dd4bf 100%)' }}>
                <Gift className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] text-foreground font-medium">{t('home.rewardsStore').split(' ')[0]}</span>
            </button>
            <button 
              onClick={() => requireAuth(() => navigate("/oil-calculator"))}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-all hover:scale-105 group"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow"
                   style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)' }}>
                <Calculator className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] text-foreground font-medium">{t('home.oilCalculator').split(' ')[0]}</span>
            </button>
            <button 
              onClick={() => requireAuth(() => navigate("/dashboard"))}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-all hover:scale-105 group"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow"
                   style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)' }}>
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] text-foreground font-medium">{t('home.realTimeDashboard').split(' ')[0]}</span>
            </button>
            <button 
              onClick={() => requireAuth(() => navigate("/community"))}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-all hover:scale-105 group"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow"
                   style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #a78bfa 100%)' }}>
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] text-foreground font-medium">{t('common.community')}</span>
            </button>
            <button 
              onClick={() => requireAuth(() => navigate("/certified-restaurants"))}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-all hover:scale-105 group"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow"
                   style={{ background: 'linear-gradient(135deg, #808000 0%, #6B8E23 50%, #556B2F 100%)' }}>
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] text-foreground font-medium">{t('home.verifiedRestaurants').split(' ')[0]}</span>
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
