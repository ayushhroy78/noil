import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ArrowRight,
  Store,
  Plus,
  X,
  Utensils,
  Droplet,
  ChefHat,
  Send,
  CheckCircle,
  Star,
  TrendingUp,
  Users,
  Award,
  Sparkles,
  Clock,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";

const OIL_TYPES = [
  "Mustard Oil",
  "Groundnut Oil",
  "Coconut Oil",
  "Sesame Oil",
  "Rice Bran Oil",
  "Olive Oil",
  "Sunflower Oil",
  "Other Cold-Pressed Oils",
];

const COOKING_METHODS = [
  "Steaming",
  "Grilling",
  "Baking",
  "Air Frying",
  "Sauteing (Low Oil)",
  "Stir Frying",
  "Roasting",
  "Boiling",
  "Pressure Cooking",
];

const CUISINE_TYPES = [
  "North Indian",
  "South Indian", 
  "Chinese",
  "Continental",
  "Italian",
  "Thai",
  "Mexican",
  "Mediterranean",
  "Multi-Cuisine",
];

const CERTIFICATIONS = [
  "FSSAI Certified",
  "Organic Kitchen",
  "Vegan Friendly",
  "Gluten-Free Options",
  "Diabetic-Friendly Menu",
  "Heart-Healthy Certified",
];

