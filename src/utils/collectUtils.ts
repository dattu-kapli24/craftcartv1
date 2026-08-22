import QRCode from 'qrcode';
import * as XLSX from 'xlsx';
import { Invoice } from '../types/collect';

/**
 * Sanitizes and formats Indian phone numbers to +91 international standard.
 * Strips spaces, hyphens, leading zeros, and adds +91 if missing.
 */
export function sanitizePhone(phoneStr: string | number): string {
  if (!phoneStr) return '';
  let cleaned = String(phoneStr).replace(/\D/g, '');
  
  // If starts with 91 and has 12 digits, or 10 digits without country code
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    cleaned = '+' + cleaned;
  } else if (cleaned.length === 10) {
    cleaned = '+91' + cleaned;
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = '+91' + cleaned.substring(1);
  } else if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
}

/**
 * Constructs valid Indian NPCI UPI payment URL.
 */
export function generateUpiUrl(upiId: string, payeeName: string, amount: number, invoiceNo: string): string {
  const cleanUpi = encodeURIComponent(upiId.trim());
  const cleanName = encodeURIComponent(payeeName.trim());
  const formattedAmount = Number(amount).toFixed(2);
  const cleanTr = encodeURIComponent(invoiceNo.trim());

  return `upi://pay?pa=${cleanUpi}&pn=${cleanName}&am=${formattedAmount}&tr=${cleanTr}&cu=INR`;
}

/**
 * Constructs a fully qualified HTTPS Web Payment hyperlink suitable for WhatsApp messages.
 * WhatsApp converts http:// and https:// URLs into clickable hyperlinks, whereas raw upi:// is plain text.
 */
export function generatePaymentWebUrl(
  upiId: string,
  payeeName: string,
  amount: number,
  invoiceNo: string,
  customerName?: string,
  vendorBusinessName?: string,
  dueDate?: string
): string {
  let origin = 'https://orderspot.in';
  if (typeof window !== 'undefined' && window.location?.origin) {
    origin = window.location.origin;
  }

  const params = new URLSearchParams({
    pa: (upiId || 'orderspot@icici').trim(),
    pn: (payeeName || vendorBusinessName || 'OrderSpot Merchant').trim(),
    am: Number(amount).toFixed(2),
    tr: (invoiceNo || 'INV').trim(),
    inv: (invoiceNo || 'INV').trim(),
    cust: (customerName || '').trim(),
    vendor: (vendorBusinessName || payeeName || 'OrderSpot').trim(),
    due: (dueDate || '').trim()
  });

  return `${origin}/pay.html?${params.toString()}`;
}

/**
 * Generates a data URL for a QR code representing the UPI link.
 */
export async function generateQrCodeDataUrl(upiUrl: string): Promise<string> {
  try {
    return await QRCode.toDataURL(upiUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('Failed to generate QR code:', err);
    return '';
  }
}

/**
 * Parses Tally / Excel "Pending Receivables" files (.xlsx, .xls, .csv)
 * Expected columns (case-insensitive):
 * InvoiceNo / Bill No, CustomerName / Party Name, Phone / Mobile, Amount / Balance, DueDate / Due Date
 */
export async function parseTallyExcel(file: File): Promise<Partial<Invoice>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Read first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON array of objects
        const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        const parsedInvoices: Partial<Invoice>[] = [];

        rawRows.forEach((row, idx) => {
          // Normalize keys to lowercase for flexible matching
          const normalizedRow: Record<string, any> = {};
          Object.keys(row).forEach(k => {
            normalizedRow[k.toLowerCase().replace(/[^a-z0-9]/g, '')] = row[k];
          });

          // Extract fields with multiple fallbacks
          const invoiceNo = String(
            normalizedRow['invoiceno'] || 
            normalizedRow['billno'] || 
            normalizedRow['voucherno'] || 
            normalizedRow['billnumber'] || 
            `INV-${idx + 101}`
          ).trim();

          const customerName = String(
            normalizedRow['customername'] || 
            normalizedRow['partyname'] || 
            normalizedRow['name'] || 
            normalizedRow['client'] || 
            'Walk-in Customer'
          ).trim();

          const rawPhone = 
            normalizedRow['phone'] || 
            normalizedRow['mobileno'] || 
            normalizedRow['mobile'] || 
            normalizedRow['contact'] || 
            '9876543210';
          
          const phone = sanitizePhone(rawPhone);

          const rawAmount = 
            normalizedRow['amount'] || 
            normalizedRow['balance'] || 
            normalizedRow['pendingamount'] || 
            normalizedRow['total'] || 
            0;
          const amount = parseFloat(String(rawAmount).replace(/[^0-9.]/g, '')) || 1500;

          const rawDate = 
            normalizedRow['duedate'] || 
            normalizedRow['date'] || 
            normalizedRow['due'] || 
            new Date().toISOString().split('T')[0];
          
          let dueDate = String(rawDate).trim();
          if (!dueDate || dueDate.length < 8) {
            const d = new Date();
            d.setDate(d.getDate() + 7); // Default due in 7 days
            dueDate = d.toISOString().split('T')[0];
          }

          if (invoiceNo && amount > 0) {
            parsedInvoices.push({
              invoiceNo,
              customerName,
              phone,
              amount,
              dueDate,
              status: 'PENDING',
              reminderCount: 0,
              createdAt: new Date().toISOString()
            });
          }
        });

        resolve(parsedInvoices);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}
