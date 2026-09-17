// server/services/whatsapp.ts
// Outbound WhatsApp Cloud API Adapter with stub fallback for local dev & testing.

export interface WhatsAppMessagePayload {
  to: string;
  body: string;
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  stubbed?: boolean;
  error?: string;
}

export interface WhatsAppAdapter {
  sendMessage(payload: WhatsAppMessagePayload): Promise<WhatsAppSendResult>;
}

export class WhatsAppCloudApiAdapter implements WhatsAppAdapter {
  private apiToken?: string;
  private phoneNumberId?: string;

  constructor() {
    this.apiToken = process.env.WHATSAPP_API_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  }

  async sendMessage(payload: WhatsAppMessagePayload): Promise<WhatsAppSendResult> {
    const { to, body } = payload;
    const cleanPhone = to.replace(/\D/g, '');

    // If credentials are provided, attempt real Meta WhatsApp Cloud API call
    if (this.apiToken && this.phoneNumberId) {
      try {
        const url = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanPhone,
            type: 'text',
            text: { preview_url: false, body },
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          console.error('[WhatsApp Cloud API Error]', data);
          return {
            success: false,
            error: data.error?.message || 'Failed to send WhatsApp message via Cloud API',
          };
        }

        const messageId = data.messages?.[0]?.id;
        console.log(`[WhatsApp Cloud API] Successfully dispatched message to ${cleanPhone} (ID: ${messageId})`);
        return {
          success: true,
          messageId,
          stubbed: false,
        };
      } catch (err: any) {
        console.error('[WhatsApp Cloud API Exception]', err);
        return {
          success: false,
          error: err.message,
        };
      }
    }

    // Clean stubbed outbound call adapter (for development and environments without live Meta business verified numbers)
    const stubMessageId = `wamid.stub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    console.log('\n================== [WHATSAPP OUTBOUND STUB] ==================');
    console.log(`To:           ${cleanPhone}`);
    console.log(`Message ID:   ${stubMessageId}`);
    console.log(`Content:\n${body}`);
    console.log('==============================================================\n');

    return {
      success: true,
      messageId: stubMessageId,
      stubbed: true,
    };
  }
}

export const whatsAppService = new WhatsAppCloudApiAdapter();
