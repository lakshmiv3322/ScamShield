import express from 'express';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config({ path: ['.env.local', '.env'] });

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '15mb' }));

// Lazy initialization of Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ScamShield AI Backend',
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// AI Fraud Analysis Endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const { text, linkUrl, imageUrl, senderContact } = req.body;

    if (!text && !linkUrl && !imageUrl) {
      res.status(400).json({ error: 'At least message text, link, or image is required' });
      return;
    }

    const ai = getAI();

    // If Gemini API Key is available, use Gemini 2.5 Flash for deep fraud analysis
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

        // Build multimodal contents array if image is present
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
          res.json({
            success: true,
            analysis: parsed,
            source: 'gemini-2.5-flash',
          });
          return;
        }
      } catch (geminiError) {
        console.error('Gemini API call failed, falling back to heuristic engine:', geminiError);
      }
    }

    // Heuristic Fraud Engine (Rule-based Fallback)
    const lower = (text || '').toLowerCase();
    const hasUrgency =
      lower.includes('urgent') ||
      lower.includes('immediately') ||
      lower.includes('blocked') ||
      lower.includes('tonight') ||
      lower.includes('disconnect') ||
      lower.includes('suspended') ||
      lower.includes('freeze') ||
      lower.includes('within 24 hours');

    const hasFinancial =
      lower.includes('kyc') ||
      lower.includes('bank') ||
      lower.includes('account') ||
      lower.includes('otp') ||
      lower.includes('upi') ||
      lower.includes('tax refund') ||
      lower.includes('lottery') ||
      lower.includes('electricity') ||
      lower.includes('bijli') ||
      lower.includes('bill');

    const hasSuspiciousDomain =
      (linkUrl &&
        (linkUrl.includes('.online') ||
          linkUrl.includes('.top') ||
          linkUrl.includes('.link') ||
          linkUrl.includes('.xyz') ||
          linkUrl.includes('.vip'))) ||
      false;

    let riskScore = 15;
    let riskLevel: 'safe' | 'caution' | 'scam' = 'safe';
    let scamType = 'Legitimate Notification';
    let plainLanguageExplanation = [
      'Message does not exhibit recognizable fraud indicators or coercive tactics.',
      'Sender phrasing conforms to standard benign communication.',
    ];
    let actionableAdvice = 'This message appears safe. Remember never to share OTP codes with anyone.';

    if (hasUrgency && (hasFinancial || hasSuspiciousDomain)) {
      riskScore = 95;
      riskLevel = 'scam';
      scamType = lower.includes('electricity') || lower.includes('bijli')
        ? 'Fake Electricity Disconnection Scam'
        : lower.includes('kyc') || lower.includes('bank')
        ? 'Banking KYC Account Freeze Trap'
        : 'Urgent Phishing Scam';
      plainLanguageExplanation = [
        'Artificial Panic Trigger: Threatens rapid cutoff or account freeze to rush you into acting without verifying.',
        'Unofficial Sender: Government and legitimate utility boards never conduct official service warnings via personal WhatsApp numbers.',
        'Untrusted Destination: Link redirects to an unverified domain designed to harvest credentials or banking PINs.',
      ];
      actionableAdvice = 'DO NOT click links or call the number in the message. Verify your account only through the official provider app or in-person branch.';
    } else if (hasUrgency || hasFinancial || hasSuspiciousDomain) {
      riskScore = 58;
      riskLevel = 'caution';
      scamType = 'Unverified Financial / Account Notice';
      plainLanguageExplanation = [
        'Message requests action regarding sensitive financial or service records without standard verification badges.',
        'Always independently verify unfamiliar requests before sharing information or making payments.',
      ];
      actionableAdvice = 'Call the organization directly using the phone number printed on your official physical bill or card.';
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

    res.json({
      success: true,
      analysis: {
        riskScore,
        riskLevel,
        scamType,
        plainLanguageExplanation,
        actionableAdvice,
      },
      source: 'heuristic-engine',
    });
    return;
  } catch (err: any) {
    console.error('Analysis error:', err);
    res.status(500).json({ error: 'Analysis failed', details: err.message });
  }
});

// Broadcast Alert Simulator Endpoint
app.post('/api/alerts/broadcast', (req, res) => {
  const { messageId, familyId } = req.body;
  res.json({
    success: true,
    message: 'Emergency alert dispatched to 5 connected family WhatsApp contacts.',
    dispatchedCount: 5,
    timestamp: new Date().toISOString(),
  });
});

// Setup Vite middleware in dev, or serve static dist in prod
async function startServer() {
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '127.0.0.1', () => {
    console.log(`\n  ✅ ScamShield is running!`);
    console.log(`  ➜  Open in browser: http://localhost:${PORT}\n`);
  });
}

startServer();
