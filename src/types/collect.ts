export interface Vendor {
  id: string;
  businessName: string;
  upiId: string;
  payeeName: string;
  phone: string;
  paymentTerms: string; // e.g. "Net 15 Days", "15"
  whatsappTemplate?: string;
  whatsappAccessToken?: string;
  whatsappPhoneNumberId?: string;
  whatsappTemplateName?: string;
  updatedAt?: string;
}

export type InvoiceStatus = 'PENDING' | 'PAID' | 'OVERDUE';

export interface Invoice {
  id: string;
  vendorId: string;
  invoiceNo: string;
  customerName: string;
  phone: string;
  amount: number;
  originalAmount?: number;
  paidAmount?: number;
  dueDate: string; // ISO date string YYYY-MM-DD
  status: InvoiceStatus;
  createdAt: string;
  lastReminderSentAt?: string;
  reminderCount: number;
  notes?: string;
  paymentHistory?: Array<{
    date: string;
    amount: number;
    notes?: string;
  }>;
}

export type ReminderTriggerType = 'MANUAL' | 'BATCH';
export type ReminderDeliveryStatus = 'DELIVERED' | 'FAILED';

export interface ReminderLog {
  id: string;
  invoiceId: string;
  invoiceNo: string;
  customerName: string;
  sentAt: string;
  status: ReminderDeliveryStatus;
  whatsappMessageId: string;
  triggerType: ReminderTriggerType;
}
