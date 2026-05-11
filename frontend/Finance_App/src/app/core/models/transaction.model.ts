export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  categoryName?: string;
  description: string;
  date: string; // ISO date: YYYY-MM-DD
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTransactionDto {
  type: TransactionType;
  amount: number;
  categoryId: string;
  description: string;
  date: string;
  notes?: string;
}

export type UpdateTransactionDto = Partial<CreateTransactionDto>;

export interface TransactionFilter {
  startDate?: string;
  endDate?: string;
  type?: TransactionType | 'all';
  categoryId?: string;
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
