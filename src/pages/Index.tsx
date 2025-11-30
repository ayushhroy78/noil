import { Heart, Search, Home, Activity, Book, ShoppingBag, Compass } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import oilTrackerImg from "@/assets/oil-tracker-illustration.png";
import recipesImg from "@/assets/healthy-recipes-illustration.png";
import storeImg from "@/assets/smart-store-illustration.png";
import discoverImg from "@/assets/discover-wellness-illustration.png";
import Autoplay from "embla-carousel-autoplay";

const Index = () => {
  const offerSlides = [
    {
      id: "wellness-challenge",
      badge: "💧 WELLNESS CHALLENGE",
      title: "Save 10% Oil",
      subtitle: "Improve Your Health Today",
      buttonText: "Join Challenge",
      gradient: "bg-gradient-success",
      glowClass: "success-glow",
    },
    {
      id: "store-discount",
      badge: "🛍️ SMART STORE SALE",
      title: "Up to 30% OFF",
      subtitle: "On Certified Healthy Oils & Essentials",
      buttonText: "Shop Now",
      gradient: "bg-gradient-primary",
      glowClass: "primary-glow",
    },
  ];

  const categories = [
    {
      id: "oil-tracker",
      title: "Oil Tracker",
      subtitle: "Track Your Daily Oil Use",
      image: oilTrackerImg,
      color: "from-blue-500/10 to-cyan-500/10",
    },
    {
      id: "recipes",
      title: "Healthy Recipes",
      subtitle: "Low-Oil Cooking Ideas",
      image: recipesImg,
      color: "from-green-500/10 to-emerald-500/10",
    },
    {
      id: "store",
      title: "Smart Store",
      subtitle: "Buy Certified Oils & Essentials",
      image: storeImg,
      color: "from-orange-500/10 to-amber-500/10",
    },
    {
      id: "discover",
      title: "Discover",
      subtitle: "Learn Healthy Habits",
      image: discoverImg,
      color: "from-purple-500/10 to-pink-500/10",
    },
  ];

  const navItems = [
    { icon: Activity, label: "Tracker", active: false },
    { icon: Book, label: "Recipes", active: false },
    { icon: Home, label: "Home", active: true },
    { icon: ShoppingBag, label: "Store", active: false },
    { icon: Compass, label: "Discover", active: false },
  ];

  return (
    <div className="min-h-screen bg-background pb-40 overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card shadow-soft px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-primary">noil</h1>
            <div>
              <p className="text-xs text-muted-foreground">Koramangala, Bangalore</p>
            </div>
          </div>
          <button className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
            <Heart className="w-5 h-5 text-primary" />
          </button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search healthy recipes, oils, guides..."
            className="w-full pl-10 pr-4 py-3 bg-secondary rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-success/20 transition-all"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 space-y-6 max-w-md mx-auto pb-8">
        {/* Offer Carousel */}
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 4000,
            }),
          ]}
          className="w-full animate-in fade-in slide-in-from-top-4 duration-500"
        >
          <CarouselContent>
            {offerSlides.map((slide) => (
              <CarouselItem key={slide.id}>
                <Card className={`relative overflow-hidden ${slide.gradient} shadow-glow-${slide.id === 'wellness-challenge' ? 'success' : 'primary'} border-0 p-6`}>
                  <div className="absolute inset-0 bg-gradient-radial opacity-40" />
                  <div className={`absolute top-0 right-0 w-40 h-40 bg-${slide.glowClass} rounded-full blur-3xl opacity-20`} />
                  <div className={`absolute bottom-0 left-0 w-32 h-32 bg-${slide.glowClass} rounded-full blur-2xl opacity-15`} />
                  
                  <div className="relative z-10 space-y-2">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 ${slide.id === 'wellness-challenge' ? 'bg-success-foreground/15' : 'bg-primary-foreground/15'} rounded-full mb-2`}>
                      <span className="text-xs font-bold ${slide.id === 'wellness-challenge' ? 'text-success-foreground' : 'text-primary-foreground'}">{slide.badge}</span>
                    </div>
                    <h2 className={`text-2xl font-bold ${slide.id === 'wellness-challenge' ? 'text-success-foreground' : 'text-primary-foreground'} tracking-tight`}>
                      {slide.title}
                    </h2>
                    <p className={`${slide.id === 'wellness-challenge' ? 'text-success-foreground/90' : 'text-primary-foreground/90'} font-medium`}>{slide.subtitle}</p>
                    <button className={`mt-3 px-5 py-2 ${slide.id === 'wellness-challenge' ? 'bg-success-foreground text-success' : 'bg-primary-foreground text-primary'} rounded-lg font-semibold text-sm hover:scale-105 transition-transform`}>
                      {slide.buttonText}
                    </button>
                  </div>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 gap-4">
          {categories.map((category, index) => (
            <Card
              key={category.id}
              className="group relative overflow-hidden bg-card shadow-medium border-0 p-5 cursor-pointer hover:shadow-lg transition-all duration-500 hover:-translate-y-1 animate-in fade-in duration-700"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              
              <div className="relative z-10 space-y-3">
                <div className="w-16 h-16 mx-auto">
                  <img
                    src={category.image}
                    alt={category.title}
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-foreground text-base mb-1">
                    {category.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {category.subtitle}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Promotional Card */}
        <Card className="relative overflow-hidden bg-gradient-primary shadow-medium border-0 p-6 animate-in fade-in duration-700" style={{ animationDelay: '600ms' }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-foreground/10 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-foreground/10 rounded-full blur-xl" />
          
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-primary-foreground mb-1">
                  Healthy Rewards
                </h3>
                <p className="text-primary-foreground/90 text-sm">
                  Earn Points for Every Healthy Choice
                </p>
              </div>
              <div className="w-16 h-16 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                <span className="text-3xl">🌟</span>
              </div>
            </div>
            <button className="w-full py-3 bg-primary-foreground text-primary rounded-xl font-semibold text-sm hover:scale-105 transition-transform">
              Learn More
            </button>
          </div>
        </Card>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card shadow-nav border-t border-border/50 backdrop-blur-sm">
        <div className="max-w-md mx-auto flex items-center justify-around px-4 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isHome = item.label === "Home";
            return (
              <button
                key={item.label}
                className={`flex flex-col items-center gap-1 rounded-xl transition-all ${
                  isHome 
                    ? "px-4 py-2 -mt-6 bg-primary text-primary-foreground shadow-lg scale-110" 
                    : `px-3 py-1.5 ${
                        item.active
                          ? "text-primary bg-primary/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      }`
                }`}
              >
                <Icon className={`w-6 h-6 ${isHome ? "fill-primary-foreground" : item.active ? "fill-primary" : ""}`} />
                <span className={`text-xs font-medium ${isHome ? "font-semibold" : ""}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Index;
