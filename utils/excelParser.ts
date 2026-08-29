import * as XLSX from 'xlsx';
import { doc, writeBatch, collection, setDoc } from 'firebase/firestore';
import { db, cleanFirestoreData } from '../lib/firebase';
import { Invoice } from '../src/types/collect';

/**
 * Sanitizes and formats Indian phone numbers to standard international format (+91XXXXXXXXXX).
 * Strips whitespace, hyphens, parenthesis, leading zeros, and prefixes.
 */
export function sanitizeIndianPhone(phoneStr: string | number | null | undefined): string {
  if (!phoneStr) return '';
  const str = String(phoneStr).trim();
  let cleaned = str.replace(/\D/g, '');

  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return '+' + cleaned;
  } else if (cleaned.length === 10) {
    return '+91' + cleaned;
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    return '+91' + cleaned.substring(1);
  } else if (cleaned.length > 10 && !cleaned.startsWith('91')) {
    return '+' + cleaned;
  } else if (cleaned.length > 0 && cleaned.length < 10) {
    return '+91' + cleaned;
  }

  return str;
}

/**
 * Normalizes object keys to lowercase alphanumeric for resilient property extraction.
 */
function normalizeRowKeys(row: Record<string, any>): Record<string, any> {
  const normalized: Record<string, any> = {};
  for (const key of Object.keys(row)) {
    const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    normalized[cleanKey] = row[key];
  }
  return normalized;
}

/**
 * Client-side Tally/ERP Excel Parser
 * Extracts invoices safely from various spreadsheet layouts with zero NaN/undefined errors.
 */
