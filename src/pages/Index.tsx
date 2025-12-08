import { useState, useEffect } from "react";
import { User, Search, LogOut, Heart, Store, Activity, Gift, Calculator, MapPin, ChevronDown, LayoutDashboard, Shield, Award, MessageSquare, Landmark } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import Chatbot from "@/components/Chatbot";
import { Card } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import trackerMainImg from "@/assets/tracker-main.jpg";
import fitMealMainImg from "@/assets/fit-meal-main.jpg";
import oilhubMainImg from "@/assets/oilhub-main.jpg";
import discoverMainImg from "@/assets/discover-main.jpg";
import logoImg from "@/assets/logo.jpg";
import Autoplay from "embla-carousel-autoplay";
import LocationEditDialog from "@/components/LocationEditDialog";

const Index = () => {
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
        title: "Login Required",
        description: "Please login to access this feature.",
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
    return "Set your location";
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out."
    });
    navigate("/auth");
  };
  const offerSlides = [{
    id: "wellness-challenge",
    badge: "💧 WELLNESS CHALLENGE",
    title: "Save 10% Oil",
    subtitle: "Improve Your Health Today",
    buttonText: "Join Challenge",
    gradient: "bg-gradient-success",
    glowClass: "success-glow",
    action: () => requireAuth(() => navigate("/profile?tab=challenges"))
  }, {
    id: "store-discount",
    badge: "🛍️ SMART STORE SALE",
    title: "Up to 30% OFF",
    subtitle: "On Certified Healthy Oils & Essentials",
    buttonText: "Shop Now",
    gradient: "bg-gradient-primary",
    glowClass: "primary-glow",
    action: () => requireAuth(() => navigate("/oilhub"))
  }, {
    id: "register-restaurant",
    badge: "🍴 PARTNER WITH US",
    title: "Register Restaurant",
    subtitle: "Join Noil's Healthy Dining Network & Grow Your Business",
    buttonText: "Apply Now",
    gradient: "bg-gradient-to-br from-amber-500 to-orange-600",
    glowClass: "amber-glow",
    action: () => requireAuth(() => navigate("/restaurant-apply"))
  }];
  const categories = [{
    id: "oil-tracker",
    title: "Tracker",
    subtitle: "Track Your Daily Oil Use",
    image: trackerMainImg,
    color: "from-blue-500/10 to-cyan-500/10",
    path: "/tracker"
  }, {
    id: "recipes",
    title: "Fit Meal",
    subtitle: "Low-Oil Cooking Ideas",
    image: fitMealMainImg,
    color: "from-green-500/10 to-emerald-500/10",
    path: "/fit-meal"
  }, {
    id: "store",
    title: "OilHub",
    subtitle: "Buy Certified Oils & Essentials",
    image: oilhubMainImg,
    color: "from-orange-500/10 to-amber-500/10",
    path: "/oilhub"
  }, {
    id: "discover",
    title: "Discover",
    subtitle: "Learn Healthy Habits",
    image: discoverMainImg,
    color: "from-purple-500/10 to-pink-500/10",
    path: "/discover"
  }];
  return <div className="min-h-screen bg-background pb-24 overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card shadow-soft px-4 py-4">
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
                    Health Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/restaurant-apply")} className="cursor-pointer">
                    <Store className="w-4 h-4 mr-2" />
                    Register Restaurant
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/certified-restaurants")} className="cursor-pointer">
                    <Shield className="w-4 h-4 mr-2" />
                    Verified Restaurants
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/dashboard")} className="cursor-pointer">
                    <Activity className="w-4 h-4 mr-2" />
                    Real Time Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/policy-dashboard")} className="cursor-pointer">
                    <Landmark className="w-4 h-4 mr-2" />
                    Policy Maker Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/community")} className="cursor-pointer">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Community
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/profile?tab=rewards")} className="cursor-pointer">
                    <Gift className="w-4 h-4 mr-2" />
                    Rewards Store
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/oil-calculator")} className="cursor-pointer">
                    <Calculator className="w-4 h-4 mr-2" />
                    Oil Calculator
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onClick={() => navigate("/auth")} className="cursor-pointer">
                  <User className="w-4 h-4 mr-2" />
                  Login / Sign Up
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input type="text" placeholder="Search healthy recipes, oils, guides..." className="w-full pl-10 pr-4 py-3 bg-secondary rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-success/20 transition-all" />
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 space-y-6 max-w-md mx-auto pb-8">
        {/* Offer Carousel */}
        <div className="relative">
          <Carousel opts={{
            align: "start",
            loop: true
          }} plugins={[Autoplay({
            delay: 4000,
            stopOnInteraction: true
          })]} className="w-full animate-in fade-in slide-in-from-top-4 duration-500">
            <CarouselContent>
              {offerSlides.map(slide => <CarouselItem key={slide.id}>
                  <Card className={`relative overflow-hidden ${slide.gradient} border-0 p-6 min-h-[160px]`}>
                    <div className="absolute inset-0 bg-gradient-radial opacity-40" />
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl opacity-20" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl opacity-15" />
                    
                    <div className="relative z-10 space-y-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 rounded-full mb-2">
                        <span className="text-xs font-bold text-white">{slide.badge}</span>
                      </div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">
                        {slide.title}
                      </h2>
                      <p className="text-white/90 font-medium text-sm">{slide.subtitle}</p>
                      <button onClick={slide.action} className="mt-3 px-5 py-2 bg-white text-foreground rounded-lg font-semibold text-sm hover:scale-105 transition-transform shadow-md">
                        {slide.buttonText}
                      </button>
                    </div>
                  </Card>
                </CarouselItem>)}
            </CarouselContent>
            <CarouselPrevious className="left-2 bg-white/80 hover:bg-white border-0 shadow-md" />
            <CarouselNext className="right-2 bg-white/80 hover:bg-white border-0 shadow-md" />
          </Carousel>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 gap-4">
          {categories.map((category, index) => <Card key={category.id} onClick={() => requireAuth(() => navigate(category.path))} className="group relative overflow-hidden bg-card shadow-medium border-0 cursor-pointer hover:shadow-lg transition-all duration-500 hover:-translate-y-1 animate-in fade-in duration-700 h-48" style={{
          animationDelay: `${index * 150}ms`
        }}>
              {/* Full Image Background */}
              <img src={category.image} alt={category.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </Card>)}
        </div>

        {/* Footer Branding */}
        <div className="py-12 space-y-4 animate-in fade-in duration-700" style={{
        animationDelay: '600ms'
      }}>
          <h2 className="font-black text-muted-foreground/20 leading-tight text-5xl font-serif text-center">Less Oil, Same Taste, Better Life <br />
            ​
          </h2>
          
        </div>
      </main>

      {/* Chatbot */}
      <Chatbot />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>;
};
export default Index;