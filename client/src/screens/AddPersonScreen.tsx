import { useState, useEffect, useMemo, useRef } from "react";
import { Info, Camera, User, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { UnsavedChangesDialog } from "@/components/UnsavedChangesDialog";
import { useNavigation } from "@/lib/navigation";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { useSimpleDirtyTracker } from "@/hooks/use-dirty-tracker";
import { 
  salaryTypes, 
  type SalaryType, 
  STAFF_ROLES,
  SALARY_TYPE_LABELS 
} from "@shared/schema";

export function AddPersonScreen() {
  const { navigate, goBack, data } = useNavigation();
  const { toast } = useToast();
  const { isDirty, markDirty, markClean } = useSimpleDirtyTracker();
  const editMode = data.editMode && data.personId;
  
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [salaryType, setSalaryType] = useState<SalaryType>("DAILY");
  const [baseRate, setBaseRate] = useState("");
  const [halfDayPercentage, setHalfDayPercentage] = useState("");
  const [notes, setNotes] = useState("");
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editMode && data.personId) {
      const person = storage.getPerson(data.personId);
      if (person) {
        setName(person.name);
        setRole(person.role);
        setPhone(person.phone);
        setSalaryType(person.salaryType);
        setBaseRate(person.baseRate.toString());
        setHalfDayPercentage(person.halfDayPercentage?.toString() || "");
        setNotes(person.notes || "");
        setPhotoData(person.photoData || null);
      }
    }
  }, [editMode, data.personId]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = "Name is required";
    if (!role.trim()) newErrors.role = "Role is required";
    if (!phone.trim() || phone.replace(/\D/g, "").length < 10) {
      newErrors.phone = "Valid phone number required (10+ digits)";
    }
    if (baseRate === "" || parseFloat(baseRate) < 0) {
      newErrors.baseRate = "Base rate is required (0 allowed for volunteers)";
    }
    if (halfDayPercentage && (parseFloat(halfDayPercentage) < 0 || parseFloat(halfDayPercentage) > 100)) {
      newErrors.halfDayPercentage = "Must be between 0 and 100";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const updateData = {
      name: name.trim(),
      role: role.trim(),
      phone: phone.trim(),
      salaryType,
      baseRate: parseFloat(baseRate),
      halfDayPercentage: halfDayPercentage ? parseFloat(halfDayPercentage) : undefined,
      notes: notes.trim() || undefined,
      photoData: photoData || undefined,
    };

    if (editMode && data.personId) {
      storage.updatePerson(data.personId, updateData);
      toast({ title: "Staff member updated successfully" });
    } else {
      let accountId: string;
      try {
        accountId = storage.requireActiveAccountId();
      } catch {
        toast({ title: "Error", description: "No active account. Please set up an account first.", variant: "destructive" });
        return;
      }
      storage.addPerson({ ...updateData, accountId, isActive: true });
      toast({ title: "Staff member added successfully" });
    }

    markClean();
    navigate("people");
  };

  const handleHomePress = () => {
    if (isDirty) {
      setShowUnsavedDialog(true);
    } else {
      navigate("home");
    }
  };

  const handleDiscardAndGoHome = () => {
    setShowUnsavedDialog(false);
    markClean();
    navigate("home");
  };

  return (
    <AppLayout>
      <Header
        title="Staff Details"
        subtitle="Fill in the details below"
        onBack={() => navigate("people")}
        onHome={handleHomePress}
      />

      <ScrollContent>
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Basic Information</h2>

          <div className="flex flex-col items-center gap-3">
            <div 
              className="relative w-24 h-24 rounded-full bg-muted flex items-center justify-center cursor-pointer hover-elevate overflow-hidden border-2 border-dashed border-muted-foreground/30"
              onClick={() => setShowPhotoDialog(true)}
              data-testid="button-photo-upload"
            >
              {photoData ? (
                <img src={photoData} alt="Staff photo" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Camera className="w-6 h-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Add Photo</span>
                </div>
              )}
            </div>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => {
                    setPhotoData(reader.result as string);
                    markDirty();
                  };
                  reader.readAsDataURL(file);
                }
                setShowPhotoDialog(false);
              }}
              data-testid="input-camera"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => {
                    setPhotoData(reader.result as string);
                    markDirty();
                  };
                  reader.readAsDataURL(file);
                }
                setShowPhotoDialog(false);
              }}
              data-testid="input-photo-file"
            />
            {photoData && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setPhotoData(null); markDirty(); }}
                data-testid="button-remove-photo"
              >
                Remove Photo
              </Button>
            )}
          </div>

          <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
            <DialogContent className="max-w-xs">
              <DialogHeader>
                <DialogTitle>Add Photo</DialogTitle>
                <DialogDescription>Choose how to add a photo</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3"
                  onClick={() => cameraInputRef.current?.click()}
                  data-testid="button-capture-image"
                >
                  <Camera className="w-5 h-5" />
                  Capture Image
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="button-select-image"
                >
                  <ImageIcon className="w-5 h-5" />
                  Select from Device
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Person/Vendor Name <span className="text-destructive">*</span></Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => { setName(e.target.value); markDirty(); }}
              placeholder="Enter name"
              data-testid="input-name"
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="role">Role/Profession <span className="text-destructive">*</span></Label>
            <Select value={role} onValueChange={(v) => { setRole(v); markDirty(); }}>
              <SelectTrigger id="role" data-testid="select-role">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {STAFF_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && <p className="text-xs text-destructive">{errors.role}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Phone Number <span className="text-destructive">*</span></Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); markDirty(); }}
              placeholder="+1234567890"
              data-testid="input-phone"
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">
            {role === "Laundry" ? "Pay Details" : "Salary Details"}
          </h2>

          {role !== "Laundry" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="salaryType">Salary Type <span className="text-destructive">*</span></Label>
              <Select value={salaryType} onValueChange={(v) => { setSalaryType(v as SalaryType); markDirty(); }}>
                <SelectTrigger id="salaryType" data-testid="select-salary-type">
                  <SelectValue placeholder="Select salary type" />
                </SelectTrigger>
                <SelectContent>
                  {salaryTypes.map((type) => (
                    <SelectItem key={type} value={type}>{SALARY_TYPE_LABELS[type]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">How this person is paid</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="baseRate">
              {role === "Laundry" 
                ? "Minimum Base Rate * (per item or cloth)"
                : `Base Rate * (${salaryType === "MONTHLY" ? "per month" : salaryType === "DAILY" ? "per day" : "per hour"})`
              }
            </Label>
            <Input
              id="baseRate"
              type="number"
              value={baseRate}
              onChange={(e) => { setBaseRate(e.target.value); markDirty(); }}
              placeholder="0.00"
              data-testid="input-base-rate"
            />
            {role === "Laundry" && (
              <p className="text-xs text-muted-foreground">
                Minimum rate per item/cloth for laundry services
              </p>
            )}
            {errors.baseRate && <p className="text-xs text-destructive">{errors.baseRate}</p>}
          </div>

          {role !== "Laundry" && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="halfDayPercentage">Half Day %</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-sm">Percentage of the daily rate paid for half-day work. Default is 50%.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="halfDayPercentage"
                type="number"
                value={halfDayPercentage}
                onChange={(e) => { setHalfDayPercentage(e.target.value); markDirty(); }}
                placeholder="50"
                data-testid="input-half-day"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use global setting (50%)
              </p>
              {errors.halfDayPercentage && (
                <p className="text-xs text-destructive">{errors.halfDayPercentage}</p>
              )}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Additional Notes</h2>
          <Textarea
            value={notes}
            onChange={(e) => { setNotes(e.target.value); markDirty(); }}
            placeholder="Any additional notes..."
            rows={3}
            data-testid="textarea-notes"
          />
        </section>

        <Button className="w-full" onClick={handleSubmit} data-testid="button-save">
          {editMode ? "Update Staff/Vendor" : "Save Staff/Vendor"}
        </Button>
      </ScrollContent>

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onDiscard={handleDiscardAndGoHome}
        onCancel={() => setShowUnsavedDialog(false)}
      />
    </AppLayout>
  );
}
