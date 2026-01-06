import { useMemo, useState } from "react";
import { ArrowRightLeft, User, Link2, Trash2, Plus, X } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchBar } from "@/components/SearchBar";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useNavigation } from "@/lib/navigation";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { formatCurrency, formatRecordCurrency, formatDate, getTodayString, getCategoryLabel } from "@/lib/calculations";
import { useActiveContext } from "@/hooks/use-active-context";

export function TransactionsScreen() {
  const { navigate, data } = useNavigation();
  const source = data.source as "home" | "people" | undefined;
  
  const handleBack = () => {
    if (source === "people") {
      navigate("people");
    } else {
      navigate("home");
    }
  };
  const { tLabel } = useTranslation();
  const { toast } = useToast();
  const { contextLabel, contextMode } = useActiveContext();
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);

  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [category, setCategory] = useState("payment");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(getTodayString());
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const settings = useMemo(() => storage.getSettings(), [refreshKey]);
  const activeAccountId = useMemo(() => storage.getActiveAccountId(), [refreshKey]);
  const showAllContexts = useMemo(() => storage.getShowAllContexts(), [refreshKey]);
  const people = useMemo(() => {
    return activeAccountId ? storage.getPeopleByAccount(activeAccountId) : [];
  }, [refreshKey, activeAccountId]);
  
  const activePeople = useMemo(() => {
    const accountId = storage.getActiveAccountId();
    const allPeople = accountId ? storage.getPeopleByAccount(accountId) : storage.getPeople();
    return allPeople.filter(p => p.isActive !== false);
  }, [refreshKey]);

  const filterGroups = useMemo(() => {
    return [
      {
        id: "category",
        label: tLabel('category', 'Category'),
        options: [
          { id: "payment", label: tLabel('payment', 'Payment') },
          { id: "advance", label: tLabel('advance', 'Advance') },
          { id: "deduction", label: tLabel('deduction', 'Deduction') },
          { id: "other", label: tLabel('other', 'Other') },
        ],
      },
    ];
  }, [tLabel]);

  const handleFilterChange = (groupId: string, optionIds: string[]) => {
    setFilters(prev => ({ ...prev, [groupId]: optionIds }));
  };

  const transactions = useMemo(() => {
    let allTransactions = storage.getTransactions();
    
    if (!showAllContexts && activeAccountId) {
      const accountPeople = storage.getPeopleByAccount(activeAccountId);
      const personIds = new Set(accountPeople.map(p => p.id));
      allTransactions = allTransactions.filter(t => personIds.has(t.personId));
    }
    
    const categoryFilter = filters.category || [];
    if (categoryFilter.length > 0) {
      allTransactions = allTransactions.filter(t => categoryFilter.includes(t.category));
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      allTransactions = allTransactions.filter(t => {
        const personName = getPersonName(t.personId).toLowerCase();
        return personName.includes(query) || 
               t.description.toLowerCase().includes(query) ||
               t.transactionNo?.toLowerCase().includes(query);
      });
    }
    
    return allTransactions.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [refreshKey, activeAccountId, showAllContexts, filters, searchQuery, people]);

  const linkedDocs = useMemo(() => {
    const docs = storage.getDocuments();
    const linkedMap = new Map<string, boolean>();
    docs.forEach(d => {
      if (d.linkedRecordType === 'TRANSACTION' && d.linkedRecordId) {
        linkedMap.set(d.linkedRecordId, true);
      }
    });
    return linkedMap;
  }, [refreshKey]);

  const getPersonName = (personId: string) => {
    const person = people.find(p => p.id === personId);
    return person?.name || 'Unknown';
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'payment': return 'bg-success/10 text-success';
      case 'advance': return 'bg-warning/10 text-warning';
      case 'deduction': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  
  const resetForm = () => {
    setSelectedPersonId("");
    setCategory("payment");
    setDescription("");
    setAmount("");
    setDate(getTodayString());
    setErrors({});
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!selectedPersonId) newErrors.person = "Please select a staff member";
    if (!description.trim()) newErrors.description = "Description is required";
    if (!amount || parseFloat(amount) <= 0) newErrors.amount = "Amount must be greater than 0";
    if (!date) newErrors.date = "Date is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    storage.addTransaction({
      personId: selectedPersonId,
      category,
      description: description.trim(),
      amount: parseFloat(amount),
      date,
      isPaid: true,
    });
    toast({ title: tLabel('transactionAdded', 'Transaction added successfully') });

    resetForm();
    setShowAddForm(false);
    setRefreshKey(prev => prev + 1);
  };

  const handleDelete = (txId: string) => {
    storage.deleteTransaction(txId);
    toast({ title: tLabel('transactionDeleted', 'Transaction deleted') });
    setDeleteConfirmId(null);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="h-screen flex flex-col bg-background" data-testid="screen-transactions">
      <div className="safe-area-top" />

      <Header
        title={tLabel('transactions', 'Transactions')}
        subtitle={`${transactions.length} ${tLabel('totalTransactions', 'Total')}`}
        onBack={handleBack}
        contextLabel={contextLabel}
        contextMode={contextMode}
        rightAction={
          <Button 
            size="icon" 
            onClick={() => { resetForm(); setShowAddForm(true); }}
            data-testid="button-toggle-add-form"
          >
            <Plus className="h-5 w-5" />
          </Button>
        }
      />

      <Drawer open={showAddForm} onOpenChange={setShowAddForm}>
        <DrawerContent className="max-h-[90vh] flex flex-col">
          <DrawerHeader className="py-3 pb-4 shrink-0 relative">
            <DrawerTitle className="text-center">
              {tLabel('addTransaction', 'Add Transaction')}
            </DrawerTitle>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2"
              onClick={() => setShowAddForm(false)}
              data-testid="button-close-add-form"
            >
              <X className="w-5 h-5" />
            </Button>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto flex-1 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="person">{tLabel('staff', 'Staff')} <span className="text-destructive">*</span></Label>
              <SearchableSelect
                value={selectedPersonId}
                onValueChange={setSelectedPersonId}
                placeholder={tLabel('selectStaff', 'Select staff member')}
                searchPlaceholder="Search staff..."
                emptyMessage="No staff members found"
                options={activePeople.map((p) => ({
                  value: p.id,
                  label: p.name,
                }))}
                data-testid="select-person"
              />
              {errors.person && <p className="text-xs text-destructive">{errors.person}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="category">{tLabel('category', 'Category')} <span className="text-destructive">*</span></Label>
              <SearchableSelect
                value={category}
                onValueChange={setCategory}
                placeholder={tLabel('selectCategory', 'Select category')}
                searchPlaceholder="Search categories..."
                emptyMessage="No categories found"
                options={[
                  { value: "payment", label: tLabel('payment', 'Payment') },
                  { value: "advance", label: tLabel('advance', 'Advance') },
                  { value: "deduction", label: tLabel('deduction', 'Deduction') },
                  { value: "other", label: tLabel('other', 'Other') },
                ]}
                data-testid="select-category"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="description">{tLabel('description', 'Description')} <span className="text-destructive">*</span></Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={tLabel('transactionPlaceholder', 'e.g., Salary payment, Festival bonus')}
                data-testid="input-description"
              />
              {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="amount">{tLabel('amount', 'Amount')} <span className="text-destructive">*</span></Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                data-testid="input-amount"
              />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="date">{tLabel('date', 'Date')} <span className="text-destructive">*</span></Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                data-testid="input-date"
              />
              {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { resetForm(); setShowAddForm(false); }} data-testid="button-cancel">
                {tLabel('cancel', 'Cancel')}
              </Button>
              <Button className="flex-1" onClick={handleSubmit} data-testid="button-save">
                {tLabel('save', 'Save')}
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <ConfirmModal
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        title={tLabel('deleteTransaction', 'Delete Transaction')}
        description={tLabel('deleteTransactionConfirm', 'Are you sure you want to delete this transaction? This action cannot be undone.')}
        confirmText={tLabel('delete', 'Delete')}
        cancelText={tLabel('cancel', 'Cancel')}
        variant="destructive"
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="content-container pt-3 pb-8 flex flex-col gap-2">
          <SearchBar
            placeholder={tLabel('searchTransactions', 'Search transactions...')}
            value={searchQuery}
            onChange={setSearchQuery}
            filterGroups={filterGroups}
            activeFilters={filters}
            onFilterChange={handleFilterChange}
            testId="search-transactions"
          />

          {transactions.length === 0 ? (
            <Card className="p-4 flex flex-col items-center gap-2" data-testid="empty-state">
              <div className="icon-halo-muted w-10 h-10">
                <ArrowRightLeft className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-sm">{tLabel('noTransactions', 'No transactions yet')}</h3>
                <p className="text-xs text-muted-foreground">{tLabel('addFirstTransaction', 'Add your first transaction to get started')}</p>
              </div>
            </Card>
          ) : (
            transactions.map((tx) => (
              <Card
                key={tx.id}
                className="p-3 hover-elevate"
                data-testid={`card-transaction-${tx.id}`}
              >
                <div className="flex items-start gap-2.5">
                  <div 
                    className="icon-halo-primary w-9 h-9 flex-shrink-0 cursor-pointer"
                    onClick={() => navigate('person-detail', { personId: tx.personId })}
                  >
                    <User className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{tx.description}</p>
                        {linkedDocs.has(tx.id) && (
                          <Link2 className="w-3.5 h-3.5 text-info flex-shrink-0" />
                        )}
                      </div>
                      <p className="font-semibold text-sm whitespace-nowrap">
                        {formatRecordCurrency(tx.amount, tx.recordCurrencySymbol, settings.currency, settings.customCurrencySymbol)}
                      </p>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(tx.id); }}
                        data-testid={`button-delete-${tx.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`text-xs ${getCategoryColor(tx.category)}`}>
                        {getCategoryLabel(tx.category)}
                      </Badge>
                      <span className="text-xs text-muted-foreground truncate">
                        {getPersonName(tx.personId)}
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(tx.date)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