export async function parseTallyExcelFile(file: File, vendorId: string): Promise<Invoice[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('The uploaded Excel file does not contain any sheets.');
        }

        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (!rawRows || rawRows.length === 0) {
          throw new Error('No data rows found in the uploaded sheet.');
        }

        const parsedInvoices: Invoice[] = [];

        rawRows.forEach((rawRow, index) => {
          const row = normalizeRowKeys(rawRow);

          // 1. INVOICE / BILL NO KEY MAPPINGS
          const invoiceNoCandidate =
            row['invoiceno'] ||
            row['billno'] ||
            row['refno'] ||
            row['vchno'] ||
            row['voucherno'] ||
            row['billnumber'] ||
            row['invno'] ||
            row['docno'] ||
            row['ref'] ||
            `OS-TALLY-${index + 101}`;

          const invoiceNo = String(invoiceNoCandidate).trim() || `OS-TALLY-${index + 101}`;

          // 2. CUSTOMER / PARTY NAME KEY MAPPINGS
          const customerCandidate =
            row['partyname'] ||
            row['customername'] ||
            row['particulars'] ||
            row['party'] ||
            row['customer'] ||
            row['accountname'] ||
            row['ledger'] ||
            row['buyer'] ||
            `Wholesale Client ${index + 1}`;

          const customerName = String(customerCandidate).trim() || `Wholesale Client ${index + 1}`;

          // 3. PHONE / MOBILE KEY MAPPINGS
          const rawPhoneCandidate =
            row['mobile'] ||
            row['phone'] ||
            row['contact'] ||
            row['partymobile'] ||
            row['mobilenumber'] ||
            row['cell'] ||
            row['phoneno'] ||
            row['whatsapp'] ||
            '9876543210';

          const phone = sanitizeIndianPhone(rawPhoneCandidate);

          // 4. AMOUNT / BALANCE KEY MAPPINGS
          const rawAmountCandidate =
            row['pendingamount'] ||
            row['amount'] ||
            row['balance'] ||
            row['closingbalance'] ||
            row['dueamount'] ||
            row['debit'] ||
            row['total'] ||
            row['netamount'] ||
            0;

          let amount = 0;
          if (typeof rawAmountCandidate === 'number') {
            amount = Math.abs(rawAmountCandidate);
          } else {
            const cleanedNum = String(rawAmountCandidate).replace(/[^0-9.-]/g, '');
            amount = Math.abs(parseFloat(cleanedNum)) || 0;
          }

          // If no positive amount, skip non-payable header rows
          if (amount <= 0) return;

          // 5. DUE DATE KEY MAPPINGS
          const rawDateCandidate =
            row['duedate'] ||
            row['due'] ||
            row['date'] ||
            row['billdate'] ||
            row['vchdate'] ||
            '';

          let dueDate = String(rawDateCandidate).trim();
          // If valid Excel serial number or date string
          if (!dueDate || dueDate.length < 8) {
            const defaultDate = new Date();
            defaultDate.setDate(defaultDate.getDate() + 15); // Default Net 15
            dueDate = defaultDate.toISOString().split('T')[0];
          } else if (dueDate.includes('/')) {
            // Convert DD/MM/YYYY or MM/DD/YYYY to YYYY-MM-DD
            const parts = dueDate.split('/');
            if (parts.length === 3) {
              if (parts[2].length === 4) {
                // DD/MM/YYYY
                dueDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
              }
            }
          }

          // Compute initial Status
          const today = new Date().toISOString().split('T')[0];
          const isOverdue = dueDate < today;

          const invoice: Invoice = {
            id: `inv_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 7)}`,
            vendorId,
            invoiceNo,
            customerName,
            phone,
            amount,
            originalAmount: amount,
            paidAmount: 0,
            dueDate,
            status: isOverdue ? 'OVERDUE' : 'PENDING',
            createdAt: new Date().toISOString(),
            reminderCount: 0
          };

          parsedInvoices.push(invoice);
        });

        resolve(parsedInvoices);
      } catch (err: any) {
        reject(new Error(`Failed to parse spreadsheet: ${err.message || 'Unknown formatting error'}`));
      }
    };

    reader.onerror = () => reject(new Error('File reading error. Please try uploading again.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Batches and writes parsed invoices to Firestore in max 400-chunk limits
 */
export async function batchWriteInvoicesToFirestore(invoices: Invoice[], vendorId: string): Promise<number> {
  if (!invoices || invoices.length === 0) return 0;

  const CHUNK_SIZE = 400; // Under Firestore 500 batch write limit
  let totalWritten = 0;

  for (let i = 0; i < invoices.length; i += CHUNK_SIZE) {
    const chunk = invoices.slice(i, i + CHUNK_SIZE);
    
    try {
      const batch = writeBatch(db);
      chunk.forEach((inv) => {
        const docRef = doc(db, 'invoices', inv.id);
        const cleanInv = cleanFirestoreData({
          ...inv,
          vendorId,
          updatedAt: new Date().toISOString()
        });
        batch.set(docRef, cleanInv, { merge: true });
      });

      await batch.commit();
      totalWritten += chunk.length;
    } catch (err: any) {
      console.warn('Batch write encountered issue, attempting individual setDocs:', err);
      // Fallback: Individual setDocs to avoid single-item failure breaking the entire batch
      for (const inv of chunk) {
        try {
          const docRef = doc(db, 'invoices', inv.id);
          const cleanInv = cleanFirestoreData({
            ...inv,
            vendorId,
            updatedAt: new Date().toISOString()
          });
          await setDoc(docRef, cleanInv, { merge: true });
          totalWritten++;
        } catch (individualErr) {
          console.error(`Failed to write invoice ${inv.id}:`, individualErr);
        }
      }
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const vId = vendorId || 'demo_vendor_uid';
      const keys = [`orderspot_invoices_${vId}`, 'orderspot_collect_invoices'];
      keys.forEach((key) => {
        const local = localStorage.getItem(key);
        let list: Invoice[] = local ? JSON.parse(local) : [];
        // Add new items preventing duplicate IDs
        const existingIds = new Set(list.map((i) => i.id));
        const newItems = invoices.filter((i) => !existingIds.has(i.id));
        const updatedList = [...newItems, ...list];
        localStorage.setItem(key, JSON.stringify(updatedList));
      });
    } catch (e) {
      console.warn('Local batch storage error:', e);
    }
  }

  return totalWritten;
}
