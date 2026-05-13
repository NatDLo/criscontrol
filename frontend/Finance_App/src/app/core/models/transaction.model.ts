export type TransactionType = 'income' | 'expense';
export type CurrencyOption = 'ARS' | 'USD' | 'EUR' | 'CUSTOM';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  categoryName?: string;
  description: string;
  date: string;
  notes?: string;
  currency: CurrencyOption;
  customCurrency?: string | null;
  currencyDisplay?: string;
}

export interface CreateTransactionDto {
  type: TransactionType;
  amount: number;
  categoryId: string;
  description: string;
  date: string;
  notes?: string;
  currency?: CurrencyOption;
  customCurrency?: string;
}

export type UpdateTransactionDto = Partial<CreateTransactionDto>;

export interface TransactionFilter {
  search?: string;
  startDate?: string;
  endDate?: string;
  type?: TransactionType | 'all';
  categoryId?: string;
  currency?: CurrencyOption | string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactionCount: number;
  period?: string;
}