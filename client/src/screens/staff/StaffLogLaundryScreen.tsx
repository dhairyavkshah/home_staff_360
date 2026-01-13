import { useState, useMemo, useEffect } from "react";
import { X, Truck, Shirt, Briefcase, Trash2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { UnsavedChangesDialog } from "@/components/UnsavedChangesDialog";
import { useNavigation, useNavigationData } from "@/lib/navigation";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { useSimpleDirtyTracker } from "@/hooks/use-dirty-tracker";
import { useDirtyForm } from "@/lib/dirty-tracking";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { useCurrency } from "@/hooks/useCurrency";
import { QuickAddClothModal } from "@/components/laundry/QuickAddClothModal";
import { currencySymbols, LAUNDRY_SERVICE_TYPES } from "@shared/schema";
import type { LaundryServiceType, Account } from "@shared/schema";

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
  useDirtyForm(isDirty);
  const { getCurrencySymbol, getCurrencyInputLabel } = useCurrency();
  const data = useNavigationData<{ laundryJobId?: string }>();

  const profile = useMemo(() => storage.getProfile(), []);
  const settings = useMemo(() => storage.getSettings(), []);
  const symbol = settings.customCurrencySymbol || currencySymbols[settings.currency];
  
  const laundryBusinesses = useMemo(() => {
    const accounts = storage.getAccounts().filter(a => a.ownerType === 'STAFF');
    return accounts.filter((a: Account) => a.profession === 'Laundry Service');
  }, []);
  
  const activeAccountId = useMemo(() => storage.getActiveAccountId(), []);
  const activeAccount = useMemo(() => {
    return laundryBusinesses.find(a => a.id === activeAccountId);
  }, [laundryBusinesses, activeAccountId]);

  const isViewMode = !!data.laundryJobId;
  const existingJob = useMemo(() => {
    if (!data.laundryJobId) return null;
    return storage.getStaffLaundryJobs().find(j => j.id === data.laundryJobId) || null;
  }, [data.laundryJobId]);

  const displaySymbol = existingJob?.recordCurrencySymbol || getCurrencySymbol();

  const today = new Date().toISOString().split('T')[0];
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>(activeAccount?.id || "");
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const clientHomes = useMemo(() => {
    if (selectedBusinessId) {
      return storage.getActiveClientHomesByAccount(selectedBusinessId);
    }
    return storage.getActiveClientHomes();
  }, [selectedBusinessId]);
  
  useEffect(() => {
    if (!selectedBusinessId && activeAccount) {
      setSelectedBusinessId(activeAccount.id);
    }
  }, [activeAccount, selectedBusinessId]);

  const itemsTotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const deliveryCharge = pickupDelivery ? parseFloat(pickupDeliveryCharge) || 0 : 0;
  const total = itemsTotal + deliveryCharge;
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    if (existingJob) {
      if (existingJob.accountId) setSelectedBusinessId(existingJob.accountId);
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

    if (!selectedBusinessId) newErrors.selectedBusinessId = "Business is required";
    if (!selectedHome) newErrors.selectedHome = t("selectClientHome") || "Client Home is required";
    if (!serviceType) newErrors.serviceType = "Service Type is required";
    if (!date) {
      newErrors.date = "Date is required";
    } else {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);
      
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const selectedMonth = selectedDate.getMonth();
      const selectedYear = selectedDate.getFullYear();
      
      if (selectedYear < currentYear || (selectedYear === currentYear && selectedMonth < currentMonth)) {
        newErrors.date = t("cannotLogPreviousMonths") || "Cannot log laundry for previous months";
      } else if (selectedDate > today) {
        newErrors.date = t("cannotLogFutureDates") || "Cannot log laundry for future dates";
      }
    }
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

    storage.addStaffLaundryJob({
      staffUserId: profile.id,
      accountId: selectedBusinessId,
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

    markClean();
    navigate("staff-laundry");
  };

  const handleDelete = () => {
    if (!data.laundryJobId) return;
    
    storage.deleteStaffLaundryJob(data.laundryJobId);
    toast({ title: t("laundryJobDeleted") || "Laundry job deleted successfully" });
    navigate("staff-laundry");
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

  const getClientHomeName = (clientHomeId: string | undefined) => {
    if (!clientHomeId) return null;
    const homes = storage.getClientHomes();
    const home = homes.find(h => h.id === clientHomeId);
    return home?.name || null;
  };

  const getBusinessName = (accountId: string | undefined) => {
    if (!accountId) return null;
    const business = laundryBusinesses.find(b => b.id === accountId);
    return business?.name || null;
  };

  const formatCurrency = (amount: number) => `${symbol}${amount.toLocaleString()}`;

  if (isViewMode && existingJob) {
    const clientHomeName = getClientHomeName(existingJob.clientHomeId);
    const businessName = getBusinessName(existingJob.accountId);
    const viewItemsTotal = existingJob.items?.reduce((sum, item) => sum + item.subtotal, 0) || 0;
    const viewTotalItems = existingJob.items?.reduce((sum, item) => sum + item.quantity, 0) || existingJob.itemCount || 0;
    const viewDeliveryCharge = existingJob.pickupDelivery ? (existingJob.pickupDeliveryCharge || 0) : 0;

    return (
      <AppLayout>
        <Header
          title={"View Laundry Job"}
          subtitle={"Laundry record details"}
          onBack={() => navigate("staff-laundry")}
          onHome={() => navigate("staff-home")}
        />

        <ScrollContent>
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{t("basicInformation") || "Basic Information"}</h2>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6" data-testid="button-info-readonly">
                    <Info className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">This record cannot be edited</p>
                    <p className="text-xs text-muted-foreground">Financial records are locked after creation. If you need to make changes, delete this record and create a new one.</p>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {businessName && laundryBusinesses.length > 1 && (
              <div className="flex flex-col gap-1">
                <Label className="text-muted-foreground text-sm">{"Business"}</Label>
                <p className="font-medium" data-testid="view-business">{businessName}</p>
              </div>
            )}

            {clientHomeName && (
              <div className="flex flex-col gap-1">
                <Label className="text-muted-foreground text-sm">{"Client Home"}</Label>
                <p className="font-medium" data-testid="view-client-home">{clientHomeName}</p>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <Label className="text-muted-foreground text-sm">{t("date") || "Date"}</Label>
              <p className="font-medium" data-testid="view-date">{formatDate(existingJob.date)}</p>
            </div>

            {existingJob.serviceType && (
              <div className="flex flex-col gap-1">
                <Label className="text-muted-foreground text-sm">{t("serviceType") || "Service Type"}</Label>
                <p className="font-medium" data-testid="view-service-type">{existingJob.serviceType}</p>
              </div>
            )}

            {existingJob.note && (
              <div className="flex flex-col gap-1">
                <Label className="text-muted-foreground text-sm">{t("notes") || "Notes"}</Label>
                <p className="font-medium" data-testid="view-notes">{existingJob.note}</p>
              </div>
            )}
          </section>

          {existingJob.items && existingJob.items.length > 0 && (
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">{t("items") || "Items"}</h2>
                <span className="text-sm text-muted-foreground">
                  {viewTotalItems} {t("item") || "item"}{viewTotalItems !== 1 ? 's' : ''}
                </span>
              </div>
              
              <Card className="divide-y">
                {existingJob.items.map((item, index) => (
                  <div key={item.id || index} className="p-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className="icon-halo-primary w-9 h-9 flex-shrink-0">
                        <Shirt className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.type}</p>
                        <p className="text-sm text-muted-foreground">
                          {displaySymbol}{item.rate.toLocaleString()} {t("each") || "each"} x {item.quantity}
                        </p>
                      </div>
                    </div>
                    <span className="font-medium text-right">
                      {displaySymbol}{item.subtotal.toLocaleString()}
                    </span>
                  </div>
                ))}
              </Card>
            </section>
          )}

          {existingJob.pickupDelivery && (
            <section className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold">{t("additionalServices") || "Additional Services"}</h2>
              <Card className="p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="icon-halo-muted w-9 h-9">
                    <Truck className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{t("pickupDelivery") || "Pick-up & Delivery"}</p>
                  </div>
                </div>
                <span className="font-medium">{displaySymbol}{viewDeliveryCharge.toLocaleString()}</span>
              </Card>
            </section>
          )}

          <Card className="p-3 bg-primary/5 border-primary/20">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("items") || "Items"} ({viewTotalItems})</span>
                <span>{displaySymbol}{viewItemsTotal.toLocaleString()}</span>
              </div>
              {existingJob.pickupDelivery && viewDeliveryCharge > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("pickupDelivery") || "Pick-up & Delivery"}</span>
                  <span>{displaySymbol}{viewDeliveryCharge.toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="font-semibold">{t("totalEarnings") || "Total Earnings"}</span>
                <span className="text-xl font-bold" data-testid="view-total">
                  {displaySymbol}{existingJob.totalEarned.toLocaleString()}
                </span>
              </div>
            </div>
          </Card>

          {existingJob.createdAt && (
            <div className="flex flex-col gap-1">
              <Label className="text-muted-foreground text-sm">{"Recorded On"}</Label>
              <p className="text-sm text-muted-foreground" data-testid="view-created">
                {formatDate(existingJob.createdAt)}
              </p>
            </div>
          )}

          <Button 
            variant="destructive" 
            className="w-full" 
            onClick={() => setShowDeleteDialog(true)} 
            data-testid="button-delete"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {t("deleteLaundryJob") || "Delete Laundry Job"}
          </Button>
        </ScrollContent>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("deleteLaundryJob") || "Delete Laundry Job"}</AlertDialogTitle>
              <AlertDialogDescription>
                {"Are you sure you want to delete this laundry job? This action cannot be undone."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel") || "Cancel"}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                {t("delete") || "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AppLayout>
    );
  }

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

          {laundryBusinesses.length > 1 && (
            <div className="flex flex-col gap-4">
              <Label htmlFor="business">{t("business") || "Business"} <span className="text-destructive">*</span></Label>
              <SearchableSelect
                value={selectedBusinessId}
                onValueChange={(v) => { setSelectedBusinessId(v); setSelectedHome(""); markDirty(); }}
                placeholder={t("selectBusiness") || "Select business"}
                searchPlaceholder="Search businesses..."
                emptyMessage="No businesses found"
                options={laundryBusinesses.map((business) => ({
                  value: business.id,
                  label: business.name,
                  icon: <Briefcase className="w-4 h-4" />,
                }))}
                data-testid="select-business"
              />
              {errors.selectedBusinessId && <p className="text-xs text-destructive">{errors.selectedBusinessId}</p>}
            </div>
          )}

          <div className="flex flex-col gap-4">
            <Label htmlFor="clientHome">{t("clientHomes")} <span className="text-destructive">*</span></Label>
            <SearchableSelect
              value={selectedHome}
              onValueChange={(v) => { setSelectedHome(v); markDirty(); }}
              placeholder={t("selectClientHome") || "Select client home"}
              searchPlaceholder="Search client homes..."
              emptyMessage={t("noClientHomesFound") || "No client homes found. Add a client home first."}
              options={clientHomes.map((home) => ({
                value: home.id,
                label: home.name,
              }))}
              data-testid="select-client-home"
            />
            {errors.selectedHome && <p className="text-xs text-destructive">{errors.selectedHome}</p>}
          </div>

          <div className="flex flex-col gap-4">
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
          
          <div className="flex flex-col gap-4">
            <Label htmlFor="serviceType">{t("serviceType") || "Service Type"} <span className="text-destructive">*</span></Label>
            <SearchableSelect
              value={serviceType}
              onValueChange={(v) => { setServiceType(v as LaundryServiceType); markDirty(); }}
              placeholder={t("selectServiceType") || "Select service type"}
              searchPlaceholder="Search service types..."
              emptyMessage="No service types found"
              options={LAUNDRY_SERVICE_TYPES.map((type) => ({
                value: type,
                label: type,
              }))}
              data-testid="select-service-type"
            />
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
                <Label htmlFor="deliveryCharge">{t("pickupDeliveryCharge") || "Pick-up & Delivery Charge"} ({getCurrencyInputLabel()}) <span className="text-destructive">*</span></Label>
                <Input
                  id="deliveryCharge"
                  type="number"
                  min="0"
                  step="1"
                  value={pickupDeliveryCharge}
                  onChange={(e) => { 
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setPickupDeliveryCharge(val); 
                    markDirty(); 
                  }}
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
          {t("logLaundryJob")}
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
