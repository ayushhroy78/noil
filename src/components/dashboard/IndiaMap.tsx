import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

interface StateData {
  name: string;
  consumption: number;
  userCount: number;
}

interface IndiaMapProps {
  userState?: string;
}

const INDIAN_STATES: { [key: string]: string } = {
  "Andhra Pradesh": "AP",
  "Arunachal Pradesh": "AR",
  "Assam": "AS",
  "Bihar": "BR",
  "Chhattisgarh": "CG",
  "Goa": "GA",
  "Gujarat": "GJ",
  "Haryana": "HR",
  "Himachal Pradesh": "HP",
  "Jharkhand": "JH",
  "Karnataka": "KA",
  "Kerala": "KL",
  "Madhya Pradesh": "MP",
  "Maharashtra": "MH",
  "Manipur": "MN",
  "Meghalaya": "ML",
  "Mizoram": "MZ",
  "Nagaland": "NL",
  "Odisha": "OR",
  "Punjab": "PB",
  "Rajasthan": "RJ",
  "Sikkim": "SK",
  "Tamil Nadu": "TN",
  "Telangana": "TS",
  "Tripura": "TR",
  "Uttar Pradesh": "UP",
  "Uttarakhand": "UK",
  "West Bengal": "WB",
  "Delhi": "DL",
  "Jammu & Kashmir": "JK",
  "Ladakh": "LA",
};

// SVG path data for each state (simplified representation)
const STATE_PATHS: { [key: string]: { d: string; cx: number; cy: number } } = {
  "Jammu & Kashmir": { d: "M145,45 L175,35 L195,50 L200,75 L180,95 L155,90 L140,70 Z", cx: 170, cy: 65 },
  "Ladakh": { d: "M195,25 L235,20 L255,45 L240,70 L200,75 L195,50 Z", cx: 220, cy: 45 },
  "Himachal Pradesh": { d: "M180,95 L205,90 L220,105 L210,125 L185,120 L175,105 Z", cx: 195, cy: 107 },
  "Punjab": { d: "M155,90 L180,95 L175,105 L185,120 L165,135 L145,125 L140,105 Z", cx: 160, cy: 112 },
  "Uttarakhand": { d: "M220,105 L250,100 L265,120 L250,140 L220,135 L210,125 Z", cx: 235, cy: 120 },
  "Haryana": { d: "M165,135 L185,120 L210,125 L205,150 L175,160 L160,150 Z", cx: 180, cy: 140 },
  "Delhi": { d: "M182,155 L195,152 L198,165 L185,168 Z", cx: 190, cy: 160 },
  "Rajasthan": { d: "M90,140 L160,150 L175,160 L180,200 L150,250 L80,230 L60,180 Z", cx: 120, cy: 195 },
  "Uttar Pradesh": { d: "M175,160 L205,150 L250,140 L280,160 L295,200 L260,230 L200,220 L180,200 Z", cx: 230, cy: 190 },
  "Bihar": { d: "M295,200 L325,190 L350,205 L340,230 L305,235 L290,220 Z", cx: 320, cy: 215 },
  "Sikkim": { d: "M355,185 L370,180 L375,195 L365,205 L355,200 Z", cx: 365, cy: 192 },
  "Arunachal Pradesh": { d: "M395,165 L450,155 L470,175 L455,200 L410,205 L390,190 Z", cx: 430, cy: 180 },
  "Nagaland": { d: "M455,200 L475,195 L480,215 L465,225 L450,215 Z", cx: 465, cy: 210 },
  "Manipur": { d: "M450,225 L470,220 L475,245 L455,255 L445,240 Z", cx: 460, cy: 238 },
  "Mizoram": { d: "M445,255 L465,250 L470,280 L450,295 L435,275 Z", cx: 455, cy: 272 },
  "Tripura": { d: "M415,260 L435,255 L440,280 L425,290 L410,275 Z", cx: 425, cy: 272 },
  "Meghalaya": { d: "M380,220 L415,215 L420,235 L395,245 L375,235 Z", cx: 397, cy: 228 },
  "Assam": { d: "M365,205 L410,200 L450,215 L445,240 L395,250 L375,235 L355,220 Z", cx: 405, cy: 225 },
  "West Bengal": { d: "M340,230 L380,220 L395,250 L380,295 L345,320 L330,290 L320,250 Z", cx: 355, cy: 270 },
  "Jharkhand": { d: "M305,235 L340,230 L350,260 L330,290 L295,280 L290,255 Z", cx: 320, cy: 260 },
  "Odisha": { d: "M295,280 L330,290 L345,320 L325,365 L280,355 L265,310 Z", cx: 305, cy: 325 },
  "Chhattisgarh": { d: "M260,255 L295,255 L295,280 L280,355 L240,340 L230,290 Z", cx: 265, cy: 305 },
  "Madhya Pradesh": { d: "M150,250 L230,240 L260,255 L260,290 L240,340 L170,350 L120,310 L110,270 Z", cx: 185, cy: 295 },
  "Gujarat": { d: "M60,230 L110,270 L100,310 L60,340 L25,320 L20,270 L40,245 Z", cx: 65, cy: 285 },
  "Maharashtra": { d: "M100,310 L170,350 L185,400 L140,440 L80,420 L55,370 L60,340 Z", cx: 115, cy: 380 },
  "Goa": { d: "M80,420 L100,415 L105,440 L85,450 Z", cx: 92, cy: 432 },
  "Karnataka": { d: "M80,420 L140,440 L150,490 L120,530 L70,510 L55,460 Z", cx: 105, cy: 475 },
  "Kerala": { d: "M70,510 L100,530 L95,590 L75,610 L60,570 Z", cx: 80, cy: 560 },
  "Tamil Nadu": { d: "M100,530 L150,490 L185,510 L175,575 L130,610 L95,590 Z", cx: 140, cy: 550 },
  "Telangana": { d: "M170,350 L240,340 L255,380 L230,420 L185,400 Z", cx: 215, cy: 380 },
  "Andhra Pradesh": { d: "M185,400 L230,420 L255,380 L280,355 L300,400 L270,470 L200,490 L150,490 L140,440 Z", cx: 220, cy: 435 },
};

