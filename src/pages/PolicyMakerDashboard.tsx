import { useState, useEffect } from "react";
import { 
  ArrowLeft, MapPin, TrendingDown, TrendingUp, Users, Store, Target, Activity, 
  BarChart3, PieChart, Download, FileText, Lock, Shield, AlertTriangle, 
  CheckCircle2, Clock, Zap, Heart, Brain, Leaf, FileCheck, Bell, 
  Calendar, Globe, Award, BookOpen, Settings, RefreshCw, Eye, 
  ThumbsUp, ThumbsDown, AlertCircle, Info, ChevronRight, Sparkles,
  GitCompare, Plus, X, ArrowUpDown, Minus, Equal
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BottomNav } from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPie, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface StateData {
  state: string;
  avgConsumption: number;
  userCount: number;
  restaurantCount: number;
  trend: number;
  healthIndex: number;
  complianceRate: number;
  districts: DistrictData[];
}

interface DistrictData {
  district: string;
  avgConsumption: number;
  userCount: number;
  restaurantCount: number;
  trend: number;
  healthIndex: number;
  complianceRate: number;
}

interface CampaignMetrics {
  totalUsers: number;
  activeTrackers: number;
  challengeParticipants: number;
  avgReduction: number;
  certifiedRestaurants: number;
  dataQualityScore: number;
  engagementRate: number;
  retentionRate: number;
}

interface PolicyAlert {
  id: string;
  type: "critical" | "warning" | "info" | "success";
  title: string;
  description: string;
  region: string;
  timestamp: Date;
  isRead: boolean;
}

