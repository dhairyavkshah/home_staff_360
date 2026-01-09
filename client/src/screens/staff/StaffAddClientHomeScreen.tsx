import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { UnsavedChangesDialog } from "@/components/UnsavedChangesDialog";
import { useNavigation, useNavigationData } from "@/lib/navigation";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { useSimpleDirtyTracker } from "@/hooks/use-dirty-tracker";
import { useDirtyForm } from "@/lib/dirty-tracking";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { collaborationService } from "@/lib/collaboration-service";
import { UserCheck, UserPlus, Send, Loader2, CheckCircle } from "lucide-react";
import { 
  type SalaryType, 
  STAFF_ROLES, 
  salaryTypes, 
  SALARY_TYPE_LABELS,
  currencies,
  type Currency,
  CURRENCIES,
} from "@shared/schema";
import { useCurrency } from "@/hooks/useCurrency";

interface PhoneCheckResult {
  exists: boolean;
  isConnected?: boolean;
  displayName?: string;
  userId?: string;
}

export function StaffAddClientHomeScreen() {
  const { goBack, navigate } = useNavigation();
  const { toast } = useToast();
  const { t, tLabel } = useTranslation();
  const { isDirty, markDirty, markClean } = useSimpleDirtyTracker();
  useDirtyForm(isDirty);
  const { getCurrencyInputLabel } = useCurrency();
  const data = useNavigationData<{ clientHomeId?: string }>();
  
  const profile = useMemo(() => storage.getProfile(), []);
  const activeAccountId = useMemo(() => storage.getActiveAccountId(), []);
  const activeAccount = useMemo(() => {
    if (!activeAccountId) return null;
    return storage.getAccounts().find(a => a.id === activeAccountId) || null;
  }, [activeAccountId]);
  const isLaundryBusiness = activeAccount?.profession === 'Laundry Service';
  const editMode = !!data.clientHomeId;
  const existingHome = useMemo(() => {
    if (!data.clientHomeId) return null;
    return storage.getClientHomes().find(h => h.id === data.clientHomeId);
  }, [data.clientHomeId]);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [role, setRole] = useState(isLaundryBusiness ? "Laundry" : "");
  const [salaryType, setSalaryType] = useState<SalaryType>("DAILY");
  const [rate, setRate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sameAsClientName, setSameAsClientName] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [noContactPhone, setNoContactPhone] = useState(false);
  
  const defaultCurrency = storage.getStaffSettings().currency || "USD";
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [customCurrencySymbol, setCustomCurrencySymbol] = useState("");

  const [phoneCheckResult, setPhoneCheckResult] = useState<PhoneCheckResult | null>(null);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const phoneCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckedPhoneRef = useRef<string>("");

  const cleanPhoneNumber = (phone: string): string => {
    return phone.replace(/\D/g, "");
  };

  const checkPhoneNumber = useCallback(async (phone: string) => {
    const cleanedPhone = cleanPhoneNumber(phone);
    if (cleanedPhone.length < 10) {
      setPhoneCheckResult(null);
      return;
    }

    if (cleanedPhone === lastCheckedPhoneRef.current) {
      return;
    }

    lastCheckedPhoneRef.current = cleanedPhone;
    setIsCheckingPhone(true);
    setPhoneCheckResult(null);

    try {
      const token = collaborationService.getToken();
      const response = await fetch(`/api/phone/check?phone=${encodeURIComponent(phone)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error("Failed to check phone");
      }

      const data = await response.json();
      setPhoneCheckResult({
        exists: data.exists,
        isConnected: data.isConnected,
        displayName: data.displayName,
        userId: data.userId,
      });
    } catch (error) {
      console.error("Phone check error:", error);
      setPhoneCheckResult(null);
    } finally {
      setIsCheckingPhone(false);
    }
  }, []);

  const handlePhoneChange = (value: string) => {
    setContactPhone(value);
    markDirty();
    
    if (phoneCheckTimeoutRef.current) {
      clearTimeout(phoneCheckTimeoutRef.current);
    }

    // Clear any self-phone error when typing
    if (errors.contactPhone === "You cannot add yourself as a client") {
      setErrors(prev => {
        const { contactPhone, ...rest } = prev;
        return rest;
      });
    }

    const cleanedPhone = cleanPhoneNumber(value);
    
    // Check if this is the user's own phone number
    const profilePhone = profile?.phone ? cleanPhoneNumber(profile.phone) : "";
    if (cleanedPhone.length >= 10 && profilePhone && cleanedPhone === profilePhone) {
      setErrors(prev => ({ ...prev, contactPhone: "You cannot add yourself as a client" }));
      setPhoneCheckResult(null);
      lastCheckedPhoneRef.current = "";
      return;
    }

    // Skip phone check if noContactPhone is checked
    if (noContactPhone) {
      setPhoneCheckResult(null);
      lastCheckedPhoneRef.current = "";
      return;
    }

    if (cleanedPhone.length >= 10) {
      phoneCheckTimeoutRef.current = setTimeout(() => {
        checkPhoneNumber(value);
      }, 1000);
    } else {
      setPhoneCheckResult(null);
      lastCheckedPhoneRef.current = "";
    }
  };

  const handleNoContactPhoneChange = (checked: boolean) => {
    setNoContactPhone(checked);
    markDirty();
    if (checked) {
      setContactPhone("");
      setPhoneCheckResult(null);
      lastCheckedPhoneRef.current = "";
      // Clear any phone-related errors
      setErrors(prev => {
        const { contactPhone, ...rest } = prev;
        return rest;
      });
    }
  };

  const handlePhoneBlur = () => {
    if (phoneCheckTimeoutRef.current) {
      clearTimeout(phoneCheckTimeoutRef.current);
    }
    // Skip phone check if noContactPhone is checked or if self-phone error exists
    if (noContactPhone || errors.contactPhone === "You cannot add yourself as a client") {
      return;
    }
    const cleanedPhone = cleanPhoneNumber(contactPhone);
    if (cleanedPhone.length >= 10) {
      checkPhoneNumber(contactPhone);
    }
  };

  const handleSendConnectRequest = async () => {
    if (!phoneCheckResult?.userId || !profile?.displayName) return;

    setIsSendingRequest(true);
    try {
      const token = collaborationService.getToken();
      const response = await fetch("/api/connections/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          targetUserId: phoneCheckResult.userId,
          requesterName: profile.displayName,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to send connect request");
      }

      toast({ title: "Connect request sent successfully" });
      setPhoneCheckResult((prev) => prev ? { ...prev, isConnected: true } : null);
    } catch (error) {
      toast({
        title: "Failed to send connect request",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleSendSmsInvite = async () => {
    if (!contactPhone || !profile?.displayName) return;

    setIsSendingInvite(true);
    try {
      const token = collaborationService.getToken();
      const response = await fetch("/api/invitations/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          phone: contactPhone,
          inviterName: profile.displayName,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to send SMS invite");
      }

      toast({ title: "SMS invitation sent successfully" });
    } catch (error) {
      toast({
        title: "Failed to send SMS invite",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSendingInvite(false);
    }
  };

  useEffect(() => {
    return () => {
      if (phoneCheckTimeoutRef.current) {
        clearTimeout(phoneCheckTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (existingHome) {
      setName(existingHome.name);
      setAddress(existingHome.address || "");
      setContactName(existingHome.contactName || "");
      setContactPhone(existingHome.contactPhone || "");
      setRole(existingHome.role);
      setSalaryType(existingHome.salaryType);
      setRate(existingHome.rate.toString());
      setIsActive(existingHome.isActive);
      setSameAsClientName(existingHome.contactName === existingHome.name || !existingHome.contactName);
      // Set noContactPhone to true if existing client has no phone
      setNoContactPhone(!existingHome.contactPhone);
      if (existingHome.currency) {
        setCurrency(existingHome.currency);
        setCustomCurrencySymbol(existingHome.customCurrencySymbol || "");
      }
    }
  }, [existingHome]);

  // Auto-set role to "Laundry" for Laundry Service businesses in create mode
  // Reset to empty when switching away from Laundry Service business
  useEffect(() => {
    if (!editMode) {
      if (isLaundryBusiness) {
        setRole("Laundry");
      } else {
        // Only reset if role was auto-set to Laundry and account is no longer laundry business
        setRole(prev => prev === "Laundry" ? "" : prev);
      }
    }
  }, [editMode, isLaundryBusiness]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = t("nameRequired");
    if (!role.trim()) newErrors.role = t("roleRequired");
    const rateNum = parseInt(rate, 10);
    if (!rate || isNaN(rateNum) || rateNum < 1 || !Number.isInteger(parseFloat(rate))) {
      newErrors.rate = "Rate must be a positive whole number (no decimals)";
    }
    if (currency === "OTHER" && !customCurrencySymbol.trim()) {
      newErrors.customCurrencySymbol = "Custom symbol required";
    }
    // Skip phone validation if noContactPhone is checked
    if (!noContactPhone && contactPhone.trim()) {
      const normalizedPhone = contactPhone.trim().replace(/\D/g, "");
      if (normalizedPhone.length >= 10) {
        // Check if this is the user's own phone number
        const profilePhone = profile?.phone ? cleanPhoneNumber(profile.phone) : "";
        if (profilePhone && normalizedPhone === profilePhone) {
          newErrors.contactPhone = "You cannot add yourself as a client";
        } else {
          // Check for duplicate phone number among client homes
          const existingHomes = storage.getClientHomes();
          const duplicate = existingHomes.find((h) => {
            // Skip current client in edit mode
            if (editMode && data.clientHomeId && h.id === data.clientHomeId) return false;
            // Normalize existing phone for comparison
            const existingNormalized = (h.contactPhone || "").replace(/\D/g, "");
            return existingNormalized === normalizedPhone;
          });
          if (duplicate) {
            newErrors.contactPhone = `A client with this phone number already exists (${duplicate.name})`;
          }
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleHomePress = () => {
    if (isDirty) {
      setShowUnsavedDialog(true);
    } else {
      navigate("staff-home");
    }
  };

  const handleDiscardAndGoHome = () => {
    setShowUnsavedDialog(false);
    markClean();
    navigate("staff-home");
  };

  const handleSave = () => {
    if (!validate() || !profile || !activeAccountId) return;

    const finalContactName = sameAsClientName ? name.trim() : contactName.trim();
    // When noContactPhone is checked, save phone as undefined (no phone)
    const finalContactPhone = noContactPhone ? undefined : (contactPhone.trim() || undefined);

    if (editMode && data.clientHomeId) {
      storage.updateClientHome(data.clientHomeId, {
        name: name.trim(),
        address: address.trim() || undefined,
        contactName: finalContactName || undefined,
        contactPhone: finalContactPhone,
        role: role.trim(),
        salaryType,
        rate: parseInt(rate, 10),
        isActive,
        currency,
        customCurrencySymbol: currency === "OTHER" ? customCurrencySymbol.trim() : undefined,
      });
      toast({ title: t("clientHomeUpdated") });
      markClean();
    } else {
      storage.addClientHome({
        ownerId: activeAccountId,
        name: name.trim(),
        address: address.trim() || undefined,
        contactName: finalContactName || undefined,
        contactPhone: finalContactPhone,
        role: role.trim(),
        salaryType,
        rate: parseInt(rate, 10),
        isActive,
        currency,
        customCurrencySymbol: currency === "OTHER" ? customCurrencySymbol.trim() : undefined,
      });
      toast({ title: t("clientHomeAdded") });
      markClean();
    }

    navigate("staff-client-homes");
  };

  return (
    <AppLayout>
      <Header
        title={tLabel("clientDetails", "Client Details")}
        subtitle={t("addNewClient")}
        onBack={() => navigate("staff-client-homes")}
        onHome={handleHomePress}
      />

      <ScrollContent>
        <div className="flex flex-col gap-4">
          <Label htmlFor="name">{tLabel("clientName", "Client Name")} <span className="text-destructive">*</span></Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => { setName(e.target.value); markDirty(); }}
            placeholder={tLabel("enterClientName", "e.g., Smith Family")}
            data-testid="input-name"
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        <div className="flex flex-col gap-4">
          <Label htmlFor="address">{t("address")}</Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => { setAddress(e.target.value); markDirty(); }}
            placeholder={t("enterAddress")}
            data-testid="input-address"
          />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="contactName">{t("contactName")}</Label>
            <div className="flex items-center gap-2">
              <Checkbox
                id="sameAsClientName"
                checked={sameAsClientName}
                onCheckedChange={(checked) => { setSameAsClientName(checked === true); markDirty(); }}
                data-testid="checkbox-same-as-client"
              />
              <Label htmlFor="sameAsClientName" className="text-sm font-normal cursor-pointer">
                {tLabel("sameAsClientName", "Same as Client Name")}
              </Label>
            </div>
          </div>
          <Input
            id="contactName"
            value={sameAsClientName ? name : contactName}
            onChange={(e) => { setContactName(e.target.value); markDirty(); }}
            placeholder={t("enterContactName")}
            disabled={sameAsClientName}
            data-testid="input-contact-name"
          />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="contactPhone">{t("contactPhone")}</Label>
            <div className="flex items-center gap-2">
              <Checkbox
                id="noContactPhone"
                checked={noContactPhone}
                onCheckedChange={(checked) => handleNoContactPhoneChange(checked === true)}
                data-testid="checkbox-no-phone"
              />
              <Label htmlFor="noContactPhone" className="text-sm font-normal cursor-pointer">
                {tLabel("noPhone", "No phone")}
              </Label>
            </div>
          </div>
          <Input
            id="contactPhone"
            value={contactPhone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            onBlur={handlePhoneBlur}
            placeholder="+91 98765 43210"
            disabled={noContactPhone}
            className={noContactPhone ? "bg-muted text-muted-foreground" : ""}
            data-testid="input-contact-phone"
          />
          {!noContactPhone && (
            <p className="text-xs text-muted-foreground">
              Include country code (e.g., +91 for India, +1 for USA)
            </p>
          )}
          {noContactPhone && (
            <p className="text-xs text-muted-foreground">Phone number not available for this client</p>
          )}
          {errors.contactPhone && (
            <p className="text-xs text-destructive" data-testid="error-contact-phone">{errors.contactPhone}</p>
          )}
          {!noContactPhone && contactPhone && !contactPhone.trim().startsWith('+') && !errors.contactPhone && (
            <p className="text-xs text-destructive">Phone number must start with + and country code</p>
          )}
          
          {!noContactPhone && isCheckingPhone && (
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg" data-testid="status-phone-checking">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Checking phone number...</span>
            </div>
          )}

          {!noContactPhone && !isCheckingPhone && phoneCheckResult && (
            <>
              {phoneCheckResult.exists && phoneCheckResult.isConnected && (
                <div 
                  className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg"
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

              {phoneCheckResult.exists && !phoneCheckResult.isConnected && (
                <div 
                  className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg"
                  data-testid="status-user-found"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50">
                    <UserPlus className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">
                      {phoneCheckResult.displayName || "Registered User"}
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300">Available to connect</p>
                  </div>
                  <Button
                    size="sm"
                    variant="default"
                    className="bg-green-600 hover:bg-green-700 text-white shrink-0"
                    onClick={handleSendConnectRequest}
                    disabled={isSendingRequest}
                    data-testid="button-send-connect-request"
                  >
                    {isSendingRequest ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4 mr-1" />
                        Connect
                      </>
                    )}
                  </Button>
                </div>
              )}

              {!phoneCheckResult.exists && (
                <div 
                  className="flex items-center gap-3 p-3 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-lg"
                  data-testid="status-user-not-found"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/50">
                    <Send className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-sky-900 dark:text-sky-100">User not registered</p>
                    <p className="text-xs text-sky-700 dark:text-sky-300">Send an SMS invite</p>
                  </div>
                  <Button
                    size="sm"
                    variant="default"
                    className="bg-sky-600 hover:bg-sky-700 text-white shrink-0"
                    onClick={handleSendSmsInvite}
                    disabled={isSendingInvite}
                    data-testid="button-send-sms-invite"
                  >
                    {isSendingInvite ? (
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

        <div className="flex flex-col gap-4">
          <Label>{t("yourRole")} <span className="text-destructive">*</span></Label>
          <SearchableSelect
            value={role}
            onValueChange={(v) => { setRole(v); markDirty(); }}
            disabled={isLaundryBusiness && !editMode}
            placeholder={t("selectRole")}
            searchPlaceholder="Search roles..."
            emptyMessage="No roles found"
            options={STAFF_ROLES.map((r) => ({ value: r, label: r }))}
            data-testid="select-role"
          />
          {isLaundryBusiness && !editMode && (
            <p className="text-xs text-muted-foreground">{t("roleAutoSetForLaundry") || "Role is automatically set for Laundry Service businesses"}</p>
          )}
          {errors.role && <p className="text-xs text-destructive">{errors.role}</p>}
        </div>

        <div className="flex flex-col gap-4">
          <Label>{t("currency")}</Label>
          <div className="flex items-center gap-2 p-2 bg-muted rounded-md border">
            <span className="text-sm font-medium" data-testid="display-currency">
              {CURRENCIES[currency]?.symbol} {CURRENCIES[currency]?.name} ({currency})
            </span>
            <span className="text-xs text-muted-foreground ml-auto">{tLabel("fromSettings", "(From Settings)")}</span>
          </div>
          <p className="text-xs text-muted-foreground">{tLabel("currencySetInSettings", "Currency is set in Settings and applies to all client records")}</p>
        </div>

        {role !== 'Laundry' && (
          <div className="flex flex-col gap-4">
            <Label>{t("salaryType")} <span className="text-destructive">*</span></Label>
            <SearchableSelect
              value={salaryType}
              onValueChange={(v) => { setSalaryType(v as SalaryType); markDirty(); }}
              placeholder={t("salaryType")}
              searchPlaceholder="Search salary types..."
              emptyMessage="No salary types found"
              options={salaryTypes.map((type) => ({ value: type, label: SALARY_TYPE_LABELS[type] }))}
              data-testid="select-salary-type"
            />
            <p className="text-xs text-muted-foreground">{t("daily")}, {t("hourly")}, or {t("monthly")}</p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <Label htmlFor="rate">
            {role === 'Laundry' ? `${tLabel("ratePerItem", "Rate")} (${getCurrencyInputLabel()})` : `${t("rate")} (${getCurrencyInputLabel()})`} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="rate"
            type="number"
            step="1"
            min="1"
            value={rate}
            onChange={(e) => { 
              const val = e.target.value.replace(/[^0-9]/g, '');
              setRate(val); 
              markDirty(); 
            }}
            placeholder={role === 'Laundry' ? "10" : (salaryType === 'DAILY' ? "500" : salaryType === 'HOURLY' ? "100" : "15000")}
            data-testid="input-rate"
          />
          {role === 'Laundry' && (
            <p className="text-xs text-muted-foreground">Rate charged per laundry item</p>
          )}
          {errors.rate && <p className="text-xs text-destructive">{errors.rate}</p>}
        </div>

        <div className="flex items-center justify-between p-4 bg-muted rounded-md">
          <div>
            <p className="font-medium">{t("activeClient")}</p>
            <p className="text-sm text-muted-foreground">{t("currentlyWorkingHere")}</p>
          </div>
          <Switch
            checked={isActive}
            onCheckedChange={(checked) => { setIsActive(checked); markDirty(); }}
            data-testid="switch-active"
          />
        </div>

        <Button className="w-full" onClick={handleSave} data-testid="button-save">
          {editMode ? t("update") : t("addClientHome")}
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
