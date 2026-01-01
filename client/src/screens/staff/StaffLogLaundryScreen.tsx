import { useState, useMemo, useEffect } from "react";
import { X, Truck, Shirt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
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
import { QuickAddClothModal } from "@/components/laundry/QuickAddClothModal";
import { currencySymbols, LAUNDRY_SERVICE_TYPES } from "@shared/schema";
import type { LaundryServiceType } from "@shared/schema";

interface LaundryItem {
  id: string;
  type: string;
  quantity: number;
  rate: number;
  subtotal: number;
  details?: string;
}

function generateItemId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function StaffLogLaundryScreen() {
  const { goBack, navigate } = useNavigation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { isDirty, markDirty, markClean } = useSimpleDirtyTracker();
  const data = useNavigationData<{ laundryJobId?: string }>();

  const profile = useMemo(() => storage.getProfile(), []);
  const clientHomes = useMemo(() => storage.getActiveClientHomes(), []);
  const settings = useMemo(() => storage.getSettings(), []);
  const symbol = settings.customCurrencySymbol || currencySymbols[settings.currency];

  const editMode = !!data.laundryJobId;
  const existingJob = useMemo(() => {
    if (!data.laundryJobId) return null;
    return storage.getStaffLaundryJobs().find(j => j.id === data.laundryJobId);
  }, [data.laundryJobId]);

  const today = new Date().toISOString().split('T')[0];
  const [selectedHome, setSelectedHome] = useState<string>("");
  const [date, setDate] = useState(today);
  const [provider, setProvider] = useState("");
  const [serviceType, setServiceType] = useState<LaundryServiceType>("Ironing");
  const [items, setItems] = useState<LaundryItem[]>([]);
  const [pickupDelivery, setPickupDelivery] = useState(false);
  const [pickupDeliveryCharge, setPickupDeliveryCharge] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  const itemsTotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const deliveryCharge = pickupDelivery ? parseFloat(pickupDeliveryCharge) || 0 : 0;
  const total = itemsTotal + deliveryCharge;
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    if (existingJob) {
      setSelectedHome(existingJob.clientHomeId);
      setDate(existingJob.date);
      if (existingJob.note) setProvider(existingJob.note);
      if (existingJob.serviceType) setServiceType(existingJob.serviceType as LaundryServiceType);
      if (existingJob.pickupDelivery) setPickupDelivery(existingJob.pickupDelivery);
      if (existingJob.pickupDeliveryCharge) setPickupDeliveryCharge(existingJob.pickupDeliveryCharge.toString());
      if (existingJob.items && existingJob.items.length > 0) {
        setItems(existingJob.items);
      }
    }
  }, [existingJob]);

  const handleAddItem = (newItem: { type: string; quantity: number; rate: number; details?: string }) => {
    const existingIndex = items.findIndex(i => i.type === newItem.type && i.rate === newItem.rate);
    
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + newItem.quantity,
        subtotal: (updated[existingIndex].quantity + newItem.quantity) * newItem.rate,
      };
      setItems(updated);
    } else {
      const item: LaundryItem = {
        id: generateItemId(),
        type: newItem.type,
        quantity: newItem.quantity,
        rate: newItem.rate,
        subtotal: newItem.quantity * newItem.rate,
        details: newItem.details,
      };
      setItems([...items, item]);
    }
    
    toast({
      title: t("itemAdded") || "Item Added",
      description: `${newItem.quantity}x ${newItem.type}`,
    });
    markDirty();
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter((i) => i.id !== itemId));
    markDirty();
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(itemId);
      return;
    }
    
    setItems(items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity: newQuantity,
          subtotal: newQuantity * item.rate,
        };
      }
      return item;
    }));
    markDirty();
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedHome) newErrors.selectedHome = t("selectClientHome") || "Client Home is required";
    if (!serviceType) newErrors.serviceType = "Service Type is required";
    if (!date) newErrors.date = "Date is required";
    if (items.length === 0) newErrors.items = "Add at least one item";
    if (pickupDelivery && (!pickupDeliveryCharge || parseFloat(pickupDeliveryCharge) <= 0)) {
      newErrors.pickupDeliveryCharge = "Enter a valid pickup/delivery charge";
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
    if (!validate()) return;
    if (!profile) return;

    if (editMode && data.laundryJobId) {
      storage.updateStaffLaundryJob(data.laundryJobId, {
        clientHomeId: selectedHome,
        date,
        itemCount: totalItems,
        ratePerItem: items.length > 0 ? items[0].rate : 0,
        totalEarned: total,
        items: items,
        serviceType,
        pickupDelivery,
        pickupDeliveryCharge: deliveryCharge,
        note: provider.trim() || undefined,
      });
      toast({ title: t("laundryJobUpdated") || "Laundry job updated" });
    } else {
      storage.addStaffLaundryJob({
        staffUserId: profile.id,
        clientHomeId: selectedHome,
        date,
        itemCount: totalItems,
        ratePerItem: items.length > 0 ? items[0].rate : 0,
        totalEarned: total,
        items: items,
        serviceType,
        pickupDelivery,
        pickupDeliveryCharge: deliveryCharge,
        note: provider.trim() || undefined,
      });
      toast({ title: t("laundryJobLogged") });
    }

    markClean();
    navigate("staff-laundry");
  };

  const formatCurrency = (amount: number) => `${symbol}${amount.toLocaleString()}`;

  return (
    <AppLayout>
      <Header
        title="Laundry Details"
        subtitle={t("recordLaundryWork")}
        onBack={() => navigate("staff-laundry")}
        onHome={handleHomePress}
      />

      <ScrollContent className="page-enter">
        <section className="flex flex-col gap-4 fade-in-up">
          <h2 className="text-lg font-semibold">{t("basicInformation") || "Basic Information"}</h2>

          <div className="flex flex-col gap-2">
            <Label htmlFor="clientHome">{t("clientHomes")} <span className="text-destructive">*</span></Label>
            <Select value={selectedHome} onValueChange={(v) => { setSelectedHome(v); markDirty(); }}>
              <SelectTrigger id="clientHome" data-testid="select-client-home">
                <SelectValue placeholder={t("selectClientHome")} />
              </SelectTrigger>
              <SelectContent>
                {clientHomes.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground text-center">
                    {t("noClientHomesFound") || "No client homes found. Add a client home first."}
                  </div>
                ) : (
                  clientHomes.map((home) => (
                    <SelectItem key={home.id} value={home.id}>
                      {home.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.selectedHome && <p className="text-xs text-destructive">{errors.selectedHome}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="date">{t("date")} <span className="text-destructive">*</span></Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); markDirty(); }}
              data-testid="input-date"
            />
            {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
          </div>

        </section>

        <section className="flex flex-col gap-4 fade-in-up" style={{ animationDelay: "50ms" }}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">{t("items") || "Items"}</h2>
            {items.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {totalItems} {t("item") || "item"}{totalItems !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          <div className="flex flex-col gap-2">
            <Label htmlFor="serviceType">{t("serviceType") || "Service Type"} <span className="text-destructive">*</span></Label>
            <Select value={serviceType} onValueChange={(v) => { setServiceType(v as LaundryServiceType); markDirty(); }}>
              <SelectTrigger id="serviceType" data-testid="select-service-type">
                <SelectValue placeholder={t("selectServiceType") || "Select service type"} />
              </SelectTrigger>
              <SelectContent>
                {LAUNDRY_SERVICE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.serviceType && <p className="text-xs text-destructive">{errors.serviceType}</p>}
          </div>

          {errors.items && <p className="text-xs text-destructive">{errors.items}</p>}

          {items.length > 0 && (
            <Card className="divide-y">
              {items.map((item) => (
                <div key={item.id} className="p-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Shirt className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(item.rate)} {t("each") || "each"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        data-testid={`button-qty-minus-${item.id}`}
                      >
                        <span className="text-lg font-medium">-</span>
                      </Button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        data-testid={`button-qty-plus-${item.id}`}
                      >
                        <span className="text-lg font-medium">+</span>
                      </Button>
                    </div>
                    <span className="font-medium w-20 text-right">
                      {formatCurrency(item.subtotal)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(item.id)}
                      data-testid={`button-remove-${item.id}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </Card>
          )}

          <Button
            variant="outline"
            onClick={() => setShowAddModal(true)}
            className="w-full button-press border-dashed"
            data-testid="button-add-cloth"
          >
            <span className="mr-2">+</span>
            {t("addCloth") || "Add Cloth"}
          </Button>
        </section>

        <section className="flex flex-col gap-4 fade-in-up" style={{ animationDelay: "100ms" }}>
          <h2 className="text-lg font-semibold">{t("additionalServices") || "Additional Services"}</h2>

          <Card className="p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{t("pickupDelivery") || "Pick-up & Delivery"}</p>
                  <p className="text-sm text-muted-foreground">{t("addAdditionalCharges") || "Add additional charges"}</p>
                </div>
              </div>
              <Switch
                checked={pickupDelivery}
                onCheckedChange={(v) => { setPickupDelivery(v); markDirty(); }}
                data-testid="switch-pickup-delivery"
              />
            </div>

            {pickupDelivery && (
              <div className="flex flex-col gap-2 pt-2 border-t">
                <Label htmlFor="deliveryCharge">{t("pickupDeliveryCharge") || "Pick-up & Delivery Charge"} <span className="text-destructive">*</span></Label>
                <Input
                  id="deliveryCharge"
                  type="number"
                  min="0"
                  step="0.01"
                  value={pickupDeliveryCharge}
                  onChange={(e) => { setPickupDeliveryCharge(e.target.value); markDirty(); }}
                  placeholder={t("enterChargeAmount") || "Enter charge amount"}
                  data-testid="input-delivery-charge"
                />
                {errors.pickupDeliveryCharge && (
                  <p className="text-xs text-destructive">{errors.pickupDeliveryCharge}</p>
                )}
              </div>
            )}
          </Card>
        </section>

        <Card className="p-4 bg-primary/5 border-primary/20 fade-in-up" style={{ animationDelay: "150ms" }}>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("items") || "Items"} ({totalItems})</span>
              <span>{formatCurrency(itemsTotal)}</span>
            </div>
            {pickupDelivery && deliveryCharge > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("pickupDelivery") || "Pick-up & Delivery"}</span>
                <span>{formatCurrency(deliveryCharge)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="font-semibold">{t("totalEarnings") || "Total Earnings"}</span>
              <span className="text-xl font-bold">{formatCurrency(total)}</span>
            </div>
          </div>
        </Card>

        <Button className="w-full button-press" onClick={handleSave} data-testid="button-save">
          {editMode ? t("update") : t("logLaundryJob")}
        </Button>
      </ScrollContent>

      <QuickAddClothModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onAddItem={handleAddItem}
        currencySymbol={symbol}
        defaultRate={10}
        keepOpenAfterAdd={true}
      />

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onDiscard={handleDiscardAndGoHome}
        onCancel={() => setShowUnsavedDialog(false)}
      />
    </AppLayout>
  );
}
