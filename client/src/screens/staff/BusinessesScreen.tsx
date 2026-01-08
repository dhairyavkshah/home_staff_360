import { useMemo, useState } from "react";
import { Briefcase, Trash2, Edit2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigation } from "@/lib/navigation";
import { storage } from "@/lib/storage";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { useToast } from "@/hooks/use-toast";
import { notifyActiveContextChange } from "@/hooks/use-active-context";
import { usePlanStatus } from "@/hooks/use-plan-status";
import { BUSINESS_PROFESSIONS } from "@shared/schema";

export function BusinessesScreen() {
  const { navigate } = useNavigation();
  const { tLabel } = useTranslation();
  const { toast } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [businessProfession, setBusinessProfession] = useState("");
  const { planType } = usePlanStatus();

  const profile = useMemo(() => storage.getProfile(), [refreshKey]);
  const accounts = useMemo(() => storage.getAccounts().filter(a => a.ownerType === 'STAFF'), [refreshKey]);
  const activeAccountId = useMemo(() => storage.getActiveAccountId(), [refreshKey]);
  const planLimit = useMemo(() => storage.checkStaffPlanLimit('businesses'), [refreshKey, planType]);

  const handleAdd = () => {
    if (!planLimit.allowed) {
      toast({
        title: tLabel('limitReached', 'Limit Reached'),
        description: `${tLabel('maxBusinesses', 'Maximum businesses')}: ${planLimit.max}. ${tLabel('deleteToAddMore', 'Delete an existing business to add a new one.')}`,
        variant: 'destructive',
      });
      return;
    }
    setBusinessName("");
    setBusinessDescription("");
    setBusinessProfession("");
    setEditingId(null);
    setShowAddDialog(true);
  };

  const handleEdit = (id: string) => {
    const account = accounts.find(a => a.id === id);
    if (account) {
      setBusinessName(account.name);
      setBusinessDescription(account.description || "");
      setBusinessProfession(account.profession || "");
      setEditingId(id);
      setShowAddDialog(true);
    }
  };

  const handleSave = () => {
    if (!businessName.trim()) {
      toast({
        title: tLabel('error', 'Error'),
        description: tLabel('enterBusinessName', 'Please enter a business name'),
        variant: 'destructive',
      });
      return;
    }

    if (!businessProfession) {
      toast({
        title: tLabel('error', 'Error'),
        description: tLabel('selectProfessionRequired', 'Please select a service/profession type'),
        variant: 'destructive',
      });
      return;
    }

    const accountData = {
      name: businessName.trim(),
      description: businessDescription.trim() || undefined,
      profession: businessProfession,
    };

    if (editingId) {
      storage.updateAccount(editingId, accountData);
      toast({
        title: tLabel('updated', 'Updated'),
        description: tLabel('businessUpdated', 'Business updated successfully'),
      });
    } else {
      const newAccount = storage.addAccount({
        ownerId: profile?.id || '',
        ownerType: 'STAFF',
        ...accountData,
      });
      storage.setActiveAccount(newAccount.id);
      notifyActiveContextChange();
      toast({
        title: tLabel('added', 'Added'),
        description: tLabel('businessAdded', 'Business added successfully'),
      });
    }

    setShowAddDialog(false);
    setBusinessName("");
    setBusinessDescription("");
    setBusinessProfession("");
    setEditingId(null);
    setRefreshKey(k => k + 1);
  };

  const handleDelete = (id: string) => {
    storage.deleteAccount(id);
    notifyActiveContextChange();
    setDeleteConfirm(null);
    setRefreshKey(k => k + 1);
    toast({
      title: tLabel('deleted', 'Deleted'),
      description: tLabel('businessDeleted', 'Business deleted'),
    });
  };

  const handleSelect = (id: string) => {
    storage.setActiveAccount(id);
    storage.setShowAllContexts(false);
    notifyActiveContextChange();
    setRefreshKey(k => k + 1);
    navigate("staff-home");
  };

  return (
    <div className="h-screen flex flex-col bg-background" data-testid="screen-businesses">
      <div className="safe-area-top" />

      <Header
        title={tLabel('businesses', 'Businesses')}
        subtitle={`${planLimit.current}/${planLimit.max} ${tLabel('used', 'Used')}`}
        onBack={() => navigate("staff-home")}
        onAdd={handleAdd}
        addDisabled={!planLimit.allowed}
        addTestId="button-add-business"
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="content-container pt-4 pb-8 flex flex-col gap-2.5">
          {accounts.length === 0 ? (
            <Card className="p-4 flex flex-col items-center gap-2" data-testid="empty-state">
              <div className="icon-halo-muted w-10 h-10">
                <Briefcase className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-sm">{tLabel('noBusinesses', 'No businesses yet')}</h3>
                <p className="text-xs text-muted-foreground">{tLabel('addFirstBusiness', 'Add your first business or profession')}</p>
              </div>
              <Button onClick={handleAdd} data-testid="button-add-first-business">
                <span className="mr-2">+</span>
                {tLabel('addBusiness', 'Add Business')}
              </Button>
            </Card>
          ) : (
            accounts.map((account) => {
              const isActive = account.id === activeAccountId;
              return (
                <Card
                  key={account.id}
                  className={`p-3 flex items-center gap-2.5 cursor-pointer hover-elevate ${isActive ? 'border-primary' : ''}`}
                  onClick={() => handleSelect(account.id)}
                  data-testid={`card-business-${account.id}`}
                >
                  <div className="icon-halo-primary w-9 h-9">
                    <Briefcase className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{account.name}</p>
                      {isActive && (
                        <Badge variant="default" className="text-xs">{tLabel('active', 'Active')}</Badge>
                      )}
                    </div>
                    {account.profession && (
                      <p className="text-xs text-muted-foreground truncate">{account.profession}</p>
                    )}
                  </div>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(account.id)}
                      data-testid={`button-edit-${account.id}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteConfirm(account.id)}
                      data-testid={`button-delete-${account.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? tLabel('editBusiness', 'Edit Business') : tLabel('addBusiness', 'Add Business')}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label>{tLabel('businessName', 'Business Name')} <span className="text-destructive">*</span></Label>
              <Input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder={tLabel('enterBusinessName', 'e.g., My Cleaning Business, ABC Services...')}
                data-testid="input-business-name"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{tLabel('serviceProfessionType', 'Service/Profession Type')} <span className="text-destructive">*</span></Label>
              <SearchableSelect
                value={businessProfession}
                onValueChange={setBusinessProfession}
                placeholder={tLabel('selectProfession', 'Select profession...')}
                searchPlaceholder={tLabel('searchProfession', 'Search professions...')}
                emptyMessage={tLabel('noProfessionFound', 'No profession found')}
                options={BUSINESS_PROFESSIONS.map((profession) => ({
                  value: profession,
                  label: profession,
                }))}
                data-testid="select-business-profession"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{tLabel('businessDescription', 'Business Description')}</Label>
              <Textarea
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                placeholder={tLabel('enterBusinessDescription', 'Brief description of your business (optional)')}
                rows={3}
                data-testid="input-business-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              {tLabel('cancel', 'Cancel')}
            </Button>
            <Button onClick={handleSave} data-testid="button-save-business">
              {tLabel('save', 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
        title={tLabel('deleteBusiness', 'Delete Business')}
        description={tLabel('deleteBusinessConfirm', 'Are you sure you want to delete this business? This action cannot be undone.')}
        confirmText={tLabel('delete', 'Delete')}
        cancelText={tLabel('cancel', 'Cancel')}
        variant="destructive"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
      />
      <div className="safe-area-bottom" />
    </div>
  );
}
