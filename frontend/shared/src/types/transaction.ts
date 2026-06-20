export type TransactionType = 'TRANSFER' | 'TOP_UP' | 'WITHDRAWAL' | 'PAYMENT';
export type TransactionStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REVERSED';

export interface Transaction {
  id: string;
  idempotencyKey: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency: string;
  toCurrency?: string;
  exchangeRate?: number;
  feeAmount?: number;
  convertedAmount?: number;
  type: TransactionType;
  status: TransactionStatus;
  description?: string;
  correlationId: string;
  errorCode?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransferRequest {
  fromAccountId: string;
  toAccountId: string;
  amount: string;
  description?: string;
  idempotencyKey?: string;
}

export interface TransferResponse {
  transactionId: string;
  status: TransactionStatus;
  estimatedCompletionAt: string;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
