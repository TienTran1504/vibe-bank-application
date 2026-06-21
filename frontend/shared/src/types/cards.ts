export type CardType = 'VIRTUAL' | 'PHYSICAL';
export type CardStatus = 'ACTIVE' | 'FROZEN' | 'CLOSED';

export interface Card {
  id: string;
  userId: string;
  accountId: string;
  cardNumberMasked: string;
  cardType: CardType;
  status: CardStatus;
  spendingLimit: number | null;
  expiryDate: string; // ISO date "YYYY-MM-DD"
  createdAt: string;
  updatedAt: string;
}

export interface CreateVirtualCardRequest {
  accountId: string;
}

export interface FreezeCardRequest {
  freeze: boolean;
}

export interface SpendingLimitRequest {
  dailyLimit: string;
}
