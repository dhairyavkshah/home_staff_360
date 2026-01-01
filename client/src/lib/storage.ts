import {
  STORAGE_KEYS,
  STAFF_STORAGE_KEYS,
  DOCUMENT_STORAGE_KEY,
  PLAN_LIMITS,
  STORAGE_LIMITS,
  CURRENCIES,
  type AppSettings,
  type HomeSettings,
  type StaffSettings,
  type UserProfile,
  type UserType,
  type Account,
  type InsertUserProfile,
  type InsertAccount,
  type Person,
  type AttendanceEntry,
  type Transaction,
  type LaundryBatch,
  type Expense,
  type BackupData,
  type InsertPerson,
  type InsertAttendance,
  type InsertTransaction,
  type InsertLaundryBatch,
  type InsertExpense,
  type ClientHome,
  type InsertClientHome,
  type SelfAttendance,
  type InsertSelfAttendance,
  type StaffLaundryJob,
  type InsertStaffLaundryJob,
  type StaffEarning,
  type InsertStaffEarning,
  type StaffExpense,
  type InsertStaffExpense,
  type StaffInvoice,
  type InsertStaffInvoice,
  type Document,
  type InsertDocument,
  type PlanType,
  type LinkedRecordType,
  type Currency,
  defaultSettings,
  defaultHomeSettings,
  defaultStaffSettings,
} from "@shared/schema";

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function getCurrentCurrencyInfo(): { currency: string; symbol: string } {
  const profile = getItem<UserProfile | null>(STORAGE_KEYS.PROFILE, null);
  const isStaffMode = profile?.type === 'STAFF';
  
  if (isStaffMode) {
    const staffSettings = getItem(STORAGE_KEYS.STAFF_SETTINGS, defaultStaffSettings);
    const currency = staffSettings.currency || 'USD';
    const symbol = currency === 'OTHER' && staffSettings.customCurrencySymbol 
      ? staffSettings.customCurrencySymbol 
      : CURRENCIES[currency as Currency]?.symbol || '$';
    return { currency, symbol };
  } else {
    const homeSettings = getItem(STORAGE_KEYS.HOME_SETTINGS, defaultHomeSettings);
    const currency = homeSettings.currency || 'USD';
    const symbol = currency === 'OTHER' && homeSettings.customCurrencySymbol 
      ? homeSettings.customCurrencySymbol 
      : CURRENCIES[currency as Currency]?.symbol || '$';
    return { currency, symbol };
  }
}

