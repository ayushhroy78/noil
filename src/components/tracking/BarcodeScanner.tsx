import { useState, useRef, useEffect } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, X, Scan, Keyboard, History, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BarcodeScannerProps {
  userId: string;
  onScanComplete: () => void;
}

interface BarcodeHistory {
  id: string;
  barcode: string | null;
  product_name: string;
  oil_content_ml: number;
  fat_content_g: number | null;
  trans_fat_g: number | null;
  scan_date: string;
}

export const BarcodeScanner = ({ userId, onScanComplete }: BarcodeScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [manualBarcode, setManualBarcode] = useState("");
  const [productName, setProductName] = useState("");
  const [oilContent, setOilContent] = useState("");
  const [fatContent, setFatContent] = useState("");
  const [transFat, setTransFat] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [history, setHistory] = useState<BarcodeHistory[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchHistory();
    return () => {
      stopScanning();
    };
  }, []);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("barcode_scans")
        .select("*")
        .eq("user_id", userId)
        .order("scan_date", { ascending: false })
        .limit(5);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  const lookupBarcode = async (barcode: string) => {
    setIsLookingUp(true);
    try {
      const { data, error } = await supabase.functions.invoke("lookup-barcode", {
        body: { barcode },
      });

      if (error) throw error;

      if (data.found) {
        setProductName(data.productName);
        if (data.oilContentMl) setOilContent(data.oilContentMl.toString());
        if (data.fatContentG) setFatContent(data.fatContentG.toString());
        if (data.transFatG) setTransFat(data.transFatG.toString());
        
        toast({
          title: "Product Found!",
          description: `${data.productName} - Nutritional info loaded`,
        });
      } else {
        toast({
          title: "Product Not Found",
          description: "Please enter details manually",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error looking up barcode:", error);
      toast({
        title: "Lookup Failed",
        description: "Could not fetch product info. Please enter manually.",
        variant: "destructive",
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  const startScanning = async () => {
    try {
      const videoElement = videoRef.current;
      if (!videoElement) return;

      // Request camera permissions first
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      videoElement.srcObject = stream;
      await videoElement.play();

      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;
      setIsScanning(true);

      reader.decodeFromVideoDevice(
        undefined,
        videoElement,
        (result, error) => {
          if (result) {
            const barcode = result.getText();
            setScannedBarcode(barcode);
            stopScanning();
            toast({
              title: "Barcode detected!",
              description: `Scanned: ${barcode}`,
            });
            lookupBarcode(barcode);
          }
          // Continue scanning if no result yet
        }
      );
    } catch (error) {
      console.error("Error starting scanner:", error);
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive",
      });
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (readerRef.current && videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      readerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleManualLookup = () => {
    if (!manualBarcode.trim()) {
      toast({
        title: "Enter Barcode",
        description: "Please enter a barcode number",
        variant: "destructive",
      });
      return;
    }
    setScannedBarcode(manualBarcode);
    lookupBarcode(manualBarcode);
  };

  const handleQuickAdd = async (item: BarcodeHistory) => {
    try {
      const { error } = await supabase.from("barcode_scans").insert({
        user_id: userId,
        barcode: item.barcode,
        product_name: item.product_name,
        oil_content_ml: item.oil_content_ml,
        fat_content_g: item.fat_content_g,
        trans_fat_g: item.trans_fat_g,
        scan_date: new Date().toISOString(),
      });

      if (error) throw error;

      toast({
        title: "Product Added!",
        description: `${item.product_name} added to today's tracking.`,
      });

      fetchHistory();
      onScanComplete();
    } catch (error) {
      console.error("Error quick adding:", error);
      toast({
        title: "Error",
        description: "Failed to add product.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productName || !oilContent) {
      toast({
        title: "Missing Information",
        description: "Please enter product name and oil content.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("barcode_scans").insert({
        user_id: userId,
        barcode: scannedBarcode || null,
        product_name: productName,
        oil_content_ml: Number(oilContent),
        fat_content_g: fatContent ? Number(fatContent) : null,
        trans_fat_g: transFat ? Number(transFat) : null,
        scan_date: new Date().toISOString(),
      });

      if (error) throw error;

      toast({
        title: "Product Added!",
        description: `${productName} tracked successfully.`,
      });

      // Reset form
      setScannedBarcode("");
      setManualBarcode("");
      setProductName("");
      setOilContent("");
      setFatContent("");
      setTransFat("");

      fetchHistory();
      onScanComplete();
    } catch (error) {
      console.error("Error saving scan:", error);
      toast({
        title: "Error",
        description: "Failed to save product scan.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="border-border/40 shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="w-5 h-5 text-primary" />
          Scan Packaged Food
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="scan" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="scan">
              <Camera className="w-4 h-4 mr-2" />
              Scan
            </TabsTrigger>
            <TabsTrigger value="manual">
              <Keyboard className="w-4 h-4 mr-2" />
              Manual
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="space-y-4">
            {!isScanning && !scannedBarcode && (
              <Button
                onClick={startScanning}
                className="w-full"
                size="lg"
              >
                <Camera className="w-5 h-5 mr-2" />
                Start Camera Scan
              </Button>
            )}

            {isScanning && (
          <div className="relative">
            <video
              ref={videoRef}
              className="w-full rounded-lg bg-muted"
              style={{ maxHeight: "300px", width: "100%" }}
              playsInline
              muted
            />
            <Button
              onClick={stopScanning}
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
            >
              <X className="w-4 h-4" />
            </Button>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-primary rounded-lg" />
            </div>
            </div>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manualBarcode">Enter Barcode Number</Label>
              <div className="flex gap-2">
                <Input
                  id="manualBarcode"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="e.g., 8901725113933"
                  type="text"
                />
                <Button
                  type="button"
                  onClick={handleManualLookup}
                  disabled={isLookingUp}
                >
                  {isLookingUp ? "Looking up..." : "Lookup"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the barcode number manually if camera scanning doesn't work
              </p>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-3">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No scan history yet
              </p>
            ) : (
              history.map((item) => (
                <Card key={item.id} className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {item.product_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Oil: {item.oil_content_ml}ml
                        {item.barcode && ` • ${item.barcode}`}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickAdd(item)}
                      className="shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        <form onSubmit={handleSubmit} className="space-y-4">
          {(scannedBarcode || isLookingUp) && (
            <div className="p-3 bg-primary/10 rounded-lg">
              <p className="text-sm font-medium text-foreground">
                {isLookingUp ? "Looking up product..." : `Barcode: ${scannedBarcode}`}
              </p>
            </div>
          )}

          {scannedBarcode && (
            <>
              <div className="space-y-2">
                <Label htmlFor="productName">Product Name *</Label>
                <Input
                  id="productName"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g., Brand Chips 50g"
                  required
                  disabled={isLookingUp}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="oilContent">Oil Content (ml) *</Label>
                  <Input
                    id="oilContent"
                    type="number"
                    step="0.1"
                    value={oilContent}
                    onChange={(e) => setOilContent(e.target.value)}
                    placeholder="10"
                    required
                    disabled={isLookingUp}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fatContent">Fat (g)</Label>
                  <Input
                    id="fatContent"
                    type="number"
                    step="0.1"
                    value={fatContent}
                    onChange={(e) => setFatContent(e.target.value)}
                    placeholder="5"
                    disabled={isLookingUp}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transFat">Trans Fat (g)</Label>
                <Input
                  id="transFat"
                  type="number"
                  step="0.1"
                  value={transFat}
                  onChange={(e) => setTransFat(e.target.value)}
                  placeholder="0.5"
                  disabled={isLookingUp}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLookingUp}>
                Add to Daily Tracking
              </Button>

              {!isScanning && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setScannedBarcode("");
                    setManualBarcode("");
                    setProductName("");
                    setOilContent("");
                    setFatContent("");
                    setTransFat("");
                  }}
                >
                  Clear & Scan Another
                </Button>
              )}
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
};
