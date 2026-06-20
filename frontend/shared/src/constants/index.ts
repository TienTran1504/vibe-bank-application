export const CURRENCIES = ['USD', 'EUR', 'VND'] as const;

// Rates expressed as: how many units of toCurrency per 1 unit of fromCurrency
// Base rates anchored to USD: 1 USD = 26,000 VND, 1 USD = 0.87 EUR
const RATES_FROM_USD: Record<string, number> = { USD: 1, VND: 26000, EUR: 0.87 };

export function getExchangeRate(from: string, to: string): number {
  if (from === to) return 1;
  const fromInUsd = RATES_FROM_USD[from];
  const toInUsd   = RATES_FROM_USD[to];
  if (!fromInUsd || !toInUsd) return 1;
  return toInUsd / fromInUsd;
}

export const FX_FEE_RATE = 0.015; // 1.5% conversion fee

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  VND: '₫',
};

export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  CONFLICT: 'CONFLICT',
  DUPLICATE_REQUEST: 'DUPLICATE_REQUEST',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  ACCOUNT_FROZEN: 'ACCOUNT_FROZEN',
  KYC_REQUIRED: 'KYC_REQUIRED',
  FRAUD_BLOCKED: 'FRAUD_BLOCKED',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export const KYC_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Not Started',
  SUBMITTED: 'Under Review',
  APPROVED: 'Verified',
  REJECTED: 'Rejected',
};

export const TRANSACTION_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  REVERSED: 'Reversed',
};

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  SAVINGS: 'Savings',
  CHECKING: 'Checking',
  WALLET: 'Wallet',
};
