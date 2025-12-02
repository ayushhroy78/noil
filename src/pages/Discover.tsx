import { ArrowLeft, Leaf, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import discoverMainImg from "@/assets/discover-main.jpg";
import { Button } from "@/components/ui/button";

const Discover = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card shadow-soft px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => navigate("/")}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Discover</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 space-y-6 max-w-md mx-auto">
        <div className="space-y-4">
          <div className="text-center mb-2">
            <h2 className="text-2xl font-bold text-foreground mb-1">Discover</h2>
            <p className="text-muted-foreground">Learn Healthy Habits</p>
          </div>

          <div className="relative rounded-2xl overflow-hidden shadow-medium">
            <img
              src={discoverMainImg}
              alt="Discover Healthy Habits"
              className="w-full h-auto"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <Button
              size="lg"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-semibold"
              onClick={() => alert("Explore Articles feature coming soon!")}
            >
              <Leaf className="w-5 h-5 mr-2" />
              Explore Articles
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="w-full rounded-xl font-semibold"
              onClick={() => alert("Join Challenges feature coming soon!")}
            >
              <Calendar className="w-5 h-5 mr-2" />
              Join Challenges
            </Button>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Discover;
