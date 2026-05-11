export interface ReportFilter {
  startDate: string;
  endDate: string;
  type?: 'income' | 'expense' | 'all';
  categoryIds?: string[];
  groupBy?: 'day' | 'week' | 'month';
}

export interface ReportSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactionCount: number;
  avgTransactionAmount: number;
  topCategories: CategoryStat[];
  monthlyData: MonthlyData[];
}

export interface CategoryStat {
  categoryId: string;
  categoryName: string;
  total: number;
  percentage: number;
  transactionCount: number;
}

export interface MonthlyData {
  period: string;
  income: number;
  expenses: number;
  balance: number;
}
