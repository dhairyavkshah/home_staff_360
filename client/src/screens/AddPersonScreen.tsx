import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Info, Camera, User, ImageIcon, UserCheck, UserPlus, Send, Loader2, CheckCircle } from "lucide-react";
import { collaborationService } from "@/lib/collaboration-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";
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
import { useDirtyForm } from "@/lib/dirty-tracking";
import { 
  salaryTypes, 
  type SalaryType, 
  STAFF_ROLES,
  SALARY_TYPE_LABELS,
  currencies,
  type Currency,
  CURRENCIES,
} from "@shared/schema";
import { useCurrency } from "@/hooks/useCurrency";

export function AddPersonScreen() {
  const { navigate, goBack, data } = useNavigation();
  const { toast } = useToast();
  const { isDirty, markDirty, markClean } = useSimpleDirtyTracker();
  useDirtyForm(isDirty);
  const { getCurrencyInputLabel } = useCurrency();
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
  
  const defaultCurrency = storage.getHomeSettings().currency || "USD";
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [customCurrencySymbol, setCustomCurrencySymbol] = useState("");

  // Phone verification state
  interface PhoneCheckResult {
    exists: boolean;
    isConnected?: boolean;
    displayName?: string;
    userId?: string;
  }
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [phoneCheckResult, setPhoneCheckResult] = useState<PhoneCheckResult | null>(null);
  const [isSendingAction, setIsSendingAction] = useState(false);
  const phoneCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get user profile for display name
  const profile = storage.getProfile();

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
        if (person.currency) {
          setCurrency(person.currency);
          setCustomCurrencySymbol(person.customCurrencySymbol || "");
        }
      }
    }
  }, [editMode, data.personId]);

  // Phone check with debounce
  const checkPhoneNumber = useCallback(async (phoneNumber: string) => {
    const digitsOnly = phoneNumber.replace(/\D/g, "");
    if (digitsOnly.length < 10) {
      setPhoneCheckResult(null);
      return;
    }

    setIsCheckingPhone(true);
    try {
      const token = collaborationService.getToken();
      const response = await fetch(`/api/phone/check?phone=${encodeURIComponent(phoneNumber)}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        setPhoneCheckResult(result);
      } else {
        setPhoneCheckResult(null);
      }
    } catch (error) {
      console.error("Phone check failed:", error);
      setPhoneCheckResult(null);
    } finally {
      setIsCheckingPhone(false);
    }
  }, []);

  useEffect(() => {
    if (phoneCheckTimeoutRef.current) {
      clearTimeout(phoneCheckTimeoutRef.current);
    }

    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.length >= 10) {
      phoneCheckTimeoutRef.current = setTimeout(() => {
        checkPhoneNumber(phone);
      }, 1000);
    } else {
      setPhoneCheckResult(null);
    }

    return () => {
      if (phoneCheckTimeoutRef.current) {
        clearTimeout(phoneCheckTimeoutRef.current);
      }
    };
  }, [phone, checkPhoneNumber]);

  // Handle send connect request
  const handleSendConnectRequest = async () => {
    if (!phoneCheckResult?.userId) return;

    setIsSendingAction(true);
    try {
      const token = collaborationService.getToken();
      const response = await fetch("/api/connections/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          targetUserId: phoneCheckResult.userId,
          requesterName: profile?.displayName || name || "User",
        }),
      });

      if (response.ok) {
        toast({ title: "Connect request sent successfully" });
        setPhoneCheckResult(prev => prev ? { ...prev, isConnected: true } : null);
      } else {
        const error = await response.json().catch(() => ({}));
        toast({ 
          title: "Failed to send connect request", 
          description: error.message || "Please try again",
          variant: "destructive" 
        });
      }
    } catch (error) {
      toast({ 
        title: "Failed to send connect request", 
        description: "Please check your connection and try again",
        variant: "destructive" 
      });
    } finally {
      setIsSendingAction(false);
    }
  };

  // Handle send SMS invite
  const handleSendSmsInvite = async () => {
    setIsSendingAction(true);
    try {
      const token = collaborationService.getToken();
      const response = await fetch("/api/invitations/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          phone: phone.trim(),
          inviterName: profile?.displayName || name || "User",
        }),
      });

      if (response.ok) {
        toast({ title: "SMS invite sent successfully" });
      } else {
        const error = await response.json().catch(() => ({}));
        toast({ 
          title: "Failed to send SMS invite", 
          description: error.message || "Please try again",
          variant: "destructive" 
        });
      }
    } catch (error) {
      toast({ 
        title: "Failed to send SMS invite", 
        description: "Please check your connection and try again",
        variant: "destructive" 
      });
    } finally {
      setIsSendingAction(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = "Name is required";
    if (!role.trim()) newErrors.role = "Role is required";
    if (!phone.trim() || phone.replace(/\D/g, "").length < 10) {
      newErrors.phone = "Valid phone number required (10+ digits)";
    } else {
      // Check for duplicate phone number
      const normalizedPhone = phone.trim().replace(/\D/g, "");
      const existingPeople = storage.getPeople();
      const duplicate = existingPeople.find((p) => {
        // Skip current person in edit mode
        if (editMode && data.personId && p.id === data.personId) return false;
        // Normalize existing phone for comparison
        const existingNormalized = p.phone.replace(/\D/g, "");
        return existingNormalized === normalizedPhone;
      });
      if (duplicate) {
        newErrors.phone = `A staff member with this phone number already exists (${duplicate.name})`;
      }
    }
    const baseRateNum = parseInt(baseRate, 10);
    if (baseRate === "" || isNaN(baseRateNum) || baseRateNum < 1 || !Number.isInteger(parseFloat(baseRate))) {
      newErrors.baseRate = "Base rate must be a positive whole number (no decimals)";
    }
    if (halfDayPercentage && (parseFloat(halfDayPercentage) < 0 || parseFloat(halfDayPercentage) > 100)) {
      newErrors.halfDayPercentage = "Must be between 0 and 100";
    }
    if (currency === "OTHER" && !customCurrencySymbol.trim()) {
      newErrors.customCurrencySymbol = "Custom symbol required for OTHER currency";
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
      baseRate: parseInt(baseRate, 10),
      halfDayPercentage: halfDayPercentage ? parseFloat(halfDayPercentage) : undefined,
      notes: notes.trim() || undefined,
      photoData: photoData || undefined,
      currency,
      customCurrencySymbol: currency === "OTHER" ? customCurrencySymbol.trim() : undefined,
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
          <h2 className="text-base font-semibold">Basic Information</h2>

          <div className="flex flex-col items-center gap-4">
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

          <div className="flex flex-col gap-1">
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

          <div className="flex flex-col gap-1">
            <Label htmlFor="role">Role/Profession <span className="text-destructive">*</span></Label>
            <SearchableSelect
              value={role}
              onValueChange={(v) => { setRole(v); markDirty(); }}
              placeholder="Select role"
              searchPlaceholder="Search roles..."
              emptyMessage="No roles found"
              options={STAFF_ROLES.map((r) => ({
                value: r,
                label: r,
              }))}
              data-testid="select-role"
            />
            {errors.role && <p className="text-xs text-destructive">{errors.role}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="phone">Phone Number <span className="text-destructive">*</span></Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); markDirty(); }}
              placeholder="+91 98765 43210"
              data-testid="input-phone"
            />
            <p className="text-xs text-muted-foreground">
              Include country code (e.g., +91 for India, +1 for USA)
            </p>
            {phone && !phone.trim().startsWith('+') && (
              <p className="text-xs text-destructive">Phone number must start with + and country code</p>
            )}
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            
            {/* Phone verification status */}
            {isCheckingPhone && (
              <div 
                className="flex items-center gap-2 p-3 mt-2 rounded-lg bg-muted/50"
                data-testid="status-phone-checking"
              >
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Checking phone number...</span>
              </div>
            )}
            
            {!isCheckingPhone && phoneCheckResult && (
              <>
                {/* User exists and already connected */}
                {phoneCheckResult.exists && phoneCheckResult.isConnected && (
                  <div 
                    className="flex items-center gap-3 p-3 mt-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900"
                    data-testid="status-already-connected"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50">
                      <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Already Connected</p>
                      {phoneCheckResult.displayName && (
                        <p className="text-xs text-blue-700 dark:text-blue-300 truncate">{phoneCheckResult.displayName}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* User exists but not connected */}
                {phoneCheckResult.exists && !phoneCheckResult.isConnected && (
                  <div 
                    className="flex items-center gap-3 p-3 mt-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900"
                    data-testid="status-user-found"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50">
                      <UserCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">
                        {phoneCheckResult.displayName || "User found"}
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300">Registered on Home Staff 360</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-300 dark:border-green-700 text-green-700 dark:text-green-300"
                      onClick={handleSendConnectRequest}
                      disabled={isSendingAction}
                      data-testid="button-send-connect-request"
                    >
                      {isSendingAction ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-1" />
                          Connect
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* User doesn't exist */}
                {!phoneCheckResult.exists && (
                  <div 
                    className="flex items-center gap-3 p-3 mt-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900"
                    data-testid="status-user-not-found"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50">
                      <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">User not registered</p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">Invite them to Home Staff 360</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                      onClick={handleSendSmsInvite}
                      disabled={isSendingAction}
                      data-testid="button-send-sms-invite"
                    >
                      {isSendingAction ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-1" />
                          Invite
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-base font-semibold">
            {role === "Laundry" ? "Pay Details" : "Salary Details"}
          </h2>

          <div className="flex flex-col gap-1">
            <Label htmlFor="currency">Currency</Label>
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md border">
              <span className="text-sm font-medium" data-testid="display-currency">
                {CURRENCIES[currency]?.symbol} {CURRENCIES[currency]?.name} ({currency})
              </span>
              <span className="text-xs text-muted-foreground ml-auto">(From Settings)</span>
            </div>
            <p className="text-xs text-muted-foreground">Currency is set in Settings and applies to all staff records</p>
          </div>

          {role !== "Laundry" && (
            <div className="flex flex-col gap-1">
              <Label htmlFor="salaryType">Salary Type <span className="text-destructive">*</span></Label>
              <SearchableSelect
                value={salaryType}
                onValueChange={(v) => { setSalaryType(v as SalaryType); markDirty(); }}
                placeholder="Select salary type"
                searchPlaceholder="Search salary types..."
                emptyMessage="No salary types found"
                options={salaryTypes.map((type) => ({
                  value: type,
                  label: SALARY_TYPE_LABELS[type],
                }))}
                data-testid="select-salary-type"
              />
              <p className="text-xs text-muted-foreground">How this person is paid</p>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <Label htmlFor="baseRate">
              {role === "Laundry" 
                ? `Minimum Base Rate (${getCurrencyInputLabel()}) * (per item or cloth)`
                : `Base Rate (${getCurrencyInputLabel()}) * (${salaryType === "MONTHLY" ? "per month" : salaryType === "DAILY" ? "per day" : "per hour"})`
              }
            </Label>
            <Input
              id="baseRate"
              type="number"
              step="1"
              min="1"
              value={baseRate}
              onChange={(e) => { 
                const val = e.target.value.replace(/[^0-9]/g, '');
                setBaseRate(val); 
                markDirty(); 
              }}
              placeholder="500"
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
            <div className="flex flex-col gap-1">
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
          <h2 className="text-base font-semibold">Additional Notes</h2>
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
