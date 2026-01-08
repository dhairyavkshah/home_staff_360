const BASE_URL = 'http://0.0.0.0:5000';
const BYPASS_HEADER = { 'x-test-bypass': 'rate-limit-skip' };

async function runTests() {
  console.log('--- Staff User Features API Test ---');
  
  const phone = '+917777777777';
  let token = '';
  let userId = '';

  try {
    // 1. Request OTP
    console.log('1. Requesting OTP...');
    const otpRes = await fetch(`${BASE_URL}/api/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...BYPASS_HEADER },
      body: JSON.stringify({ phone })
    });
    const otpData: any = await otpRes.json();
    if (!otpRes.ok) throw new Error(`OTP request failed: ${JSON.stringify(otpData)}`);
    const otp = otpData.devOtp;
    console.log('OTP received (dev mode):', otp);

    // 2. Verify OTP
    console.log('2. Verifying OTP...');
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

    // 3. Set Password
    console.log('3. Setting Password...');
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
    console.log('Password set.');

    // 4. Complete Onboarding
    console.log('4. Completing Onboarding as STAFF...');
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
    const onboardData: any = await onboardRes.json();
    if (!onboardRes.ok) throw new Error(`Onboarding failed: ${JSON.stringify(onboardData)}`);
    console.log('Onboarding completed.');

    // 5. Test Bindings API
    console.log('5. Testing Bindings API...');
    const getBindRes = await fetch(`${BASE_URL}/api/bindings`, {
      headers: { 'Authorization': `Bearer ${token}`, ...BYPASS_HEADER }
    });
    const getBindData: any = await getBindRes.json();
    console.log('GET /api/bindings status:', getBindRes.status);
    console.log('Bindings count:', getBindData.bindings?.length || 0);

    // 6. Test Invoices API
    console.log('6. Testing Invoices API...');
    const getInvoiceRes = await fetch(`${BASE_URL}/api/invoices`, {
      headers: { 'Authorization': `Bearer ${token}`, ...BYPASS_HEADER }
    });
    console.log('GET /api/invoices status:', getInvoiceRes.status);
    
    if (getInvoiceRes.ok) {
        const invoiceData: any = await getInvoiceRes.json();
        console.log('Invoices count:', invoiceData.invoices?.length || 0);
    }

    const postInvoiceRes = await fetch(`${BASE_URL}/api/invoices`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${token}`,
        ...BYPASS_HEADER 
      },
      body: JSON.stringify({
        clientHomeId: 'test-client',
        invoiceNumber: 'INV-001',
        issueDate: new Date().toISOString(),
        dueDate: new Date().toISOString(),
        items: [{ description: 'Test Item', quantity: 1, rate: 100, amount: 100 }],
        subtotal: 100,
        total: 100,
        status: 'draft'
      })
    });
    console.log('POST /api/invoices status:', postInvoiceRes.status);

    // 7. Test Earnings API
    console.log('7. Testing Earnings API...');
    const getEarningsRes = await fetch(`${BASE_URL}/api/earnings`, {
      headers: { 'Authorization': `Bearer ${token}`, ...BYPASS_HEADER }
    });
    console.log('GET /api/earnings status:', getEarningsRes.status);

  } catch (error) {
    console.error('Test Suite Failed:', error);
  }
}

runTests();
