import { useRef, useState } from "react";
import { Camera, ImageIcon, Trash2, User } from "lucide-react";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { compressProfileImage } from "@/lib/imageCompression";
import { useNavigation } from "@/lib/navigation";
import { storage } from "@/lib/storage";

export function ProfileSettingsScreen() {
  const { navigate } = useNavigation();
  const { toast } = useToast();
  const [profile, setProfile] = useState(() => storage.getProfile());
  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [showClearDataModal, setShowClearDataModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const saveName = () => {
    const name = displayName.trim();
    if (!name) {
      toast({
        title: "Name required",
        description: "Please enter your name.",
        variant: "destructive",
      });
      return;
    }

    const updated = storage.updateProfile({ displayName: name });
    setProfile(updated);
    toast({
      title: "Profile updated",
      description: "Your name was saved on this device.",
      variant: "success",
    });
  };

  const savePhoto = async (file: File) => {
    try {
      const profileImage = await compressProfileImage(file);
      const updated = storage.updateProfile({ profileImage });
      setProfile(updated);
      setShowPhotoDialog(false);
      toast({
        title: "Photo updated",
        description: "Your profile photo was saved on this device.",
        variant: "success",
      });
    } catch {
      toast({
        title: "Photo not saved",
        description: "Please choose a different image.",
        variant: "destructive",
      });
    }
  };

  const removePhoto = () => {
    const updated = storage.updateProfile({ profileImage: undefined });
    setProfile(updated);
    setShowPhotoDialog(false);
  };

  const clearAllData = () => {
    storage.clearAllData();
    setShowClearDataModal(false);
    navigate("role-selection");
  };

  return (
    <AppLayout>
      <Header title="Profile" onBack={() => navigate("settings")} />
      <ScrollContent>
        <section className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-3 py-2">
            <button
              type="button"
              className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-dashed border-muted-foreground/30 bg-muted"
              onClick={() => setShowPhotoDialog(true)}
              data-testid="button-profile-photo-upload"
            >
              {profile?.profileImage ? (
                <img
                  src={profile.profileImage}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
                  <Camera className="h-6 w-6" />
                  <span className="text-xs">Add photo</span>
                </span>
              )}
            </button>
            <p className="text-xs text-muted-foreground">
              Stored only on this device
            </p>
          </div>

          <Card className="p-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <h2 className="font-medium">Profile details</h2>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="displayName">Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Your name"
                  data-testid="input-display-name"
                />
              </div>
              <Button onClick={saveName} data-testid="button-save-profile">
                Save profile
              </Button>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex flex-col gap-3">
              <div>
                <h2 className="font-medium">Local data</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Home Staff 360 keeps your profile and work records on this
                  device. No account or phone sign-in is used.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => setShowClearDataModal(true)}
                data-testid="button-clear-local-data"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear all local data
              </Button>
            </div>
          </Card>
        </section>
      </ScrollContent>

      <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Profile photo</DialogTitle>
            <DialogDescription>
              Choose a photo to store locally on this device.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Button onClick={() => cameraInputRef.current?.click()}>
              <Camera className="mr-2 h-4 w-4" />
              Take photo
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              Choose image
            </Button>
            {profile?.profileImage && (
              <Button variant="ghost" onClick={removePhoto}>
                Remove photo
              </Button>
            )}
          </div>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void savePhoto(file);
              event.currentTarget.value = "";
            }}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void savePhoto(file);
              event.currentTarget.value = "";
            }}
          />
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={showClearDataModal}
        onOpenChange={setShowClearDataModal}
        title="Clear all local data?"
        description="This permanently removes your profile, settings, and all records stored on this device."
        confirmText="Clear data"
        variant="destructive"
        onConfirm={clearAllData}
      />
    </AppLayout>
  );
}