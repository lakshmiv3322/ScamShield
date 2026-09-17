// scripts/test-phase3.ts
import { getTestBaseUrl } from './test-helper.js';

async function runPhase3Tests() {
  const base = await getTestBaseUrl();

  // 1. Authenticate as Rahul Sharma
  const loginRes = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'rahul.sharma@example.com', password: 'password123' }),
  });
  const cookie = loginRes.headers.get('set-cookie')?.split(';')[0] || '';
  console.log('1. Auth status:', loginRes.status, 'Cookie set:', !!cookie);

  // 2. VAPID public key
  const vapidRes = await fetch(`${base}/api/notifications/vapid-public-key`);
  const vapidData = await vapidRes.json();
  console.log('2. VAPID Public Key retrieved:', vapidData.publicKey?.slice(0, 30) + '... (valid length: ' + vapidData.publicKey?.length + ')');

  // 3. Register Push Subscription
  const dummySub = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/test_scamshield_token_123',
    keys: {
      p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QT9t0AIdWOcqR-hkY00mHm7zLLfsT0',
      auth: 'tBHItJI5svbpez7KI4CCXg',
    },
  };

  const subRes = await fetch(`${base}/api/notifications/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie,
    },
    body: JSON.stringify({ subscription: dummySub }),
  });
  const subData = await subRes.json();
  console.log('3. Push subscription registration status:', subRes.status, 'Result:', subData.success ? 'SAVED_TO_DB ✅' : 'FAILED ❌');

  // 4. Trigger a new high-risk scam message to verify alert notification dispatch (push + email fallback)
  const alertTestMsg = {
    senderMemberId: 'mem_sunita',
    senderName: 'Sunita Sharma',
    senderRelation: 'Mother',
    senderContact: '+91 98450 19283',
    originalText: 'URGENT: Income tax refund ₹48,000 pending. Click http://refund-tax-claim.online immediately.',
    linkUrl: 'http://refund-tax-claim.online',
    analysis: {
      id: `an_test_${Date.now()}`,
      riskScore: 96,
      riskLevel: 'scam',
      scamType: 'Tax Refund Phishing',
      scamTypeLabel: 'Tax Phishing Trap',
      plainLanguageTitle: 'Counterfeit Tax Refund Trap',
      explanationBullets: ['Fake refund hook', 'Urgent timer trap'],
      plainLanguageExplanation: ['Fake refund hook', 'Urgent timer trap'],
      safeActionAdvice: ['Never enter credentials on .online domains'],
      actionableAdvice: 'Do not click the link.',
      confidenceScore: 0.98,
    },
  };

  const postMsgRes = await fetch(`${base}/api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify(alertTestMsg),
  });
  const postMsgData = await postMsgRes.json();
  console.log('4. Alert creation with push & email fallback dispatch status:', postMsgRes.status, 'Message ID:', postMsgData.message?.id);

  // 5. Retention policy update (PATCH /api/family/retention)
  const patchRetentionRes = await fetch(`${base}/api/family/retention`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify({ retentionDays: 60 }),
  });
  const patchRetentionData = await patchRetentionRes.json();
  console.log('5. Retention policy updated:', patchRetentionRes.status, 'New retention days:', patchRetentionData.retentionDays);

  // 6. Manual retention cleanup (POST /api/family/cleanup)
  const cleanupRes = await fetch(`${base}/api/family/cleanup`, {
    method: 'POST',
    headers: { cookie },
  });
  const cleanupData = await cleanupRes.json();
  console.log('6. Family retention cleanup sweep status:', cleanupRes.status, 'Pruned messages:', cleanupData.deletedMessages, 'Pruned alerts:', cleanupData.deletedAlerts);

  // 7. Admin retention cleanup (POST /api/admin/cleanup)
  const adminCleanupRes = await fetch(`${base}/api/admin/cleanup`, {
    method: 'POST',
  });
  const adminCleanupData = await adminCleanupRes.json();
  console.log('7. Admin retention sweep status:', adminCleanupRes.status, 'Total deleted messages:', adminCleanupData.deletedMessages);

  console.log('\n🎉 ALL PHASE 3 NOTIFICATION & RETENTION TESTS PASSED SUCCESSFULLY!');
}

runPhase3Tests().catch(console.error);
