export type Transaction = {
  id: string;
  date: string;
  time: string;
  type: 'IN' | 'OUT';
  amount: number;
  method: string;
  counterparty: string;
  desc: string;
};

export type Account = {
  id: string;
  name: string;
  riskScore: number;
  openingDate: string;
  branch: string;
  swiftCode: string;
  kycStatus: string;
  transactions: Transaction[];
};

export const MOCK_ACCOUNTS: Account[] = [
  {
    id: 'ACC-982-11x',
    name: 'Osiris Global Trade Ltd.',
    riskScore: 92,
    openingDate: '2023-11-04',
    branch: 'Frankfurt Central',
    swiftCode: 'DEUTFF1XXX',
    kycStatus: 'Flagged (Layering)',
    transactions: [
      { id: 'tx-1', date: '2026-05-10', time: '14:22:01', type: 'IN', amount: 540000, method: 'SWIFT', counterparty: 'Shell Corp A', desc: 'Consulting Fees' },
      { id: 'tx-2', date: '2026-05-11', time: '09:14:55', type: 'OUT', amount: 539500, method: 'EFT', counterparty: 'Offshore Holdings LLC', desc: 'Vendor Payment' }
    ]
  },
  {
    id: 'ACC-334-09B',
    name: 'NeoTech Innovations',
    riskScore: 65,
    openingDate: '2024-02-14',
    branch: 'London Canary Wharf',
    swiftCode: 'BARCGB2L',
    kycStatus: 'Pending Review',
    transactions: [
      { id: 'tx-3', date: '2026-05-12', time: '10:05:33', type: 'IN', amount: 45000, method: 'ACH', counterparty: 'Stripe Inc', desc: 'Sales Payout' },
      { id: 'tx-4', date: '2026-05-12', time: '16:30:11', type: 'OUT', amount: 15000, method: 'EFT', counterparty: 'AWS EMEA', desc: 'Cloud Infrastructure' }
    ]
  },
  {
    id: 'ACC-110-33X',
    name: 'Maria Rossi',
    riskScore: 12,
    openingDate: '2020-08-21',
    branch: 'Rome Retail',
    swiftCode: 'UNCRITRR',
    kycStatus: 'Verified',
    transactions: [
      { id: 'tx-5', date: '2026-05-11', time: '08:00:00', type: 'IN', amount: 3200, method: 'SEPA', counterparty: 'TechCorp SRL', desc: 'Salary' },
      { id: 'tx-6', date: '2026-05-11', time: '19:44:20', type: 'OUT', amount: 45, method: 'POS', counterparty: 'Supermercato Roma', desc: 'Groceries' }
    ]
  }
];
