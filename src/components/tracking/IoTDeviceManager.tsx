import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface IoTDevice {
  id: string;
  device_id: string;
  device_name: string;
  linked_oil_type: string | null;
  is_active: boolean;
}

interface IoTDeviceManagerProps {
  userId: string;
  onRefetch: () => void;
}

export const IoTDeviceManager = ({ userId, onRefetch }: IoTDeviceManagerProps) => {
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPairForm, setShowPairForm] = useState(false);
  const [deviceId, setDeviceId] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [oilType, setOilType] = useState("");

  useEffect(() => {
    fetchDevices();
  }, [userId]);

  const fetchDevices = async () => {
    try {
      const { data, error } = await supabase
        .from("iot_devices")
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;

      setDevices(data || []);
    } catch (error) {
      console.error("Error fetching devices:", error);
    } finally {
      setLoading(false);
    }
  };

  const pairDevice = async () => {
    if (!deviceId || !deviceName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("iot_devices").insert({
        user_id: userId,
        device_id: deviceId,
        device_name: deviceName,
        linked_oil_type: oilType || null,
        is_active: true,
      });

      if (error) throw error;

      toast({
        title: "Device Paired",
        description: "Your IoT device has been successfully paired",
      });

      setDeviceId("");
      setDeviceName("");
      setOilType("");
      setShowPairForm(false);
      fetchDevices();
    } catch (error: any) {
      console.error("Error pairing device:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to pair device",
        variant: "destructive",
      });
    }
  };

  const unpairDevice = async (deviceIdToRemove: string) => {
    try {
      const { error } = await supabase
        .from("iot_devices")
        .delete()
        .eq("id", deviceIdToRemove);

      if (error) throw error;

      toast({
        title: "Device Removed",
        description: "IoT device has been unpaired",
      });

      fetchDevices();
      onRefetch();
    } catch (error) {
      console.error("Error unpairing device:", error);
      toast({
        title: "Error",
        description: "Failed to remove device",
        variant: "destructive",
      });
    }
  };

  const simulateUsage = async (deviceDbId: string) => {
    try {
      // Simulate IoT device logging usage (mock data)
      const randomVolume = Math.floor(Math.random() * 15) + 5; // 5-20ml

      const { error } = await supabase.from("iot_usage_logs").insert({
        device_id: deviceDbId,
        user_id: userId,
        volume_used_ml: randomVolume,
        logged_at: new Date().toISOString(),
        synced_to_tracking: false,
      });

      if (error) throw error;

      // Also add to daily logs
      const { error: logError } = await supabase.from("daily_logs").insert({
        user_id: userId,
        amount_ml: randomVolume,
        source: "IoT Device",
        log_date: new Date().toISOString().split("T")[0],
      });

      if (logError) throw logError;

      // Update sync status
      await supabase
        .from("iot_usage_logs")
        .update({ synced_to_tracking: true })
        .eq("device_id", deviceDbId)
        .eq("synced_to_tracking", false);

      toast({
        title: "Usage Logged",
        description: `Simulated ${randomVolume}ml usage logged automatically`,
      });

      onRefetch();
    } catch (error) {
      console.error("Error simulating usage:", error);
      toast({
        title: "Error",
        description: "Failed to log usage",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Wifi className="w-5 h-5 text-primary" />
          IoT Oil Devices
        </h3>
        {!showPairForm && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowPairForm(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Pair Device
          </Button>
        )}
      </div>

      {showPairForm && (
        <div className="space-y-3 p-4 bg-secondary/50 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="deviceId">Device ID</Label>
            <Input
              id="deviceId"
              placeholder="Enter device ID (e.g., IOT-12345)"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deviceName">Device Name</Label>
            <Input
              id="deviceName"
              placeholder="E.g., Kitchen Oil Bottle"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="oilType">Oil Type (Optional)</Label>
            <Input
              id="oilType"
              placeholder="E.g., Mustard Oil"
              value={oilType}
              onChange={(e) => setOilType(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={pairDevice} className="flex-1">
              Pair Device
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowPairForm(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Loading devices...
          </p>
        ) : devices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <WifiOff className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No IoT devices paired</p>
            <p className="text-xs mt-1">
              Purchase and pair an IoT device from OilHub to automatically track usage
            </p>
          </div>
        ) : (
          devices.map((device) => (
            <div
              key={device.id}
              className="flex items-center justify-between p-3 bg-card border rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-sm">{device.device_name}</p>
                  <Badge variant={device.is_active ? "default" : "secondary"}>
                    {device.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  ID: {device.device_id}
                </p>
                {device.linked_oil_type && (
                  <p className="text-xs text-muted-foreground">
                    Oil: {device.linked_oil_type}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => simulateUsage(device.id)}
                >
                  Test Log
                </Button>
                <button
                  onClick={() => unpairDevice(device.id)}
                  className="text-destructive hover:text-destructive/80"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        💡 IoT devices automatically log oil usage to your tracking data. Use "Test Log" to simulate automatic logging.
      </p>
    </Card>
  );
};