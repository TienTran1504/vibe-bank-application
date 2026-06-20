export type AccountType = 'SAVINGS' | 'CHECKING' | 'WALLET';
export type AccountStatus = 'ACTIVE' | 'FROZEN' | 'CLOSED';
export type Currency = 'USD' | 'EUR' | 'VND';

export interface BankAccount {
  id: string;
  userId: string;
  holderName?: string;
  accountNumber: string;
  accountType: AccountType;
  currency: Currency;
  balance: number;
  availableBalance: number;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountRequest {
  currency: Currency;
  type: AccountType;
}
