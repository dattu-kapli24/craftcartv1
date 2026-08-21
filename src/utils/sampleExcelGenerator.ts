import * as XLSX from 'xlsx';

export interface SampleRow {
  'Invoice No': string;
  'Party Name': string;
  'Contact Mobile': string;
  'Pending Amount': number;
  'Due Date': string;
  'Notes / Ledger': string;
}

export const SAMPLE_TALLY_DATA: SampleRow[] = [
  {
    'Invoice No': 'INV-2026-001',
    'Party Name': 'Sharma Kirana Store',
    'Contact Mobile': '9876543210',
    'Pending Amount': 14500,
    'Due Date': '2026-08-15',
    'Notes / Ledger': 'Sundry Debtors - Grocery Distribution'
  },
  {
    'Invoice No': 'INV-2026-002',
    'Party Name': 'Royal Bakers & Confectionery',
    'Contact Mobile': '9823456789',
    'Pending Amount': 28750,
    'Due Date': '2026-08-18',
    'Notes / Ledger': 'Sundry Debtors - Bakery Supplies'
  },
  {
    'Invoice No': 'INV-2026-003',
    'Party Name': 'Metro Supermarket Pvt Ltd',
    'Contact Mobile': '9845123456',
    'Pending Amount': 52000,
    'Due Date': '2026-08-25',
    'Notes / Ledger': 'Sundry Debtors - FMCG Goods'
  },
  {
    'Invoice No': 'INV-2026-004',
    'Party Name': 'Gupta General Traders',
    'Contact Mobile': '9712345678',
    'Pending Amount': 9800,
    'Due Date': '2026-08-10',
    'Notes / Ledger': 'Sundry Debtors - Overdue Net 15'
  },
  {
    'Invoice No': 'INV-2026-005',
    'Party Name': 'Venkateshwara Provision Store',
    'Contact Mobile': '9900112233',
    'Pending Amount': 34200,
    'Due Date': '2026-08-30',
    'Notes / Ledger': 'Sundry Debtors - Wholesale Grains'
  },
  {
    'Invoice No': 'INV-2026-006',
    'Party Name': 'Sai Ram Cafe & Caterers',
    'Contact Mobile': '9880099887',
    'Pending Amount': 18900,
    'Due Date': '2026-08-12',
    'Notes / Ledger': 'Sundry Debtors - Dairy & Beverages'
  }
];

export function downloadSampleTallyExcel() {
  const worksheet = XLSX.utils.json_to_sheet(SAMPLE_TALLY_DATA);
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 16 }, // Invoice No
    { wch: 32 }, // Party Name
    { wch: 18 }, // Contact Mobile
    { wch: 18 }, // Pending Amount
    { wch: 14 }, // Due Date
    { wch: 36 }  // Notes / Ledger
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tally Outstanding Bills');

  XLSX.writeFile(workbook, 'OrderSpot_Tally_Receivables_Sample.xlsx');
}
