import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { UnsavedChangesDialog } from "@/components/UnsavedChangesDialog";
import { useNavigation, useNavigationData } from "@/lib/navigation";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { useSimpleDirtyTracker } from "@/hooks/use-dirty-tracker";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { 
  type SalaryType, 
  STAFF_ROLES, 
  salaryTypes, 
  SALARY_TYPE_LABELS 
} from "@shared/schema";

export function StaffAddClientHomeScreen() {
  const { goBack, navigate } = useNavigation();
  const { toast } = useToast();
  const { t, tLabel } = useTranslation();
  const { isDirty, markDirty, markClean } = useSimpleDirtyTracker();
  const data = useNavigationData<{ clientHomeId?: string }>();
  
  const profile = useMemo(() => storage.getProfile(), []);
  const activeAccountId = useMemo(() => storage.getActiveAccountId(), []);
  const editMode = !!data.clientHomeId;
  const existingHome = useMemo(() => {
    if (!data.clientHomeId) return null;
    return storage.getClientHomes().find(h => h.id === data.clientHomeId);
  }, [data.clientHomeId]);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [role, setRole] = useState("");
  const [salaryType, setSalaryType] = useState<SalaryType>("DAILY");
  const [rate, setRate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sameAsClientName, setSameAsClientName] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

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
    }
  }, [existingHome]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = t("nameRequired");
    if (!role.trim()) newErrors.role = t("roleRequired");
    if (!rate || parseFloat(rate) <= 0) newErrors.rate = t("baseRateRequired");
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

    if (editMode && data.clientHomeId) {
      storage.updateClientHome(data.clientHomeId, {
        name: name.trim(),
        address: address.trim() || undefined,
        contactName: finalContactName || undefined,
        contactPhone: contactPhone.trim() || undefined,
        role: role.trim(),
        salaryType,
        rate: parseFloat(rate),
        isActive,
      });
      toast({ title: t("clientHomeUpdated") });
      markClean();
    } else {
      storage.addClientHome({
        ownerId: activeAccountId,
        name: name.trim(),
        address: address.trim() || undefined,
        contactName: finalContactName || undefined,
        contactPhone: contactPhone.trim() || undefined,
        role: role.trim(),
        salaryType,
        rate: parseFloat(rate),
        isActive,
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
        <div className="flex flex-col gap-2">
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

        <div className="flex flex-col gap-2">
          <Label htmlFor="address">{t("address")}</Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => { setAddress(e.target.value); markDirty(); }}
            placeholder={t("enterAddress")}
            data-testid="input-address"
          />
        </div>

        <div className="flex flex-col gap-2">
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

        <div className="flex flex-col gap-2">
          <Label htmlFor="contactPhone">{t("contactPhone")}</Label>
          <Input
            id="contactPhone"
            value={contactPhone}
            onChange={(e) => { setContactPhone(e.target.value); markDirty(); }}
            placeholder={t("enterContactPhone")}
            data-testid="input-contact-phone"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>{t("yourRole")} <span className="text-destructive">*</span></Label>
          <Select value={role} onValueChange={(v) => { setRole(v); markDirty(); }}>
            <SelectTrigger data-testid="select-role">
              <SelectValue placeholder={t("selectRole")} />
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
          <Label>{t("salaryType")} <span className="text-destructive">*</span></Label>
          <Select value={salaryType} onValueChange={(v) => { setSalaryType(v as SalaryType); markDirty(); }}>
            <SelectTrigger data-testid="select-salary-type">
              <SelectValue placeholder={t("salaryType")} />
            </SelectTrigger>
            <SelectContent>
              {salaryTypes.map((type) => (
                <SelectItem key={type} value={type}>{SALARY_TYPE_LABELS[type]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{t("daily")}, {t("hourly")}, or {t("monthly")}</p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="rate">{t("rate")} <span className="text-destructive">*</span></Label>
          <Input
            id="rate"
            type="number"
            value={rate}
            onChange={(e) => { setRate(e.target.value); markDirty(); }}
            placeholder={salaryType === 'DAILY' ? "500" : salaryType === 'HOURLY' ? "100" : "15000"}
            data-testid="input-rate"
          />
          {errors.rate && <p className="text-xs text-destructive">{errors.rate}</p>}
        </div>

        <div className="flex items-center justify-between p-3 bg-muted rounded-md">
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
