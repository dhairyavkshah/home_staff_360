import { useState, useMemo, useEffect } from "react";
import { X, FileText, Truck, Info, Edit2, Shirt } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { UnsavedChangesDialog } from "@/components/UnsavedChangesDialog";
import { useNavigation, useNavigationData } from "@/lib/navigation";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { useSimpleDirtyTracker } from "@/hooks/use-dirty-tracker";
import { useActiveContext } from "@/hooks/use-active-context";
import { getTodayString, formatCurrency } from "@/lib/calculations";
import { QuickAddClothModal } from "@/components/laundry/QuickAddClothModal";
import { LAUNDRY_SERVICE_TYPES, type LaundryItem, type LaundryServiceType, currencySymbols } from "@shared/schema";

function generateItemId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function AddLaundryScreen() {
  const { navigate, goBack } = useNavigation();
  const navData = useNavigationData<{ laundryId?: string }>();
  const { toast } = useToast();
  const { isDirty, markDirty, markClean } = useSimpleDirtyTracker();
  const { contextLabel, contextMode } = useActiveContext();
  const settings = useMemo(() => storage.getSettings(), []);
  const symbol = settings.customCurrencySymbol || currencySymbols[settings.currency];
  
  const isEditMode = !!navData.laundryId;
  
  const [serviceType, setServiceType] = useState<LaundryServiceType>("Ironing");
  const [date, setDate] = useState(getTodayString());
  const [provider, setProvider] = useState("");
  const [items, setItems] = useState<LaundryItem[]>([]);
  const [pickupDelivery, setPickupDelivery] = useState(false);
  const [pickupDeliveryCharge, setPickupDeliveryCharge] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<LaundryItem | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  useEffect(() => {
    if (navData.laundryId && !isLoaded) {
      const existingBatch = storage.getLaundryById(navData.laundryId);
      if (existingBatch) {
        setServiceType((existingBatch.serviceType as LaundryServiceType) || "Ironing");
        setDate(existingBatch.date);
        setProvider(existingBatch.provider || "");
        setItems(existingBatch.items || []);
        setPickupDelivery(!!existingBatch.pickupDelivery);
        setPickupDeliveryCharge(existingBatch.pickupDeliveryCharge?.toString() || "");
      }
      setIsLoaded(true);
    }
  }, [navData.laundryId, isLoaded]);

  const itemsTotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const deliveryCharge = pickupDelivery ? parseFloat(pickupDeliveryCharge) || 0 : 0;
  const total = itemsTotal + deliveryCharge;
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  
  const defaultBaseRate = 10;

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
      title: "Item Added",
      description: `${newItem.quantity}x ${newItem.type}`,
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter((i) => i.id !== itemId));
  };

  const handleEditItem = (item: LaundryItem) => {
    setEditingItem(item);
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
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!serviceType) newErrors.serviceType = "Service Type is required";
    if (!date) newErrors.date = "Date is required";
    if (items.length === 0) newErrors.items = "Add at least one item";
    if (pickupDelivery && (!pickupDeliveryCharge || parseFloat(pickupDeliveryCharge) <= 0)) {
      newErrors.pickupDeliveryCharge = "Enter a valid pickup/delivery charge";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    let accountId: string;
    try {
      accountId = storage.requireActiveAccountId();
    } catch {
      toast({ title: "Error", description: "No active account. Please set up an account first.", variant: "destructive" });
      return;
    }
    
    const laundryData = {
      provider: provider.trim() || undefined,
      serviceType: serviceType as typeof LAUNDRY_SERVICE_TYPES[number],
      date,
      items,
      pickupDelivery,
      pickupDeliveryCharge: pickupDelivery ? deliveryCharge : undefined,
      itemsTotal,
      total,
      accountId,
      isPaid: false,
    };

    if (isEditMode && navData.laundryId) {
      storage.updateLaundry(navData.laundryId, laundryData);
      toast({ title: "Laundry batch updated successfully" });
    } else {
      storage.addLaundry(laundryData);
      toast({ title: "Laundry batch added successfully" });
    }
    markClean();
    navigate("laundry-view");
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
        title="Laundry Details"
        subtitle="Record laundry service"
        onBack={() => navigate("laundry-view")}
        onHome={handleHomePress}
        contextLabel={contextLabel}
        contextMode={contextMode}
      />

      <ScrollContent className="page-enter">
        <section className="flex flex-col gap-4 fade-in-up">
          <h2 className="text-lg font-semibold">Basic Information</h2>

          <div className="flex flex-col gap-2">
            <Label htmlFor="date">Date <span className="text-destructive">*</span></Label>
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
            <h2 className="text-lg font-semibold">Items</h2>
            {items.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {totalItems} item{totalItems !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1">
              <Label htmlFor="serviceType">Service Type <span className="text-destructive">*</span></Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-sm">Type of laundry service being provided for this batch.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select value={serviceType} onValueChange={(v) => { setServiceType(v as LaundryServiceType); markDirty(); }}>
              <SelectTrigger id="serviceType" data-testid="select-service-type">
                <SelectValue placeholder="Select service type" />
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
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="icon-halo-primary w-9 h-9 flex-shrink-0">
                      <Shirt className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(item.rate, settings.currency, settings.customCurrencySymbol)} each
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        data-testid={`button-qty-minus-${item.id}`}
                      >
                        -
                      </Button>
                      <span className="w-6 text-center font-semibold text-sm">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        data-testid={`button-qty-plus-${item.id}`}
                      >
                        +
                      </Button>
                    </div>
                    <span className="font-medium w-20 text-right">
                      {formatCurrency(item.subtotal, settings.currency, settings.customCurrencySymbol)}
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
            Add Cloth
          </Button>
        </section>

        <section className="flex flex-col gap-4 fade-in-up" style={{ animationDelay: "100ms" }}>
          <h2 className="text-lg font-semibold">Additional Services</h2>

          <Card className="p-3 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="icon-halo-muted w-9 h-9">
                  <Truck className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">Pick-up & Delivery</p>
                  <p className="text-xs text-muted-foreground">Add additional charges</p>
                </div>
              </div>
              <Switch
                checked={pickupDelivery}
                onCheckedChange={(checked) => { setPickupDelivery(checked); markDirty(); }}
                data-testid="switch-pickup-delivery"
              />
            </div>

            {pickupDelivery && (
              <div className="flex flex-col gap-2 pt-3 border-t">
                <Label htmlFor="deliveryCharge" className="text-sm">Pick-up & Delivery Charge <span className="text-destructive">*</span></Label>
                <Input
                  id="deliveryCharge"
                  type="number"
                  min="0"
                  step="0.01"
                  value={pickupDeliveryCharge}
                  onChange={(e) => { setPickupDeliveryCharge(e.target.value); markDirty(); }}
                  placeholder="Enter charge amount"
                  data-testid="input-delivery-charge"
                />
                {errors.pickupDeliveryCharge && (
                  <p className="text-xs text-destructive">{errors.pickupDeliveryCharge}</p>
                )}
              </div>
            )}
          </Card>
        </section>

        <Card className="p-3 bg-primary/5 border-primary/20 fade-in-up" style={{ animationDelay: "150ms" }}>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Items ({totalItems})</span>
              <span>{formatCurrency(itemsTotal, settings.currency, settings.customCurrencySymbol)}</span>
            </div>
            {pickupDelivery && deliveryCharge > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pick-up & Delivery</span>
                <span>{formatCurrency(deliveryCharge, settings.currency, settings.customCurrencySymbol)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-bold">
                {formatCurrency(total, settings.currency, settings.customCurrencySymbol)}
              </span>
            </div>
          </div>
        </Card>

        <Button className="w-full button-press" onClick={handleSubmit} data-testid="button-save">
          {isEditMode ? "Update Laundry Batch" : "Save Laundry Batch"}
        </Button>
      </ScrollContent>

      <QuickAddClothModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onAddItem={handleAddItem}
        currencySymbol={symbol}
        defaultRate={defaultBaseRate}
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
