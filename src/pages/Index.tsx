import { Heart, Search, Home, Activity, Book, ShoppingBag, Compass } from "lucide-react";
import { Card } from "@/components/ui/card";
import oilTrackerImg from "@/assets/oil-tracker-illustration.png";
import recipesImg from "@/assets/healthy-recipes-illustration.png";
import storeImg from "@/assets/smart-store-illustration.png";
import discoverImg from "@/assets/discover-wellness-illustration.png";

const Index = () => {
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
    { icon: Home, label: "Home", active: true },
    { icon: Activity, label: "Tracker", active: false },
    { icon: Book, label: "Recipes", active: false },
    { icon: ShoppingBag, label: "Store", active: false },
    { icon: Compass, label: "Discover", active: false },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card shadow-soft px-4 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-5 h-5 text-success fill-success/20" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Wellness Home</p>
            <p className="text-xs text-muted-foreground">Koramangala, Bangalore</p>
          </div>
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
      <main className="px-4 py-6 space-y-6 max-w-md mx-auto">
        {/* Offer Banner */}
        <Card className="relative overflow-hidden bg-gradient-success shadow-glow-success border-0 p-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="absolute inset-0 bg-gradient-radial opacity-40" />
          <div className="absolute top-0 right-0 w-40 h-40 bg-success-glow rounded-full blur-3xl opacity-20" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-success-glow rounded-full blur-2xl opacity-15" />
          
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-success-foreground/15 rounded-full mb-2">
              <span className="text-xl">💧</span>
              <span className="text-xs font-bold text-success-foreground">WELLNESS CHALLENGE</span>
            </div>
            <h2 className="text-2xl font-bold text-success-foreground tracking-tight">
              Save 10% Oil
            </h2>
            <p className="text-success-foreground/90 font-medium">Improve Your Health Today</p>
            <button className="mt-3 px-5 py-2 bg-success-foreground text-success rounded-lg font-semibold text-sm hover:scale-105 transition-transform">
              Join Challenge
            </button>
          </div>
        </Card>

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
        <Card className="relative overflow-hidden bg-gradient-primary shadow-medium border-0 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
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
      <nav className="fixed bottom-0 left-0 right-0 bg-card shadow-[0_-4px_16px_rgba(0,0,0,0.08)] border-t border-border">
        <div className="max-w-md mx-auto flex items-center justify-around px-4 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className={`flex flex-col items-center gap-1 px-3 py-1 transition-all ${
                  item.active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`w-5 h-5 ${item.active ? "fill-primary" : ""}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Index;
