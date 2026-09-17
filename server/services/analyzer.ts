// server/services/analyzer.ts
import { GoogleGenAI } from '@google/genai';

export interface AnalysisOutput {
  riskScore: number;
  riskLevel: 'safe' | 'caution' | 'scam';
  scamType: string;
  plainLanguageExplanation: string[];
  actionableAdvice: string;
}

export interface AnalyzeParams {
  text?: string;
  linkUrl?: string;
  imageUrl?: string;
  senderContact?: string;
}

let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

/**
 * Check URL against Google Safe Browsing API v4
 */
export async function checkGoogleSafeBrowsing(urlToCheck: string): Promise<{
  isMalicious: boolean;
  threatType?: string;
} | null> {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  if (!apiKey || !urlToCheck) return null;

  try {
    const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client: { clientId: 'scamshield', clientVersion: '1.0.0' },
        threatInfo: {
          threatTypes: [
            'MALWARE',
            'SOCIAL_ENGINEERING',
            'UNWANTED_SOFTWARE',
            'POTENTIALLY_HARMFUL_APPLICATION',
          ],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url: urlToCheck }],
        },
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    if (data && data.matches && data.matches.length > 0) {
      return {
        isMalicious: true,
        threatType: data.matches[0].threatType || 'SOCIAL_ENGINEERING',
      };
    }
    return { isMalicious: false };
  } catch (err) {
    console.error('Google Safe Browsing API check error:', err);
    return null;
  }
}