const applicationSchema = z.object({
  restaurantName: z.string().min(2, "Restaurant name must be at least 2 characters"),
  ownerName: z.string().min(2, "Owner name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  description: z.string().optional(),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

interface MenuItem {
  name: string;
  description: string;
  oilUsed: string;
  cookingMethod: string;
}

const RestaurantApply = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedOilTypes, setSelectedOilTypes] = useState<string[]>([]);
  const [selectedCookingMethods, setSelectedCookingMethods] = useState<string[]>([]);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedCertifications, setSelectedCertifications] = useState<string[]>([]);
  const [dailyCustomers, setDailyCustomers] = useState<string>("50-100");
  const [yearsInBusiness, setYearsInBusiness] = useState<string>("1-3");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  const totalSteps = 4;
  const progressPercentage = (currentStep / totalSteps) * 100;
  const [newMenuItem, setNewMenuItem] = useState<MenuItem>({
    name: "",
    description: "",
    oilUsed: "",
    cookingMethod: "",
  });

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      restaurantName: "",
      ownerName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      description: "",
    },
  });

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        form.setValue("email", user.email || "");
      } else {
        navigate("/auth");
      }
      setLoading(false);
    };

    fetchUser();
  }, [navigate, form]);

  const addMenuItem = () => {
    if (newMenuItem.name && newMenuItem.oilUsed && newMenuItem.cookingMethod) {
      setMenuItems([...menuItems, newMenuItem]);
      setNewMenuItem({
        name: "",
        description: "",
        oilUsed: "",
        cookingMethod: "",
      });
    } else {
      toast({
        title: "Incomplete Menu Item",
        description: "Please fill in at least name, oil used, and cooking method",
        variant: "destructive",
      });
    }
  };

  const removeMenuItem = (index: number) => {
    setMenuItems(menuItems.filter((_, i) => i !== index));
  };

  const toggleOilType = (oil: string) => {
    setSelectedOilTypes((prev) =>
      prev.includes(oil) ? prev.filter((o) => o !== oil) : [...prev, oil]
    );
  };

  const toggleCookingMethod = (method: string) => {
    setSelectedCookingMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
  };

  const toggleCuisine = (cuisine: string) => {
    setSelectedCuisines((prev) =>
      prev.includes(cuisine) ? prev.filter((c) => c !== cuisine) : [...prev, cuisine]
    );
  };

  const toggleCertification = (cert: string) => {
    setSelectedCertifications((prev) =>
      prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert]
    );
  };

  const nextStep = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const onSubmit = async (data: ApplicationFormData) => {
    if (!userId) {
      toast({
        title: "Not authenticated",
        description: "Please log in to submit an application",
        variant: "destructive",
      });
      return;
    }

    if (selectedOilTypes.length === 0) {
      toast({
        title: "Oil Types Required",
        description: "Please select at least one oil type you use",
        variant: "destructive",
      });
      return;
    }

    if (selectedCookingMethods.length === 0) {
      toast({
        title: "Cooking Methods Required",
        description: "Please select at least one cooking method",
        variant: "destructive",
      });
      return;
    }

    if (menuItems.length === 0) {
      toast({
        title: "Menu Items Required",
        description: "Please add at least one menu item",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await (supabase as any).from("restaurant_applications").insert({
        user_id: userId,
        restaurant_name: data.restaurantName,
        owner_name: data.ownerName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        description: data.description || null,
        menu_items: menuItems,
        oil_types: selectedOilTypes,
        cooking_methods: selectedCookingMethods,
        status: "pending",
      });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "Application Submitted!",
        description: "We'll review your application and get back to you soon.",
      });
    } catch (error) {
      console.error("Error submitting application:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-50 bg-card shadow-soft px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/profile")}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5 text-primary" />
            </button>
            <h1 className="text-xl font-bold text-foreground">Application Submitted</h1>
          </div>
        </header>

        <main className="px-4 py-8 max-w-lg mx-auto text-center">
          <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Thank You!</h2>
          <p className="text-muted-foreground mb-6">
            Your restaurant application has been submitted successfully. Our team will review your application and get back to you within 3-5 business days.
          </p>
          <Button onClick={() => navigate("/profile")} data-testid="button-back-profile">
            Back to Profile
          </Button>
        </main>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 bg-card shadow-soft px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/profile")}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Register Restaurant</h1>
            <p className="text-xs text-muted-foreground">Join our healthy dining network</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-2xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Step {currentStep} of {totalSteps}</span>
            <span className="text-primary font-medium">{Math.round(progressPercentage)}% Complete</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between mt-2">
            {["Details", "Kitchen", "Menu", "Business"].map((step, index) => (
              <span 
                key={step} 
                className={`text-xs ${currentStep > index ? 'text-primary font-medium' : 'text-muted-foreground'}`}
              >
                {step}
              </span>
            ))}
          </div>
        </div>

        {/* Partner Benefits Banner */}
        <Card className="mb-6 bg-gradient-to-r from-primary/10 via-success/10 to-primary/10 border-primary/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-foreground">Partner Benefits</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3 text-success" />
                    <span className="text-muted-foreground">Increased visibility</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-success" />
                    <span className="text-muted-foreground">Health-conscious customers</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Award className="w-3 h-3 text-success" />
                    <span className="text-muted-foreground">Noil Certified badge</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star className="w-3 h-3 text-success" />
                    <span className="text-muted-foreground">Featured promotions</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Restaurant Details */}
            {currentStep === 1 && (
              <Card className="animate-in fade-in duration-300">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Store className="w-4 h-4" />
                    Restaurant Details
                  </CardTitle>
                  <CardDescription>Tell us about your restaurant</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="restaurantName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Restaurant Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Restaurant Name" {...field} data-testid="input-restaurant-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ownerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Owner Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Owner's Full Name" {...field} data-testid="input-owner-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <Mail className="w-3 h-3" /> Email
                          </FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="email@example.com" {...field} data-testid="input-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <Phone className="w-3 h-3" /> Phone
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="9876543210" {...field} data-testid="input-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> Address
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Street Address" {...field} data-testid="input-address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="City" {...field} data-testid="input-city" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input placeholder="State" {...field} data-testid="input-state" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>About Your Restaurant (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us about your restaurant's specialty and commitment to healthy cooking..."
                            {...field}
                            data-testid="input-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {/* Step 2: Kitchen & Cooking */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Droplet className="w-4 h-4" />
                      Oil Types Used
                    </CardTitle>
                    <CardDescription>Select all oils you use in your kitchen</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {OIL_TYPES.map((oil) => (
                        <Badge
                          key={oil}
                          variant={selectedOilTypes.includes(oil) ? "default" : "outline"}
                          className="cursor-pointer transition-all hover:scale-105"
                          onClick={() => toggleOilType(oil)}
                          data-testid={`badge-oil-${oil.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          {oil}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <ChefHat className="w-4 h-4" />
                      Cooking Methods
                    </CardTitle>
                    <CardDescription>Select all healthy cooking methods you use</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {COOKING_METHODS.map((method) => (
                        <Badge
                          key={method}
                          variant={selectedCookingMethods.includes(method) ? "default" : "outline"}
                          className="cursor-pointer transition-all hover:scale-105"
                          onClick={() => toggleCookingMethod(method)}
                          data-testid={`badge-method-${method.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          {method}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Utensils className="w-4 h-4" />
                      Cuisine Types
                    </CardTitle>
                    <CardDescription>What cuisines do you specialize in?</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {CUISINE_TYPES.map((cuisine) => (
                        <Badge
                          key={cuisine}
                          variant={selectedCuisines.includes(cuisine) ? "default" : "outline"}
                          className="cursor-pointer transition-all hover:scale-105"
                          onClick={() => toggleCuisine(cuisine)}
                        >
                          {cuisine}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 3: Menu Items */}
            {currentStep === 3 && (
              <Card className="animate-in fade-in duration-300">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Utensils className="w-4 h-4" />
                    Signature Healthy Dishes
                  </CardTitle>
                  <CardDescription>Add at least 3 of your best low-oil dishes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {menuItems.length > 0 && (
                    <div className="space-y-2">
                      {menuItems.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium text-sm">{item.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.oilUsed} • {item.cookingMethod}
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeMenuItem(index)}
                            className="text-destructive hover:text-destructive"
                            data-testid={`button-remove-menu-${index}`}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-3 p-4 border-2 border-dashed rounded-lg bg-muted/30">
                    <p className="text-sm font-medium text-center text-muted-foreground">Add New Dish</p>
                    <Input
                      placeholder="Dish Name (e.g., Grilled Paneer Tikka)"
                      value={newMenuItem.name}
                      onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                      data-testid="input-menu-name"
                    />
                    <Input
                      placeholder="Description (optional)"
                      value={newMenuItem.description}
                      onChange={(e) => setNewMenuItem({ ...newMenuItem, description: e.target.value })}
                      data-testid="input-menu-description"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Oil Used (e.g., Olive Oil)"
                        value={newMenuItem.oilUsed}
                        onChange={(e) => setNewMenuItem({ ...newMenuItem, oilUsed: e.target.value })}
                        data-testid="input-menu-oil"
                      />
                      <Input
                        placeholder="Cooking Method"
                        value={newMenuItem.cookingMethod}
                        onChange={(e) => setNewMenuItem({ ...newMenuItem, cookingMethod: e.target.value })}
                        data-testid="input-menu-method"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={addMenuItem}
                      data-testid="button-add-menu-item"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Dish
                    </Button>
                  </div>

                  <div className="text-center text-xs text-muted-foreground">
                    {menuItems.length} dish{menuItems.length !== 1 ? 'es' : ''} added
                    {menuItems.length < 3 && <span className="text-amber-500 ml-1">(minimum 3 required)</span>}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Business Info & Certifications */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Business Information
                    </CardTitle>
                    <CardDescription>Help us understand your business better</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Average Daily Customers</label>
                      <div className="flex flex-wrap gap-2">
                        {["< 50", "50-100", "100-200", "200-500", "500+"].map((range) => (
                          <Badge
                            key={range}
                            variant={dailyCustomers === range ? "default" : "outline"}
                            className="cursor-pointer transition-all hover:scale-105"
                            onClick={() => setDailyCustomers(range)}
                          >
                            <Users className="w-3 h-3 mr-1" />
                            {range}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Years in Business</label>
                      <div className="flex flex-wrap gap-2">
                        {["< 1 year", "1-3 years", "3-5 years", "5-10 years", "10+ years"].map((years) => (
                          <Badge
                            key={years}
                            variant={yearsInBusiness === years ? "default" : "outline"}
                            className="cursor-pointer transition-all hover:scale-105"
                            onClick={() => setYearsInBusiness(years)}
                          >
                            <Clock className="w-3 h-3 mr-1" />
                            {years}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      Certifications & Special Features
                    </CardTitle>
                    <CardDescription>Select any certifications or special features</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {CERTIFICATIONS.map((cert) => (
                        <Badge
                          key={cert}
                          variant={selectedCertifications.includes(cert) ? "default" : "outline"}
                          className="cursor-pointer transition-all hover:scale-105"
                          onClick={() => toggleCertification(cert)}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Summary Card */}
                <Card className="bg-success/5 border-success/20">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-8 w-8 text-success" />
                      <div>
                        <p className="font-medium">Ready to Submit!</p>
                        <p className="text-sm text-muted-foreground">
                          Review your details and submit your application
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
              
              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="flex-1"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={submitting}
                  data-testid="button-submit-application"
                >
                  {submitting ? (
                    "Submitting..."
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Application
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </main>

      <BottomNav />
    </div>
  );
};

export default RestaurantApply;
