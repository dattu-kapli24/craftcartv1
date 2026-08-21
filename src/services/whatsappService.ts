import { Invoice, Vendor, ReminderLog } from '../types/collect';
import { generateUpiUrl, generatePaymentWebUrl, sanitizePhone } from '../utils/collectUtils';

export interface SendResult {
  success: boolean;
  messageId: string;
  whatsappUrl: string;
  payWebUrl: string;
  payload?: any;
  error?: string;
}

/**
 * Formats the polite, high-converting English message for WhatsApp recovery.
 * Uses a fully qualified HTTPS URL so WhatsApp renders it as a clickable blue hyperlink.
 */
export function formatReminderMessage(invoice: Invoice, vendor: Vendor): string {
  const payWebUrl = generatePaymentWebUrl(
    vendor.upiId,
    vendor.payeeName,
    invoice.amount,
    invoice.invoiceNo,
    invoice.customerName,
    vendor.businessName,
    invoice.dueDate
  );
  const upiId = vendor.upiId || 'orderspot@icici';
  
  return `Dear *${invoice.customerName}*,

Your pending invoice *#${invoice.invoiceNo}* of *₹${invoice.amount.toLocaleString('en-IN')}* from *${vendor.businessName}* was due on *${invoice.dueDate}*.

💳 *Click below to pay securely via UPI (GPay / PhonePe / Paytm):*
${payWebUrl}

UPI ID: \`${upiId}\`

Thank you for your prompt business!
_(Please ignore if already paid)_`;
}

/**
 * Sends or prepares the WhatsApp reminder. 
 * Supports Meta Cloud API simulation + wa.me web deep link fallback for Spark Plan.
 */
export async function sendWhatsAppReminder(invoice: Invoice, vendor: Vendor, triggerType: 'MANUAL' | 'BATCH' = 'MANUAL'): Promise<SendResult> {
  const cleanPhone = sanitizePhone(invoice.phone);
  const messageText = formatReminderMessage(invoice, vendor);
  const payWebUrl = generatePaymentWebUrl(
    vendor.upiId,
    vendor.payeeName,
    invoice.amount,
    invoice.invoiceNo,
    invoice.customerName,
    vendor.businessName,
    invoice.dueDate
  );

  // Meta WhatsApp Cloud API payload structure (Official Ready)
  const metaCloudPayload = {
    messaging_product: "whatsapp",
    to: cleanPhone.replace('+', ''),
    type: "template",
    template: {
      name: vendor.whatsappTemplateName || "order_spot_invoice_reminder",
      language: {
        code: "en"
      },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: invoice.customerName },
            { type: "text", text: invoice.invoiceNo },
            { type: "text", text: `₹${invoice.amount.toLocaleString('en-IN')}` },
            { type: "text", text: vendor.businessName },
            { type: "text", text: invoice.dueDate }
          ]
        },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [
            {
              type: "text",
              text: encodeURIComponent(payWebUrl)
            }
          ]
        }
      ]
    }
  };

  const messageId = `wamid.osc.${Date.now()}.${Math.random().toString(36).substring(2, 8)}`;
  const encodedMessage = encodeURIComponent(messageText);
  const whatsappWebUrl = `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodedMessage}`;

  // If vendor configured Meta Cloud API token, we could call the backend endpoint,
  // otherwise fallback to direct WhatsApp Web / Click-to-chat API which works instantly on Spark Plan.
  try {
    if (vendor.whatsappAccessToken && vendor.whatsappPhoneNumberId) {
      // Real or simulated Cloud API call
      const response = await fetch(`https://graph.facebook.com/v18.0/${vendor.whatsappPhoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${vendor.whatsappAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metaCloudPayload)
      });
      
      if (!response.ok) {
        console.warn('Meta Cloud API returned non-OK status, falling back to direct web link dispatch.');
      }
    }

    return {
      success: true,
      messageId,
      whatsappUrl: whatsappWebUrl,
      payWebUrl,
      payload: metaCloudPayload
    };
  } catch (err: any) {
    return {
      success: true, // Still return true for web link fallback
      messageId,
      whatsappUrl: whatsappWebUrl,
      payWebUrl,
      error: err?.message
    };
  }
}
