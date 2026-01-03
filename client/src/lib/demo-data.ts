import { STORAGE_KEYS, STAFF_STORAGE_KEYS } from "@shared/schema";

const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export function loadDemoData() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const profileId = generateId();
  const accountId = generateId();
  
  const profile = {
    id: profileId,
    type: "HOME",
    displayName: "Demo User",
    createdAt: new Date(currentYear, currentMonth - 2, 1).toISOString(),
    activeAccountId: accountId,
  };
  
  const accounts = [{
    id: accountId,
    ownerId: profileId,
    ownerType: "HOME",
    name: "Patel Residence",
    description: "Main household",
    createdAt: new Date(currentYear, currentMonth - 2, 1).toISOString(),
  }];
  
  const person1Id = generateId();
  const person2Id = generateId();
  const person3Id = generateId();
  const person4Id = generateId();
  
  const people = [
    {
      id: person1Id,
      accountId: accountId,
      name: "Asha Sharma",
      role: "Housekeeper",
      phone: "9876543210",
      salaryType: "MONTHLY",
      baseRate: 12000,
      halfDayPercentage: 50,
      notes: "Works Mon-Sat, 8am-2pm",
      isActive: true,
      createdAt: new Date(currentYear, currentMonth - 2, 5).toISOString(),
      currency: "INR",
    },
    {
      id: person2Id,
      accountId: accountId,
      name: "Rakesh Kumar",
      role: "Driver",
      phone: "9123456789",
      salaryType: "MONTHLY",
      baseRate: 18000,
      halfDayPercentage: 50,
      notes: "Available for evening trips",
      isActive: true,
      createdAt: new Date(currentYear, currentMonth - 2, 5).toISOString(),
      currency: "INR",
    },
    {
      id: person3Id,
      accountId: accountId,
      name: "Lila Das",
      role: "Cook",
      phone: "9988776655",
      salaryType: "MONTHLY",
      baseRate: 15000,
      halfDayPercentage: 50,
      notes: "Specializes in North Indian cuisine",
      isActive: true,
      createdAt: new Date(currentYear, currentMonth - 1, 1).toISOString(),
      currency: "INR",
    },
    {
      id: person4Id,
      accountId: accountId,
      name: "Mohan Singh",
      role: "Gardener",
      phone: "9112233445",
      salaryType: "DAILY",
      baseRate: 500,
      halfDayPercentage: 50,
      notes: "Visits twice a week",
      isActive: true,
      createdAt: new Date(currentYear, currentMonth - 1, 10).toISOString(),
      currency: "INR",
    },
  ];
  
  const attendance = [];
  const daysToGenerate = 25;
  
  for (let i = daysToGenerate; i >= 0; i--) {
    const date = new Date(currentYear, currentMonth, now.getDate() - i);
    if (date > now) continue;
    
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) continue;
    
    const dateStr = date.toISOString().split('T')[0];
    
    if (dayOfWeek !== 0) {
      const statuses = ["FULL", "FULL", "FULL", "FULL", "HALF", "ABSENT"];
      attendance.push({
        id: generateId(),
        personId: person1Id,
        date: dateStr,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        createdAt: date.toISOString(),
        recordSalaryType: "MONTHLY",
        recordBaseRate: 12000,
        recordHalfDayPercentage: 50,
        recordCurrency: "INR",
        recordCurrencySymbol: "₹",
      });
    }
    
    attendance.push({
      id: generateId(),
      personId: person2Id,
      date: dateStr,
      status: Math.random() > 0.1 ? "FULL" : "HALF",
      createdAt: date.toISOString(),
      recordSalaryType: "MONTHLY",
      recordBaseRate: 18000,
      recordHalfDayPercentage: 50,
      recordCurrency: "INR",
      recordCurrencySymbol: "₹",
    });
    
    if (dayOfWeek !== 0) {
      attendance.push({
        id: generateId(),
        personId: person3Id,
        date: dateStr,
        status: Math.random() > 0.05 ? "FULL" : "ABSENT",
        createdAt: date.toISOString(),
        recordSalaryType: "MONTHLY",
        recordBaseRate: 15000,
        recordHalfDayPercentage: 50,
        recordCurrency: "INR",
        recordCurrencySymbol: "₹",
      });
    }
    
    if (dayOfWeek === 2 || dayOfWeek === 5) {
      attendance.push({
        id: generateId(),
        personId: person4Id,
        date: dateStr,
        status: "FULL",
        createdAt: date.toISOString(),
        recordSalaryType: "DAILY",
        recordBaseRate: 500,
        recordHalfDayPercentage: 50,
        recordCurrency: "INR",
        recordCurrencySymbol: "₹",
      });
    }
  }
  
  const transactions = [
    {
      id: generateId(),
      personId: person1Id,
      category: "payment",
      description: "December salary",
      amount: 12000,
      date: new Date(currentYear, currentMonth - 1, 5).toISOString().split('T')[0],
      isPaid: true,
      createdAt: new Date(currentYear, currentMonth - 1, 5).toISOString(),
      recordCurrency: "INR",
      recordCurrencySymbol: "₹",
    },
    {
      id: generateId(),
      personId: person1Id,
      category: "advance",
      description: "Festival advance",
      amount: 3000,
      date: new Date(currentYear, currentMonth, 2).toISOString().split('T')[0],
      isPaid: true,
      createdAt: new Date(currentYear, currentMonth, 2).toISOString(),
      recordCurrency: "INR",
      recordCurrencySymbol: "₹",
    },
    {
      id: generateId(),
      personId: person2Id,
      category: "payment",
      description: "December salary",
      amount: 18000,
      date: new Date(currentYear, currentMonth - 1, 5).toISOString().split('T')[0],
      isPaid: true,
      createdAt: new Date(currentYear, currentMonth - 1, 5).toISOString(),
      recordCurrency: "INR",
      recordCurrencySymbol: "₹",
    },
    {
      id: generateId(),
      personId: person2Id,
      category: "deduction",
      description: "Fuel reimbursement adjustment",
      amount: 500,
      date: new Date(currentYear, currentMonth, 10).toISOString().split('T')[0],
      isPaid: true,
      createdAt: new Date(currentYear, currentMonth, 10).toISOString(),
      recordCurrency: "INR",
      recordCurrencySymbol: "₹",
    },
    {
      id: generateId(),
      personId: person3Id,
      category: "payment",
      description: "December salary",
      amount: 15000,
      date: new Date(currentYear, currentMonth - 1, 5).toISOString().split('T')[0],
      isPaid: true,
      createdAt: new Date(currentYear, currentMonth - 1, 5).toISOString(),
      recordCurrency: "INR",
      recordCurrencySymbol: "₹",
    },
    {
      id: generateId(),
      personId: person4Id,
      category: "payment",
      description: "Weekly payment",
      amount: 4000,
      date: new Date(currentYear, currentMonth, 7).toISOString().split('T')[0],
      isPaid: true,
      createdAt: new Date(currentYear, currentMonth, 7).toISOString(),
      recordCurrency: "INR",
      recordCurrencySymbol: "₹",
    },
  ];
  
  const expenses = [
    {
      id: generateId(),
      accountId: accountId,
      category: "utilities",
      description: "Electricity bill - December",
      amount: 4500,
      date: new Date(currentYear, currentMonth - 1, 15).toISOString().split('T')[0],
      isPaid: true,
      recurrence: "MONTHLY",
      createdAt: new Date(currentYear, currentMonth - 1, 15).toISOString(),
      recordCurrency: "INR",
      recordCurrencySymbol: "₹",
    },
    {
      id: generateId(),
      accountId: accountId,
      category: "utilities",
      description: "Water bill - December",
      amount: 850,
      date: new Date(currentYear, currentMonth - 1, 20).toISOString().split('T')[0],
      isPaid: true,
      recurrence: "MONTHLY",
      createdAt: new Date(currentYear, currentMonth - 1, 20).toISOString(),
      recordCurrency: "INR",
      recordCurrencySymbol: "₹",
    },
    {
      id: generateId(),
      accountId: accountId,
      category: "maintenance",
      description: "AC servicing",
      amount: 1200,
      date: new Date(currentYear, currentMonth, 5).toISOString().split('T')[0],
      isPaid: true,
      recurrence: "NONE",
      createdAt: new Date(currentYear, currentMonth, 5).toISOString(),
      recordCurrency: "INR",
      recordCurrencySymbol: "₹",
    },
    {
      id: generateId(),
      accountId: accountId,
      category: "groceries",
      description: "Monthly groceries",
      amount: 8500,
      date: new Date(currentYear, currentMonth, 3).toISOString().split('T')[0],
      isPaid: true,
      recurrence: "MONTHLY",
      createdAt: new Date(currentYear, currentMonth, 3).toISOString(),
      recordCurrency: "INR",
      recordCurrencySymbol: "₹",
    },
    {
      id: generateId(),
      accountId: accountId,
      category: "supplies",
      description: "Cleaning supplies",
      amount: 650,
      date: new Date(currentYear, currentMonth, 8).toISOString().split('T')[0],
      isPaid: true,
      recurrence: "NONE",
      createdAt: new Date(currentYear, currentMonth, 8).toISOString(),
      recordCurrency: "INR",
      recordCurrencySymbol: "₹",
    },
    {
      id: generateId(),
      accountId: accountId,
      category: "recurring-bill",
      description: "Internet & WiFi",
      amount: 999,
      date: new Date(currentYear, currentMonth, 1).toISOString().split('T')[0],
      isPaid: true,
      recurrence: "MONTHLY",
      createdAt: new Date(currentYear, currentMonth, 1).toISOString(),
      recordCurrency: "INR",
      recordCurrencySymbol: "₹",
    },
    {
      id: generateId(),
      accountId: accountId,
      category: "insurance",
      description: "Home insurance premium",
      amount: 12000,
      date: new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0],
      isPaid: true,
      recurrence: "YEARLY",
      createdAt: new Date(currentYear, currentMonth - 1, 1).toISOString(),
      recordCurrency: "INR",
      recordCurrencySymbol: "₹",
    },
  ];
  
  const laundry = [
    {
      id: generateId(),
      accountId: accountId,
      batchNumber: "L-2025-001",
      items: [
        { type: "Shirt", quantity: 5, pricePerItem: 15 },
        { type: "Pants", quantity: 3, pricePerItem: 20 },
        { type: "Saree", quantity: 2, pricePerItem: 50 },
      ],
      totalItems: 10,
      totalAmount: 235,
      status: "delivered",
      sentDate: new Date(currentYear, currentMonth - 1, 20).toISOString().split('T')[0],
      receivedDate: new Date(currentYear, currentMonth - 1, 23).toISOString().split('T')[0],
      isPaid: true,
      createdAt: new Date(currentYear, currentMonth - 1, 20).toISOString(),
      recordCurrency: "INR",
      recordCurrencySymbol: "₹",
    },
    {
      id: generateId(),
      accountId: accountId,
      batchNumber: "L-2025-002",
      items: [
        { type: "Shirt", quantity: 8, pricePerItem: 15 },
        { type: "Pants", quantity: 4, pricePerItem: 20 },
        { type: "Bedsheet", quantity: 2, pricePerItem: 40 },
      ],
      totalItems: 14,
      totalAmount: 280,
      status: "processing",
      sentDate: new Date(currentYear, currentMonth, 10).toISOString().split('T')[0],
      isPaid: false,
      createdAt: new Date(currentYear, currentMonth, 10).toISOString(),
      recordCurrency: "INR",
      recordCurrencySymbol: "₹",
    },
  ];
  
  const homeSettings = {
    householdName: "Patel Residence",
    currency: "INR",
    language: "en",
    salaryStartDay: 1,
    halfDayPercentage: 50,
  };
  
  const appSettings = {
    currency: "INR",
    language: "en",
    salaryStartDay: 1,
    halfDayPercentage: 50,
    hasCompletedOnboarding: true,
    pinEnabled: false,
    darkMode: false,
    planType: "STANDARD",
    showAllContexts: false,
    defaultAppMode: "HOME",
    homeTourCompleted: true,
    staffTourCompleted: true,
    purchaseStatus: "STANDARD",
    hapticFeedbackEnabled: true,
    soundEffectsEnabled: true,
    country: "IN",
  };
  
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  localStorage.setItem(STORAGE_KEYS.PEOPLE, JSON.stringify(people));
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  localStorage.setItem(STORAGE_KEYS.LAUNDRY, JSON.stringify(laundry));
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(appSettings));
  localStorage.setItem(STORAGE_KEYS.HOME_SETTINGS, JSON.stringify(homeSettings));
  
  console.log("Demo data loaded successfully!");
  console.log("Staff:", people.length);
  console.log("Attendance records:", attendance.length);
  console.log("Transactions:", transactions.length);
  console.log("Expenses:", expenses.length);
  console.log("Laundry batches:", laundry.length);
  console.log("Reloading page in 1 second...");
  
  setTimeout(() => {
    window.location.reload();
  }, 1000);
  
  return {
    profile,
    accounts,
    people,
    attendance,
    transactions,
    expenses,
    laundry,
  };
}

export function clearDemoData() {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  Object.values(STAFF_STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  console.log("All demo data cleared!");
}

(window as any).loadDemoData = loadDemoData;
(window as any).clearDemoData = clearDemoData;
