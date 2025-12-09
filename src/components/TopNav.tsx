import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { User, LogOut, Activity, MapPin, ChevronDown, Shield, Landmark, ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logoImg from "@/assets/logo.jpg";
import LocationEditDialog from "@/components/LocationEditDialog";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface TopNavProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  showSearch?: boolean;
}

export const TopNav = ({ title, subtitle, showBackButton = false, showSearch = false }: TopNavProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
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
      if (session?.user) {
        // Refetch location on auth change
        supabase
          .from("user_profiles")
          .select("city, state")
          .eq("user_id", session.user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              setUserCity(data.city);
              setUserState(data.state);
            }
          });
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

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

  const isHomePage = location.pathname === "/" || location.pathname === "/home";

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md shadow-soft px-4 py-3 border-b border-border/50">
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-2">
          {showBackButton && !isHomePage ? (
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-primary" />
            </button>
          ) : (
            <img src={logoImg} alt="Noil Logo" className="h-10 w-10 object-contain" />
          )}
          
          {title ? (
            <div>
              <h1 className="text-lg font-bold text-foreground">{title}</h1>
              {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
          ) : (
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
          )}
        </div>

        {/* Right Section */}
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
    </header>
  );
};

export default TopNav;
