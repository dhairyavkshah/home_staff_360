
const BASE_URL = 'http://0.0.0.0:5000';
const BYPASS_HEADER = { 'x-test-bypass': 'rate-limit-skip' };

async function testApi() {
  console.log('--- Comprehensive Staff User Features API Test ---');
  
  const phone = '+91' + Math.floor(1000000000 + Math.random() * 9000000000);
  let token = '';
  let userId = '';

  try {
    // 1. Auth Flow
    console.log('\n[1. AUTH FLOW]');
    console.log(`Requesting OTP for ${phone}...`);
    const otpRes = await fetch(`${BASE_URL}/api/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...BYPASS_HEADER },
      body: JSON.stringify({ phone })
    });
    const otpData: any = await otpRes.json();
    if (!otpRes.ok) throw new Error(`OTP request failed: ${JSON.stringify(otpData)}`);
    const otp = otpData.devOtp;
    console.log('OTP received:', otp);

    console.log('Verifying OTP...');
    const verifyRes = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...BYPASS_HEADER },
      body: JSON.stringify({ phone, otp })
    });
    const verifyData: any = await verifyRes.json();
    if (!verifyRes.ok) throw new Error(`OTP verification failed: ${JSON.stringify(verifyData)}`);
    token = verifyData.token;
    userId = verifyData.user.id;
    console.log('Auth token obtained.');

    console.log('Setting Password...');
    const passRes = await fetch(`${BASE_URL}/api/auth/set-password`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${token}`,
        ...BYPASS_HEADER 
      },
      body: JSON.stringify({ password: 'Password123!' })
    });
    if (!passRes.ok) throw new Error('Failed to set password');
    console.log('Password set successfully.');

    console.log('Completing Onboarding as STAFF...');
    const onboardRes = await fetch(`${BASE_URL}/api/user/complete-onboarding`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${token}`,
        ...BYPASS_HEADER 
      },
      body: JSON.stringify({
        displayName: 'Test Staff User',
        userType: 'STAFF',
        settings: {
          currency: 'INR',
          language: 'en',
          salaryStartDay: 1,
          halfDayPercentage: 50,
          hasCompletedOnboarding: true
        }
      })
    });
    if (!onboardRes.ok) throw new Error(`Onboarding failed: ${await onboardRes.text()}`);
    console.log('Onboarding completed.');

    // 2. Client Management
    console.log('\n[2. CLIENT MANAGEMENT]');
    console.log('Checking for client management endpoints...');
    // We'll try common patterns if they exist
    const clientEndpoints = ['/api/staff/clients', '/api/client-homes', '/api/clients'];
    for (const endpoint of clientEndpoints) {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            headers: { 'Authorization': `Bearer ${token}`, ...BYPASS_HEADER }
        });
        console.log(`GET ${endpoint} status:`, res.status);
    }

    // 3. Invoices API
    console.log('\n[3. INVOICES API]');
    console.log('Testing POST /api/invoices...');
    const postInvoiceRes = await fetch(`${BASE_URL}/api/invoices`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${token}`,
        ...BYPASS_HEADER 
      },
      body: JSON.stringify({
        clientHomeId: 'test-client-id',
        invoiceNumber: 'INV-' + Date.now(),
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
        items: [{ description: 'House cleaning', quantity: 1, rate: 500, amount: 500 }],
        subtotal: 500,
        total: 500,
        status: 'pending'
      })
    });
    console.log('POST /api/invoices status:', postInvoiceRes.status);
    const postInvoiceData = await postInvoiceRes.text();
    if (postInvoiceData.startsWith('<!DOCTYPE html>')) {
        console.log('Result: 404/Catch-all (Missing Endpoint)');
    } else {
        console.log('POST /api/invoices response snippet:', postInvoiceData.substring(0, 100));
    }

    console.log('Testing GET /api/invoices...');
    const getInvoiceRes = await fetch(`${BASE_URL}/api/invoices`, {
      headers: { 'Authorization': `Bearer ${token}`, ...BYPASS_HEADER }
    });
    console.log('GET /api/invoices status:', getInvoiceRes.status);
    const getInvoiceData = await getInvoiceRes.text();
    if (getInvoiceData.startsWith('<!DOCTYPE html>')) {
        console.log('Result: 404/Catch-all (Missing Endpoint)');
    } else {
        try {
            const data = JSON.parse(getInvoiceData);
            console.log('Invoices received:', data);
        } catch(e) {
            console.log('Failed to parse invoice JSON');
        }
    }

    // 4. Earnings API
    console.log('\n[4. EARNINGS API]');
    console.log('Testing GET /api/earnings...');
    const getEarningsRes = await fetch(`${BASE_URL}/api/earnings`, {
      headers: { 'Authorization': `Bearer ${token}`, ...BYPASS_HEADER }
    });
    console.log('GET /api/earnings status:', getEarningsRes.status);
    const getEarningsData = await getEarningsRes.text();
    if (getEarningsData.startsWith('<!DOCTYPE html>')) {
        console.log('Result: 404/Catch-all (Missing Endpoint)');
    } else {
        try {
            const data = JSON.parse(getEarningsData);
            console.log('Earnings data:', data);
        } catch(e) {
            console.log('Failed to parse earnings JSON');
        }
    }

    // 5. Bindings API
    console.log('\n[5. BINDINGS API]');
    console.log('Testing POST /api/bindings (invalid data)...');
    const postBindingResInvalid = await fetch(`${BASE_URL}/api/bindings`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${token}`,
        ...BYPASS_HEADER 
      },
      body: JSON.stringify({
        targetUserId: 'some-user-id'
      })
    });
    console.log('POST /api/bindings (invalid) status:', postBindingResInvalid.status);
    console.log('POST /api/bindings (invalid) response:', await postBindingResInvalid.text());

    console.log('Testing GET /api/bindings...');
    const getBindingRes = await fetch(`${BASE_URL}/api/bindings`, {
      headers: { 'Authorization': `Bearer ${token}`, ...BYPASS_HEADER }
    });
    console.log('GET /api/bindings status:', getBindingRes.status);
    if (getBindingRes.ok) {
        const data = await getBindingRes.json();
        console.log('Bindings count:', data.bindings?.length || 0);
    }

  } catch (error) {
    console.error('Test Execution Error:', error);
  }
}

testApi();
