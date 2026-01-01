import { useState, useRef } from "react";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface ProfileAvatarProps {
  avatarData: string | null;
  displayName: string | null;
  onAvatarChange?: (avatarData: string | null) => void;
  size?: "sm" | "md" | "lg";
  editable?: boolean;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-16 h-16",
};

export function ProfileAvatar({
  avatarData,
  displayName,
  onAvatarChange,
  size = "md",
  editable = false,
}: ProfileAvatarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const initials = displayName
    ? displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxSize = 200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxSize) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Failed to get canvas context"));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      const compressed = await compressImage(file);
      onAvatarChange?.(compressed);
      toast({ title: "Profile photo updated" });
      setIsOpen(false);
    } catch (error: any) {
      toast({ title: "Failed to process image", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = () => {
    onAvatarChange?.(null);
    toast({ title: "Profile photo removed" });
    setIsOpen(false);
  };

  return (
    <>
      <button
        className={`relative rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${editable ? "cursor-pointer" : "cursor-default"}`}
        onClick={() => editable && setIsOpen(true)}
        disabled={!editable}
        data-testid="button-profile-avatar"
      >
        <Avatar className={sizeClasses[size]}>
          {avatarData ? (
            <AvatarImage src={avatarData} alt={displayName || "Profile"} />
          ) : null}
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
        {editable && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
            <Camera className="w-2.5 h-2.5 text-primary-foreground" />
          </div>
        )}
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Profile Photo</DialogTitle>
            <DialogDescription>Upload a new profile photo or remove the current one.</DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center gap-6 py-4">
            <Avatar className="w-24 h-24">
              {avatarData ? (
                <AvatarImage src={avatarData} alt={displayName || "Profile"} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex gap-2 w-full">
              <Button
                className="flex-1"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                data-testid="button-upload-photo"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Upload
              </Button>
              {avatarData && (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isProcessing}
                  data-testid="button-remove-photo"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={handleFileSelect}
            data-testid="input-file-avatar"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
