export interface Vendor {
  id: string;
  businessName: string;
  upiId: string;
  payeeName: string;
  phone: string;
  paymentTerms: string; // e.g. "Net 15 Days", "15"
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankName?: string;
  bankBranch?: string;
  whatsappTemplate?: string;
  whatsappAccessToken?: string;
  whatsappPhoneNumberId?: string;
  whatsappTemplateName?: string;
  email?: string;
  planStatus?: 'TRIAL_ACTIVE' | 'ACTIVE' | 'EXPIRED';
  trialStartDate?: string;
  trialEndDate?: string;
  trialDaysLeft?: number;
  updatedAt?: string;
}

export type InvoiceStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'PENDING_VERIFICATION' | 'PARTIALLY_PAID';

export interface Invoice {
  id: string;
  vendorId: string;
  invoiceNo: string;
  customerName: string;
  phone: string;
  amount: number;
  originalAmount?: number;
  outstandingAmount?: number;
  paidAmount?: number;
  dueDate: string; // ISO date string YYYY-MM-DD
  status: InvoiceStatus;
  createdAt: string;
  lastReminderSentAt?: string;
  reminderCount: number;
  notes?: string;
  receiptUrl?: string;
  utrNumber?: string;
  proofSubmittedAt?: string;
  paymentMethod?: 'UPI' | 'NEFT_RTGS' | 'IMPS' | 'CASH' | 'CHEQUE' | 'OTHER';
  payerNotes?: string;
  verifiedAt?: string;
  verifiedBy?: string;
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
