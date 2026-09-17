// scripts/test-verification.ts
async function verifyEndpoints() {
  const base = 'http://127.0.0.1:3002';
  console.log('🚀 Verifying API Endpoints on', base, '...\n');

  // 1. GET /api/health
  console.log('1. Testing GET /api/health');
  const healthRes = await fetch(`${base}/api/health`);
  console.log('   Status:', healthRes.status);
  console.log('   CSP Header:', healthRes.headers.get('content-security-policy'));
  const healthData = await healthRes.json();
  console.log('   Body:', healthData);

  if (healthRes.status !== 200 || healthData.status !== 'ok') {
    throw new Error('❌ GET /api/health failed');
  }
  console.log('   ✅ GET /api/health PASS\n');

  // 2. POST /api/auth/register
  console.log('2. Testing POST /api/auth/register');
  const testEmail = `test_user_${Date.now()}@example.com`;
  const regRes = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Verification User',
      email: testEmail,
      password: 'Password123!',
      circleName: 'Verification Circle',
      relation: 'Son',
    }),
  });
  console.log('   Status:', regRes.status);
  const regData = await regRes.json();
  console.log('   Body:', { success: regData.success, user: regData.user?.email, family: regData.family?.name });

  if ((regRes.status !== 200 && regRes.status !== 201) || !regData.user) {
    throw new Error(`❌ POST /api/auth/register failed (${regRes.status})`);
  }
  console.log('   ✅ POST /api/auth/register PASS\n');

  // 3. POST /api/analyze
  console.log('3. Testing POST /api/analyze');
  const analyzeRes = await fetch(`${base}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: 'Urgent: Your electricity bill is unpaid. Service will be disconnected tonight. Pay now: http://discom-pay.online',
      linkUrl: 'http://discom-pay.online',
    }),
  });
  console.log('   Status:', analyzeRes.status);
  const analyzeData = await analyzeRes.json();
  console.log('   Body:', { success: analyzeData.success, riskLevel: analyzeData.analysis?.riskLevel, riskScore: analyzeData.analysis?.riskScore });

  if (analyzeRes.status !== 200 || !analyzeData.analysis) {
    throw new Error(`❌ POST /api/analyze failed (${analyzeRes.status})`);
  }
  console.log('   ✅ POST /api/analyze PASS\n');

  console.log('🎉 ALL ENDPOINT VERIFICATION TESTS PASSED CLEANLY! ✅');
}

verifyEndpoints().catch((err) => {
  console.error('❌ Verification Error:', err);
  process.exit(1);
});