export async function runFraudAnalysis(params: AnalyzeParams): Promise<{
  analysis: AnalysisOutput;
  source: 'gemini-2.5-flash' | 'heuristic-engine' | 'google-safe-browsing';
}> {
  const { text, linkUrl, imageUrl, senderContact } = params;

  // 1. Google Safe Browsing API Check (if linkUrl or link in text present & API key set)
  const targetUrl = linkUrl || (text?.match(/https?:\/\/[^\s]+/)?.[0]);
  if (targetUrl) {
    const safeBrowsingResult = await checkGoogleSafeBrowsing(targetUrl);
    if (safeBrowsingResult?.isMalicious) {
      return {
        analysis: {
          riskScore: 100,
          riskLevel: 'scam',
          scamType: 'Malicious Phishing URL (Google Safe Browsing Flagged)',
          plainLanguageExplanation: [
            'Global Security Database Alert: The domain in this link is registered as a confirmed phishing or malware distribution vector in Google Safe Browsing.',
            'Deceptive Clone: Designed to capture bank credentials, UPI PINs, or install malicious Android payload files.',
            'Never open links from unverified WhatsApp forwards.',
          ],
          actionableAdvice: 'DO NOT click or open this link under any circumstances. Block the sender immediately.',
        },
        source: 'google-safe-browsing',
      };
    }
  }

  // 2. Gemini 2.5 Flash Multimodal Analysis
  const ai = getAI();
  if (ai) {
    try {
      const prompt = `You are ScamShield, an AI fraud detection copilot engineered to protect non-tech-savvy elderly parents and family members from financial fraud, WhatsApp scams, phishing, fake bills, impersonation, and KYC traps.

Analyze this forwarded message and provide output in strict JSON:
Message Text: "${text || 'No text provided'}"
Suspicious Link: "${linkUrl || 'None'}"
Sender Contact: "${senderContact || 'Unknown'}"
Has Image Attachment: ${imageUrl ? 'Yes, see attached image' : 'No'}

Evaluate:
1. Risk Score: 0 to 100 (0-30 = safe, 31-70 = caution, 71-100 = scam)
2. Risk Level: "safe" | "caution" | "scam"
3. Scam Type: short category (e.g. "Fake Electricity Bill", "Banking / KYC Trap", "Family Impersonation", "Courier Phishing", "Job Scam", "Legitimate Notification")
4. Plain-Language Explanation: 3-4 bullet points explaining EXACTLY why this is safe or risky in simple, non-jargon language that a grandmother would understand immediately.
5. Actionable Advice: Single clear sentence telling the family member what to do (e.g. "Do not click. Pay only through your official electricity provider app.")

Return ONLY a JSON object with this exact schema:
{
  "riskScore": number,
  "riskLevel": "safe" | "caution" | "scam",
  "scamType": string,
  "plainLanguageExplanation": string[],
  "actionableAdvice": string
}`;

      const contents: any[] = [];
      if (imageUrl && imageUrl.startsWith('data:')) {
        const mimeMatch = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (mimeMatch) {
          contents.push({
            inlineData: {
              mimeType: mimeMatch[1],
              data: mimeMatch[2],
            },
          });
        }
      }
      contents.push(prompt);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents.length === 1 ? prompt : contents,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const jsonText = response.text;
      if (jsonText) {
        const parsed = JSON.parse(jsonText);
        return {
          analysis: parsed,
          source: 'gemini-2.5-flash',
        };
      }
    } catch (geminiError) {
      console.error('Gemini API call failed, falling back to heuristic engine:', geminiError);
    }
  }

  // 3. Expanded Heuristic Fraud Engine (Rule-based Fallback for Indian Scams & Hinglish)
  const lower = (text || '').toLowerCase();
  const lowerLink = (linkUrl || '').toLowerCase();

  const hasUrgency =
    lower.includes('urgent') ||
    lower.includes('immediately') ||
    lower.includes('blocked') ||
    lower.includes('tonight') ||
    lower.includes('disconnect') ||
    lower.includes('suspended') ||
    lower.includes('freeze') ||
    lower.includes('within 24 hours') ||
    lower.includes('bijli') ||
    lower.includes('bijlee') ||
    lower.includes('khata band') ||
    lower.includes('khata freeze') ||
    lower.includes('account band') ||
    lower.includes('nahi diya toh') ||
    lower.includes('action liya jayega') ||
    lower.includes('fir darz') ||
    lower.includes('court notice') ||
    lower.includes('last chance') ||
    lower.includes('final warning');

  const hasFinancialOrIdentity =
    lower.includes('kyc') ||
    lower.includes('bank') ||
    lower.includes('account') ||
    lower.includes('otp') ||
    lower.includes('upi') ||
    lower.includes('tax refund') ||
    lower.includes('income tax vibhag') ||
    lower.includes('lottery') ||
    lower.includes('lottery jeeta') ||
    lower.includes('prize money') ||
    lower.includes('kbc') ||
    lower.includes('electricity') ||
    lower.includes('bill') ||
    lower.includes('recharge karo') ||
    lower.includes('ek baar click') ||
    lower.includes('paisa wapas') ||
    lower.includes('cbi') ||
    lower.includes('challan') ||
    lower.includes('aadhaar') ||
    lower.includes('pan card') ||
    lower.includes('reward points');

  const suspiciousTLDs = [
    '.buzz', '.site', '.info', '.club', '.shop', '.xyz', '.top',
    '.online', '.work', '.vip', '.monster', '.link', '.tk', '.ml',
    '.ga', '.cf', '.gq', '.app-apk', '.apk', '.is', '.cc'
  ];

  const hasSuspiciousDomain =
    suspiciousTLDs.some((tld) => lowerLink.includes(tld) || lower.includes(tld)) ||
    (lowerLink.length > 0 && !lowerLink.includes('gov.in') && !lowerLink.includes('nic.in') && (lowerLink.includes('bit.ly') || lowerLink.includes('tinyurl')));

  let riskScore = 15;
  let riskLevel: 'safe' | 'caution' | 'scam' = 'safe';
  let scamType = 'Legitimate Notification';
  let plainLanguageExplanation = [
    'Message does not exhibit recognizable fraud indicators or coercive tactics.',
    'Sender phrasing conforms to standard benign communication.',
  ];
  let actionableAdvice = 'This message appears safe. Remember never to share OTP codes with anyone.';

  if (hasUrgency && (hasFinancialOrIdentity || hasSuspiciousDomain)) {
    riskScore = 95;
    riskLevel = 'scam';

    if (lower.includes('electricity') || lower.includes('bijli') || lower.includes('bijlee') || lower.includes('light bill')) {
      scamType = 'Fake Electricity Disconnection Scam';
    } else if (lower.includes('kyc') || lower.includes('khata') || lower.includes('bank')) {
      scamType = 'Banking KYC Account Freeze Trap';
    } else if (lower.includes('lottery') || lower.includes('prize') || lower.includes('kbc')) {
      scamType = 'Fake Lottery & Reward Scam';
    } else if (lower.includes('tax') || lower.includes('income tax')) {
      scamType = 'Income Tax Refund Phishing';
    } else {
      scamType = 'Urgent Phishing Scam';
    }

    plainLanguageExplanation = [
      'Artificial Panic Trigger: Uses threats like service cutoff ("bijli band") or account freeze ("khata block") to force immediate action.',
      'Unofficial WhatsApp Channel: Government offices and utility boards never send personal WhatsApp warnings or ask for bill payments via unverified links.',
      'Untrusted Link Destination: Directs to an unofficial web domain designed to steal netbanking PINs or UPI credentials.',
    ];
    actionableAdvice = 'DO NOT click links or call numbers in this message. Pay utility bills only via official provider apps or in-person service centers.';
  } else if (hasUrgency || hasFinancialOrIdentity || hasSuspiciousDomain) {
    riskScore = 58;
    riskLevel = 'caution';
    scamType = 'Unverified Financial / Service Notice';
    plainLanguageExplanation = [
      'Message requests action regarding sensitive financial or service records without standard verification indicators.',
      'Always independently verify unfamiliar requests before sharing information, clicking links, or making payments.',
    ];
    actionableAdvice = 'Call the organization directly using the official phone number printed on your physical bill or bank card.';
  } else if (imageUrl && !text) {
    riskScore = 65;
    riskLevel = 'caution';
    scamType = 'Unverified Screenshot / QR Code Attachment';
    plainLanguageExplanation = [
      'Image attachment received without clear plain-text context.',
      'Scammers frequently hide deceptive banking details or payment QR codes inside images to evade text filters.',
      'Do not scan any QR codes or call phone numbers displayed in unfamiliar images.',
    ];
    actionableAdvice = 'Confirm with your family member before scanning any QR code or making payments shown in this image.';
  }

  return {
    analysis: {
      riskScore,
      riskLevel,
      scamType,
      plainLanguageExplanation,
      actionableAdvice,
    },
    source: 'heuristic-engine',
  };
}