interface PolicyProtocol {
  id: string;
  title: string;
  description: string;
  status: "active" | "pending" | "archived";
  category: string;
  lastUpdated: Date;
  complianceRate: number;
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

// Policy Protocols Data
const POLICY_PROTOCOLS: PolicyProtocol[] = [
  {
    id: "1",
    title: "ICMR Oil Consumption Guidelines",
    description: "Daily oil intake should not exceed 20-25ml per person as per ICMR recommendations",
    status: "active",
    category: "Health Standards",
    lastUpdated: new Date("2024-01-15"),
    complianceRate: 67
  },
  {
    id: "2",
    title: "Restaurant Certification Protocol",
    description: "All partner restaurants must maintain <30% oil usage in cooking and display blockchain certification",
    status: "active",
    category: "Certification",
    lastUpdated: new Date("2024-02-01"),
    complianceRate: 85
  },
  {
    id: "3",
    title: "Trans Fat Elimination Policy",
    description: "Eliminate industrially-produced trans fats from food supply by limiting to <2% of total fats",
    status: "active",
    category: "Food Safety",
    lastUpdated: new Date("2024-03-10"),
    complianceRate: 72
  },
  {
    id: "4",
    title: "Community Health Campaign Standards",
    description: "Monthly health awareness campaigns reaching minimum 10,000 users per state",
    status: "active",
    category: "Outreach",
    lastUpdated: new Date("2024-04-05"),
    complianceRate: 58
  },
  {
    id: "5",
    title: "Data Privacy & Security Protocol",
    description: "All user health data must be encrypted and anonymized for analytics",
    status: "active",
    category: "Data Governance",
    lastUpdated: new Date("2024-05-20"),
    complianceRate: 95
  }
];

// Generate sample alerts
const generateAlerts = (): PolicyAlert[] => [
  {
    id: "1",
    type: "critical",
    title: "High Consumption Spike Detected",
    description: "Maharashtra shows 23% increase in average oil consumption over the past week",
    region: "Maharashtra",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isRead: false
  },
  {
    id: "2",
    type: "warning",
    title: "Low Engagement Rate",
    description: "Bihar user engagement dropped below 40% threshold",
    region: "Bihar",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    isRead: false
  },
  {
    id: "3",
    type: "success",
    title: "Target Achievement",
    description: "Karnataka achieved 15% oil reduction target ahead of schedule",
    region: "Karnataka",
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
    isRead: true
  },
  {
    id: "4",
    type: "info",
    title: "New Restaurants Onboarded",
    description: "12 new restaurants certified in Tamil Nadu this week",
    region: "Tamil Nadu",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    isRead: true
  }
];

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
    certifiedRestaurants: 0,
    dataQualityScore: 0,
    engagementRate: 0,
    retentionRate: 0
  });
  const [consumptionTrend, setConsumptionTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<PolicyAlert[]>(generateAlerts());
  const [selectedProtocol, setSelectedProtocol] = useState<PolicyProtocol | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  
  // Comparison state
  const [compareMode, setCompareMode] = useState<"states" | "districts">("states");
  const [compareRegion1, setCompareRegion1] = useState<string>("");
  const [compareRegion2, setCompareRegion2] = useState<string>("");
  const [compareRegion3, setCompareRegion3] = useState<string>("");
  const [compareParentState, setCompareParentState] = useState<string>("");

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
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("state, city, user_id");

      const { data: logs } = await supabase
        .from("daily_logs")
        .select("user_id, amount_ml, log_date")
        .gte("log_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);

      const { data: restaurants } = await supabase
        .from("restaurant_applications")
        .select("state, city, status, blockchain_certified")
        .eq("status", "approved");

      const { data: challenges } = await supabase
        .from("user_challenges")
        .select("user_id, status");

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
        .map(([state, data]) => {
          const avgConsumption = data.consumption.length > 0 
            ? Math.round(data.consumption.reduce((a, b) => a + b, 0) / data.consumption.length) 
            : 0;
          return {
            state,
            avgConsumption,
            userCount: data.users.size,
            restaurantCount: data.restaurants,
            trend: Math.random() > 0.5 ? -Math.random() * 15 : Math.random() * 10,
            healthIndex: Math.round(60 + Math.random() * 35),
            complianceRate: Math.round(50 + Math.random() * 45),
            districts: Object.entries(data.districts)
              .filter(([district]) => district !== "Unknown")
              .map(([district, districtData]) => {
                const districtAvg = districtData.consumption.length > 0
                  ? Math.round(districtData.consumption.reduce((a, b) => a + b, 0) / districtData.consumption.length)
                  : 0;
                return {
                  district,
                  avgConsumption: districtAvg,
                  userCount: districtData.users.size,
                  restaurantCount: districtData.restaurants,
                  trend: Math.random() > 0.5 ? -Math.random() * 15 : Math.random() * 10,
                  healthIndex: Math.round(55 + Math.random() * 40),
                  complianceRate: Math.round(45 + Math.random() * 50)
                };
              })
              .sort((a, b) => b.userCount - a.userCount)
          };
        })
        .sort((a, b) => b.userCount - a.userCount);

      setStateData(processedStateData);

      const totalUsers = profiles?.length || 0;
      const activeTrackers = new Set(logs?.map(l => l.user_id)).size;
      const challengeParticipants = new Set(challenges?.filter(c => c.status === "active" || c.status === "completed").map(c => c.user_id)).size;
      const certifiedRestaurants = restaurants?.filter(r => r.blockchain_certified).length || 0;

      setCampaignMetrics({
        totalUsers,
        activeTrackers,
        challengeParticipants,
        avgReduction: 12.5,
        certifiedRestaurants,
        dataQualityScore: 87,
        engagementRate: 64,
        retentionRate: 78
      });

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
          target: 25,
          users: dayLogs.length
        });
      }
      setConsumptionTrend(trendData);
      setLastRefreshed(new Date());

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

  const getDistrictData = () => {
    if (selectedState === "All States") return [];
    const stateInfo = stateData.find(s => s.state === selectedState);
    return stateInfo?.districts || [];
  };

  const exportToCSV = () => {
    const data = selectedState === "All States" 
      ? stateData.map(s => ({
          "Region": s.state,
          "Users": s.userCount,
          "Avg Consumption (ml)": s.avgConsumption,
          "Restaurants": s.restaurantCount,
          "Health Index": s.healthIndex,
          "Compliance Rate (%)": s.complianceRate,
          "Trend (%)": s.trend.toFixed(1)
        }))
      : getDistrictData().map(d => ({
          "District": d.district,
          "Users": d.userCount,
          "Avg Consumption (ml)": d.avgConsumption,
          "Restaurants": d.restaurantCount,
          "Health Index": d.healthIndex,
          "Compliance Rate (%)": d.complianceRate,
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

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setTextColor(0, 128, 128);
    doc.text("Noil Policy Maker Dashboard Report", 14, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString("en-IN")}`, 14, 32);
    doc.text(`Region: ${selectedState}${selectedDistrict !== "All Districts" ? ` > ${selectedDistrict}` : ""}`, 14, 40);
    
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
        ["Avg Oil Reduction", `${campaignMetrics.avgReduction}%`],
        ["Data Quality Score", `${campaignMetrics.dataQualityScore}%`],
        ["Engagement Rate", `${campaignMetrics.engagementRate}%`],
        ["Retention Rate", `${campaignMetrics.retentionRate}%`]
      ],
      theme: "striped",
      headStyles: { fillColor: [0, 128, 128] }
    });

    const tableData = selectedState === "All States" 
      ? stateData.slice(0, 15).map(s => [s.state, s.userCount, s.avgConsumption, s.healthIndex, s.complianceRate, `${s.trend > 0 ? "+" : ""}${s.trend.toFixed(1)}%`])
      : getDistrictData().slice(0, 15).map(d => [d.district, d.userCount, d.avgConsumption, d.healthIndex, d.complianceRate, `${d.trend > 0 ? "+" : ""}${d.trend.toFixed(1)}%`]);

    if (tableData.length > 0) {
      doc.setFontSize(14);
      doc.text(selectedState === "All States" ? "State-wise Overview" : `District-wise Overview (${selectedState})`, 14, (doc as any).lastAutoTable.finalY + 15);
      
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [[selectedState === "All States" ? "State" : "District", "Users", "Avg (ml)", "Health Index", "Compliance %", "Trend"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [0, 128, 128] }
      });
    }

    doc.save(`policy_dashboard_${selectedState.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`);
    toast({ title: "PDF exported successfully" });
  };

  const markAlertAsRead = (alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isRead: true } : a));
  };

  const getAlertIcon = (type: PolicyAlert["type"]) => {
    switch (type) {
      case "critical": return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case "warning": return <AlertCircle className="w-4 h-4 text-warning" />;
      case "success": return <CheckCircle2 className="w-4 h-4 text-success" />;
      case "info": return <Info className="w-4 h-4 text-primary" />;
    }
  };

  const oilTypeDistribution = [
    { name: "Mustard", value: 35 },
    { name: "Groundnut", value: 25 },
    { name: "Coconut", value: 20 },
    { name: "Refined", value: 15 },
    { name: "Olive", value: 5 }
  ];

  const healthImpactData = [
    { subject: "Heart Health", A: 78, fullMark: 100 },
    { subject: "Diabetes Risk", A: 65, fullMark: 100 },
    { subject: "Obesity", A: 72, fullMark: 100 },
    { subject: "Cholesterol", A: 68, fullMark: 100 },
    { subject: "Blood Pressure", A: 74, fullMark: 100 },
    { subject: "Overall Wellness", A: 70, fullMark: 100 }
  ];

  const monthlyTrendData = [
    { month: "Jul", consumption: 32, target: 25, users: 1200 },
    { month: "Aug", consumption: 30, target: 25, users: 1450 },
    { month: "Sep", consumption: 28, target: 25, users: 1680 },
    { month: "Oct", consumption: 27, target: 25, users: 1920 },
    { month: "Nov", consumption: 25, target: 25, users: 2100 },
    { month: "Dec", consumption: 24, target: 25, users: 2350 }
  ];

  const unreadAlertsCount = alerts.filter(a => !a.isRead).length;

  // Get comparison data for selected regions
  const getComparisonData = () => {
    const regions = [compareRegion1, compareRegion2, compareRegion3].filter(Boolean);
    
    if (compareMode === "states") {
      return regions.map(regionName => {
        const data = stateData.find(s => s.state === regionName);
        return data ? { name: regionName, ...data } : null;
      }).filter(Boolean) as (StateData & { name: string })[];
    } else {
      if (!compareParentState) return [];
      const parentState = stateData.find(s => s.state === compareParentState);
      if (!parentState) return [];
      
      return regions.map(districtName => {
        const data = parentState.districts.find(d => d.district === districtName);
        return data ? { name: districtName, ...data } : null;
      }).filter(Boolean) as (DistrictData & { name: string })[];
    }
  };

  const comparisonData = getComparisonData();

  // Generate comparison chart data
  const getComparisonChartData = () => {
    const metrics = ["Users", "Avg Consumption", "Health Index", "Compliance %", "Restaurants"];
    return metrics.map(metric => {
      const dataPoint: any = { metric };
      comparisonData.forEach((region, index) => {
        switch (metric) {
          case "Users":
            dataPoint[region.name] = region.userCount;
            break;
          case "Avg Consumption":
            dataPoint[region.name] = region.avgConsumption;
            break;
          case "Health Index":
            dataPoint[region.name] = region.healthIndex;
            break;
          case "Compliance %":
            dataPoint[region.name] = region.complianceRate;
            break;
          case "Restaurants":
            dataPoint[region.name] = region.restaurantCount;
            break;
        }
      });
      return dataPoint;
    });
  };

  const comparisonChartData = getComparisonChartData();

  const getAvailableCompareRegions = () => {
    if (compareMode === "states") {
      return Object.keys(STATE_DISTRICTS).sort();
    } else {
      return compareParentState ? STATE_DISTRICTS[compareParentState] || [] : [];
    }
  };

  const getDifferenceIndicator = (val1: number, val2: number, higherIsBetter: boolean = true) => {
    const diff = val1 - val2;
    const percentage = val2 !== 0 ? ((diff / val2) * 100).toFixed(1) : "0";
    
    if (Math.abs(diff) < 0.1) {
      return <span className="text-muted-foreground flex items-center gap-1"><Equal className="w-3 h-3" /> Same</span>;
    }
    
    const isPositive = higherIsBetter ? diff > 0 : diff < 0;
    
    return (
      <span className={`flex items-center gap-1 ${isPositive ? 'text-success' : 'text-destructive'}`}>
        {diff > 0 ? <Plus className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
        {Math.abs(Number(percentage))}%
      </span>
    );
  };

  const COMPARE_COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))'];

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
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold">Policy Maker Dashboard</h1>
                <Badge variant="outline" className="text-xs">Pro</Badge>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last updated: {lastRefreshed.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Alerts */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              onClick={() => toast({ title: "Alerts Panel", description: `You have ${unreadAlertsCount} unread alerts` })}
            >
              <Bell className="w-5 h-5" />
              {unreadAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                  {unreadAlertsCount}
                </span>
              )}
            </Button>

            {/* Refresh */}
            <Button variant="ghost" size="icon" onClick={fetchDashboardData} disabled={loading}>
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>

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
        </div>
      </header>

      <main className="px-4 py-6 space-y-6 max-w-5xl mx-auto">
        {/* Quick Stats Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Total Users</span>
              </div>
              <p className="text-2xl font-bold">{campaignMetrics.totalUsers.toLocaleString()}</p>
              <p className="text-xs text-success flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> +12% this month
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-success" />
                <span className="text-xs text-muted-foreground">Active Trackers</span>
              </div>
              <p className="text-2xl font-bold">{campaignMetrics.activeTrackers.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((campaignMetrics.activeTrackers / campaignMetrics.totalUsers) * 100) || 0}% of total
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-warning" />
                <span className="text-xs text-muted-foreground">Challenge Users</span>
              </div>
              <p className="text-2xl font-bold">{campaignMetrics.challengeParticipants.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {campaignMetrics.engagementRate}% engagement
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Store className="w-4 h-4 text-destructive" />
                <span className="text-xs text-muted-foreground">Certified Restaurants</span>
              </div>
              <p className="text-2xl font-bold">{campaignMetrics.certifiedRestaurants}</p>
              <p className="text-xs text-success flex items-center gap-1 mt-1">
                <Shield className="w-3 h-3" /> Blockchain verified
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Key Performance Indicators */}
        <Card className="bg-gradient-to-r from-primary/5 via-transparent to-success/5 border-primary/20">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-success/10 mb-2">
                  <TrendingDown className="w-6 h-6 text-success" />
                </div>
                <p className="text-2xl font-bold text-success">{campaignMetrics.avgReduction}%</p>
                <p className="text-xs text-muted-foreground">Avg Oil Reduction</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <p className="text-2xl font-bold">{campaignMetrics.dataQualityScore}%</p>
                <p className="text-xs text-muted-foreground">Data Quality Score</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-warning/10 mb-2">
                  <Zap className="w-6 h-6 text-warning" />
                </div>
                <p className="text-2xl font-bold">{campaignMetrics.engagementRate}%</p>
                <p className="text-xs text-muted-foreground">Engagement Rate</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary/20 mb-2">
                  <Heart className="w-6 h-6 text-destructive" />
                </div>
                <p className="text-2xl font-bold">{campaignMetrics.retentionRate}%</p>
                <p className="text-xs text-muted-foreground">Retention Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

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

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6 h-auto">
            <TabsTrigger value="overview" className="text-xs py-2">Overview</TabsTrigger>
            <TabsTrigger value="compare" className="text-xs py-2">
              <GitCompare className="w-3 h-3 mr-1" />
              Compare
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs py-2">Analytics</TabsTrigger>
            <TabsTrigger value="health" className="text-xs py-2">Health</TabsTrigger>
            <TabsTrigger value="protocols" className="text-xs py-2">Protocols</TabsTrigger>
            <TabsTrigger value="alerts" className="text-xs py-2 relative">
              Alerts
              {unreadAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center">
                  {unreadAlertsCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* 6-Month Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  6-Month Consumption Trend
                </CardTitle>
                <CardDescription>Average daily oil consumption vs target</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyTrendData}>
                      <defs>
                        <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="consumption" 
                        stroke="hsl(var(--primary))" 
                        fillOpacity={1}
                        fill="url(#colorConsumption)"
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="target" 
                        stroke="hsl(var(--success))" 
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-muted-foreground">Avg Consumption (ml/day)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-success" />
                    <span className="text-muted-foreground">ICMR Target (25ml)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* State Overview Grid */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  {selectedState === "All States" ? "State-wise Overview" : `District Overview: ${selectedState}`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedState === "All States" ? (
                    stateData.slice(0, 8).map((data) => (
                      <div 
                        key={data.state}
                        className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors"
                        onClick={() => setSelectedState(data.state)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            data.healthIndex >= 75 ? 'bg-success/10' : 
                            data.healthIndex >= 60 ? 'bg-warning/10' : 'bg-destructive/10'
                          }`}>
                            <span className={`text-sm font-bold ${
                              data.healthIndex >= 75 ? 'text-success' : 
                              data.healthIndex >= 60 ? 'text-warning' : 'text-destructive'
                            }`}>{data.healthIndex}</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{data.state}</p>
                            <p className="text-xs text-muted-foreground">
                              {data.userCount} users • {data.restaurantCount} restaurants
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-4">
                          <div>
                            <p className="text-sm font-medium">{data.avgConsumption} ml/day</p>
                            <div className={`flex items-center gap-1 text-xs ${data.trend < 0 ? 'text-success' : 'text-destructive'}`}>
                              {data.trend < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                              {Math.abs(data.trend).toFixed(1)}%
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))
                  ) : (
                    getDistrictData().slice(0, 10).map((data) => (
                      <div 
                        key={data.district}
                        className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                          selectedDistrict === data.district ? 'bg-primary/10 border border-primary/30' : 'bg-secondary/30 hover:bg-secondary/50'
                        }`}
                        onClick={() => setSelectedDistrict(data.district)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            data.healthIndex >= 75 ? 'bg-success/10' : 
                            data.healthIndex >= 60 ? 'bg-warning/10' : 'bg-destructive/10'
                          }`}>
                            <span className={`text-sm font-bold ${
                              data.healthIndex >= 75 ? 'text-success' : 
                              data.healthIndex >= 60 ? 'text-warning' : 'text-destructive'
                            }`}>{data.healthIndex}</span>
                          </div>
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
                            {data.trend < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
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

          {/* Compare Tab */}
          <TabsContent value="compare" className="space-y-4 mt-4">
            {/* Mode Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <GitCompare className="w-4 h-4 text-primary" />
                  Region Comparison Tool
                </CardTitle>
                <CardDescription>Select up to 3 regions to compare side-by-side</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Compare Mode Toggle */}
                <div className="flex gap-2">
                  <Button
                    variant={compareMode === "states" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setCompareMode("states");
                      setCompareRegion1("");
                      setCompareRegion2("");
                      setCompareRegion3("");
                      setCompareParentState("");
                    }}
                    className="flex-1"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Compare States
                  </Button>
                  <Button
                    variant={compareMode === "districts" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setCompareMode("districts");
                      setCompareRegion1("");
                      setCompareRegion2("");
                      setCompareRegion3("");
                    }}
                    className="flex-1"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Compare Districts
                  </Button>
                </div>

                {/* Parent State Selection (for district mode) */}
                {compareMode === "districts" && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Select State</label>
                    <Select value={compareParentState} onValueChange={(value) => {
                      setCompareParentState(value);
                      setCompareRegion1("");
                      setCompareRegion2("");
                      setCompareRegion3("");
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a state first" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(STATE_DISTRICTS).sort().map(state => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Region Selectors */}
                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      {compareMode === "states" ? "State" : "District"} 1
                    </label>
                    <Select 
                      value={compareRegion1} 
                      onValueChange={setCompareRegion1}
                      disabled={compareMode === "districts" && !compareParentState}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableCompareRegions()
                          .filter(r => r !== compareRegion2 && r !== compareRegion3)
                          .map(region => (
                            <SelectItem key={region} value={region}>{region}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-success" />
                      {compareMode === "states" ? "State" : "District"} 2
                    </label>
                    <Select 
                      value={compareRegion2} 
                      onValueChange={setCompareRegion2}
                      disabled={compareMode === "districts" && !compareParentState}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableCompareRegions()
                          .filter(r => r !== compareRegion1 && r !== compareRegion3)
                          .map(region => (
                            <SelectItem key={region} value={region}>{region}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-warning" />
                      {compareMode === "states" ? "State" : "District"} 3 (Optional)
                    </label>
                    <Select 
                      value={compareRegion3} 
                      onValueChange={setCompareRegion3}
                      disabled={compareMode === "districts" && !compareParentState}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableCompareRegions()
                          .filter(r => r !== compareRegion1 && r !== compareRegion2)
                          .map(region => (
                            <SelectItem key={region} value={region}>{region}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Clear Selection */}
                {(compareRegion1 || compareRegion2 || compareRegion3) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setCompareRegion1("");
                      setCompareRegion2("");
                      setCompareRegion3("");
                    }}
                    className="w-full text-muted-foreground"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear Selection
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Comparison Results */}
            {comparisonData.length >= 2 ? (
              <>
                {/* Side-by-Side Metrics Cards */}
                <div className={`grid gap-4 ${comparisonData.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  {comparisonData.map((region, index) => (
                    <Card key={region.name} className="border-2" style={{ borderColor: COMPARE_COLORS[index] }}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COMPARE_COLORS[index] }} />
                          {region.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Users</span>
                          <span className="font-bold">{region.userCount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Avg Consumption</span>
                          <span className="font-bold">{region.avgConsumption} ml</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Health Index</span>
                          <span className={`font-bold ${
                            region.healthIndex >= 75 ? 'text-success' :
                            region.healthIndex >= 60 ? 'text-warning' : 'text-destructive'
                          }`}>{region.healthIndex}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Compliance</span>
                          <span className="font-bold">{region.complianceRate}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Restaurants</span>
                          <span className="font-bold">{region.restaurantCount}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Trend</span>
                          <span className={`font-bold flex items-center gap-1 ${region.trend < 0 ? 'text-success' : 'text-destructive'}`}>
                            {region.trend < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                            {Math.abs(region.trend).toFixed(1)}%
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Comparison Bar Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      Metric Comparison Chart
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={comparisonChartData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis type="number" className="text-xs" />
                          <YAxis dataKey="metric" type="category" width={110} className="text-xs" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }} 
                          />
                          <Legend />
                          {comparisonData.map((region, index) => (
                            <Bar 
                              key={region.name}
                              dataKey={region.name} 
                              fill={COMPARE_COLORS[index]}
                              radius={[0, 4, 4, 0]}
                            />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Comparison Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <ArrowUpDown className="w-4 h-4 text-primary" />
                      Detailed Comparison Analysis
                    </CardTitle>
                    <CardDescription>
                      {comparisonData.length === 2 
                        ? `Comparing ${comparisonData[0].name} vs ${comparisonData[1].name}`
                        : `Comparing ${comparisonData.map(r => r.name).join(', ')}`
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-2 font-medium">Metric</th>
                            {comparisonData.map((region, index) => (
                              <th key={region.name} className="text-center py-3 px-2 font-medium">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COMPARE_COLORS[index] }} />
                                  {region.name}
                                </div>
                              </th>
                            ))}
                            {comparisonData.length === 2 && (
                              <th className="text-center py-3 px-2 font-medium">Difference</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="py-3 px-2 text-muted-foreground">Total Users</td>
                            {comparisonData.map(region => (
                              <td key={region.name} className="text-center py-3 px-2 font-medium">
                                {region.userCount.toLocaleString()}
                              </td>
                            ))}
                            {comparisonData.length === 2 && (
                              <td className="text-center py-3 px-2 text-xs">
                                {getDifferenceIndicator(comparisonData[0].userCount, comparisonData[1].userCount)}
                              </td>
                            )}
                          </tr>
                          <tr className="border-b">
                            <td className="py-3 px-2 text-muted-foreground">Avg Consumption (ml)</td>
                            {comparisonData.map(region => (
                              <td key={region.name} className="text-center py-3 px-2 font-medium">
                                {region.avgConsumption}
                              </td>
                            ))}
                            {comparisonData.length === 2 && (
                              <td className="text-center py-3 px-2 text-xs">
                                {getDifferenceIndicator(comparisonData[0].avgConsumption, comparisonData[1].avgConsumption, false)}
                              </td>
                            )}
                          </tr>
                          <tr className="border-b">
                            <td className="py-3 px-2 text-muted-foreground">Health Index</td>
                            {comparisonData.map(region => (
                              <td key={region.name} className={`text-center py-3 px-2 font-medium ${
                                region.healthIndex >= 75 ? 'text-success' :
                                region.healthIndex >= 60 ? 'text-warning' : 'text-destructive'
                              }`}>
                                {region.healthIndex}
                              </td>
                            ))}
                            {comparisonData.length === 2 && (
                              <td className="text-center py-3 px-2 text-xs">
                                {getDifferenceIndicator(comparisonData[0].healthIndex, comparisonData[1].healthIndex)}
                              </td>
                            )}
                          </tr>
                          <tr className="border-b">
                            <td className="py-3 px-2 text-muted-foreground">Compliance Rate</td>
                            {comparisonData.map(region => (
                              <td key={region.name} className="text-center py-3 px-2 font-medium">
                                {region.complianceRate}%
                              </td>
                            ))}
                            {comparisonData.length === 2 && (
                              <td className="text-center py-3 px-2 text-xs">
                                {getDifferenceIndicator(comparisonData[0].complianceRate, comparisonData[1].complianceRate)}
                              </td>
                            )}
                          </tr>
                          <tr className="border-b">
                            <td className="py-3 px-2 text-muted-foreground">Restaurants</td>
                            {comparisonData.map(region => (
                              <td key={region.name} className="text-center py-3 px-2 font-medium">
                                {region.restaurantCount}
                              </td>
                            ))}
                            {comparisonData.length === 2 && (
                              <td className="text-center py-3 px-2 text-xs">
                                {getDifferenceIndicator(comparisonData[0].restaurantCount, comparisonData[1].restaurantCount)}
                              </td>
                            )}
                          </tr>
                          <tr>
                            <td className="py-3 px-2 text-muted-foreground">Trend</td>
                            {comparisonData.map(region => (
                              <td key={region.name} className={`text-center py-3 px-2 font-medium ${region.trend < 0 ? 'text-success' : 'text-destructive'}`}>
                                {region.trend > 0 ? '+' : ''}{region.trend.toFixed(1)}%
                              </td>
                            ))}
                            {comparisonData.length === 2 && (
                              <td className="text-center py-3 px-2 text-xs">
                                {getDifferenceIndicator(comparisonData[1].trend, comparisonData[0].trend, false)}
                              </td>
                            )}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Winner Summary (for 2 regions) */}
                {comparisonData.length === 2 && (
                  <Card className="bg-gradient-to-r from-primary/5 to-success/5">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Award className="w-4 h-4 text-warning" />
                        Comparison Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-card rounded-lg border">
                          <p className="text-sm text-muted-foreground mb-2">Better Health Performance</p>
                          <p className="font-bold text-lg">
                            {comparisonData[0].healthIndex >= comparisonData[1].healthIndex 
                              ? comparisonData[0].name 
                              : comparisonData[1].name
                            }
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Health Index: {Math.max(comparisonData[0].healthIndex, comparisonData[1].healthIndex)}
                          </p>
                        </div>
                        <div className="p-4 bg-card rounded-lg border">
                          <p className="text-sm text-muted-foreground mb-2">Lower Oil Consumption</p>
                          <p className="font-bold text-lg">
                            {comparisonData[0].avgConsumption <= comparisonData[1].avgConsumption 
                              ? comparisonData[0].name 
                              : comparisonData[1].name
                            }
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Avg: {Math.min(comparisonData[0].avgConsumption, comparisonData[1].avgConsumption)} ml/day
                          </p>
                        </div>
                        <div className="p-4 bg-card rounded-lg border">
                          <p className="text-sm text-muted-foreground mb-2">Higher Compliance</p>
                          <p className="font-bold text-lg">
                            {comparisonData[0].complianceRate >= comparisonData[1].complianceRate 
                              ? comparisonData[0].name 
                              : comparisonData[1].name
                            }
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Rate: {Math.max(comparisonData[0].complianceRate, comparisonData[1].complianceRate)}%
                          </p>
                        </div>
                        <div className="p-4 bg-card rounded-lg border">
                          <p className="text-sm text-muted-foreground mb-2">Better Trend</p>
                          <p className="font-bold text-lg">
                            {comparisonData[0].trend <= comparisonData[1].trend 
                              ? comparisonData[0].name 
                              : comparisonData[1].name
                            }
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Trend: {Math.min(comparisonData[0].trend, comparisonData[1].trend).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-12 text-center">
                  <GitCompare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Select Regions to Compare</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Choose at least 2 {compareMode === "states" ? "states" : "districts"} from the selectors above 
                    to see a detailed side-by-side comparison of their performance metrics.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4 mt-4">
            <div className="grid md:grid-cols-2 gap-4">
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
                  <div className="flex flex-wrap justify-center gap-3 mt-4">
                    {oilTypeDistribution.map((item, index) => (
                      <div key={item.name} className="flex items-center gap-2 text-xs">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-muted-foreground">{item.name} ({item.value}%)</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Restaurant Certification */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    Restaurant Certification Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-success" />
                          Blockchain Certified
                        </span>
                        <span className="text-sm font-medium text-success">{campaignMetrics.certifiedRestaurants}</span>
                      </div>
                      <Progress value={70} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm flex items-center gap-2">
                          <Clock className="w-4 h-4 text-warning" />
                          Pending Certification
                        </span>
                        <span className="text-sm font-medium text-warning">12</span>
                      </div>
                      <Progress value={20} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm flex items-center gap-2">
                          <Eye className="w-4 h-4 text-muted-foreground" />
                          Under Review
                        </span>
                        <span className="text-sm font-medium text-muted-foreground">8</span>
                      </div>
                      <Progress value={10} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* User Engagement Funnel */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  User Engagement Funnel
                </CardTitle>
                <CardDescription>Conversion from registration to active tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Registered Users</span>
                      <span className="text-sm font-medium">{campaignMetrics.totalUsers}</span>
                    </div>
                    <Progress value={100} className="h-3" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Profile Completed</span>
                      <span className="text-sm font-medium">{Math.round(campaignMetrics.totalUsers * 0.82)}</span>
                    </div>
                    <Progress value={82} className="h-3" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Active Trackers</span>
                      <span className="text-sm font-medium">{campaignMetrics.activeTrackers}</span>
                    </div>
                    <Progress value={(campaignMetrics.activeTrackers / campaignMetrics.totalUsers) * 100 || 45} className="h-3" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Challenge Participants</span>
                      <span className="text-sm font-medium">{campaignMetrics.challengeParticipants}</span>
                    </div>
                    <Progress value={(campaignMetrics.challengeParticipants / campaignMetrics.totalUsers) * 100 || 28} className="h-3" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 7-Day Consumption Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Health Impact Tab */}
          <TabsContent value="health" className="space-y-4 mt-4">
            {/* Health Impact Radar */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="w-4 h-4 text-destructive" />
                  Population Health Impact Assessment
                </CardTitle>
                <CardDescription>Estimated health improvement metrics based on oil reduction campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={healthImpactData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="subject" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Radar name="Health Score" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Health Statistics Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="border-success/30 bg-success/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                      <Heart className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-success">23%</p>
                      <p className="text-xs text-muted-foreground">Reduced CVD Risk</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Estimated reduction in cardiovascular disease risk among active users
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Brain className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary">18%</p>
                      <p className="text-xs text-muted-foreground">Diabetes Prevention</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Reduced type-2 diabetes risk through better oil consumption habits
                  </p>
                </CardContent>
              </Card>

              <Card className="border-warning/30 bg-warning/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                      <Leaf className="w-6 h-6 text-warning" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-warning">15%</p>
                      <p className="text-xs text-muted-foreground">Obesity Reduction</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Users reporting weight management improvements
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Health Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-primary" />
                  Evidence-Based Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-success/10 rounded-lg border border-success/20">
                    <div className="flex items-start gap-3">
                      <ThumbsUp className="w-5 h-5 text-success mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Promote Cold-Pressed Oils</p>
                        <p className="text-xs text-muted-foreground">States with higher cold-pressed oil usage show 12% better health outcomes</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="flex items-start gap-3">
                      <ThumbsUp className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Expand Restaurant Certification</p>
                        <p className="text-xs text-muted-foreground">Areas with certified restaurants show 15% higher user engagement</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Focus on North Indian States</p>
                        <p className="text-xs text-muted-foreground">Higher refined oil usage detected - targeted campaigns recommended</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Protocols Tab */}
          <TabsContent value="protocols" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  Active Policy Protocols
                </CardTitle>
                <CardDescription>Guidelines and standards governing the oil reduction campaign</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {POLICY_PROTOCOLS.map((protocol) => (
                    <div 
                      key={protocol.id}
                      className="p-4 border rounded-lg hover:bg-secondary/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedProtocol(protocol)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm">{protocol.title}</p>
                            <Badge variant={protocol.status === "active" ? "default" : "secondary"} className="text-[10px]">
                              {protocol.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{protocol.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <FileCheck className="w-3 h-3" />
                              {protocol.category}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Updated {protocol.lastUpdated.toLocaleDateString("en-IN")}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${
                            protocol.complianceRate >= 80 ? 'text-success' :
                            protocol.complianceRate >= 60 ? 'text-warning' : 'text-destructive'
                          }`}>
                            {protocol.complianceRate}%
                          </div>
                          <p className="text-xs text-muted-foreground">Compliance</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Compliance Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary" />
                  Overall Compliance Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-success/10 rounded-lg">
                    <p className="text-3xl font-bold text-success">72%</p>
                    <p className="text-sm text-muted-foreground">Avg Protocol Compliance</p>
                  </div>
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <p className="text-3xl font-bold text-primary">5</p>
                    <p className="text-sm text-muted-foreground">Active Protocols</p>
                  </div>
                  <div className="text-center p-4 bg-warning/10 rounded-lg">
                    <p className="text-3xl font-bold text-warning">2</p>
                    <p className="text-sm text-muted-foreground">Protocols Under Review</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  System Alerts & Notifications
                </CardTitle>
                <CardDescription>Real-time alerts for policy compliance and campaign performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div 
                      key={alert.id}
                      className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                        alert.isRead ? 'bg-secondary/20' : 'bg-card border-l-4'
                      } ${
                        alert.type === 'critical' ? 'border-l-destructive' :
                        alert.type === 'warning' ? 'border-l-warning' :
                        alert.type === 'success' ? 'border-l-success' : 'border-l-primary'
                      }`}
                      onClick={() => markAlertAsRead(alert.id)}
                    >
                      <div className="flex items-start gap-3">
                        {getAlertIcon(alert.type)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-sm">{alert.title}</p>
                            {!alert.isRead && (
                              <Badge variant="secondary" className="text-[10px]">New</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{alert.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {alert.region}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {alert.timestamp.toLocaleString("en-IN", { 
                                hour: "2-digit", 
                                minute: "2-digit",
                                day: "numeric",
                                month: "short"
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Alert Statistics */}
            <div className="grid sm:grid-cols-4 gap-3">
              <Card className="bg-destructive/5 border-destructive/20">
                <CardContent className="p-4 text-center">
                  <AlertTriangle className="w-6 h-6 text-destructive mx-auto mb-2" />
                  <p className="text-2xl font-bold text-destructive">
                    {alerts.filter(a => a.type === "critical").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Critical</p>
                </CardContent>
              </Card>
              <Card className="bg-warning/5 border-warning/20">
                <CardContent className="p-4 text-center">
                  <AlertCircle className="w-6 h-6 text-warning mx-auto mb-2" />
                  <p className="text-2xl font-bold text-warning">
                    {alerts.filter(a => a.type === "warning").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Warnings</p>
                </CardContent>
              </Card>
              <Card className="bg-success/5 border-success/20">
                <CardContent className="p-4 text-center">
                  <CheckCircle2 className="w-6 h-6 text-success mx-auto mb-2" />
                  <p className="text-2xl font-bold text-success">
                    {alerts.filter(a => a.type === "success").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Successes</p>
                </CardContent>
              </Card>
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 text-center">
                  <Info className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold text-primary">
                    {alerts.filter(a => a.type === "info").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Info</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Protocol Detail Dialog */}
      <Dialog open={!!selectedProtocol} onOpenChange={() => setSelectedProtocol(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-primary" />
              {selectedProtocol?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedProtocol?.category} • Last updated {selectedProtocol?.lastUpdated.toLocaleDateString("en-IN")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{selectedProtocol?.description}</p>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Compliance Rate</span>
                <span className={`font-medium ${
                  (selectedProtocol?.complianceRate || 0) >= 80 ? 'text-success' :
                  (selectedProtocol?.complianceRate || 0) >= 60 ? 'text-warning' : 'text-destructive'
                }`}>
                  {selectedProtocol?.complianceRate}%
                </span>
              </div>
              <Progress value={selectedProtocol?.complianceRate} className="h-2" />
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-sm font-medium">Key Requirements:</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Regular monitoring and reporting</li>
                <li>Quarterly compliance audits</li>
                <li>Stakeholder training programs</li>
                <li>Documentation and record keeping</li>
              </ul>
            </div>

            <Button className="w-full" onClick={() => setSelectedProtocol(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default PolicyMakerDashboard;
