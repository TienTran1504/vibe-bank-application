export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  MFA: undefined;
};

export type HomeStackParamList = {
  Dashboard: undefined;
  AccountDetail: { accountId: string };
  Wallet: undefined;
  Notifications: undefined;
};

export type SendStackParamList = {
  SendTo: undefined;
  EnterAmount: {
    toAccountId: string;
    recipientName: string;
    recipientAccountNumber: string;
    recipientCurrency: string;
  };
  Review: {
    fromAccountId: string;
    fromAccountNumber: string;
    fromCurrency: string;
    toAccountId: string;
    amount: string;
    recipientName: string;
    recipientAccountNumber: string;
    recipientCurrency: string;
    description?: string;
  };
  Confirmation: {
    transactionId: string;
    amount: string;
    currency: string;
    recipientName: string;
    success: boolean;
    errorMessage?: string;
    convertedAmount?: string;
    recipientCurrency?: string;
  };
};

export type ActivityStackParamList = {
  TransactionList: undefined;
  TransactionDetail: { transactionId: string };
};

export type CardsStackParamList = {
  CardsList: undefined;
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  KYC: undefined;
  Spend: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  SendTab: undefined;
  ActivityTab: undefined;
  CardsTab: undefined;
  ProfileTab: undefined;
};
