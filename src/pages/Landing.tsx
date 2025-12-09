import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Droplets, 
  ChefHat, 
  ShoppingBag, 
  BookOpen, 
  TrendingDown, 
  Users, 
  Award, 
  Shield,
  ArrowRight,
  Heart,
  Activity,
  Target
} from "lucide-react";
import logoImg from "@/assets/logo.jpg";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Activity,
      title: "Smart Oil Tracking",
      description: "Track your daily oil consumption with bottle tracking, barcode scanning, and manual logging. Get real-time insights on your usage patterns.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: ChefHat,
      title: "Fit Meal Recipes",
      description: "Discover 100+ low-oil recipes or create custom ones with our AI Recipe Builder. Cook healthier without compromising taste.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: ShoppingBag,
      title: "OilHub Store",
      description: "Shop certified healthy oils and IoT devices that automatically track your consumption. Premium products, delivered to your door.",
      color: "from-orange-500 to-amber-500"
    },
    {
      icon: BookOpen,
      title: "Health Education",
      description: "Learn about oil myths, hidden oil in foods, and healthy cooking tips. Take quizzes and earn rewards while learning.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Target,
      title: "Health Score System",
      description: "Get a personalized health score (0-100) based on your oil consumption, quality of oils used, and tracking consistency.",
      color: "from-teal-500 to-green-500"
    },
    {
      icon: Award,
      title: "Gamified Rewards",
      description: "Complete challenges, earn points, unlock badges, and redeem rewards. Compete on leaderboards and track your progress.",
      color: "from-yellow-500 to-orange-500"
    }
  ];

  const stats = [
    { value: "10K+", label: "Active Users" },
    { value: "30%", label: "Avg Oil Reduction" },
    { value: "500+", label: "Healthy Recipes" },
    { value: "100+", label: "Certified Restaurants" }
  ];

  const benefits = [
    {
      icon: Heart,
      title: "Better Heart Health",
      description: "Reduce risk of cardiovascular diseases by managing oil intake"
    },
    {
      icon: TrendingDown,
      title: "Weight Management",
      description: "Lower calorie consumption naturally by reducing excess oil"
    },
    {
      icon: Users,
      title: "Family Wellness",
      description: "Track oil consumption for your entire household"
    },
    {
      icon: Shield,
      title: "Verified Partners",
      description: "Blockchain-certified restaurants committed to healthy cooking"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-success/10" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-success/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-16 lg:py-24">
          <nav className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-3">
              <img src={logoImg} alt="Noil Logo" className="h-12 w-12 object-contain rounded-xl shadow-md" />
              <span className="text-2xl font-bold text-foreground">Noil</span>
            </div>
            <Button variant="outline" onClick={() => navigate("/auth")} className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              Sign In
            </Button>
          </nav>

          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4">
              <Droplets className="w-4 h-4" />
              India's #1 Oil Wellness Platform
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
              Track. Cook. <span className="text-primary">Thrive.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Transform your relationship with cooking oil. Monitor consumption, discover healthier recipes, 
              and join a community committed to wellness.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                onClick={() => navigate("/auth")}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
              >
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="text-center p-6 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50"
              >
                <div className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need for Healthier Cooking
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A comprehensive platform designed to help Indian families reduce oil consumption 
              while maintaining the flavors they love.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className="p-6 bg-card border-border/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Reduce Oil Consumption?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The average Indian household consumes 2-3x the recommended amount of cooking oil. 
              Here's how Noil helps you make a change.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="text-center p-6 rounded-2xl bg-gradient-to-b from-card to-secondary/20 border border-border/50"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary to-primary/80">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Start Your Wellness Journey Today
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of families who are already cooking healthier, living better, 
            and saving money on cooking oil.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate("/auth")}
            className="bg-white text-primary hover:bg-white/90 px-10 py-6 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-card border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={logoImg} alt="Noil Logo" className="h-10 w-10 object-contain rounded-lg" />
              <div>
                <span className="text-xl font-bold text-foreground">Noil</span>
                <p className="text-sm text-muted-foreground">Less Oil, Same Taste, Better Life</p>
              </div>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <button onClick={() => navigate("/auth")} className="hover:text-primary transition-colors">
                Sign In
              </button>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            © 2024 Noil. All rights reserved. Made with ❤️ for healthier India.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
