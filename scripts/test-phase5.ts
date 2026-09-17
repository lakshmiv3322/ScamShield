// scripts/test-phase5.ts
import { runFraudAnalysis } from '../server/services/analyzer.js';

async function runPhase5Tests() {
  console.log('🚀 Running Phase 5 Verification Tests...\n');

  // 1. Test Hinglish Fraud Keyword Detection: Electricity Disconnection Scam
  console.log('Test 1: Hinglish Electricity Disconnection Scam Detection');
  const elecResult = await runFraudAnalysis({
    text: 'Urgent: Aapka bijli bill nahi bhara. Tonight 9:30 PM connection band ho jayega. Click: http://discom-bill-update.online',
    linkUrl: 'http://discom-bill-update.online',
  });

  console.log('  Source:', elecResult.source);
  console.log('  Risk Level:', elecResult.analysis.riskLevel);
  console.log('  Risk Score:', elecResult.analysis.riskScore);
  console.log('  Scam Type:', elecResult.analysis.scamType);
  console.log('  Explanation Bullets:', elecResult.analysis.plainLanguageExplanation);

  if (elecResult.analysis.riskLevel !== 'scam' || elecResult.analysis.riskScore < 75) {
    throw new Error('❌ Test 1 Failed: Hinglish electricity scam was not flagged as high risk scam');
  }
  console.log('  ✅ Test 1 Passed\n');

  // 2. Test Hinglish Fraud Keyword Detection: Banking / KYC / Khata Freeze Scam
  console.log('Test 2: Hinglish Banking / KYC Khata Freeze Scam Detection');
  const kycResult = await runFraudAnalysis({
    text: 'Dear customer, your bank khata band ho jayega. Update KYC immediately or account freeze: http://sbi-kyc-update.xyz',
    linkUrl: 'http://sbi-kyc-update.xyz',
  });

  console.log('  Risk Level:', kycResult.analysis.riskLevel);
  console.log('  Risk Score:', kycResult.analysis.riskScore);
  console.log('  Scam Type:', kycResult.analysis.scamType);

  if (kycResult.analysis.riskLevel !== 'scam') {
    throw new Error('❌ Test 2 Failed: Hinglish KYC khata freeze scam was not flagged as scam');
  }
  console.log('  ✅ Test 2 Passed\n');

  // 3. Test API Endpoint: GET /api/map/pins
  console.log('Test 3: Threat Map Pins Endpoint (GET /api/map/pins)');
  let mapRes;
  try {
    mapRes = await fetch('http://127.0.0.1:3002/api/map/pins');
  } catch {
    mapRes = await fetch('http://127.0.0.1:3000/api/map/pins');
  }

  if (!mapRes.ok) {
    throw new Error(`HTTP ${mapRes.status} on /api/map/pins`);
  }
  const mapData = await mapRes.json();
  console.log('  Success:', mapData.success);
  console.log('  Pins Count:', mapData.pins?.length);

  if (!mapData.pins || mapData.pins.length === 0) {
    throw new Error('❌ Test 3 Failed: Map pins array is empty');
  }

  const samplePin = mapData.pins[0];
  console.log('  Sample Pin:', {
    cityName: samplePin.cityName,
    riskLevel: samplePin.riskLevel,
    scamType: samplePin.scamType,
    memberAffected: samplePin.memberAffected,
  });

  if (!samplePin.cityName || !samplePin.lat || !samplePin.lng || !samplePin.riskLevel) {
    throw new Error('❌ Test 3 Failed: Invalid pin data structure');
  }

  console.log('  ✅ Test 3 Passed\n');
  console.log('🎉 ALL PHASE 5 TESTS PASSED SUCCESSFULLY! ✅');
}

runPhase5Tests().catch((err) => {
  console.error('❌ Phase 5 Test Runner Error:', err);
  process.exit(1);
});
