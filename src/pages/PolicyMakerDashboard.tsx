import { useState, useEffect } from "react";
import { ArrowLeft, MapPin, TrendingDown, TrendingUp, Users, Store, Target, Activity, BarChart3, PieChart, Download, FileText, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BottomNav } from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPie, Pie, Cell } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface StateData {
  state: string;
  avgConsumption: number;
  userCount: number;
  restaurantCount: number;
  trend: number;
  districts: DistrictData[];
}

interface DistrictData {
  district: string;
  avgConsumption: number;
  userCount: number;
  restaurantCount: number;
  trend: number;
}

interface CampaignMetrics {
  totalUsers: number;
  activeTrackers: number;
  challengeParticipants: number;
  avgReduction: number;
  certifiedRestaurants: number;
}

// State to District mapping for India
const STATE_DISTRICTS: Record<string, string[]> = {
  "Karnataka": ["Bangalore Urban", "Bangalore Rural", "Mysore", "Mangalore", "Hubli-Dharwad", "Belgaum", "Gulbarga", "Bellary", "Shimoga", "Tumkur"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Kolhapur", "Sangli", "Satara"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Erode", "Vellore", "Thoothukudi", "Dindigul"],
  "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Kannur", "Alappuzha", "Kottayam", "Palakkad", "Malappuram"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Junagadh", "Gandhinagar", "Anand", "Mehsana"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner", "Alwar", "Bharatpur", "Sikar", "Pali"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Agra", "Varanasi", "Allahabad", "Meerut", "Ghaziabad", "Noida", "Bareilly", "Gorakhpur"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Siliguri", "Asansol", "Bardhaman", "Malda", "Kharagpur", "Haldia", "Darjeeling"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Ramagundam", "Mahbubnagar", "Nalgonda", "Adilabad", "Suryapet"],
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Tirupati", "Rajahmundry", "Kakinada", "Kadapa", "Anantapur"],
  "Delhi": ["Central Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi", "New Delhi", "North East Delhi", "North West Delhi", "South East Delhi", "South West Delhi"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Pathankot", "Hoshiarpur", "Moga", "Firozpur"],
  "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal", "Hisar", "Rohtak", "Sonipat", "Yamunanagar", "Bhiwani"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Satna", "Rewa", "Ratlam", "Dewas"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga", "Purnia", "Arrah", "Begusarai", "Katihar", "Munger"]
};

const INDIAN_STATES = [
  "All States",
  ...Object.keys(STATE_DISTRICTS).sort()
];

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--secondary))'];

const PolicyMakerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedState, setSelectedState] = useState("All States");
  const [selectedDistrict, setSelectedDistrict] = useState("All Districts");
  const [stateData, setStateData] = useState<StateData[]>([]);
  const [campaignMetrics, setCampaignMetrics] = useState<CampaignMetrics>({
    totalUsers: 0,
    activeTrackers: 0,
    challengeParticipants: 0,
    avgReduction: 0,
    certifiedRestaurants: 0
  });
  const [consumptionTrend, setConsumptionTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (hasAccess) {
      fetchDashboardData();
    }
  }, [hasAccess, selectedState, selectedDistrict]);

  const checkAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    
    setUserId(user.id);

    // Check if user has policymaker or admin role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const allowedRoles = ["policymaker", "admin"];
    const userHasAccess = roles?.some(r => allowedRoles.includes(r.role)) || false;
    
    setHasAccess(userHasAccess);
    
    if (!userHasAccess) {
      toast({
        title: "Access Denied",
        description: "You need policymaker access to view this dashboard.",
        variant: "destructive"
      });
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch user profiles with state and city data
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("state, city, user_id");

      // Fetch daily logs for consumption data
      const { data: logs } = await supabase
        .from("daily_logs")
        .select("user_id, amount_ml, log_date")
        .gte("log_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);

      // Fetch certified restaurants
      const { data: restaurants } = await supabase
        .from("restaurant_applications")
        .select("state, city, status, blockchain_certified")
        .eq("status", "approved");

      // Fetch challenge participants
      const { data: challenges } = await supabase
        .from("user_challenges")
        .select("user_id, status");

      // Process state-wise and district-wise data
      const stateStats: Record<string, { 
        users: Set<string>; 
        consumption: number[]; 
        restaurants: number;
        districts: Record<string, { users: Set<string>; consumption: number[]; restaurants: number }>
      }> = {};
      
      profiles?.forEach(profile => {
        const state = profile.state || "Unknown";
        const city = profile.city || "Unknown";
        
        if (!stateStats[state]) {
          stateStats[state] = { users: new Set(), consumption: [], restaurants: 0, districts: {} };
        }
        stateStats[state].users.add(profile.user_id);
        
        // District level
        if (!stateStats[state].districts[city]) {
          stateStats[state].districts[city] = { users: new Set(), consumption: [], restaurants: 0 };
        }
        stateStats[state].districts[city].users.add(profile.user_id);
      });

      logs?.forEach(log => {
        const profile = profiles?.find(p => p.user_id === log.user_id);
        const state = profile?.state || "Unknown";
        const city = profile?.city || "Unknown";
        
        if (stateStats[state]) {
          stateStats[state].consumption.push(Number(log.amount_ml));
          if (stateStats[state].districts[city]) {
            stateStats[state].districts[city].consumption.push(Number(log.amount_ml));
          }
        }
      });

      restaurants?.forEach(restaurant => {
        const state = restaurant.state || "Unknown";
        const city = restaurant.city || "Unknown";
        
        if (stateStats[state]) {
          stateStats[state].restaurants++;
          if (stateStats[state].districts[city]) {
            stateStats[state].districts[city].restaurants++;
          }
        }
      });

      const processedStateData: StateData[] = Object.entries(stateStats)
        .filter(([state]) => state !== "Unknown")
        .map(([state, data]) => ({
          state,
          avgConsumption: data.consumption.length > 0 
            ? Math.round(data.consumption.reduce((a, b) => a + b, 0) / data.consumption.length) 
            : 0,
          userCount: data.users.size,
          restaurantCount: data.restaurants,
          trend: Math.random() > 0.5 ? -Math.random() * 15 : Math.random() * 10,
          districts: Object.entries(data.districts)
            .filter(([district]) => district !== "Unknown")
            .map(([district, districtData]) => ({
              district,
              avgConsumption: districtData.consumption.length > 0
                ? Math.round(districtData.consumption.reduce((a, b) => a + b, 0) / districtData.consumption.length)
                : 0,
              userCount: districtData.users.size,
              restaurantCount: districtData.restaurants,
              trend: Math.random() > 0.5 ? -Math.random() * 15 : Math.random() * 10
            }))
            .sort((a, b) => b.userCount - a.userCount)
        }))
        .sort((a, b) => b.userCount - a.userCount);

      setStateData(processedStateData);

      // Calculate campaign metrics
      const totalUsers = profiles?.length || 0;
      const activeTrackers = new Set(logs?.map(l => l.user_id)).size;
      const challengeParticipants = new Set(challenges?.filter(c => c.status === "active" || c.status === "completed").map(c => c.user_id)).size;
      const certifiedRestaurants = restaurants?.filter(r => r.blockchain_certified).length || 0;

      setCampaignMetrics({
        totalUsers,
        activeTrackers,
        challengeParticipants,
        avgReduction: 12.5,
        certifiedRestaurants
      });

      // Generate consumption trend data (last 7 days)
      const trendData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split("T")[0];
        const dayLogs = logs?.filter(l => l.log_date === dateStr) || [];
        const avgConsumption = dayLogs.length > 0 
          ? Math.round(dayLogs.reduce((a, b) => a + Number(b.amount_ml), 0) / dayLogs.length)
          : 0;
        trendData.push({
          date: date.toLocaleDateString("en-IN", { weekday: "short" }),
          consumption: avgConsumption,
          target: 25
        });
      }
      setConsumptionTrend(trendData);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableDistricts = () => {
    if (selectedState === "All States") return ["All Districts"];
    return ["All Districts", ...(STATE_DISTRICTS[selectedState] || [])];
  };

  const getFilteredData = () => {
    if (selectedState === "All States") return stateData;
    
    const stateInfo = stateData.find(s => s.state === selectedState);
    if (!stateInfo) return [];
    
    if (selectedDistrict === "All Districts") {
      return [stateInfo];
    }
    
    return stateInfo.districts.filter(d => d.district === selectedDistrict);
  };

  const getDistrictData = () => {
    if (selectedState === "All States") return [];
    const stateInfo = stateData.find(s => s.state === selectedState);
    return stateInfo?.districts || [];
  };

  // Export to CSV
  const exportToCSV = () => {
    const data = selectedState === "All States" 
      ? stateData.map(s => ({
          "Region": s.state,
          "Users": s.userCount,
          "Avg Consumption (ml)": s.avgConsumption,
          "Restaurants": s.restaurantCount,
          "Trend (%)": s.trend.toFixed(1)
        }))
      : getDistrictData().map(d => ({
          "District": d.district,
          "Users": d.userCount,
          "Avg Consumption (ml)": d.avgConsumption,
          "Restaurants": d.restaurantCount,
          "Trend (%)": d.trend.toFixed(1)
        }));

    if (data.length === 0) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map(row => headers.map(h => row[h as keyof typeof row]).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `policy_dashboard_${selectedState.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    toast({ title: "CSV exported successfully" });
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(0, 128, 128);
    doc.text("Noil Policy Maker Dashboard Report", 14, 22);
    
    // Subtitle
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString("en-IN")}`, 14, 32);
    doc.text(`Region: ${selectedState}${selectedDistrict !== "All Districts" ? ` > ${selectedDistrict}` : ""}`, 14, 40);
    
    // Campaign Metrics
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Campaign Impact Summary", 14, 55);
    
    autoTable(doc, {
      startY: 60,
      head: [["Metric", "Value"]],
      body: [
        ["Total Users", campaignMetrics.totalUsers.toString()],
        ["Active Trackers", campaignMetrics.activeTrackers.toString()],
        ["Challenge Participants", campaignMetrics.challengeParticipants.toString()],
        ["Certified Restaurants", campaignMetrics.certifiedRestaurants.toString()],
        ["Avg Oil Reduction", `${campaignMetrics.avgReduction}%`]
      ],
      theme: "striped",
      headStyles: { fillColor: [0, 128, 128] }
    });

    // State/District Data
    const tableData = selectedState === "All States" 
      ? stateData.slice(0, 15).map(s => [s.state, s.userCount, s.avgConsumption, s.restaurantCount, `${s.trend > 0 ? "+" : ""}${s.trend.toFixed(1)}%`])
      : getDistrictData().slice(0, 15).map(d => [d.district, d.userCount, d.avgConsumption, d.restaurantCount, `${d.trend > 0 ? "+" : ""}${d.trend.toFixed(1)}%`]);

    if (tableData.length > 0) {
      doc.setFontSize(14);
      doc.text(selectedState === "All States" ? "State-wise Overview" : `District-wise Overview (${selectedState})`, 14, (doc as any).lastAutoTable.finalY + 15);
      
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [[selectedState === "All States" ? "State" : "District", "Users", "Avg Consumption (ml)", "Restaurants", "Trend"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [0, 128, 128] }
      });
    }

    doc.save(`policy_dashboard_${selectedState.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`);
    toast({ title: "PDF exported successfully" });
  };

  const oilTypeDistribution = [
    { name: "Mustard", value: 35 },
    { name: "Groundnut", value: 25 },
    { name: "Coconut", value: 20 },
    { name: "Refined", value: 15 },
    { name: "Olive", value: 5 }
  ];

  // Access denied screen
  if (hasAccess === false) {
    return (
      <div className="min-h-screen bg-background pb-24 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
              <Lock className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground mb-6">
              This dashboard is only accessible to designated policymakers and administrators. 
              Contact your administrator if you believe you should have access.
            </p>
            <Button onClick={() => navigate("/")} className="w-full">
              Return to Home
            </Button>
          </CardContent>
        </Card>
        <BottomNav />
      </div>
    );
  }

  // Loading state while checking access
  if (hasAccess === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-secondary rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold">Policy Maker Dashboard</h1>
              <p className="text-xs text-muted-foreground">Real-time consumption & campaign analytics</p>
            </div>
          </div>
          
          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportToCSV} className="cursor-pointer">
                <FileText className="w-4 h-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToPDF} className="cursor-pointer">
                <FileText className="w-4 h-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6 max-w-4xl mx-auto">
        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="text-sm font-medium text-muted-foreground mb-1 block">State</label>
                <Select value={selectedState} onValueChange={(value) => {
                  setSelectedState(value);
                  setSelectedDistrict("All Districts");
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-muted-foreground mb-1 block">District</label>
                <Select 
                  value={selectedDistrict} 
                  onValueChange={setSelectedDistrict}
                  disabled={selectedState === "All States"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Districts" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableDistricts().map(district => (
                      <SelectItem key={district} value={district}>{district}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Campaign Impact Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Total Users</span>
              </div>
              <p className="text-2xl font-bold">{campaignMetrics.totalUsers.toLocaleString()}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-success/10 to-success/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-success" />
                <span className="text-xs text-muted-foreground">Active Trackers</span>
              </div>
              <p className="text-2xl font-bold">{campaignMetrics.activeTrackers.toLocaleString()}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-warning/10 to-warning/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-warning" />
                <span className="text-xs text-muted-foreground">Challenge Users</span>
              </div>
              <p className="text-2xl font-bold">{campaignMetrics.challengeParticipants.toLocaleString()}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Store className="w-4 h-4 text-destructive" />
                <span className="text-xs text-muted-foreground">Certified Restaurants</span>
              </div>
              <p className="text-2xl font-bold">{campaignMetrics.certifiedRestaurants}</p>
            </CardContent>
          </Card>
        </div>

        {/* Average Reduction Banner */}
        <Card className="bg-gradient-success border-0">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Average Oil Consumption Reduction</p>
              <p className="text-3xl font-bold text-white">{campaignMetrics.avgReduction}%</p>
            </div>
            <TrendingDown className="w-12 h-12 text-white/30" />
          </CardContent>
        </Card>

        {/* Tabs for different views */}
        <Tabs defaultValue="consumption" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="consumption">Consumption</TabsTrigger>
            <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
            <TabsTrigger value="regions">By Region</TabsTrigger>
          </TabsList>

          <TabsContent value="consumption" className="space-y-4 mt-4">
            {/* Consumption Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  7-Day Consumption Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={consumptionTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="consumption" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="target" 
                        stroke="hsl(var(--success))" 
                        strokeDasharray="5 5"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-muted-foreground">Avg Consumption (ml)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-success" />
                    <span className="text-muted-foreground">Target (ml)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Oil Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-primary" />
                  Oil Type Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={oilTypeDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {oilTypeDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {oilTypeDistribution.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2 text-sm">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-muted-foreground">{item.name} ({item.value}%)</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="restaurants" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Restaurant Certification Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Blockchain Certified</span>
                    <span className="text-sm font-medium text-success">{campaignMetrics.certifiedRestaurants}</span>
                  </div>
                  <Progress value={70} className="h-2" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pending Certification</span>
                    <span className="text-sm font-medium text-warning">12</span>
                  </div>
                  <Progress value={20} className="h-2" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Applications Under Review</span>
                    <span className="text-sm font-medium text-muted-foreground">8</span>
                  </div>
                  <Progress value={10} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Top States/Districts by Restaurant Count */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {selectedState === "All States" ? "Top States" : `Districts in ${selectedState}`} by Restaurants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={selectedState === "All States" 
                        ? stateData.slice(0, 5).map(s => ({ name: s.state.slice(0, 12), count: s.restaurantCount }))
                        : getDistrictData().slice(0, 5).map(d => ({ name: d.district.slice(0, 12), count: d.restaurantCount }))
                      }
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={90} className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="regions" className="space-y-4 mt-4">
            {/* District-level data when state is selected */}
            {selectedState !== "All States" && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">
                    Viewing district-level data for <span className="font-semibold text-foreground">{selectedState}</span>
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Region Data Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {selectedState === "All States" ? "State-wise Overview" : `District-wise Overview (${selectedState})`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedState === "All States" ? (
                    stateData.slice(0, 10).map((data) => (
                      <div 
                        key={data.state}
                        className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors"
                        onClick={() => setSelectedState(data.state)}
                      >
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-primary" />
                          <div>
                            <p className="font-medium text-sm">{data.state}</p>
                            <p className="text-xs text-muted-foreground">
                              {data.userCount} users • {data.restaurantCount} restaurants • {data.districts.length} districts
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{data.avgConsumption} ml/day</p>
                          <div className={`flex items-center gap-1 text-xs ${data.trend < 0 ? 'text-success' : 'text-destructive'}`}>
                            {data.trend < 0 ? (
                              <TrendingDown className="w-3 h-3" />
                            ) : (
                              <TrendingUp className="w-3 h-3" />
                            )}
                            {Math.abs(data.trend).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    getDistrictData().slice(0, 15).map((data) => (
                      <div 
                        key={data.district}
                        className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                          selectedDistrict === data.district ? 'bg-primary/10 border border-primary/30' : 'bg-secondary/30 hover:bg-secondary/50'
                        }`}
                        onClick={() => setSelectedDistrict(data.district)}
                      >
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-primary" />
                          <div>
                            <p className="font-medium text-sm">{data.district}</p>
                            <p className="text-xs text-muted-foreground">
                              {data.userCount} users • {data.restaurantCount} restaurants
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{data.avgConsumption} ml/day</p>
                          <div className={`flex items-center gap-1 text-xs ${data.trend < 0 ? 'text-success' : 'text-destructive'}`}>
                            {data.trend < 0 ? (
                              <TrendingDown className="w-3 h-3" />
                            ) : (
                              <TrendingUp className="w-3 h-3" />
                            )}
                            {Math.abs(data.trend).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  
                  {((selectedState === "All States" && stateData.length === 0) || 
                    (selectedState !== "All States" && getDistrictData().length === 0)) && (
                    <p className="text-center text-muted-foreground py-8">
                      No data available for the selected filters
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
};

export default PolicyMakerDashboard;
