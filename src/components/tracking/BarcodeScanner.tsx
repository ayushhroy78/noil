import { useState, useRef, useEffect } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, X, Scan } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BarcodeScannerProps {
  userId: string;
  onScanComplete: () => void;
}

export const BarcodeScanner = ({ userId, onScanComplete }: BarcodeScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [productName, setProductName] = useState("");
  const [oilContent, setOilContent] = useState("");
  const [fatContent, setFatContent] = useState("");
  const [transFat, setTransFat] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      const videoElement = videoRef.current;
      if (!videoElement) return;

      setIsScanning(true);

      await reader.decodeFromVideoDevice(
        undefined,
        videoElement,
        (result, error) => {
          if (result) {
            setScannedBarcode(result.getText());
            stopScanning();
            toast({
              title: "Barcode detected!",
              description: `Scanned: ${result.getText()}`,
            });
          }
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
      setProductName("");
      setOilContent("");
      setFatContent("");
      setTransFat("");

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
              style={{ maxHeight: "300px" }}
            />
            <Button
              onClick={stopScanning}
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {scannedBarcode && (
            <div className="p-3 bg-primary/10 rounded-lg">
              <p className="text-sm font-medium text-foreground">
                Barcode: {scannedBarcode}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="productName">Product Name *</Label>
            <Input
              id="productName"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g., Brand Chips 50g"
              required
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
            />
          </div>

          <Button type="submit" className="w-full">
            Add to Daily Tracking
          </Button>

          {!isScanning && scannedBarcode && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                setScannedBarcode("");
                setProductName("");
                setOilContent("");
                setFatContent("");
                setTransFat("");
              }}
            >
              Clear & Scan Another
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
};
