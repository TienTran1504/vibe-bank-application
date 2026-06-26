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

export type CardPaymentStatus = 'COMPLETED' | 'DECLINED';

export interface CardPaymentRequest {
  merchant: string;
  amount: string;    // decimal string, e.g. "49.99"
  currency?: string; // optional, defaults to USD (no FX in Phase 5)
}

export interface CardTransaction {
  id: string;
  cardId: string;
  merchant: string;
  amount: number;
  currency: string;
  status: CardPaymentStatus;
  declineReason: string | null; // CARD_FROZEN | LIMIT_EXCEEDED | INSUFFICIENT_FUNDS | ...
  authorizedAt: string;
}
