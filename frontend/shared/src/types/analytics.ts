export interface SpendSummary {
  period: string; // "YYYY-MM"
  totalSpent: number;
  totalReceived: number;
  transactionCount: number;
  currency: string;
}
