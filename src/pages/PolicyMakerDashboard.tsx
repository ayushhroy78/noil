import { useState, useEffect } from "react";
import { ArrowLeft, MapPin, TrendingDown, TrendingUp, Users, Store, Target, Activity, BarChart3, PieChart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { BottomNav } from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPie, Pie, Cell } from "recharts";

interface StateData {
  state: string;
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

const INDIAN_STATES = [
  "All States",
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir"
];

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--secondary))'];

const PolicyMakerDashboard = () => {
  const navigate = useNavigate();
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

  useEffect(() => {
    fetchDashboardData();
  }, [selectedState]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch user profiles with state data
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
        .select("state, status, blockchain_certified")
        .eq("status", "approved");

      // Fetch challenge participants
      const { data: challenges } = await supabase
        .from("user_challenges")
        .select("user_id, status");

      // Process state-wise data
      const stateStats: Record<string, { users: Set<string>; consumption: number[]; restaurants: number }> = {};
      
      profiles?.forEach(profile => {
        const state = profile.state || "Unknown";
        if (!stateStats[state]) {
          stateStats[state] = { users: new Set(), consumption: [], restaurants: 0 };
        }
        stateStats[state].users.add(profile.user_id);
      });

      logs?.forEach(log => {
        const profile = profiles?.find(p => p.user_id === log.user_id);
        const state = profile?.state || "Unknown";
        if (stateStats[state]) {
          stateStats[state].consumption.push(Number(log.amount_ml));
        }
      });

      restaurants?.forEach(restaurant => {
        const state = restaurant.state || "Unknown";
        if (stateStats[state]) {
          stateStats[state].restaurants++;
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
          trend: Math.random() > 0.5 ? -Math.random() * 15 : Math.random() * 10 // Simulated trend
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
        avgReduction: 12.5, // Simulated average reduction
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

  const filteredStateData = selectedState === "All States" 
    ? stateData 
    : stateData.filter(s => s.state === selectedState);

  const oilTypeDistribution = [
    { name: "Mustard", value: 35 },
    { name: "Groundnut", value: 25 },
    { name: "Coconut", value: 20 },
    { name: "Refined", value: 15 },
    { name: "Olive", value: 5 }
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold">Policy Maker Dashboard</h1>
            <p className="text-xs text-muted-foreground">Real-time consumption & campaign analytics</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6 max-w-4xl mx-auto">
        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="text-sm font-medium text-muted-foreground mb-1 block">State</label>
                <Select value={selectedState} onValueChange={setSelectedState}>
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
                <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Districts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Districts">All Districts</SelectItem>
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
            <TabsTrigger value="states">By State</TabsTrigger>
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

            {/* Top States by Restaurant Count */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top States by Certified Restaurants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={stateData.slice(0, 5).map(s => ({ 
                        state: s.state.slice(0, 10), 
                        count: s.restaurantCount 
                      }))}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" />
                      <YAxis dataKey="state" type="category" width={80} className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="states" className="space-y-4 mt-4">
            {/* State-wise Data Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">State-wise Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredStateData.slice(0, 10).map((data) => (
                    <div 
                      key={data.state}
                      className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-primary" />
                        <div>
                          <p className="font-medium text-sm">{data.state}</p>
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
                  ))}
                  
                  {filteredStateData.length === 0 && (
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
