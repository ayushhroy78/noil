import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";

interface ImageUploaderProps {
  userId: string;
  type: "logo" | "food";
  value: string | string[];
  onChange: (value: string | string[]) => void;
  maxFiles?: number;
}

export const ImageUploader = ({
  userId,
  type,
  value,
  onChange,
  maxFiles = 1,
}: ImageUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const images = Array.isArray(value) ? value : value ? [value] : [];

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${type}/${Date.now()}.${fileExt}`;

    setUploading(true);
    try {
      const { error: uploadError } = await supabase.storage
        .from("restaurant-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("restaurant-images")
        .getPublicUrl(fileName);

      if (type === "logo") {
        onChange(publicUrl);
      } else {
        const newPhotos = [...images, publicUrl];
        onChange(newPhotos);
      }

      toast({
        title: "Image uploaded",
        description: "Your image has been uploaded successfully.",
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (type === "food" && images.length + files.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} photos allowed`,
        variant: "destructive",
      });
      return;
    }

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 5MB",
          variant: "destructive",
        });
        return;
      }
      uploadImage(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = async (imageUrl: string) => {
    try {
      // Extract file path from URL
      const urlParts = imageUrl.split("/restaurant-images/");
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from("restaurant-images").remove([filePath]);
      }

      if (type === "logo") {
        onChange("");
      } else {
        const newPhotos = images.filter((img) => img !== imageUrl);
        onChange(newPhotos);
      }

      toast({
        title: "Image removed",
        description: "The image has been removed.",
      });
    } catch (error) {
      console.error("Remove error:", error);
    }
  };

  const isLogo = type === "logo";
  const canAddMore = isLogo ? images.length === 0 : images.length < maxFiles;

  return (
    <div className="space-y-3">
      {/* Uploaded Images */}
      {images.length > 0 && (
        <div className={`grid gap-3 ${isLogo ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3"}`}>
          {images.map((imageUrl, index) => (
            <Card
              key={index}
              className={`relative overflow-hidden group ${
                isLogo ? "w-32 h-32" : "aspect-square"
              }`}
            >
              <img
                src={imageUrl}
                alt={`${type} ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(imageUrl)}
                className="absolute top-2 right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {canAddMore && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple={!isLogo}
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={`w-full border-dashed border-2 ${
              isLogo ? "h-32" : "h-24"
            }`}
          >
            {uploading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                {isLogo ? (
                  <ImageIcon className="w-8 h-8" />
                ) : (
                  <Upload className="w-6 h-6" />
                )}
                <span className="text-sm">
                  {isLogo
                    ? "Upload Logo"
                    : `Add Photos (${images.length}/${maxFiles})`}
                </span>
              </div>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};