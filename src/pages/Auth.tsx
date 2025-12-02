import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Gift } from "lucide-react";
import logoImg from "@/assets/logo.jpg";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState(searchParams.get("ref") || "");

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        navigate("/");
      }
    };
    checkUser();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            referral_code: referralCode || null,
          },
        },
      });

      if (error) throw error;

      // If signup successful and user exists, create profile and handle referral
      if (data.user) {
        // Create user profile (trigger will generate referral code)
        const { error: profileError } = await supabase
          .from("user_profiles")
          .insert({ user_id: data.user.id });

        if (profileError && !profileError.message.includes("duplicate")) {
          console.error("Profile creation error:", profileError);
        }

        // Apply referral if code was provided
        if (referralCode) {
          const { data: referrer } = await supabase
            .from("user_profiles")
            .select("user_id")
            .eq("referral_code", referralCode.toUpperCase())
            .maybeSingle();

          if (referrer && referrer.user_id !== data.user.id) {
            await supabase.from("referrals").insert({
              referrer_id: referrer.user_id,
              referred_id: data.user.id,
              referral_code: referralCode.toUpperCase(),
              status: "completed",
              completed_at: new Date().toISOString(),
            });

            // Update profile with referred_by
            await supabase
              .from("user_profiles")
              .update({ referred_by: referrer.user_id })
              .eq("user_id", data.user.id);
          }
        }
      }

      toast({
        title: "Success!",
        description: referralCode 
          ? "Account created! You'll receive bonus points after signing in." 
          : "Account created successfully. You can now sign in.",
      });

      setEmail("");
      setPassword("");
      setReferralCode("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });

      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-medium">
        <CardHeader className="text-center space-y-4">
          <img src={logoImg} alt="Noil Logo" className="h-16 w-16 mx-auto object-contain" />
          <div>
            <CardTitle className="text-2xl font-bold text-primary">Welcome to Noil</CardTitle>
            <CardDescription>Track. Cook. Thrive.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-background"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-referral" className="flex items-center gap-1">
                    <Gift className="w-4 h-4 text-primary" />
                    Referral Code (Optional)
                  </Label>
                  <Input
                    id="signup-referral"
                    type="text"
                    placeholder="Enter referral code"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    className="bg-background font-mono uppercase"
                    maxLength={8}
                  />
                  {referralCode && (
                    <p className="text-xs text-primary">🎁 You'll earn 100 bonus points!</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Sign Up"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
