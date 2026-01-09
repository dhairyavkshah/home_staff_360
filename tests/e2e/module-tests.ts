/**
 * Home Staff 360 v2.0 - Comprehensive E2E Module Tests
 * 
 * Tests collaboration modules with cross-user sync verification:
 * - User creation and connection setup
 * - Shared Attendance: Create, sync, approve workflows
 * - Shared Laundry: Create, sync, approve workflows
 * - Data isolation between unconnected users
 * 
 * Run with: npx tsx tests/e2e/module-tests.ts
 */

const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const TEST_PASSWORD = 'Test@123456';

interface TestUser {
  id: string;
  phone: string;
  token: string;
  displayName: string;
  userType: 'HOME' | 'STAFF';
  currency: string;
}

interface TestPair {
  home: TestUser;
  staff: TestUser;
  linkId?: string;
  bindingId?: string;
}

interface TestResult {
  testId: string;
  scenario: string;
  status: 'PASS' | 'FAIL';
  details: string;
  timestamp: string;
}

const results: TestResult[] = [];

// Utility functions
async function apiRequest(
  method: string,
  endpoint: string,
  body?: any,
  token?: string
): Promise<{ status: number; data: any }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-test-bypass': 'rate-limit-skip',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    return { status: response.status, data };
  } catch (error: any) {
    return { status: 0, data: { error: error.message } };
  }
}

function logResult(testId: string, scenario: string, passed: boolean, details: string) {
  const result: TestResult = {
    testId,
    scenario,
    status: passed ? 'PASS' : 'FAIL',
    details,
    timestamp: new Date().toISOString(),
  };
  results.push(result);
  const icon = passed ? '✓' : '✗';
  console.log(`  ${icon} ${testId}: ${scenario} - ${passed ? 'PASS' : 'FAIL'}`);
  if (!passed) {
    console.log(`    Details: ${details}`);
  }
}

