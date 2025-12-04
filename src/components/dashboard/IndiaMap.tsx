import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import indiaMapImg from "@/assets/india-map.webp";

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

// Clickable region positions (percentage-based for responsiveness)
const STATE_REGIONS: { [key: string]: { x: number; y: number; w: number; h: number } } = {
  "Ladakh": { x: 35, y: 3, w: 12, h: 10 },
  "Jammu & Kashmir": { x: 24, y: 6, w: 12, h: 12 },
  "Himachal Pradesh": { x: 32, y: 14, w: 8, h: 6 },
  "Punjab": { x: 24, y: 14, w: 8, h: 8 },
  "Uttarakhand": { x: 40, y: 16, w: 8, h: 6 },
  "Haryana": { x: 28, y: 21, w: 7, h: 6 },
  "Delhi": { x: 32, y: 24, w: 3, h: 3 },
  "Rajasthan": { x: 14, y: 22, w: 16, h: 18 },
  "Uttar Pradesh": { x: 34, y: 24, w: 18, h: 14 },
  "Bihar": { x: 52, y: 30, w: 9, h: 8 },
  "Sikkim": { x: 60, y: 28, w: 4, h: 4 },
  "Arunachal Pradesh": { x: 70, y: 24, w: 14, h: 10 },
  "Nagaland": { x: 82, y: 32, w: 6, h: 5 },
  "Manipur": { x: 80, y: 37, w: 6, h: 6 },
  "Mizoram": { x: 78, y: 43, w: 6, h: 8 },
  "Tripura": { x: 73, y: 42, w: 5, h: 6 },
  "Meghalaya": { x: 66, y: 35, w: 8, h: 5 },
  "Assam": { x: 63, y: 30, w: 16, h: 12 },
  "West Bengal": { x: 56, y: 38, w: 10, h: 16 },
  "Jharkhand": { x: 52, y: 38, w: 8, h: 8 },
  "Odisha": { x: 50, y: 46, w: 12, h: 12 },
  "Chhattisgarh": { x: 44, y: 42, w: 10, h: 14 },
  "Madhya Pradesh": { x: 28, y: 36, w: 18, h: 12 },
  "Gujarat": { x: 8, y: 34, w: 14, h: 16 },
  "Maharashtra": { x: 18, y: 50, w: 18, h: 14 },
  "Goa": { x: 18, y: 62, w: 4, h: 4 },
  "Karnataka": { x: 18, y: 64, w: 14, h: 16 },
  "Kerala": { x: 20, y: 78, w: 8, h: 12 },
  "Tamil Nadu": { x: 28, y: 74, w: 14, h: 14 },
  "Telangana": { x: 32, y: 54, w: 12, h: 10 },
  "Andhra Pradesh": { x: 32, y: 60, w: 16, h: 16 },
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
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("user_id, state");

      const { data: logs } = await supabase
        .from("daily_logs")
        .select("user_id, amount_ml");

      const aggregated: { [key: string]: StateData } = {};

      profiles?.forEach((profile) => {
        const state = profile.state || "Unknown";
        if (!aggregated[state]) {
          aggregated[state] = { name: state, consumption: 0, userCount: 0 };
        }
        aggregated[state].userCount++;

        const userLogs = logs?.filter((log) => log.user_id === profile.user_id) || [];
        const totalConsumption = userLogs.reduce((sum, log) => sum + Number(log.amount_ml), 0);
        aggregated[state].consumption += totalConsumption;
      });

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
    if (!data || data.userCount === 0) return "transparent";
    
    const avgConsumption = data.consumption;
    
    if (avgConsumption < 15) return "rgba(34, 197, 94, 0.5)"; // Green
    if (avgConsumption <= 25) return "rgba(234, 179, 8, 0.5)"; // Yellow
    return "rgba(239, 68, 68, 0.5)"; // Red
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

        {/* Map Container */}
        <div className="relative w-full">
          <img 
            src={indiaMapImg} 
            alt="India Map" 
            className="w-full h-auto rounded-lg"
          />
          
          {/* Overlay regions for interactivity */}
          {Object.entries(STATE_REGIONS).map(([stateName, region]) => {
            const isHovered = hoveredState === stateName;
            const isUserState = userState === stateName;
            const bgColor = getStateColor(stateName);

            return (
              <div
                key={stateName}
                className={`absolute cursor-pointer transition-all duration-200 rounded ${
                  isHovered ? "ring-2 ring-white" : ""
                } ${isUserState ? "ring-2 ring-primary" : ""}`}
                style={{
                  left: `${region.x}%`,
                  top: `${region.y}%`,
                  width: `${region.w}%`,
                  height: `${region.h}%`,
                  backgroundColor: bgColor,
                }}
                onMouseEnter={() => setHoveredState(stateName)}
                onMouseLeave={() => setHoveredState(null)}
              />
            );
          })}

          {/* User location marker */}
          {userState && STATE_REGIONS[userState] && (
            <div
              className="absolute w-3 h-3 bg-primary rounded-full animate-pulse border-2 border-white shadow-lg"
              style={{
                left: `${STATE_REGIONS[userState].x + STATE_REGIONS[userState].w / 2}%`,
                top: `${STATE_REGIONS[userState].y + STATE_REGIONS[userState].h / 2}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          )}

          {/* Tooltip */}
          {hoveredState && (
            <div 
              className="absolute bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border text-sm z-10"
              style={{
                left: `${STATE_REGIONS[hoveredState]?.x || 0}%`,
                top: `${(STATE_REGIONS[hoveredState]?.y || 0) - 2}%`,
                transform: "translateY(-100%)",
              }}
            >
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
