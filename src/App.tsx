import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import SplashScreen from "@/components/SplashScreen";
import Index from "./pages/Index";
import Tracker from "./pages/Tracker";
import FitMeal from "./pages/FitMeal";
import OilHub from "./pages/OilHub";
import Cart from "./pages/Cart";
import Discover from "./pages/Discover";
import Profile from "./pages/Profile";
import RestaurantApply from "./pages/RestaurantApply";
import Restaurants from "./pages/Restaurants";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import OilCalculator from "./pages/OilCalculator";
import Dashboard from "./pages/Dashboard";
import CompleteProfile from "./pages/CompleteProfile";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/tracker" element={<Tracker />} />
              <Route path="/fit-meal" element={<FitMeal />} />
              <Route path="/oilhub" element={<OilHub />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/restaurant-apply" element={<RestaurantApply />} />
              <Route path="/restaurants" element={<Restaurants />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/oil-calculator" element={<OilCalculator />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/complete-profile" element={<CompleteProfile />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
