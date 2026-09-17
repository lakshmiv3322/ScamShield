// server/services/email.ts
// Resend Email Alert Service with clean stub mode when RESEND_API_KEY is not set.

export interface EmailAlertPayload {
  to: string;
  memberName: string;
  scamType: string;
  riskScore: number;
  riskLevel: string;
  summary: string;
  actionableAdvice: string;
  messageId?: string;
}

export interface EmailSendResult {
  success: boolean;
  emailId?: string;
  stubbed?: boolean;
  error?: string;
}

export async function sendEmailAlert(payload: EmailAlertPayload): Promise<EmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'ScamShield Alerts <onboarding@resend.dev>';

  const subject = `🚨 [ScamShield Alert] ${payload.riskLevel.toUpperCase()}: ${payload.scamType} Detected for ${payload.memberName}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0B0F14; color: #E5E7EB; padding: 24px; margin: 0;">
        <div style="max-width: 580px; margin: 0 auto; background-color: #121821; border-radius: 16px; border: 1px solid rgba(255,255,255,0.15); padding: 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
            <div style="background: linear-gradient(135deg, #5B8FFF, #1D4ED8); width: 32px; height: 32px; border-radius: 8px; text-align: center; line-height: 32px; font-size: 18px;">🛡️</div>
            <h2 style="margin: 0; color: #FFFFFF; font-size: 18px; font-weight: bold;">ScamShield Family Guard</h2>
          </div>

          <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 16px; margin-bottom: 20px;">
            <span style="display: inline-block; background-color: #EF4444; color: #FFFFFF; font-size: 11px; font-weight: bold; padding: 3px 8px; border-radius: 999px; text-transform: uppercase; margin-bottom: 8px;">
              ${payload.riskLevel} • Risk Score: ${payload.riskScore}/100
            </span>
            <h3 style="margin: 4px 0; color: #FFFFFF; font-size: 16px;">${payload.scamType}</h3>
            <p style="margin: 6px 0 0; color: #D1D5DB; font-size: 13px; line-height: 1.5;">
              <strong>${payload.memberName}</strong> received or forwarded an incoming threat message that was flagged by ScamShield AI.
            </p>
          </div>

          <div style="margin-bottom: 20px;">
            <h4 style="color: #9CA3AF; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">Threat Context</h4>
            <div style="background-color: #0B0F14; border-radius: 10px; padding: 14px; border: 1px solid rgba(255,255,255,0.08); font-size: 13px; color: #E5E7EB; line-height: 1.5;">
              "${payload.summary}"
            </div>
          </div>

          <div style="margin-bottom: 24px;">
            <h4 style="color: #9CA3AF; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">Action Required</h4>
            <div style="background-color: #0B0F14; border-radius: 10px; padding: 14px; border-left: 3px solid #5B8FFF; font-size: 13px; color: #60A5FA; line-height: 1.5;">
              👉 ${payload.actionableAdvice}
            </div>
          </div>

          <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; font-size: 11px; color: #6B7280; text-align: center;">
            This security notification was automatically dispatched by your ScamShield Family Circle.<br/>
            Open ScamShield to view complete analysis and manage alert preferences.
          </div>
        </div>
      </body>
    </html>
  `;

  if (apiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [payload.to],
          subject,
          html: htmlContent,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error('[Resend API Error]', data);
        return { success: false, error: data.message || 'Resend API failed' };
      }

      console.log(`[Resend Email] Dispatched alert email to ${payload.to} (ID: ${data.id})`);
      return { success: true, emailId: data.id, stubbed: false };
    } catch (err: any) {
      console.error('[Resend Email Exception]', err);
      return { success: false, error: err.message };
    }
  }

  // Clean console stub when RESEND_API_KEY is not set
  const stubId = `re_stub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  console.log('\n================== [RESEND EMAIL STUB] ==================');
  console.log(`To:           ${payload.to}`);
  console.log(`Subject:      ${subject}`);
  console.log(`Member:       ${payload.memberName}`);
  console.log(`Advice:       ${payload.actionableAdvice}`);
  console.log(`Stub ID:      ${stubId}`);
  console.log('=========================================================\n');

  return { success: true, emailId: stubId, stubbed: true };
}
