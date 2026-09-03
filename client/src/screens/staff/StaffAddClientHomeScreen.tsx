import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { PhoneNumberInput } from "@/components/ui/phone-number-input";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { UnsavedChangesDialog } from "@/components/UnsavedChangesDialog";
import { useNavigation, useNavigationData } from "@/lib/navigation";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { useSimpleDirtyTracker } from "@/hooks/use-dirty-tracker";
import { useDirtyForm } from "@/lib/dirty-tracking";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { combinePhoneNumber, parseFullPhoneNumber, getDefaultCountryCode } from "@/lib/phone-utils";
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
  const [countryCode, setCountryCode] = useState(getDefaultCountryCode());
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneValid, setPhoneValid] = useState(false);
  const [role, setRole] = useState(isLaundryBusiness ? "Laundry" : "");
  const [salaryType, setSalaryType] = useState<SalaryType>("DAILY");
  const [rate, setRate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sameAsClientName, setSameAsClientName] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  
  const defaultCurrency = storage.getStaffSettings().currency || "USD";
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [customCurrencySymbol, setCustomCurrencySymbol] = useState("");

  const getFullPhoneNumber = useCallback(() => {
    return combinePhoneNumber(countryCode, phoneNumber);
  }, [countryCode, phoneNumber]);

  const handlePhoneValidationChange = useCallback((isValid: boolean) => {
    setPhoneValid(isValid);
  }, []);

  useEffect(() => {
    if (existingHome) {
      setName(existingHome.name);
      setAddress(existingHome.address || "");
      setContactName(existingHome.contactName || "");
      if (existingHome.contactPhone) {
        const parsedPhone = parseFullPhoneNumber(existingHome.contactPhone);
        if (parsedPhone) {
          setCountryCode(parsedPhone.countryCode);
          setPhoneNumber(parsedPhone.phoneNumber);
        }
      }
      setRole(existingHome.role);
      setSalaryType(existingHome.salaryType);
      setRate(existingHome.rate.toString());
      setIsActive(existingHome.isActive);
      setSameAsClientName(existingHome.contactName === existingHome.name || !existingHome.contactName);
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
    // Validate phone number if provided
    if (phoneNumber.trim() && !phoneValid) {
      newErrors.contactPhone = "Please enter a valid phone number";
    } else if (phoneNumber.trim() && phoneValid) {
      // Check for duplicate phone number among client homes
      const fullPhone = getFullPhoneNumber();
      const normalizedPhone = fullPhone.replace(/\D/g, "");
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

    const fullPhoneValue = phoneNumber.trim() ? getFullPhoneNumber() : undefined;
    
    if (editMode && data.clientHomeId) {
      storage.updateClientHome(data.clientHomeId, {
        name: name.trim(),
        address: address.trim() || undefined,
        contactName: finalContactName || undefined,
        contactPhone: fullPhoneValue,
        role: role.trim(),
        salaryType,
        rate: parseInt(rate, 10),
        isActive,
        currency,
        customCurrencySymbol: currency === "OTHER" ? customCurrencySymbol.trim() : undefined,
      });
      toast({ title: t("clientHomeUpdated"), variant: "success" });
      markClean();
    } else {
      storage.addClientHome({
        ownerId: activeAccountId,
        name: name.trim(),
        address: address.trim() || undefined,
        contactName: finalContactName || undefined,
        contactPhone: fullPhoneValue,
        role: role.trim(),
        salaryType,
        rate: parseInt(rate, 10),
        isActive,
        currency,
        customCurrencySymbol: currency === "OTHER" ? customCurrencySymbol.trim() : undefined,
      });
      toast({ title: t("clientHomeAdded"), variant: "success" });
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
          <PhoneNumberInput
            countryCode={countryCode}
            phoneNumber={phoneNumber}
            onCountryCodeChange={(code) => { setCountryCode(code); markDirty(); }}
            onPhoneNumberChange={(num) => { setPhoneNumber(num); markDirty(); }}
            onValidationChange={handlePhoneValidationChange}
            label={t("contactPhone")}
            testIdPrefix="client-phone"
          />
          {errors.contactPhone && <p className="text-xs text-destructive">{errors.contactPhone}</p>}
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
