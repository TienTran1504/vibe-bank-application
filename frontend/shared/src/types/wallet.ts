export type WalletStatus = 'ACTIVE' | 'FROZEN' | 'CLOSED';
export type WalletTransactionType = 'TOP_UP' | 'WITHDRAWAL' | 'TRANSFER';
export type WalletTransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  status: WalletStatus;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  type: WalletTransactionType;
  amount: number;
  status: WalletTransactionStatus;
  reference: string | null;
  description: string | null;
  createdAt: string;
}

export interface WalletTopUpRequest {
  amount: string;
  paymentMethodToken: string;
}

export interface WalletWithdrawRequest {
  amount: string;
  toAccountId: string;
}