const IndiaMap = ({ userState }: IndiaMapProps) => {
  const [stateData, setStateData] = useState<{ [key: string]: StateData }>({});
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStateData();
  }, []);

  const fetchStateData = async () => {
    try {
      // Get all user profiles with their states
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("user_id, state");

      // Get daily logs for all users
      const { data: logs } = await supabase
        .from("daily_logs")
        .select("user_id, amount_ml");

      // Aggregate data by state
      const aggregated: { [key: string]: StateData } = {};

      profiles?.forEach((profile) => {
        const state = profile.state || "Unknown";
        if (!aggregated[state]) {
          aggregated[state] = { name: state, consumption: 0, userCount: 0 };
        }
        aggregated[state].userCount++;

        // Sum consumption for this user
        const userLogs = logs?.filter((log) => log.user_id === profile.user_id) || [];
        const totalConsumption = userLogs.reduce((sum, log) => sum + Number(log.amount_ml), 0);
        aggregated[state].consumption += totalConsumption;
      });

      // Calculate average per user for each state
      Object.keys(aggregated).forEach((state) => {
        if (aggregated[state].userCount > 0) {
          aggregated[state].consumption = aggregated[state].consumption / aggregated[state].userCount;
        }
      });

      setStateData(aggregated);
    } catch (error) {
      console.error("Error fetching state data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStateColor = (stateName: string) => {
    const data = stateData[stateName];
    if (!data || data.userCount === 0) return "hsl(var(--muted))";
    
    const avgConsumption = data.consumption;
    
    // Low: < 15ml/day (green), Moderate: 15-25ml (yellow), High: > 25ml (red)
    if (avgConsumption < 15) return "hsl(142, 76%, 45%)"; // Green
    if (avgConsumption <= 25) return "hsl(45, 93%, 55%)"; // Yellow
    return "hsl(0, 84%, 55%)"; // Red
  };

  const getConsumptionLevel = (consumption: number) => {
    if (consumption < 15) return { level: "Low", color: "text-green-500" };
    if (consumption <= 25) return { level: "Moderate", color: "text-yellow-500" };
    return { level: "High", color: "text-red-500" };
  };

  return (
    <Card className="border-0 shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          India Oil Consumption Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mb-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span>Low (&lt;15ml)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-500" />
            <span>Moderate (15-25ml)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span>High (&gt;25ml)</span>
          </div>
        </div>

        {/* Map SVG */}
        <div className="relative">
          <svg
            viewBox="0 0 500 650"
            className="w-full h-auto max-h-[400px]"
            style={{ background: "linear-gradient(180deg, hsl(220, 60%, 20%) 0%, hsl(220, 60%, 30%) 100%)" }}
          >
            {/* Draw all states */}
            {Object.entries(STATE_PATHS).map(([stateName, pathData]) => {
              const isHovered = hoveredState === stateName;
              const isUserState = userState === stateName;
              const fillColor = getStateColor(stateName);

              return (
                <g key={stateName}>
                  <path
                    d={pathData.d}
                    fill={fillColor}
                    stroke={isUserState ? "hsl(var(--primary))" : "hsl(220, 60%, 25%)"}
                    strokeWidth={isUserState ? 3 : 1}
                    className={`transition-all duration-200 cursor-pointer ${
                      isHovered ? "opacity-80" : "opacity-100"
                    }`}
                    onMouseEnter={() => setHoveredState(stateName)}
                    onMouseLeave={() => setHoveredState(null)}
                  />
                  {/* State label */}
                  <text
                    x={pathData.cx}
                    y={pathData.cy}
                    textAnchor="middle"
                    className="fill-white text-[6px] font-medium pointer-events-none"
                    style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
                  >
                    {INDIAN_STATES[stateName] || stateName.substring(0, 2).toUpperCase()}
                  </text>
                </g>
              );
            })}

            {/* User location marker */}
            {userState && STATE_PATHS[userState] && (
              <circle
                cx={STATE_PATHS[userState].cx}
                cy={STATE_PATHS[userState].cy - 15}
                r="6"
                fill="hsl(var(--primary))"
                stroke="white"
                strokeWidth="2"
                className="animate-pulse"
              />
            )}
          </svg>

          {/* Tooltip */}
          {hoveredState && (
            <div className="absolute top-2 left-2 bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border text-sm">
              <p className="font-semibold">{hoveredState}</p>
              {stateData[hoveredState] && stateData[hoveredState].userCount > 0 ? (
                <>
                  <p className="text-muted-foreground">
                    Avg: {stateData[hoveredState].consumption.toFixed(1)} ml/day
                  </p>
                  <p className={getConsumptionLevel(stateData[hoveredState].consumption).color}>
                    {getConsumptionLevel(stateData[hoveredState].consumption).level} consumption
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stateData[hoveredState].userCount} user(s)
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground text-xs">No data available</p>
              )}
            </div>
          )}
        </div>

        {/* Current user state info */}
        {userState && (
          <div className="mt-4 p-3 bg-primary/10 rounded-lg">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="font-medium">Your Location: {userState}</span>
            </div>
            {stateData[userState] && (
              <p className="text-sm text-muted-foreground mt-1">
                State average: {stateData[userState].consumption.toFixed(1)} ml/day
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IndiaMap;
