import { useRef } from "react";
import { Camera, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { useToast } from "@/hooks/use-toast";

interface AttachmentChooserProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileSelected: (file: File) => void;
  maxSizeMB?: number;
}

export function AttachmentChooser({
  open,
  onOpenChange,
  onFileSelected,
  maxSizeMB = 20,
}: AttachmentChooserProps) {
  const { tLabel } = useTranslation();
  const { toast } = useToast();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast({
          title: tLabel('error', 'Error'),
          description: tLabel('fileTooLarge', `File size must be less than ${maxSizeMB} MB`),
          variant: 'destructive',
        });
        return;
      }
      onFileSelected(file);
      onOpenChange(false);
    }
    if (e.target) e.target.value = '';
  };

  return (
    <>
      <input
        type="file"
        ref={cameraInputRef}
        className="hidden"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        data-testid="input-camera-capture"
      />
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
        onChange={handleFileChange}
        data-testid="input-file-upload"
      />

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{tLabel('addAttachment', 'Add Attachment')}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-14"
              onClick={() => {
                cameraInputRef.current?.click();
              }}
              data-testid="button-capture-image"
            >
              <div className="icon-halo-primary w-10 h-10">
                <Camera className="w-5 h-5 text-primary" />
              </div>
              <div className="flex flex-col items-start">
                <span className="font-medium">{tLabel('captureImage', 'Capture Image')}</span>
                <span className="text-xs text-muted-foreground">
                  {tLabel('useCamera', 'Use your camera to take a photo')}
                </span>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-14"
              onClick={() => {
                fileInputRef.current?.click();
              }}
              data-testid="button-upload-file"
            >
              <div className="icon-halo-info w-10 h-10">
                <Upload className="w-5 h-5 text-info" />
              </div>
              <div className="flex flex-col items-start">
                <span className="font-medium">{tLabel('uploadFile', 'Upload File/Image')}</span>
                <span className="text-xs text-muted-foreground">
                  {tLabel('selectFromDevice', 'Select from your device')}
                </span>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
