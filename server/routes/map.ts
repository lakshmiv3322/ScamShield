// server/routes/map.ts
import { Router } from 'express';
import { getDb } from '../db/client.js';
import { MapRiskPin, RiskLevel } from '../../src/types.js';

export const mapRouter = Router();

const INDIAN_CITIES = [
  { cityName: 'New Delhi (NCR)', lat: 28.6139, lng: 77.209 },
  { cityName: 'Mumbai', lat: 19.076, lng: 72.8777 },
  { cityName: 'Jamtara Cyber Hub', lat: 24.015, lng: 86.8021 },
  { cityName: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  { cityName: 'Jaipur', lat: 26.9124, lng: 75.7873 },
  { cityName: 'Pune', lat: 18.5204, lng: 73.8567 },
  { cityName: 'Hyderabad', lat: 17.385, lng: 78.4867 },
  { cityName: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { cityName: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
  { cityName: 'Chennai', lat: 13.0827, lng: 80.2707 },
];

const DEFAULT_PINS: MapRiskPin[] = [
  {
    id: 'pin_delhi',
    cityName: 'New Delhi (NCR)',
    lat: 28.6139,
    lng: 77.209,
    riskLevel: 'scam',
    scamSnippet: 'Fake Electricity Disconnection Scam targeted at Mother',
    memberAffected: 'Sunita Sharma',
    scamType: 'Fake Electricity Bill',
    timestamp: '2h ago',
    isPulsing: true,
  },
  {
    id: 'pin_mumbai',
    cityName: 'Mumbai',
    lat: 19.076,
    lng: 72.8777,
    riskLevel: 'scam',
    scamSnippet: 'Bank KYC PAN Update phishing link sent to Father',
    memberAffected: 'Ramesh Sharma',
    scamType: 'Fake KYC',
    timestamp: '1d ago',
    isPulsing: false,
  },
  {
    id: 'pin_jamtara',
    cityName: 'Jamtara Cyber Hub',
    lat: 24.015,
    lng: 86.8021,
    riskLevel: 'scam',
    scamSnippet: 'High-volume WhatsApp electricity disconnection phishing campaign',
    memberAffected: 'Family Shield Alert',
    scamType: 'Organized Cyber Fraud',
    timestamp: '3h ago',
    isPulsing: true,
  },
  {
    id: 'pin_jaipur',
    cityName: 'Jaipur',
    lat: 26.9124,
    lng: 75.7873,
    riskLevel: 'scam',
    scamSnippet: 'Emergency taxi cash impersonation attempt targeting Grandparent',
    memberAffected: 'Sunita Sharma',
    scamType: 'Family Impersonation',
    timestamp: '2d ago',
    isPulsing: false,
  },
  {
    id: 'pin_bengaluru',
    cityName: 'Bengaluru',
    lat: 12.9716,
    lng: 77.5946,
    riskLevel: 'caution',
    scamSnippet: 'Unclaimed parcel courier link with suspicious .top address',
    memberAffected: 'Ramesh Sharma',
    scamType: 'Phishing Link',
    timestamp: '3d ago',
    isPulsing: false,
  },
  {
    id: 'pin_pune',
    cityName: 'Pune',
    lat: 18.5204,
    lng: 73.8567,
    riskLevel: 'safe',
    scamSnippet: 'Verified delivery verification OTP cleared safely',
    memberAffected: 'Rahul Sharma',
    scamType: 'Legitimate OTP',
    timestamp: '4d ago',
    isPulsing: false,
  },
];

// GET /api/map/pins — Aggregate incident threat pins for 3D Cyber Radar
mapRouter.get('/pins', (req, res) => {
  try {
    const db = getDb();

    // Query analyzed messages from DB
    const rows = db
      .prepare(
        `SELECT m.id, m.sender_name, m.sender_relation, m.original_text, m.received_at,
                a.risk_level, a.scam_type
         FROM messages m
         JOIN analyses a ON m.id = a.message_id
         ORDER BY m.received_at DESC
         LIMIT 20`
      )
      .all() as any[];

    if (!rows || rows.length === 0) {
      res.json({ success: true, pins: DEFAULT_PINS });
      return;
    }

    const pins: MapRiskPin[] = rows.map((row, idx) => {
      const textLower = (row.original_text || '').toLowerCase();
      let city = INDIAN_CITIES[idx % INDIAN_CITIES.length];

      if (textLower.includes('delhi')) city = INDIAN_CITIES[0];
      else if (textLower.includes('mumbai')) city = INDIAN_CITIES[1];
      else if (textLower.includes('jamtara')) city = INDIAN_CITIES[2];
      else if (textLower.includes('bengaluru') || textLower.includes('bangalore')) city = INDIAN_CITIES[3];
      else if (textLower.includes('jaipur')) city = INDIAN_CITIES[4];
      else if (textLower.includes('pune')) city = INDIAN_CITIES[5];

      const snippet = (row.original_text || 'Suspicious Attachment').slice(0, 60);

      return {
        id: `pin_${row.id}`,
        cityName: city.cityName,
        lat: city.lat + (idx % 2 === 0 ? 0.15 : -0.15),
        lng: city.lng + (idx % 2 === 0 ? -0.15 : 0.15),
        riskLevel: (row.risk_level as RiskLevel) || 'caution',
        scamSnippet: snippet.length >= 60 ? snippet + '...' : snippet,
        memberAffected: row.sender_name || row.sender_relation || 'Family Member',
        scamType: row.scam_type || 'Unverified Message',
        timestamp: row.received_at ? 'Recently' : 'Just now',
        isPulsing: idx === 0,
      };
    });

    res.json({ success: true, pins });
  } catch (err: any) {
    console.error('Error building map pins:', err);
    res.json({ success: true, pins: DEFAULT_PINS });
  }
});