export const storage = {
  getSettings(): AppSettings {
    return getItem(STORAGE_KEYS.SETTINGS, defaultSettings);
  },

  saveSettings(settings: AppSettings): void {
    setItem(STORAGE_KEYS.SETTINGS, settings);
  },

  getHomeSettings(): HomeSettings {
    return getItem(STORAGE_KEYS.HOME_SETTINGS, defaultHomeSettings);
  },

  saveHomeSettings(settings: HomeSettings): void {
    setItem(STORAGE_KEYS.HOME_SETTINGS, settings);
  },

  getStaffSettings(): StaffSettings {
    return getItem(STORAGE_KEYS.STAFF_SETTINGS, defaultStaffSettings);
  },

  saveStaffSettings(settings: StaffSettings): void {
    setItem(STORAGE_KEYS.STAFF_SETTINGS, settings);
  },

  getModeSettings(): HomeSettings | StaffSettings {
    const profile = this.getProfile();
    if (profile?.type === 'STAFF') {
      return this.getStaffSettings();
    }
    return this.getHomeSettings();
  },

  saveModeSettings(settings: HomeSettings | StaffSettings): void {
    const profile = this.getProfile();
    if (profile?.type === 'STAFF') {
      this.saveStaffSettings(settings as StaffSettings);
    } else {
      this.saveHomeSettings(settings as HomeSettings);
    }
  },

  getProfile(): UserProfile | null {
    return getItem<UserProfile | null>(STORAGE_KEYS.PROFILE, null);
  },

  saveProfile(profile: UserProfile): void {
    setItem(STORAGE_KEYS.PROFILE, profile);
  },

  createProfile(data: InsertUserProfile): UserProfile {
    const profile: UserProfile = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setItem(STORAGE_KEYS.PROFILE, profile);
    return profile;
  },

  updateProfile(data: Partial<InsertUserProfile>): UserProfile | null {
    const profile = this.getProfile();
    if (!profile) return null;
    const updated = { ...profile, ...data };
    setItem(STORAGE_KEYS.PROFILE, updated);
    return updated;
  },

  setActiveAccount(accountId: string): void {
    const profile = this.getProfile();
    if (profile) {
      profile.activeAccountId = accountId;
      setItem(STORAGE_KEYS.PROFILE, profile);
    }
  },

  getActiveAccountId(): string | null {
    const profile = this.getProfile();
    const currentMode = profile?.type || 'HOME';
    const modeAccounts = this.getAccounts().filter(a => a.ownerType === currentMode);
    
    if (!profile?.activeAccountId) {
      if (modeAccounts.length > 0) {
        this.setActiveAccount(modeAccounts[0].id);
        return modeAccounts[0].id;
      }
      return null;
    }
    
    const exists = modeAccounts.some(a => a.id === profile.activeAccountId);
    if (!exists && modeAccounts.length > 0) {
      this.setActiveAccount(modeAccounts[0].id);
      return modeAccounts[0].id;
    }
    return exists ? profile.activeAccountId : null;
  },
  
  getAccountsForCurrentMode(): Account[] {
    const profile = this.getProfile();
    const currentMode = profile?.type || 'HOME';
    return this.getAccounts().filter(a => a.ownerType === currentMode);
  },

  requireActiveAccountId(): string {
    const accountId = this.getActiveAccountId();
    if (!accountId) {
      throw new Error("No active account. Please create or select an account first.");
    }
    return accountId;
  },

  getAccounts(): Account[] {
    return getItem(STORAGE_KEYS.ACCOUNTS, []);
  },

  getAccount(id: string): Account | undefined {
    return this.getAccounts().find((a) => a.id === id);
  },

  addAccount(data: InsertAccount): Account {
    const accounts = this.getAccounts();
    const account: Account = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    accounts.push(account);
    setItem(STORAGE_KEYS.ACCOUNTS, accounts);
    
    const profile = this.getProfile();
    if (profile && !profile.activeAccountId) {
      this.setActiveAccount(account.id);
    }
    
    return account;
  },

  updateAccount(id: string, data: Partial<InsertAccount>): Account | undefined {
    const accounts = this.getAccounts();
    const index = accounts.findIndex((a) => a.id === id);
    if (index === -1) return undefined;
    accounts[index] = { ...accounts[index], ...data };
    setItem(STORAGE_KEYS.ACCOUNTS, accounts);
    return accounts[index];
  },

  deleteAccount(id: string): boolean {
    const accounts = this.getAccounts();
    const account = this.getAccount(id);
    if (!account) return false;
    
    if (account.ownerType === 'HOME') {
      const peopleInAccount = this.getPeopleByAccount(id);
      const personIds = new Set(peopleInAccount.map(p => p.id));
      
      const attendance = this.getAttendance().filter((a) => !personIds.has(a.personId));
      setItem(STORAGE_KEYS.ATTENDANCE, attendance);
      
      const transactionsToDelete = this.getTransactions().filter((t) => personIds.has(t.personId));
      const transactionIds = new Set(transactionsToDelete.map(t => t.id));
      const transactions = this.getTransactions().filter((t) => !personIds.has(t.personId));
      setItem(STORAGE_KEYS.TRANSACTIONS, transactions);
      
      const laundry = this.getLaundry().filter((l) => 
        l.accountId !== id && (!l.personId || !personIds.has(l.personId))
      );
      setItem(STORAGE_KEYS.LAUNDRY, laundry);
      
      const people = this.getPeople().filter((p) => p.accountId !== id);
      setItem(STORAGE_KEYS.PEOPLE, people);
      
      const expensesToDelete = this.getExpensesByAccount(id);
      const expenseIds = new Set(expensesToDelete.map(e => e.id));
      const expenses = this.getExpenses().filter((e) => e.accountId !== id);
      setItem(STORAGE_KEYS.EXPENSES, expenses);
      
      const documents = this.getDocuments().filter((d) => {
        if (d.accountId === id) return false;
        if (d.linkedRecordType === 'TRANSACTION' && d.linkedRecordId && transactionIds.has(d.linkedRecordId)) return false;
        if (d.linkedRecordType === 'EXPENSE' && d.linkedRecordId && expenseIds.has(d.linkedRecordId)) return false;
        return true;
      });
      setItem(DOCUMENT_STORAGE_KEY, documents);
    } else if (account.ownerType === 'STAFF') {
      const clientHomes = this.getClientHomes().filter(h => h.ownerId === id);
      const clientHomeIds = new Set(clientHomes.map(h => h.id));
      
      const selfAttendance = this.getSelfAttendance().filter((a) => !clientHomeIds.has(a.clientHomeId));
      setItem(STAFF_STORAGE_KEYS.SELF_ATTENDANCE, selfAttendance);
      
      const laundryJobs = this.getStaffLaundryJobs().filter((j) => j.clientHomeId && !clientHomeIds.has(j.clientHomeId));
      setItem(STAFF_STORAGE_KEYS.LAUNDRY_JOBS, laundryJobs);
      
      const earnings = this.getStaffEarnings().filter((e) => !e.clientHomeId || !clientHomeIds.has(e.clientHomeId));
      setItem(STAFF_STORAGE_KEYS.EARNINGS, earnings);
      
      const staffExpenses = this.getStaffExpenses().filter((e) => !e.clientHomeId || !clientHomeIds.has(e.clientHomeId));
      setItem(STAFF_STORAGE_KEYS.EXPENSES, staffExpenses);
      
      const homes = this.getClientHomes().filter((h) => h.ownerId !== id);
      setItem(STAFF_STORAGE_KEYS.CLIENT_HOMES, homes);
      
      const documents = this.getDocuments().filter((d) => d.accountId !== id);
      setItem(DOCUMENT_STORAGE_KEY, documents);
    }
    
    const filteredAccounts = accounts.filter((a) => a.id !== id);
    setItem(STORAGE_KEYS.ACCOUNTS, filteredAccounts);
    
    const profile = this.getProfile();
    if (profile?.activeAccountId === id) {
      if (filteredAccounts.length > 0) {
        this.setActiveAccount(filteredAccounts[0].id);
      } else {
        // Clear activeAccountId by directly modifying profile
        delete profile.activeAccountId;
        setItem(STORAGE_KEYS.PROFILE, profile);
      }
    }
    return true;
  },

  getPeople(): Person[] {
    return getItem(STORAGE_KEYS.PEOPLE, []);
  },

  getPeopleByAccount(accountId: string): Person[] {
    return this.getPeople().filter((p) => p.accountId === accountId);
  },

  getPerson(id: string): Person | undefined {
    return this.getPeople().find((p) => p.id === id);
  },

  addPerson(data: InsertPerson): Person {
    const people = this.getPeople();
    const person: Person = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    people.push(person);
    setItem(STORAGE_KEYS.PEOPLE, people);
    return person;
  },

  updatePerson(id: string, data: Partial<Omit<InsertPerson, 'accountId'>>): Person | undefined {
    const people = this.getPeople();
    const index = people.findIndex((p) => p.id === id);
    if (index === -1) return undefined;
    const { accountId, ...existing } = people[index];
    people[index] = { ...existing, ...data, accountId, id, createdAt: people[index].createdAt };
    setItem(STORAGE_KEYS.PEOPLE, people);
    return people[index];
  },

  deletePerson(id: string): void {
    const transactionsToDelete = this.getTransactions().filter((t) => t.personId === id);
    const transactionIds = new Set(transactionsToDelete.map(t => t.id));
    
    const people = this.getPeople().filter((p) => p.id !== id);
    setItem(STORAGE_KEYS.PEOPLE, people);
    const attendance = this.getAttendance().filter((a) => a.personId !== id);
    setItem(STORAGE_KEYS.ATTENDANCE, attendance);
    const transactions = this.getTransactions().filter((t) => t.personId !== id);
    setItem(STORAGE_KEYS.TRANSACTIONS, transactions);
    const laundry = this.getLaundry().filter((l) => l.personId !== id);
    setItem(STORAGE_KEYS.LAUNDRY, laundry);
    
    const documents = this.getDocuments().filter((d) => {
      if (d.linkedRecordType === 'PERSON' && d.linkedRecordId === id) return false;
      if (d.linkedRecordType === 'TRANSACTION' && d.linkedRecordId && transactionIds.has(d.linkedRecordId)) return false;
      return true;
    });
    setItem(DOCUMENT_STORAGE_KEY, documents);
  },

  getAttendance(): AttendanceEntry[] {
    return getItem(STORAGE_KEYS.ATTENDANCE, []);
  },

  getAttendanceByPerson(personId: string): AttendanceEntry[] {
    return this.getAttendance().filter((a) => a.personId === personId);
  },

  getAttendanceByDate(date: string): AttendanceEntry[] {
    return this.getAttendance().filter((a) => a.date === date);
  },

  getAttendanceByAccount(accountId: string): AttendanceEntry[] {
    const personIds = new Set(this.getPeopleByAccount(accountId).map(p => p.id));
    return this.getAttendance().filter((a) => personIds.has(a.personId));
  },

  getTransactionsByAccount(accountId: string): Transaction[] {
    const personIds = new Set(this.getPeopleByAccount(accountId).map(p => p.id));
    return this.getTransactions().filter((t) => personIds.has(t.personId));
  },

  addAttendance(data: InsertAttendance): AttendanceEntry {
    const attendance = this.getAttendance();
    const person = this.getPerson(data.personId);
    const settings = this.getSettings();
    const entry: AttendanceEntry = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      recordSalaryType: data.recordSalaryType || person?.salaryType,
      recordBaseRate: data.recordBaseRate ?? person?.baseRate,
      recordHalfDayPercentage: data.recordHalfDayPercentage ?? person?.halfDayPercentage ?? settings.halfDayPercentage,
    };
    attendance.push(entry);
    setItem(STORAGE_KEYS.ATTENDANCE, attendance);
    return entry;
  },

  updateAttendance(id: string, data: Partial<InsertAttendance>): AttendanceEntry | undefined {
    const attendance = this.getAttendance();
    const index = attendance.findIndex((a) => a.id === id);
    if (index === -1) return undefined;
    attendance[index] = { ...attendance[index], ...data };
    setItem(STORAGE_KEYS.ATTENDANCE, attendance);
    return attendance[index];
  },

  deleteAttendance(id: string): void {
    const attendance = this.getAttendance().filter((a) => a.id !== id);
    setItem(STORAGE_KEYS.ATTENDANCE, attendance);
  },

  getTransactions(): Transaction[] {
    return getItem(STORAGE_KEYS.TRANSACTIONS, []);
  },

  getTransactionsByPerson(personId: string): Transaction[] {
    return this.getTransactions().filter((t) => t.personId === personId);
  },

  addTransaction(data: InsertTransaction): Transaction {
    const transactions = this.getTransactions();
    const currencyInfo = getCurrentCurrencyInfo();
    const transaction: Transaction = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      recordCurrency: data.recordCurrency || currencyInfo.currency,
      recordCurrencySymbol: data.recordCurrencySymbol || currencyInfo.symbol,
    };
    transactions.push(transaction);
    setItem(STORAGE_KEYS.TRANSACTIONS, transactions);
    return transaction;
  },

  updateTransaction(id: string, data: Partial<InsertTransaction>): Transaction | undefined {
    const transactions = this.getTransactions();
    const index = transactions.findIndex((t) => t.id === id);
    if (index === -1) return undefined;
    transactions[index] = { ...transactions[index], ...data };
    setItem(STORAGE_KEYS.TRANSACTIONS, transactions);
    return transactions[index];
  },

  deleteTransaction(id: string): void {
    const transactions = this.getTransactions().filter((t) => t.id !== id);
    setItem(STORAGE_KEYS.TRANSACTIONS, transactions);
    this.deleteDocumentsByLinkedRecord('TRANSACTION', id);
  },

  getLaundry(): LaundryBatch[] {
    const rawLaundry = getItem<LaundryBatch[]>(STORAGE_KEYS.LAUNDRY, []);
    return rawLaundry.map((batch) => ({
      ...batch,
      itemsTotal: batch.itemsTotal ?? batch.items.reduce((sum, item) => sum + item.subtotal, 0),
      pickupDelivery: batch.pickupDelivery ?? false,
    }));
  },

  getLaundryByAccount(accountId: string): LaundryBatch[] {
    return this.getLaundry().filter((l) => l.accountId === accountId);
  },

  getLaundryByPerson(personId: string): LaundryBatch[] {
    return this.getLaundry().filter((l) => l.personId === personId);
  },

  getLaundryById(id: string): LaundryBatch | undefined {
    return this.getLaundry().find((l) => l.id === id);
  },

  addLaundry(data: InsertLaundryBatch): LaundryBatch {
    const laundry = this.getLaundry();
    const currencyInfo = getCurrentCurrencyInfo();
    const batch: LaundryBatch = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      recordCurrency: data.recordCurrency || currencyInfo.currency,
      recordCurrencySymbol: data.recordCurrencySymbol || currencyInfo.symbol,
    };
    laundry.push(batch);
    setItem(STORAGE_KEYS.LAUNDRY, laundry);
    return batch;
  },

  updateLaundry(id: string, data: Partial<InsertLaundryBatch>): LaundryBatch | undefined {
    const laundry = this.getLaundry();
    const index = laundry.findIndex((l) => l.id === id);
    if (index === -1) return undefined;
    laundry[index] = { ...laundry[index], ...data };
    setItem(STORAGE_KEYS.LAUNDRY, laundry);
    return laundry[index];
  },

  deleteLaundry(id: string): void {
    const laundry = this.getLaundry().filter((l) => l.id !== id);
    setItem(STORAGE_KEYS.LAUNDRY, laundry);
    this.deleteDocumentsByLinkedRecord('LAUNDRY', id);
  },

  markLaundryPaid(id: string): LaundryBatch | undefined {
    const laundry = this.getLaundry();
    const index = laundry.findIndex((l) => l.id === id);
    if (index === -1) return undefined;
    laundry[index] = { 
      ...laundry[index], 
      isPaid: true, 
      paidAt: new Date().toISOString() 
    };
    setItem(STORAGE_KEYS.LAUNDRY, laundry);
    return laundry[index];
  },

  markLaundryUnpaid(id: string): LaundryBatch | undefined {
    const laundry = this.getLaundry();
    const index = laundry.findIndex((l) => l.id === id);
    if (index === -1) return undefined;
    laundry[index] = { 
      ...laundry[index], 
      isPaid: false, 
      paidAt: undefined 
    };
    setItem(STORAGE_KEYS.LAUNDRY, laundry);
    return laundry[index];
  },

  getUnpaidLaundryByAccount(accountId: string): LaundryBatch[] {
    return this.getLaundryByAccount(accountId).filter((l) => !l.isPaid);
  },

  getUnpaidLaundryByPerson(personId: string): LaundryBatch[] {
    return this.getLaundryByPerson(personId).filter((l) => !l.isPaid);
  },

  getExpenses(): Expense[] {
    return getItem(STORAGE_KEYS.EXPENSES, []);
  },

  getExpensesByAccount(accountId: string): Expense[] {
    return this.getExpenses().filter((e) => e.accountId === accountId);
  },

  addExpense(data: InsertExpense): Expense {
    const expenses = this.getExpenses();
    const currencyInfo = getCurrentCurrencyInfo();
    const expense: Expense = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      recordCurrency: data.recordCurrency || currencyInfo.currency,
      recordCurrencySymbol: data.recordCurrencySymbol || currencyInfo.symbol,
    };
    expenses.push(expense);
    setItem(STORAGE_KEYS.EXPENSES, expenses);
    return expense;
  },

  updateExpense(id: string, data: Partial<Omit<InsertExpense, 'accountId'>>): Expense | undefined {
    const expenses = this.getExpenses();
    const index = expenses.findIndex((e) => e.id === id);
    if (index === -1) return undefined;
    const { accountId, ...existing } = expenses[index];
    expenses[index] = { ...existing, ...data, accountId, id, createdAt: expenses[index].createdAt };
    setItem(STORAGE_KEYS.EXPENSES, expenses);
    return expenses[index];
  },

  deleteExpense(id: string): void {
    const expenses = this.getExpenses().filter((e) => e.id !== id);
    setItem(STORAGE_KEYS.EXPENSES, expenses);
    this.deleteDocumentsByLinkedRecord('EXPENSE', id);
  },

  exportBackup(): BackupData {
    const profile = this.getProfile();
    return {
      version: "1.0.0",
      exportDate: new Date().toISOString(),
      settings: this.getSettings(),
      profile: profile || undefined,
      accounts: this.getAccounts(),
      people: this.getPeople(),
      attendance: this.getAttendance(),
      transactions: this.getTransactions(),
      laundry: this.getLaundry(),
      expenses: this.getExpenses(),
    };
  },

  importBackup(backup: BackupData, mode: "replace" | "merge" | "keep"): void {
    if (mode === "replace") {
      setItem(STORAGE_KEYS.SETTINGS, backup.settings);
      if (backup.profile) setItem(STORAGE_KEYS.PROFILE, backup.profile);
      if (backup.accounts) setItem(STORAGE_KEYS.ACCOUNTS, backup.accounts);
      setItem(STORAGE_KEYS.PEOPLE, backup.people);
      setItem(STORAGE_KEYS.ATTENDANCE, backup.attendance);
      setItem(STORAGE_KEYS.TRANSACTIONS, backup.transactions);
      setItem(STORAGE_KEYS.LAUNDRY, backup.laundry);
      setItem(STORAGE_KEYS.EXPENSES, backup.expenses);
    } else if (mode === "merge") {
      const existingPeople = this.getPeople();
      const mergedPeople = [...existingPeople];
      for (const person of backup.people) {
        const index = mergedPeople.findIndex((p) => p.id === person.id);
        if (index === -1) {
          mergedPeople.push(person);
        } else {
          mergedPeople[index] = person;
        }
      }
      setItem(STORAGE_KEYS.PEOPLE, mergedPeople);
      
    } else if (mode === "keep") {
      const existingPeople = this.getPeople();
      const newPeople = backup.people.map((p) => ({
        ...p,
        id: generateId(),
      }));
      setItem(STORAGE_KEYS.PEOPLE, [...existingPeople, ...newPeople]);
    }
  },

  clearAllData(): void {
    // Clear all HOME mode data
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.HOME_SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.STAFF_SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.ACCOUNTS);
    localStorage.removeItem(STORAGE_KEYS.PEOPLE);
    localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.LAUNDRY);
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    // Clear all STAFF mode data
    localStorage.removeItem(STAFF_STORAGE_KEYS.CLIENT_HOMES);
    localStorage.removeItem(STAFF_STORAGE_KEYS.SELF_ATTENDANCE);
    localStorage.removeItem(STAFF_STORAGE_KEYS.LAUNDRY_JOBS);
    localStorage.removeItem(STAFF_STORAGE_KEYS.EARNINGS);
    localStorage.removeItem(STAFF_STORAGE_KEYS.EXPENSES);
    // Clear documents data
    localStorage.removeItem('hm_documents');
    localStorage.removeItem('hm_staff_documents');
    // Clear PIN data
    localStorage.removeItem('hm_pin');
    localStorage.removeItem('hm_pin_attempts');
    localStorage.removeItem('hm_biometric_enabled');
  },

  switchAppMode(newType: UserType): UserProfile | null {
    const profile = this.getProfile();
    if (!profile) return null;
    const updated = { ...profile, type: newType };
    setItem(STORAGE_KEYS.PROFILE, updated);
    return updated;
  },

  // ============ STAFF USER METHODS ============

  getClientHomes(): ClientHome[] {
    return getItem<ClientHome[]>(STAFF_STORAGE_KEYS.CLIENT_HOMES, []);
  },

  getActiveClientHomes(): ClientHome[] {
    return this.getClientHomes().filter(h => h.isActive);
  },

  getClientHomesByAccount(accountId: string): ClientHome[] {
    return this.getClientHomes().filter(h => h.ownerId === accountId);
  },

  getActiveClientHomesByAccount(accountId: string): ClientHome[] {
    return this.getClientHomesByAccount(accountId).filter(h => h.isActive);
  },

  addClientHome(data: InsertClientHome): ClientHome {
    const homes = this.getClientHomes();
    const home: ClientHome = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    homes.push(home);
    setItem(STAFF_STORAGE_KEYS.CLIENT_HOMES, homes);
    return home;
  },

  updateClientHome(id: string, data: Partial<InsertClientHome>): ClientHome | undefined {
    const homes = this.getClientHomes();
    const index = homes.findIndex((h) => h.id === id);
    if (index === -1) return undefined;
    homes[index] = { ...homes[index], ...data };
    setItem(STAFF_STORAGE_KEYS.CLIENT_HOMES, homes);
    return homes[index];
  },

  deleteClientHome(id: string): void {
    const homes = this.getClientHomes().filter((h) => h.id !== id);
    setItem(STAFF_STORAGE_KEYS.CLIENT_HOMES, homes);
    const attendance = this.getSelfAttendance().filter((a) => a.clientHomeId !== id);
    setItem(STAFF_STORAGE_KEYS.SELF_ATTENDANCE, attendance);
    const laundryJobs = this.getStaffLaundryJobs().filter((j) => j.clientHomeId !== id);
    setItem(STAFF_STORAGE_KEYS.LAUNDRY_JOBS, laundryJobs);
    const earnings = this.getStaffEarnings().filter((e) => e.clientHomeId !== id);
    setItem(STAFF_STORAGE_KEYS.EARNINGS, earnings);
  },

  getClientHome(id: string): ClientHome | undefined {
    return this.getClientHomes().find((h) => h.id === id);
  },

  getSelfAttendance(): SelfAttendance[] {
    return getItem<SelfAttendance[]>(STAFF_STORAGE_KEYS.SELF_ATTENDANCE, []);
  },

  getSelfAttendanceByHome(clientHomeId: string): SelfAttendance[] {
    return this.getSelfAttendance().filter((a) => a.clientHomeId === clientHomeId);
  },

  getSelfAttendanceByDate(date: string): SelfAttendance[] {
    return this.getSelfAttendance().filter((a) => a.date === date);
  },

  getSelfAttendanceByAccount(accountId: string): SelfAttendance[] {
    const clientHomeIds = new Set(this.getClientHomesByAccount(accountId).map(h => h.id));
    return this.getSelfAttendance().filter(a => clientHomeIds.has(a.clientHomeId));
  },

  addSelfAttendance(data: InsertSelfAttendance): SelfAttendance {
    const attendance = this.getSelfAttendance();
    const clientHome = this.getClientHome(data.clientHomeId);
    const entry: SelfAttendance = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      recordSalaryType: data.recordSalaryType || clientHome?.salaryType,
      recordRate: data.recordRate ?? clientHome?.rate,
    };
    attendance.push(entry);
    setItem(STAFF_STORAGE_KEYS.SELF_ATTENDANCE, attendance);
    return entry;
  },

  updateSelfAttendance(id: string, data: Partial<InsertSelfAttendance>): SelfAttendance | undefined {
    const attendance = this.getSelfAttendance();
    const index = attendance.findIndex((a) => a.id === id);
    if (index === -1) return undefined;
    attendance[index] = { ...attendance[index], ...data };
    setItem(STAFF_STORAGE_KEYS.SELF_ATTENDANCE, attendance);
    return attendance[index];
  },

  deleteSelfAttendance(id: string): void {
    const attendance = this.getSelfAttendance().filter((a) => a.id !== id);
    setItem(STAFF_STORAGE_KEYS.SELF_ATTENDANCE, attendance);
  },

  getStaffLaundryJobs(): StaffLaundryJob[] {
    return getItem<StaffLaundryJob[]>(STAFF_STORAGE_KEYS.LAUNDRY_JOBS, []);
  },

  getStaffLaundryJobsByHome(clientHomeId: string): StaffLaundryJob[] {
    return this.getStaffLaundryJobs().filter((j) => j.clientHomeId === clientHomeId);
  },

  getStaffLaundryJobsByAccount(accountId: string): StaffLaundryJob[] {
    const clientHomeIds = new Set(this.getClientHomesByAccount(accountId).map(h => h.id));
    return this.getStaffLaundryJobs().filter(j => clientHomeIds.has(j.clientHomeId));
  },

  addStaffLaundryJob(data: InsertStaffLaundryJob): StaffLaundryJob {
    const jobs = this.getStaffLaundryJobs();
    const currencyInfo = getCurrentCurrencyInfo();
    const job: StaffLaundryJob = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      recordCurrency: data.recordCurrency || currencyInfo.currency,
      recordCurrencySymbol: data.recordCurrencySymbol || currencyInfo.symbol,
    };
    jobs.push(job);
    setItem(STAFF_STORAGE_KEYS.LAUNDRY_JOBS, jobs);
    return job;
  },

  updateStaffLaundryJob(id: string, data: Partial<InsertStaffLaundryJob>): StaffLaundryJob | undefined {
    const jobs = this.getStaffLaundryJobs();
    const index = jobs.findIndex((j) => j.id === id);
    if (index === -1) return undefined;
    jobs[index] = { ...jobs[index], ...data };
    setItem(STAFF_STORAGE_KEYS.LAUNDRY_JOBS, jobs);
    return jobs[index];
  },

  deleteStaffLaundryJob(id: string): void {
    const jobs = this.getStaffLaundryJobs().filter((j) => j.id !== id);
    setItem(STAFF_STORAGE_KEYS.LAUNDRY_JOBS, jobs);
  },

  getStaffLaundryJob(id: string): StaffLaundryJob | undefined {
    return this.getStaffLaundryJobs().find((j) => j.id === id);
  },

  getStaffEarnings(): StaffEarning[] {
    return getItem<StaffEarning[]>(STAFF_STORAGE_KEYS.EARNINGS, []);
  },

  getStaffEarningsByHome(clientHomeId: string): StaffEarning[] {
    return this.getStaffEarnings().filter((e) => e.clientHomeId === clientHomeId);
  },

  getStaffEarningsByAccount(accountId: string): StaffEarning[] {
    const clientHomeIds = new Set(this.getClientHomesByAccount(accountId).map(h => h.id));
    return this.getStaffEarnings().filter(e => e.clientHomeId && clientHomeIds.has(e.clientHomeId));
  },

  addStaffEarning(data: InsertStaffEarning): StaffEarning {
    const earnings = this.getStaffEarnings();
    const currencyInfo = getCurrentCurrencyInfo();
    const earning: StaffEarning = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      recordCurrency: data.recordCurrency || currencyInfo.currency,
      recordCurrencySymbol: data.recordCurrencySymbol || currencyInfo.symbol,
    };
    earnings.push(earning);
    setItem(STAFF_STORAGE_KEYS.EARNINGS, earnings);
    return earning;
  },

  updateStaffEarning(id: string, data: Partial<InsertStaffEarning>): StaffEarning | undefined {
    const earnings = this.getStaffEarnings();
    const index = earnings.findIndex((e) => e.id === id);
    if (index === -1) return undefined;
    earnings[index] = { ...earnings[index], ...data };
    setItem(STAFF_STORAGE_KEYS.EARNINGS, earnings);
    return earnings[index];
  },

  deleteStaffEarning(id: string): void {
    const earnings = this.getStaffEarnings().filter((e) => e.id !== id);
    setItem(STAFF_STORAGE_KEYS.EARNINGS, earnings);
  },

  getStaffExpenses(): StaffExpense[] {
    return getItem<StaffExpense[]>(STAFF_STORAGE_KEYS.EXPENSES, []);
  },

  getStaffExpensesByHome(clientHomeId: string): StaffExpense[] {
    return this.getStaffExpenses().filter((e) => e.clientHomeId === clientHomeId);
  },

  getStaffExpensesByAccount(accountId: string): StaffExpense[] {
    const clientHomeIds = new Set(this.getClientHomesByAccount(accountId).map(h => h.id));
    return this.getStaffExpenses().filter(e => e.clientHomeId && clientHomeIds.has(e.clientHomeId));
  },

  addStaffExpense(data: InsertStaffExpense): StaffExpense {
    const expenses = this.getStaffExpenses();
    const currencyInfo = getCurrentCurrencyInfo();
    const expense: StaffExpense = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      recordCurrency: data.recordCurrency || currencyInfo.currency,
      recordCurrencySymbol: data.recordCurrencySymbol || currencyInfo.symbol,
    };
    expenses.push(expense);
    setItem(STAFF_STORAGE_KEYS.EXPENSES, expenses);
    return expense;
  },

  updateStaffExpense(id: string, data: Partial<InsertStaffExpense>): StaffExpense | undefined {
    const expenses = this.getStaffExpenses();
    const index = expenses.findIndex((e) => e.id === id);
    if (index === -1) return undefined;
    expenses[index] = { ...expenses[index], ...data };
    setItem(STAFF_STORAGE_KEYS.EXPENSES, expenses);
    return expenses[index];
  },

  deleteStaffExpense(id: string): void {
    const expenses = this.getStaffExpenses().filter((e) => e.id !== id);
    setItem(STAFF_STORAGE_KEYS.EXPENSES, expenses);
  },

  getStaffExpense(id: string): StaffExpense | undefined {
    return this.getStaffExpenses().find((e) => e.id === id);
  },

  // ============ STAFF INVOICES ============

  getStaffInvoices(): StaffInvoice[] {
    return getItem<StaffInvoice[]>(STAFF_STORAGE_KEYS.INVOICES, []);
  },

  getStaffInvoicesByHome(clientHomeId: string): StaffInvoice[] {
    return this.getStaffInvoices().filter((i) => i.clientHomeId === clientHomeId);
  },

  getStaffInvoicesByAccount(accountId: string): StaffInvoice[] {
    const clientHomeIds = new Set(this.getClientHomesByAccount(accountId).map(h => h.id));
    return this.getStaffInvoices().filter(i => clientHomeIds.has(i.clientHomeId));
  },

  getStaffInvoice(id: string): StaffInvoice | undefined {
    return this.getStaffInvoices().find((i) => i.id === id);
  },

  getNextInvoiceNumber(): string {
    const invoices = this.getStaffInvoices();
    const year = new Date().getFullYear();
    const yearInvoices = invoices.filter(i => i.invoiceNumber.startsWith(`INV-${year}`));
    const nextNum = yearInvoices.length + 1;
    return `INV-${year}-${String(nextNum).padStart(4, '0')}`;
  },

  addStaffInvoice(data: InsertStaffInvoice): StaffInvoice {
    const invoices = this.getStaffInvoices();
    const currencyInfo = getCurrentCurrencyInfo();
    const invoice: StaffInvoice = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      recordCurrency: data.recordCurrency || currencyInfo.currency,
      recordCurrencySymbol: data.recordCurrencySymbol || currencyInfo.symbol,
    };
    invoices.push(invoice);
    setItem(STAFF_STORAGE_KEYS.INVOICES, invoices);
    return invoice;
  },

  updateStaffInvoice(id: string, data: Partial<InsertStaffInvoice>): StaffInvoice | undefined {
    const invoices = this.getStaffInvoices();
    const index = invoices.findIndex((i) => i.id === id);
    if (index === -1) return undefined;
    invoices[index] = { ...invoices[index], ...data };
    setItem(STAFF_STORAGE_KEYS.INVOICES, invoices);
    return invoices[index];
  },

  deleteStaffInvoice(id: string): void {
    const invoices = this.getStaffInvoices().filter((i) => i.id !== id);
    setItem(STAFF_STORAGE_KEYS.INVOICES, invoices);
  },

  calculateStaffMonthlyEarnings(year: number, month: number, accountId?: string | null) {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    
    const allAttendance = accountId 
      ? this.getSelfAttendanceByAccount(accountId)
      : this.getSelfAttendance();
    const attendance = allAttendance.filter(a => {
      const date = new Date(a.date);
      return date >= monthStart && date <= monthEnd && a.status !== 'ABSENT';
    });
    
    const allLaundryJobs = accountId 
      ? this.getStaffLaundryJobsByAccount(accountId)
      : this.getStaffLaundryJobs();
    const laundryJobs = allLaundryJobs.filter(j => {
      const date = new Date(j.date);
      return date >= monthStart && date <= monthEnd;
    });
    
    const allEarnings = accountId 
      ? this.getStaffEarningsByAccount(accountId)
      : this.getStaffEarnings();
    const earnings = allEarnings.filter(e => {
      const date = new Date(e.date);
      return date >= monthStart && date <= monthEnd;
    });
    
    const clientHomes = accountId 
      ? this.getClientHomesByAccount(accountId)
      : this.getClientHomes();
    const homeRates = new Map(clientHomes.map(h => [h.id, { rate: h.rate, salaryType: h.salaryType }]));
    
    let fromAttendance = 0;
    attendance.forEach(a => {
      const rate = a.recordRate ?? homeRates.get(a.clientHomeId)?.rate ?? 0;
      fromAttendance += a.status === 'FULL' ? rate : rate * 0.5;
    });
    
    const fromLaundry = laundryJobs.reduce((sum, j) => sum + j.totalEarned, 0);
    
    const bonusAndTips = earnings
      .filter(e => e.type === 'bonus' || e.type === 'tip')
      .reduce((sum, e) => sum + e.amount, 0);
    
    return {
      total: fromAttendance + fromLaundry + bonusAndTips,
      fromAttendance,
      fromLaundry,
      bonusAndTips,
    };
  },

  // ============ PLAN & PURCHASE HELPERS ============

  initializePlan(): void {
    const settings = this.getSettings();
    if (!settings.purchaseStatus) {
      settings.purchaseStatus = 'STANDARD';
      settings.planType = 'STANDARD';
      this.saveSettings(settings);
      this.notifyPlanChange();
    }
  },

  getPlanInfo(): { 
    status: 'STANDARD' | 'PURCHASED';
    isPremium: boolean;
  } {
    const settings = this.getSettings();
    
    if (settings.purchaseStatus === 'PURCHASED') {
      return { 
        status: 'PURCHASED', 
        isPremium: true 
      };
    }
    
    return { 
      status: 'STANDARD', 
      isPremium: false 
    };
  },

  isPremiumUnlocked(): boolean {
    const settings = this.getSettings();
    return settings.purchaseStatus === 'PURCHASED';
  },

  markPurchased(): void {
    const settings = this.getSettings();
    settings.purchaseStatus = 'PURCHASED';
    settings.planType = 'PREMIUM';
    settings.purchaseDate = new Date().toISOString();
    this.saveSettings(settings);
    this.notifyPlanChange();
  },

  restorePurchase(): boolean {
    this.markPurchased();
    return true;
  },
  
  notifyPlanChange(): void {
    if (typeof window !== 'undefined' && (window as any).__notifyPlanStatusChange) {
      (window as any).__notifyPlanStatusChange();
    }
  },

  // ============ PLAN LIMIT HELPERS ============

  getPlanType(): PlanType {
    const settings = this.getSettings();
    
    if (settings.purchaseStatus === 'PURCHASED') {
      return 'PREMIUM';
    }
    
    return 'STANDARD';
  },

  setPlanType(planType: PlanType): void {
    const settings = this.getSettings();
    settings.planType = planType;
    this.saveSettings(settings);
  },

  getShowAllContexts(): boolean {
    const settings = this.getSettings();
    return settings.showAllContexts || false;
  },

  setShowAllContexts(show: boolean): void {
    const settings = this.getSettings();
    settings.showAllContexts = show;
    this.saveSettings(settings);
  },

  checkHomePlanLimit(type: 'households' | 'staff'): { allowed: boolean; current: number; max: number } {
    const planType = this.getPlanType();
    const limits = PLAN_LIMITS.HOME[planType];
    
    if (type === 'households') {
      const current = this.getAccounts().filter(a => a.ownerType === 'HOME').length;
      return { allowed: current < limits.maxHouseholds, current, max: limits.maxHouseholds };
    }
    if (type === 'staff') {
      const current = this.getPeople().length;
      return { allowed: current < limits.maxStaffTotal, current, max: limits.maxStaffTotal };
    }
    return { allowed: true, current: 0, max: 0 };
  },

  checkStaffPlanLimit(type: 'businesses' | 'clients'): { allowed: boolean; current: number; max: number } {
    const planType = this.getPlanType();
    const limits = PLAN_LIMITS.STAFF[planType];
    
    if (type === 'businesses') {
      const current = this.getAccounts().filter(a => a.ownerType === 'STAFF').length;
      return { allowed: current < limits.maxBusinesses, current, max: limits.maxBusinesses };
    }
    if (type === 'clients') {
      const current = this.getClientHomes().length;
      return { allowed: current < limits.maxClientsTotal, current, max: limits.maxClientsTotal };
    }
    return { allowed: true, current: 0, max: 0 };
  },

  // ============ DOCUMENT METHODS ============

  getDocuments(): Document[] {
    return getItem<Document[]>(DOCUMENT_STORAGE_KEY, []);
  },

  getDocumentsByAccount(accountId: string): Document[] {
    return this.getDocuments().filter(d => d.accountId === accountId);
  },

  getDocumentsByOwnerType(ownerType: UserType): Document[] {
    return this.getDocuments().filter(d => d.ownerType === ownerType);
  },

  getDocument(id: string): Document | undefined {
    return this.getDocuments().find(d => d.id === id);
  },

  addDocument(data: InsertDocument): Document {
    const documents = this.getDocuments();
    const doc: Document = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    documents.push(doc);
    setItem(DOCUMENT_STORAGE_KEY, documents);
    return doc;
  },

  updateDocument(id: string, data: Partial<Omit<InsertDocument, 'ownerType' | 'accountId'>>): Document | undefined {
    const documents = this.getDocuments();
    const index = documents.findIndex(d => d.id === id);
    if (index === -1) return undefined;
    documents[index] = { ...documents[index], ...data };
    setItem(DOCUMENT_STORAGE_KEY, documents);
    return documents[index];
  },

  deleteDocument(id: string): void {
    const documents = this.getDocuments().filter(d => d.id !== id);
    setItem(DOCUMENT_STORAGE_KEY, documents);
  },

  getDocumentsByLinkedRecord(linkedRecordType: LinkedRecordType, linkedRecordId: string): Document[] {
    return this.getDocuments().filter(d => 
      d.linkedRecordType === linkedRecordType && d.linkedRecordId === linkedRecordId
    );
  },

  deleteDocumentsByLinkedRecord(linkedRecordType: LinkedRecordType, linkedRecordId: string): void {
    const documents = this.getDocuments().filter(d => 
      !(d.linkedRecordType === linkedRecordType && d.linkedRecordId === linkedRecordId)
    );
    setItem(DOCUMENT_STORAGE_KEY, documents);
  },

  getTransaction(id: string): Transaction | undefined {
    return this.getTransactions().find(t => t.id === id);
  },

  getExpense(id: string): Expense | undefined {
    return this.getExpenses().find(e => e.id === id);
  },

  checkDocumentLimit(): { allowed: boolean; current: number; max: number } {
    const profile = this.getProfile();
    const planType = this.getPlanType();
    const userType = profile?.type || 'HOME';
    const limits = PLAN_LIMITS[userType][planType];
    const current = this.getDocumentsByOwnerType(userType).length;
    return { 
      allowed: current < limits.maxDocuments, 
      current, 
      max: limits.maxDocuments 
    };
  },

  getDocumentStorageSize(): { totalBytes: number; formatted: string } {
    const docs = this.getDocuments();
    const totalBytes = docs.reduce((sum, doc) => sum + doc.fileSize, 0);
    if (totalBytes < 1024) return { totalBytes, formatted: `${totalBytes} B` };
    if (totalBytes < 1024 * 1024) return { totalBytes, formatted: `${(totalBytes / 1024).toFixed(1)} KB` };
    return { totalBytes, formatted: `${(totalBytes / (1024 * 1024)).toFixed(1)} MB` };
  },

  getTotalRecordsCount(): { 
    total: number; 
    breakdown: { 
      homeAttendance: number;
      homeTransactions: number;
      homeLaundry: number;
      homeExpenses: number;
      staffAttendance: number;
      staffLaundry: number;
      staffExpenses: number;
      staffEarnings: number;
      staffInvoices: number;
      documents: number;
    };
  } {
    const homeAttendance = this.getAttendance().length;
    const homeTransactions = this.getTransactions().length;
    const homeLaundry = this.getLaundry().length;
    const homeExpenses = this.getExpenses().length;
    const staffAttendance = this.getSelfAttendance().length;
    const staffLaundry = this.getStaffLaundryJobs().length;
    const staffExpenses = this.getStaffExpenses().length;
    const staffEarnings = this.getStaffEarnings().length;
    const staffInvoices = this.getStaffInvoices().length;
    const documents = this.getDocuments().length;
    
    const total = homeAttendance + homeTransactions + homeLaundry + homeExpenses + 
                  staffAttendance + staffLaundry + staffExpenses + staffEarnings + 
                  staffInvoices + documents;
    
    return {
      total,
      breakdown: {
        homeAttendance,
        homeTransactions,
        homeLaundry,
        homeExpenses,
        staffAttendance,
        staffLaundry,
        staffExpenses,
        staffEarnings,
        staffInvoices,
        documents,
      },
    };
  },

  getStorageStatus(): {
    totalRecords: number;
    warningThreshold: number;
    limitThreshold: number;
    status: 'ok' | 'warning' | 'limit';
    percentUsed: number;
  } {
    const { total } = this.getTotalRecordsCount();
    const { totalRecordsWarning, totalRecordsLimit } = STORAGE_LIMITS;
    
    let status: 'ok' | 'warning' | 'limit' = 'ok';
    if (total >= totalRecordsLimit) {
      status = 'limit';
    } else if (total >= totalRecordsWarning) {
      status = 'warning';
    }
    
    return {
      totalRecords: total,
      warningThreshold: totalRecordsWarning,
      limitThreshold: totalRecordsLimit,
      status,
      percentUsed: Math.min(100, Math.round((total / totalRecordsLimit) * 100)),
    };
  },
};