function generatePhoneNumber(index: number, prefix: string): string {
  const base = 9100000000 + index * 1000 + Math.floor(Math.random() * 100);
  return `+91${prefix}${base.toString().slice(-8)}`;
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function getDateOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

// ============ PHASE 1: Create Test Users ============
async function createTestUsers(): Promise<{ homeUsers: TestUser[]; staffUsers: TestUser[] }> {
  console.log('\n=== PHASE 1: Creating Test Users (5 Home + 5 Staff) ===\n');
  
  const homeUsers: TestUser[] = [];
  const staffUsers: TestUser[] = [];
  const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AED'];

  // Create 5 home users
  console.log('Creating 5 HOME users...');
  for (let i = 0; i < 5; i++) {
    const phone = generatePhoneNumber(i, '70');
    const displayName = `ModuleHome${i + 1}`;
    const currency = currencies[i % currencies.length];

    const otpRes = await apiRequest('POST', '/api/auth/request-otp', { phone });
    if (otpRes.status !== 200) {
      logResult(`CREATE-HOME-${i + 1}`, 'Create home user', false, `OTP request failed: ${JSON.stringify(otpRes.data)}`);
      continue;
    }

    const otp = otpRes.data.devOtp;
    if (!otp) {
      logResult(`CREATE-HOME-${i + 1}`, 'Create home user', false, 'No dev OTP returned');
      continue;
    }

    const verifyRes = await apiRequest('POST', '/api/auth/verify-otp', { phone, otp });
    if (verifyRes.status !== 200) {
      logResult(`CREATE-HOME-${i + 1}`, 'Create home user', false, `OTP verify failed: ${JSON.stringify(verifyRes.data)}`);
      continue;
    }

    const token = verifyRes.data.token;
    const userId = verifyRes.data.user?.id;

    if (verifyRes.data.isNewUser || verifyRes.data.needsPassword) {
      await apiRequest('POST', '/api/auth/set-password', { password: TEST_PASSWORD }, token);
    }

    await apiRequest('PATCH', '/api/user/profile', {
      displayName,
      userType: 'HOME',
    }, token);

    await apiRequest('POST', '/api/user/complete-onboarding', {}, token);

    homeUsers.push({
      id: userId,
      phone,
      token,
      displayName,
      userType: 'HOME',
      currency,
    });

    logResult(`CREATE-HOME-${i + 1}`, `Create home user ${displayName}`, true, phone);
  }

  // Create 5 staff users
  console.log('\nCreating 5 STAFF users...');
  for (let i = 0; i < 5; i++) {
    const phone = generatePhoneNumber(i, '71');
    const displayName = `ModuleStaff${i + 1}`;
    const currency = currencies[i % currencies.length];

    const otpRes = await apiRequest('POST', '/api/auth/request-otp', { phone });
    if (otpRes.status !== 200) {
      logResult(`CREATE-STAFF-${i + 1}`, 'Create staff user', false, `OTP request failed: ${JSON.stringify(otpRes.data)}`);
      continue;
    }

    const otp = otpRes.data.devOtp;
    if (!otp) {
      logResult(`CREATE-STAFF-${i + 1}`, 'Create staff user', false, 'No dev OTP returned');
      continue;
    }

    const verifyRes = await apiRequest('POST', '/api/auth/verify-otp', { phone, otp });
    if (verifyRes.status !== 200) {
      logResult(`CREATE-STAFF-${i + 1}`, 'Create staff user', false, `OTP verify failed: ${JSON.stringify(verifyRes.data)}`);
      continue;
    }

    const token = verifyRes.data.token;
    const userId = verifyRes.data.user?.id;

    if (verifyRes.data.isNewUser || verifyRes.data.needsPassword) {
      await apiRequest('POST', '/api/auth/set-password', { password: TEST_PASSWORD }, token);
    }

    await apiRequest('PATCH', '/api/user/profile', {
      displayName,
      userType: 'STAFF',
    }, token);

    await apiRequest('POST', '/api/user/complete-onboarding', {}, token);

    staffUsers.push({
      id: userId,
      phone,
      token,
      displayName,
      userType: 'STAFF',
      currency,
    });

    logResult(`CREATE-STAFF-${i + 1}`, `Create staff user ${displayName}`, true, phone);
  }

  console.log(`\nCreated ${homeUsers.length} home users and ${staffUsers.length} staff users\n`);
  return { homeUsers, staffUsers };
}

// ============ PHASE 2: Establish Connections and Bindings ============
async function setupConnectionsAndBindings(homeUsers: TestUser[], staffUsers: TestUser[]): Promise<TestPair[]> {
  console.log('\n=== PHASE 2: Establishing Connections and Bindings ===\n');
  
  const pairs: TestPair[] = [];
  const pairCount = Math.min(homeUsers.length, staffUsers.length);

  for (let i = 0; i < pairCount; i++) {
    const home = homeUsers[i];
    const staff = staffUsers[i];
    const pair: TestPair = { home, staff };

    console.log(`\nSetting up pair ${i + 1}: ${home.displayName} <-> ${staff.displayName}`);

    // Step 1: Home creates collaboration link
    const createLinkRes = await apiRequest('POST', '/api/collaboration/create-link', {
      homeAccountId: `home-account-${i + 1}`,
      isHomeUser: true,
    }, home.token);

    if (createLinkRes.status !== 200 || !createLinkRes.data.invitationCode) {
      logResult(`SETUP-LINK-${i + 1}`, 'Create collaboration link', false, JSON.stringify(createLinkRes.data));
      pairs.push(pair);
      continue;
    }

    const invitationCode = createLinkRes.data.invitationCode;
    logResult(`SETUP-LINK-${i + 1}`, 'Create collaboration link', true, `Code: ${invitationCode}`);

    // Step 2: Staff accepts the invitation
    const acceptRes = await apiRequest('POST', '/api/collaboration/accept-link', {
      invitationCode,
      accountId: `staff-account-${i + 1}`,
    }, staff.token);

    if (acceptRes.status !== 200) {
      logResult(`SETUP-ACCEPT-${i + 1}`, 'Staff accepts invitation', false, JSON.stringify(acceptRes.data));
      pairs.push(pair);
      continue;
    }

    pair.linkId = acceptRes.data.linkId || createLinkRes.data.linkId;
    logResult(`SETUP-ACCEPT-${i + 1}`, 'Staff accepts invitation', true, `Link ID: ${pair.linkId}`);

    // Step 3: Create binding between home person and staff client
    const bindingRes = await apiRequest('POST', '/api/bindings', {
      linkId: pair.linkId,
      homePersonId: `home-person-${i + 1}`,
      homePersonName: `Person from ${home.displayName}`,
      staffClientId: `staff-client-${i + 1}`,
      staffClientName: `Client of ${staff.displayName}`,
    }, home.token);

    if (bindingRes.status !== 200 || !bindingRes.data.binding) {
      logResult(`SETUP-BINDING-${i + 1}`, 'Create binding', false, JSON.stringify(bindingRes.data));
      pairs.push(pair);
      continue;
    }

    pair.bindingId = bindingRes.data.binding.id;
    logResult(`SETUP-BINDING-${i + 1}`, 'Create binding', true, `Binding ID: ${pair.bindingId}`);

    pairs.push(pair);
  }

  const successfulPairs = pairs.filter(p => p.bindingId);
  console.log(`\nEstablished ${successfulPairs.length} complete pairs with bindings\n`);
  return pairs;
}

// ============ PHASE 3: Home User Module Tests ============
async function testHomeUserModules(pairs: TestPair[]) {
  console.log('\n=== PHASE 3: Home User Module Tests (Cross-User Sync) ===\n');

  const pair = pairs.find(p => p.bindingId);
  if (!pair || !pair.bindingId) {
    console.log('No valid pair with binding found for testing');
    return;
  }

  const { home, staff, bindingId } = pair;

  // ---- Test 3.1: Shared Attendance - Home Creates, Staff Approves ----
  console.log('\n--- Test 3.1: Shared Attendance (Home -> Staff Approval) ---\n');

  const attendanceDate = getTodayDate();
  
  // Home creates attendance record
  const createAttRes = await apiRequest('POST', '/api/shared-attendance', {
    bindingId,
    date: attendanceDate,
    status: 'FULL',
    hoursWorked: 8,
    note: 'E2E module test attendance - Home created',
    recordCurrency: home.currency,
  }, home.token);

  if (createAttRes.status !== 200) {
    logResult('ATT-HOME-001', 'Home creates attendance', false, JSON.stringify(createAttRes.data));
  } else {
    const attendanceId = createAttRes.data.attendanceId;
    logResult('ATT-HOME-001', 'Home creates attendance', true, `ID: ${attendanceId}`);

    // Staff verifies they can see it
    const staffGetRes = await apiRequest('GET', `/api/shared-attendance?bindingId=${bindingId}`, undefined, staff.token);
    
    if (staffGetRes.status === 200) {
      const records = staffGetRes.data.attendance || [];
      const found = records.some((r: any) => r.id === attendanceId);
      logResult('ATT-HOME-002', 'Staff can see attendance created by Home', found, 
        found ? `Found ${records.length} records` : 'Record not found');

      // Verify it's pending
      const record = records.find((r: any) => r.id === attendanceId);
      if (record) {
        logResult('ATT-HOME-003', 'Attendance is pending status', record.approvalStatus === 'pending',
          `Status: ${record.approvalStatus}`);
      }
    } else {
      logResult('ATT-HOME-002', 'Staff can see attendance created by Home', false, JSON.stringify(staffGetRes.data));
    }

    // Staff approves
    const approveRes = await apiRequest('PATCH', `/api/shared-attendance/${attendanceId}/action`, {
      action: 'approve',
    }, staff.token);

    logResult('ATT-HOME-004', 'Staff approves attendance', approveRes.status === 200,
      approveRes.status === 200 ? 'Approved' : JSON.stringify(approveRes.data));

    // Both verify approved status
    const homeVerifyRes = await apiRequest('GET', `/api/shared-attendance/${attendanceId}`, undefined, home.token);
    if (homeVerifyRes.status === 200) {
      const approved = homeVerifyRes.data.attendance?.approvalStatus === 'approved';
      logResult('ATT-HOME-005', 'Home sees approved status', approved, 
        `Status: ${homeVerifyRes.data.attendance?.approvalStatus}`);
    } else {
      logResult('ATT-HOME-005', 'Home sees approved status', false, JSON.stringify(homeVerifyRes.data));
    }

    const staffVerifyRes = await apiRequest('GET', `/api/shared-attendance/${attendanceId}`, undefined, staff.token);
    if (staffVerifyRes.status === 200) {
      const approved = staffVerifyRes.data.attendance?.approvalStatus === 'approved';
      logResult('ATT-HOME-006', 'Staff sees approved status', approved,
        `Status: ${staffVerifyRes.data.attendance?.approvalStatus}`);
    } else {
      logResult('ATT-HOME-006', 'Staff sees approved status', false, JSON.stringify(staffVerifyRes.data));
    }
  }

  // ---- Test 3.2: Shared Laundry - Home Creates, Staff Approves ----
  console.log('\n--- Test 3.2: Shared Laundry (Home -> Staff Approval) ---\n');

  const laundryDate = getTodayDate();
  const laundryItems = [
    { type: 'shirt', quantity: 5, rate: 10 },
    { type: 'pants', quantity: 3, rate: 15 },
    { type: 'towels', quantity: 2, rate: 8 },
  ];

  const createLaundryRes = await apiRequest('POST', '/api/shared-laundry', {
    bindingId,
    date: laundryDate,
    items: laundryItems,
    itemsTotal: 111,
    total: 111,
    recordCurrency: home.currency,
    serviceType: 'wash_and_fold',
  }, home.token);

  if (createLaundryRes.status !== 200) {
    logResult('LAUN-HOME-001', 'Home creates laundry batch', false, JSON.stringify(createLaundryRes.data));
  } else {
    const laundryId = createLaundryRes.data.laundryId;
    logResult('LAUN-HOME-001', 'Home creates laundry batch', true, `ID: ${laundryId}`);

    // Staff verifies they can see it
    const staffGetRes = await apiRequest('GET', `/api/shared-laundry?bindingId=${bindingId}`, undefined, staff.token);
    
    if (staffGetRes.status === 200) {
      const records = staffGetRes.data.laundry || [];
      const found = records.some((r: any) => r.id === laundryId);
      logResult('LAUN-HOME-002', 'Staff can see laundry created by Home', found,
        found ? `Found ${records.length} records` : 'Record not found');

      // Verify it's pending
      const record = records.find((r: any) => r.id === laundryId);
      if (record) {
        logResult('LAUN-HOME-003', 'Laundry is pending status', record.approvalStatus === 'pending',
          `Status: ${record.approvalStatus}`);
      }
    } else {
      logResult('LAUN-HOME-002', 'Staff can see laundry created by Home', false, JSON.stringify(staffGetRes.data));
    }

    // Staff approves
    const approveRes = await apiRequest('PATCH', `/api/shared-laundry/${laundryId}/action`, {
      action: 'approve',
    }, staff.token);

    logResult('LAUN-HOME-004', 'Staff approves laundry', approveRes.status === 200,
      approveRes.status === 200 ? 'Approved' : JSON.stringify(approveRes.data));

    // Both verify approved status
    const homeVerifyRes = await apiRequest('GET', `/api/shared-laundry/${laundryId}`, undefined, home.token);
    if (homeVerifyRes.status === 200) {
      const approved = homeVerifyRes.data.laundry?.approvalStatus === 'approved';
      logResult('LAUN-HOME-005', 'Home sees approved status', approved,
        `Status: ${homeVerifyRes.data.laundry?.approvalStatus}`);
    } else {
      logResult('LAUN-HOME-005', 'Home sees approved status', false, JSON.stringify(homeVerifyRes.data));
    }

    const staffVerifyRes = await apiRequest('GET', `/api/shared-laundry/${laundryId}`, undefined, staff.token);
    if (staffVerifyRes.status === 200) {
      const approved = staffVerifyRes.data.laundry?.approvalStatus === 'approved';
      logResult('LAUN-HOME-006', 'Staff sees approved status', approved,
        `Status: ${staffVerifyRes.data.laundry?.approvalStatus}`);
    } else {
      logResult('LAUN-HOME-006', 'Staff sees approved status', false, JSON.stringify(staffVerifyRes.data));
    }
  }
}

// ============ PHASE 4: Staff User Module Tests ============
async function testStaffUserModules(pairs: TestPair[]) {
  console.log('\n=== PHASE 4: Staff User Module Tests (Cross-User Sync) ===\n');

  // Use second pair for staff-initiated tests
  const pair = pairs.length > 1 ? pairs.find((p, i) => i >= 1 && p.bindingId) : pairs.find(p => p.bindingId);
  if (!pair || !pair.bindingId) {
    console.log('No valid pair with binding found for testing');
    return;
  }

  const { home, staff, bindingId } = pair;

  // ---- Test 4.1: Shared Attendance - Staff Creates, Home Approves ----
  console.log('\n--- Test 4.1: Shared Attendance (Staff -> Home Approval) ---\n');

  const attendanceDate = getDateOffset(1); // Tomorrow to avoid conflict
  
  // Staff creates attendance record
  const createAttRes = await apiRequest('POST', '/api/shared-attendance', {
    bindingId,
    date: attendanceDate,
    status: 'HALF',
    hoursWorked: 4,
    note: 'E2E module test attendance - Staff created',
    recordCurrency: staff.currency,
  }, staff.token);

  if (createAttRes.status !== 200) {
    logResult('ATT-STAFF-001', 'Staff creates attendance', false, JSON.stringify(createAttRes.data));
  } else {
    const attendanceId = createAttRes.data.attendanceId;
    logResult('ATT-STAFF-001', 'Staff creates attendance', true, `ID: ${attendanceId}`);

    // Home verifies they can see it
    const homeGetRes = await apiRequest('GET', `/api/shared-attendance?bindingId=${bindingId}`, undefined, home.token);
    
    if (homeGetRes.status === 200) {
      const records = homeGetRes.data.attendance || [];
      const found = records.some((r: any) => r.id === attendanceId);
      logResult('ATT-STAFF-002', 'Home can see attendance created by Staff', found,
        found ? `Found ${records.length} records` : 'Record not found');

      // Verify it's pending
      const record = records.find((r: any) => r.id === attendanceId);
      if (record) {
        logResult('ATT-STAFF-003', 'Attendance is pending status', record.approvalStatus === 'pending',
          `Status: ${record.approvalStatus}`);
      }
    } else {
      logResult('ATT-STAFF-002', 'Home can see attendance created by Staff', false, JSON.stringify(homeGetRes.data));
    }

    // Home approves
    const approveRes = await apiRequest('PATCH', `/api/shared-attendance/${attendanceId}/action`, {
      action: 'approve',
    }, home.token);

    logResult('ATT-STAFF-004', 'Home approves attendance', approveRes.status === 200,
      approveRes.status === 200 ? 'Approved' : JSON.stringify(approveRes.data));

    // Both verify approved status
    const staffVerifyRes = await apiRequest('GET', `/api/shared-attendance/${attendanceId}`, undefined, staff.token);
    if (staffVerifyRes.status === 200) {
      const approved = staffVerifyRes.data.attendance?.approvalStatus === 'approved';
      logResult('ATT-STAFF-005', 'Staff sees approved status', approved,
        `Status: ${staffVerifyRes.data.attendance?.approvalStatus}`);
    } else {
      logResult('ATT-STAFF-005', 'Staff sees approved status', false, JSON.stringify(staffVerifyRes.data));
    }

    const homeVerifyRes = await apiRequest('GET', `/api/shared-attendance/${attendanceId}`, undefined, home.token);
    if (homeVerifyRes.status === 200) {
      const approved = homeVerifyRes.data.attendance?.approvalStatus === 'approved';
      logResult('ATT-STAFF-006', 'Home sees approved status', approved,
        `Status: ${homeVerifyRes.data.attendance?.approvalStatus}`);
    } else {
      logResult('ATT-STAFF-006', 'Home sees approved status', false, JSON.stringify(homeVerifyRes.data));
    }
  }

  // ---- Test 4.2: Shared Laundry - Staff Creates, Home Approves ----
  console.log('\n--- Test 4.2: Shared Laundry (Staff -> Home Approval) ---\n');

  const laundryDate = getDateOffset(1); // Tomorrow
  const laundryItems = [
    { type: 'bedsheets', quantity: 2, rate: 25 },
    { type: 'curtains', quantity: 1, rate: 50 },
  ];

  const createLaundryRes = await apiRequest('POST', '/api/shared-laundry', {
    bindingId,
    date: laundryDate,
    items: laundryItems,
    itemsTotal: 100,
    total: 100,
    recordCurrency: staff.currency,
    serviceType: 'dry_clean',
  }, staff.token);

  if (createLaundryRes.status !== 200) {
    logResult('LAUN-STAFF-001', 'Staff creates laundry batch', false, JSON.stringify(createLaundryRes.data));
  } else {
    const laundryId = createLaundryRes.data.laundryId;
    logResult('LAUN-STAFF-001', 'Staff creates laundry batch', true, `ID: ${laundryId}`);

    // Home verifies they can see it
    const homeGetRes = await apiRequest('GET', `/api/shared-laundry?bindingId=${bindingId}`, undefined, home.token);
    
    if (homeGetRes.status === 200) {
      const records = homeGetRes.data.laundry || [];
      const found = records.some((r: any) => r.id === laundryId);
      logResult('LAUN-STAFF-002', 'Home can see laundry created by Staff', found,
        found ? `Found ${records.length} records` : 'Record not found');

      // Verify it's pending
      const record = records.find((r: any) => r.id === laundryId);
      if (record) {
        logResult('LAUN-STAFF-003', 'Laundry is pending status', record.approvalStatus === 'pending',
          `Status: ${record.approvalStatus}`);
      }
    } else {
      logResult('LAUN-STAFF-002', 'Home can see laundry created by Staff', false, JSON.stringify(homeGetRes.data));
    }

    // Home approves
    const approveRes = await apiRequest('PATCH', `/api/shared-laundry/${laundryId}/action`, {
      action: 'approve',
    }, home.token);

    logResult('LAUN-STAFF-004', 'Home approves laundry', approveRes.status === 200,
      approveRes.status === 200 ? 'Approved' : JSON.stringify(approveRes.data));

    // Both verify approved status
    const staffVerifyRes = await apiRequest('GET', `/api/shared-laundry/${laundryId}`, undefined, staff.token);
    if (staffVerifyRes.status === 200) {
      const approved = staffVerifyRes.data.laundry?.approvalStatus === 'approved';
      logResult('LAUN-STAFF-005', 'Staff sees approved status', approved,
        `Status: ${staffVerifyRes.data.laundry?.approvalStatus}`);
    } else {
      logResult('LAUN-STAFF-005', 'Staff sees approved status', false, JSON.stringify(staffVerifyRes.data));
    }

    const homeVerifyRes = await apiRequest('GET', `/api/shared-laundry/${laundryId}`, undefined, home.token);
    if (homeVerifyRes.status === 200) {
      const approved = homeVerifyRes.data.laundry?.approvalStatus === 'approved';
      logResult('LAUN-STAFF-006', 'Home sees approved status', approved,
        `Status: ${homeVerifyRes.data.laundry?.approvalStatus}`);
    } else {
      logResult('LAUN-STAFF-006', 'Home sees approved status', false, JSON.stringify(homeVerifyRes.data));
    }
  }
}

// ============ PHASE 5: Data Isolation Tests ============
async function testDataIsolation(pairs: TestPair[]) {
  console.log('\n=== PHASE 5: Data Isolation Tests ===\n');

  if (pairs.length < 2) {
    console.log('Need at least 2 pairs for isolation testing');
    return;
  }

  const pair1 = pairs.find(p => p.bindingId);
  const pair2 = pairs.find((p, i) => i !== pairs.indexOf(pair1!) && p.bindingId);

  if (!pair1?.bindingId || !pair2?.bindingId) {
    console.log('Not enough pairs with bindings for isolation testing');
    return;
  }

  console.log(`Testing isolation between Pair1 (${pair1.home.displayName}-${pair1.staff.displayName}) and Pair2 (${pair2.home.displayName}-${pair2.staff.displayName})`);

  // ---- Test 5.1: Home1 cannot see Pair2's bindings ----
  console.log('\n--- Test 5.1: Cross-Pair Binding Isolation ---\n');

  const home1BindingsRes = await apiRequest('GET', '/api/bindings', undefined, pair1.home.token);
  if (home1BindingsRes.status === 200) {
    const bindings = home1BindingsRes.data.bindings || [];
    const hasPair2Binding = bindings.some((b: any) => b.id === pair2.bindingId);
    logResult('ISO-001', 'Home1 cannot see Pair2 bindings', !hasPair2Binding,
      hasPair2Binding ? 'SECURITY ISSUE: Can see other pair bindings' : 'Correctly isolated');
  } else {
    logResult('ISO-001', 'Home1 cannot see Pair2 bindings', false, JSON.stringify(home1BindingsRes.data));
  }

  // ---- Test 5.2: Staff1 cannot see Pair2's bindings ----
  const staff1BindingsRes = await apiRequest('GET', '/api/bindings', undefined, pair1.staff.token);
  if (staff1BindingsRes.status === 200) {
    const bindings = staff1BindingsRes.data.bindings || [];
    const hasPair2Binding = bindings.some((b: any) => b.id === pair2.bindingId);
    logResult('ISO-002', 'Staff1 cannot see Pair2 bindings', !hasPair2Binding,
      hasPair2Binding ? 'SECURITY ISSUE: Can see other pair bindings' : 'Correctly isolated');
  } else {
    logResult('ISO-002', 'Staff1 cannot see Pair2 bindings', false, JSON.stringify(staff1BindingsRes.data));
  }

  // ---- Test 5.3: Create attendance in Pair2 and verify Pair1 cannot access ----
  console.log('\n--- Test 5.2: Cross-Pair Attendance Isolation ---\n');

  const isolationAttDate = getDateOffset(2);
  const createAttRes = await apiRequest('POST', '/api/shared-attendance', {
    bindingId: pair2.bindingId,
    date: isolationAttDate,
    status: 'FULL',
    hoursWorked: 8,
    note: 'Isolation test attendance',
  }, pair2.home.token);

  if (createAttRes.status === 200) {
    const isolationAttId = createAttRes.data.attendanceId;
    logResult('ISO-003', 'Pair2 creates attendance for isolation test', true, `ID: ${isolationAttId}`);

    // Home1 tries to access Pair2's attendance directly
    const home1AccessRes = await apiRequest('GET', `/api/shared-attendance/${isolationAttId}`, undefined, pair1.home.token);
    const accessDenied = home1AccessRes.status === 403 || home1AccessRes.status === 404;
    logResult('ISO-004', 'Home1 cannot access Pair2 attendance directly', accessDenied,
      accessDenied ? `Correctly denied (${home1AccessRes.status})` : `SECURITY ISSUE: Status ${home1AccessRes.status}`);

    // Staff1 tries to access Pair2's attendance directly
    const staff1AccessRes = await apiRequest('GET', `/api/shared-attendance/${isolationAttId}`, undefined, pair1.staff.token);
    const staff1Denied = staff1AccessRes.status === 403 || staff1AccessRes.status === 404;
    logResult('ISO-005', 'Staff1 cannot access Pair2 attendance directly', staff1Denied,
      staff1Denied ? `Correctly denied (${staff1AccessRes.status})` : `SECURITY ISSUE: Status ${staff1AccessRes.status}`);

    // Home1 tries to query Pair2's binding for attendance
    const home1QueryRes = await apiRequest('GET', `/api/shared-attendance?bindingId=${pair2.bindingId}`, undefined, pair1.home.token);
    if (home1QueryRes.status === 200) {
      const records = home1QueryRes.data.attendance || [];
      const canSeeIsolatedRecord = records.some((r: any) => r.id === isolationAttId);
      logResult('ISO-006', 'Home1 cannot query Pair2 attendance list', !canSeeIsolatedRecord,
        canSeeIsolatedRecord ? 'SECURITY ISSUE: Can see isolated records' : 'Correctly empty/isolated');
    } else {
      logResult('ISO-006', 'Home1 cannot query Pair2 attendance list', true, `Correctly denied (${home1QueryRes.status})`);
    }
  } else {
    logResult('ISO-003', 'Pair2 creates attendance for isolation test', false, JSON.stringify(createAttRes.data));
  }

  // ---- Test 5.4: Laundry Isolation ----
  console.log('\n--- Test 5.3: Cross-Pair Laundry Isolation ---\n');

  const isolationLaunDate = getDateOffset(2);
  const createLaunRes = await apiRequest('POST', '/api/shared-laundry', {
    bindingId: pair2.bindingId,
    date: isolationLaunDate,
    items: [{ type: 'test', quantity: 1, rate: 10 }],
    total: 10,
  }, pair2.staff.token);

  if (createLaunRes.status === 200) {
    const isolationLaunId = createLaunRes.data.laundryId;
    logResult('ISO-007', 'Pair2 creates laundry for isolation test', true, `ID: ${isolationLaunId}`);

    // Home1 tries to access Pair2's laundry directly
    const home1AccessRes = await apiRequest('GET', `/api/shared-laundry/${isolationLaunId}`, undefined, pair1.home.token);
    const accessDenied = home1AccessRes.status === 403 || home1AccessRes.status === 404;
    logResult('ISO-008', 'Home1 cannot access Pair2 laundry directly', accessDenied,
      accessDenied ? `Correctly denied (${home1AccessRes.status})` : `SECURITY ISSUE: Status ${home1AccessRes.status}`);

    // Staff1 tries to access Pair2's laundry directly
    const staff1AccessRes = await apiRequest('GET', `/api/shared-laundry/${isolationLaunId}`, undefined, pair1.staff.token);
    const staff1Denied = staff1AccessRes.status === 403 || staff1AccessRes.status === 404;
    logResult('ISO-009', 'Staff1 cannot access Pair2 laundry directly', staff1Denied,
      staff1Denied ? `Correctly denied (${staff1AccessRes.status})` : `SECURITY ISSUE: Status ${staff1AccessRes.status}`);

    // Staff1 tries to query Pair2's binding for laundry
    const staff1QueryRes = await apiRequest('GET', `/api/shared-laundry?bindingId=${pair2.bindingId}`, undefined, pair1.staff.token);
    if (staff1QueryRes.status === 200) {
      const records = staff1QueryRes.data.laundry || [];
      const canSeeIsolatedRecord = records.some((r: any) => r.id === isolationLaunId);
      logResult('ISO-010', 'Staff1 cannot query Pair2 laundry list', !canSeeIsolatedRecord,
        canSeeIsolatedRecord ? 'SECURITY ISSUE: Can see isolated records' : 'Correctly empty/isolated');
    } else {
      logResult('ISO-010', 'Staff1 cannot query Pair2 laundry list', true, `Correctly denied (${staff1QueryRes.status})`);
    }
  } else {
    logResult('ISO-007', 'Pair2 creates laundry for isolation test', false, JSON.stringify(createLaunRes.data));
  }

  // ---- Test 5.5: Unconnected user access attempt ----
  console.log('\n--- Test 5.4: Unconnected User Access Denial ---\n');

  // If we have more users, test with an unconnected one
  if (pairs.length >= 3) {
    const unconnectedPair = pairs.find((p, i) => i >= 2 && p.home && p.staff);
    if (unconnectedPair && pair1.bindingId) {
      // Unconnected home tries to access Pair1's attendance
      const unconnectedRes = await apiRequest('GET', `/api/shared-attendance?bindingId=${pair1.bindingId}`, undefined, unconnectedPair.home.token);
      if (unconnectedRes.status === 200) {
        const records = unconnectedRes.data.attendance || [];
        logResult('ISO-011', 'Unconnected user cannot see connected pair data', records.length === 0,
          records.length === 0 ? 'Correctly empty' : `SECURITY ISSUE: Found ${records.length} records`);
      } else {
        logResult('ISO-011', 'Unconnected user cannot see connected pair data', true, 
          `Correctly denied (${unconnectedRes.status})`);
      }
    }
  }
}

// ============ PHASE 6: Report Summary ============
function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('               MODULE TEST SUMMARY');
  console.log('='.repeat(60) + '\n');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const total = results.length;

  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed} (${((passed / total) * 100).toFixed(1)}%)`);
  console.log(`Failed: ${failed} (${((failed / total) * 100).toFixed(1)}%)`);

  if (failed > 0) {
    console.log('\n--- Failed Tests ---\n');
    results
      .filter(r => r.status === 'FAIL')
      .forEach(r => {
        console.log(`  ✗ ${r.testId}: ${r.scenario}`);
        console.log(`    Details: ${r.details}`);
      });
  }

  // Group by category
  console.log('\n--- Results by Category ---\n');
  
  const categories = [
    { prefix: 'CREATE-', name: 'User Creation' },
    { prefix: 'SETUP-', name: 'Connection Setup' },
    { prefix: 'ATT-HOME-', name: 'Attendance (Home-initiated)' },
    { prefix: 'LAUN-HOME-', name: 'Laundry (Home-initiated)' },
    { prefix: 'ATT-STAFF-', name: 'Attendance (Staff-initiated)' },
    { prefix: 'LAUN-STAFF-', name: 'Laundry (Staff-initiated)' },
    { prefix: 'ISO-', name: 'Data Isolation' },
  ];

  categories.forEach(cat => {
    const catResults = results.filter(r => r.testId.startsWith(cat.prefix));
    if (catResults.length > 0) {
      const catPassed = catResults.filter(r => r.status === 'PASS').length;
      const status = catPassed === catResults.length ? '✓' : '✗';
      console.log(`  ${status} ${cat.name}: ${catPassed}/${catResults.length} passed`);
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log(`Test run completed at ${new Date().toISOString()}`);
  console.log('='.repeat(60) + '\n');
}

// ============ MAIN EXECUTION ============
async function main() {
  console.log('='.repeat(60));
  console.log('  Home Staff 360 v2.0 - Comprehensive E2E Module Tests');
  console.log('='.repeat(60));
  console.log(`\nTarget: ${BASE_URL}`);
  console.log(`Started: ${new Date().toISOString()}\n`);

  try {
    // Phase 1: Create users
    const { homeUsers, staffUsers } = await createTestUsers();

    if (homeUsers.length === 0 || staffUsers.length === 0) {
      console.log('\nFailed to create test users. Aborting tests.');
      printSummary();
      return;
    }

    // Phase 2: Setup connections and bindings
    const pairs = await setupConnectionsAndBindings(homeUsers, staffUsers);

    if (pairs.filter(p => p.bindingId).length === 0) {
      console.log('\nFailed to establish any connections with bindings. Aborting tests.');
      printSummary();
      return;
    }

    // Phase 3: Home user module tests
    await testHomeUserModules(pairs);

    // Phase 4: Staff user module tests
    await testStaffUserModules(pairs);

    // Phase 5: Data isolation tests
    await testDataIsolation(pairs);

    // Print summary
    printSummary();

  } catch (error) {
    console.error('\nTest execution failed with error:', error);
    printSummary();
  }
}

// Run the tests
main().catch(console.error);
