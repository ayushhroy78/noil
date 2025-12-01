import { useState, useRef, useEffect } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, X, Scan, Keyboard, History, Plus, Sparkles, Loader2 } from "lucide-react";
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

interface ProductData {
  barcode: string;
  productName: string;
  oilContentMl: number;
  fatContentG?: number;
  transFatG?: number;
}

export const BarcodeScanner = ({ userId, onScanComplete }: BarcodeScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
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
        const product = {
          barcode,
          productName: data.productName,
          oilContentMl: data.oilContentMl,
          fatContentG: data.fatContentG,
          transFatG: data.transFatG,
        };
        setProductData(product);
        // Fetch AI suggestions for better oil alternatives
        fetchAiSuggestions(product);
      } else {
        setProductData(null);
        toast({
          title: "Product Not Found",
          description: "This barcode is not in our database yet",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error looking up barcode:", error);
      setProductData(null);
      toast({
        title: "Lookup Failed",
        description: "Could not fetch product info",
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
    lookupBarcode(manualBarcode);
  };

  const handleQuickAdd = async (item: BarcodeHistory) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Add to barcode_scans
      const { error: scanError } = await supabase.from("barcode_scans").insert({
        user_id: userId,
        barcode: item.barcode,
        product_name: item.product_name,
        oil_content_ml: item.oil_content_ml,
        fat_content_g: item.fat_content_g,
        trans_fat_g: item.trans_fat_g,
        scan_date: new Date().toISOString(),
      });

      if (scanError) throw scanError;

      // Check if there's already a packaged_food log for today
      const { data: existingLog } = await supabase
        .from("daily_logs")
        .select("id, amount_ml, notes")
        .eq("user_id", userId)
        .eq("log_date", today)
        .eq("source", "packaged_food")
        .maybeSingle();

      if (existingLog) {
        // Update existing log by adding to the amount
        const newAmount = existingLog.amount_ml + item.oil_content_ml;
        const updatedNotes = existingLog.notes 
          ? `${existingLog.notes}\n+ ${item.product_name}`
          : item.product_name;
        
        const { error: updateError } = await supabase
          .from("daily_logs")
          .update({ 
            amount_ml: newAmount,
            notes: updatedNotes
          })
          .eq("id", existingLog.id);

        if (updateError) throw updateError;
      } else {
        // Create new log entry
        const { error: logError } = await supabase.from("daily_logs").insert({
          user_id: userId,
          amount_ml: item.oil_content_ml,
          source: "packaged_food",
          notes: item.product_name,
          log_date: today,
        });

        if (logError) throw logError;
      }

      toast({
        title: "Added to Daily Log!",
        description: `${item.product_name} (${item.oil_content_ml}ml oil) logged successfully.`,
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

  const handleConfirmAdd = async () => {
    if (!productData) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Add to barcode_scans table
      const { error: scanError } = await supabase.from("barcode_scans").insert({
        user_id: userId,
        barcode: productData.barcode,
        product_name: productData.productName,
        oil_content_ml: productData.oilContentMl,
        fat_content_g: productData.fatContentG || null,
        trans_fat_g: productData.transFatG || null,
        scan_date: new Date().toISOString(),
      });

      if (scanError) throw scanError;

      // Check if there's already a packaged_food log for today
      const { data: existingLog } = await supabase
        .from("daily_logs")
        .select("id, amount_ml, notes")
        .eq("user_id", userId)
        .eq("log_date", today)
        .eq("source", "packaged_food")
        .maybeSingle();

      if (existingLog) {
        // Update existing log by adding to the amount
        const newAmount = existingLog.amount_ml + productData.oilContentMl;
        const updatedNotes = existingLog.notes 
          ? `${existingLog.notes}\n+ ${productData.productName}`
          : productData.productName;
        
        const { error: updateError } = await supabase
          .from("daily_logs")
          .update({ 
            amount_ml: newAmount,
            notes: updatedNotes
          })
          .eq("id", existingLog.id);

        if (updateError) throw updateError;
      } else {
        // Create new log entry
        const { error: logError } = await supabase.from("daily_logs").insert({
          user_id: userId,
          amount_ml: productData.oilContentMl,
          source: "packaged_food",
          notes: productData.productName,
          log_date: today,
        });

        if (logError) throw logError;
      }

      toast({
        title: "Added to Daily Log!",
        description: `${productData.productName} (${productData.oilContentMl}ml oil) logged successfully.`,
      });

      // Reset
      setProductData(null);
      setManualBarcode("");
      fetchHistory();
      onScanComplete();
    } catch (error) {
      console.error("Error saving:", error);
      toast({
        title: "Error",
        description: "Failed to add to daily log.",
        variant: "destructive",
      });
    }
  };

  const fetchAiSuggestions = async (product: ProductData) => {
    setIsLoadingSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-oil-alternatives", {
        body: {
          productName: product.productName,
          oilContentMl: product.oilContentMl,
          fatContentG: product.fatContentG,
          transFatG: product.transFatG,
        },
      });

      if (error) throw error;

      if (data.success) {
        setAiSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error("Error fetching AI suggestions:", error);
      // Don't show error toast, just fail silently
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleCancel = () => {
    setProductData(null);
    setAiSuggestions(null);
    setManualBarcode("");
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
            {!isScanning && !productData && (
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

        {isLookingUp && (
          <Card className="p-4 bg-primary/5 border-primary/20">
            <p className="text-sm font-medium text-center">Looking up product...</p>
          </Card>
        )}

        {productData && (
          <Card className="p-4 space-y-4 bg-accent/50 border-primary/30">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Product Found</p>
                <p className="text-lg font-semibold text-foreground">{productData.productName}</p>
              </div>
              
              <div className="space-y-2 p-3 bg-background/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Oil Content:</span>
                  <span className="text-base font-semibold text-primary">{productData.oilContentMl} ml</span>
                </div>
                {productData.fatContentG && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Fat:</span>
                    <span className="text-sm font-medium">{productData.fatContentG} g</span>
                  </div>
                )}
                {productData.transFatG && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Trans Fat:</span>
                    <span className="text-sm font-medium">{productData.transFatG} g</span>
                  </div>
                )}
              </div>

              {isLoadingSuggestions && (
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Getting healthier oil suggestions...</span>
                  </div>
                </div>
              )}

              {aiSuggestions && !isLoadingSuggestions && (
                <div className="space-y-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                      Healthier Oil Alternatives
                    </p>
                  </div>
                  <div className="text-sm text-foreground whitespace-pre-wrap">
                    {aiSuggestions}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <p className="text-sm text-muted-foreground mb-3">
                  Do you want to add this to your daily oil consumption log?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirmAdd}
                    className="w-full"
                  >
                    Add to Log
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};
