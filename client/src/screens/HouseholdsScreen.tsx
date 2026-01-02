import { useMemo, useState } from "react";
import { Home, Trash2, Edit2, Check, Users } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigation } from "@/lib/navigation";
import { storage } from "@/lib/storage";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { useToast } from "@/hooks/use-toast";
import { notifyActiveContextChange } from "@/hooks/use-active-context";
import { usePlanStatus } from "@/hooks/use-plan-status";

export function HouseholdsScreen() {
  const { navigate } = useNavigation();
  const { tLabel } = useTranslation();
  const { toast } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [householdName, setHouseholdName] = useState("");
  const { planType } = usePlanStatus();

  const profile = useMemo(() => storage.getProfile(), [refreshKey]);
  const accounts = useMemo(() => storage.getAccounts().filter(a => a.ownerType === 'HOME'), [refreshKey]);
  const activeAccountId = useMemo(() => storage.getActiveAccountId(), [refreshKey]);
  const planLimit = useMemo(() => storage.checkHomePlanLimit('households'), [refreshKey, planType]);

  const getStaffCount = (accountId: string) => {
    return storage.getPeopleByAccount(accountId).length;
  };

  const handleAdd = () => {
    if (!planLimit.allowed) {
      toast({
        title: tLabel('limitReached', 'Limit Reached'),
        description: `${tLabel('maxHouseholds', 'Maximum households')}: ${planLimit.max}. ${tLabel('deleteToAddMore', 'Delete an existing household to add a new one.')}`,
        variant: 'destructive',
      });
      return;
    }
    setHouseholdName("");
    setEditingId(null);
    setShowAddDialog(true);
  };

  const handleEdit = (id: string, name: string) => {
    setHouseholdName(name);
    setEditingId(id);
    setShowAddDialog(true);
  };

  const handleSave = () => {
    if (!householdName.trim()) {
      toast({
        title: tLabel('error', 'Error'),
        description: tLabel('enterHouseholdName', 'Please enter a household name'),
        variant: 'destructive',
      });
      return;
    }

    if (editingId) {
      storage.updateAccount(editingId, { name: householdName.trim() });
      toast({
        title: tLabel('updated', 'Updated'),
        description: tLabel('householdUpdated', 'Household updated successfully'),
      });
    } else {
      const newAccount = storage.addAccount({
        ownerId: profile?.id || '',
        ownerType: 'HOME',
        name: householdName.trim(),
      });
      storage.setActiveAccount(newAccount.id);
      notifyActiveContextChange();
      toast({
        title: tLabel('added', 'Added'),
        description: tLabel('householdAdded', 'Household added successfully'),
      });
    }

    setShowAddDialog(false);
    setHouseholdName("");
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
      description: tLabel('householdDeleted', 'Household deleted'),
    });
  };

  const handleSelect = (id: string) => {
    storage.setActiveAccount(id);
    storage.setShowAllContexts(false);
    notifyActiveContextChange();
    setRefreshKey(k => k + 1);
    navigate("home");
  };

  return (
    <div className="h-screen flex flex-col bg-background" data-testid="screen-households">
      <div className="safe-area-top" />

      <Header
        title={tLabel('households', 'Households')}
        subtitle={`${planLimit.current}/${planLimit.max} ${tLabel('used', 'Used')}`}
        onBack={() => navigate("home")}
        onAdd={handleAdd}
        addDisabled={!planLimit.allowed}
        addTestId="button-add-household"
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="content-container pt-4 pb-8 flex flex-col gap-2.5">
          {accounts.length === 0 ? (
            <Card className="p-4 flex flex-col items-center gap-2" data-testid="empty-state">
              <div className="icon-halo-muted w-10 h-10">
                <Home className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-sm">{tLabel('noHouseholds', 'No households yet')}</h3>
                <p className="text-xs text-muted-foreground">{tLabel('addFirstHousehold', 'Add your first household to get started')}</p>
              </div>
              <Button onClick={handleAdd} data-testid="button-add-first-household">
                <span className="mr-2">+</span>
                {tLabel('addHousehold', 'Add Household')}
              </Button>
            </Card>
          ) : (
            accounts.map((account) => {
              const staffCount = getStaffCount(account.id);
              const isActive = account.id === activeAccountId;
              return (
                <Card
                  key={account.id}
                  className={`p-3 flex items-center gap-2.5 cursor-pointer hover-elevate ${isActive ? 'border-primary' : ''}`}
                  onClick={() => handleSelect(account.id)}
                  data-testid={`card-household-${account.id}`}
                >
                  <div className="icon-halo-primary w-9 h-9">
                    <Home className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{account.name}</p>
                      {isActive && (
                        <Badge variant="default" className="text-xs">{tLabel('active', 'Active')}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />
                      <span>{staffCount} {tLabel('staff', 'Staff')}</span>
                    </div>
                  </div>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(account.id, account.name)}
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
              {editingId ? tLabel('editHousehold', 'Edit Household') : tLabel('addHousehold', 'Add Household')}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label>{tLabel('householdName', 'Household Name')}</Label>
              <Input
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                placeholder={tLabel('enterHouseholdName', 'Enter household name...')}
                data-testid="input-household-name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              {tLabel('cancel', 'Cancel')}
            </Button>
            <Button onClick={handleSave} data-testid="button-save-household">
              {tLabel('save', 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
        title={tLabel('deleteHousehold', 'Delete Household')}
        description={tLabel('deleteHouseholdConfirm', 'Are you sure you want to delete this household? All associated staff and records will be removed. This action cannot be undone.')}
        confirmText={tLabel('delete', 'Delete')}
        cancelText={tLabel('cancel', 'Cancel')}
        variant="destructive"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
      />
    </div>
  );
}
