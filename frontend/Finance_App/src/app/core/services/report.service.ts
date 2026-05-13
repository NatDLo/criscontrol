import { Injectable, inject } from '@angular/core';
import { Observable, map, throwError } from 'rxjs';
import { TransactionService } from './transaction.service';
import {
  ReportFilter,
  ReportSummary,
  MonthlyData,
  CategoryStat,
  ApiResponse,
} from '../models';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly txService = inject(TransactionService);

  private toTxFilter(filter: ReportFilter) {
    return {
      startDate: filter.startDate,
      endDate: filter.endDate,
      type: filter.type,
      page: 1,
      pageSize: 100000,
      sortBy: 'date',
      sortDir: 'asc' as const,
    };
  }

  private toPeriod(dateStr: string, groupBy: 'day' | 'week' | 'month' = 'month'): string {
    if (groupBy === 'day') {
      return dateStr;
    }

    if (groupBy === 'month') {
      return dateStr.slice(0, 7);
    }

    const date = new Date(`${dateStr}T00:00:00`);
    const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = utcDate.getUTCDay() || 7;
    utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNum);

    const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((utcDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

    return `${utcDate.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  }

  getSummary(filter: ReportFilter): Observable<ApiResponse<ReportSummary>> {
    return this.txService.getAll(this.toTxFilter(filter)).pipe(
      map((res) => {
        let rows = res.data;
        const groupBy = filter.groupBy ?? 'month';

        if (filter.categoryIds?.length) {
          const ids = new Set(filter.categoryIds.map(String));
          rows = rows.filter((x) => ids.has(String(x.categoryId)));
        }

        const totalIncome = rows
          .filter((x) => x.type === 'income')
          .reduce((a, b) => a + b.amount, 0);

        const totalExpenses = rows
          .filter((x) => x.type === 'expense')
          .reduce((a, b) => a + b.amount, 0);

        const transactionCount = rows.length;
        const balance = totalIncome - totalExpenses;
        const avgTransactionAmount = transactionCount
          ? (totalIncome + totalExpenses) / transactionCount
          : 0;

        const byCategory = new Map<string, CategoryStat>();
        rows.forEach((tx) => {
          const key = String(tx.categoryId);
          const prev = byCategory.get(key) ?? {
            categoryId: key,
            categoryName: tx.categoryName ?? 'Sin categoría',
            total: 0,
            percentage: 0,
            transactionCount: 0,
          };
          prev.total += tx.amount;
          prev.transactionCount += 1;
          byCategory.set(key, prev);
        });

        const topCategories = Array.from(byCategory.values())
          .map((x) => ({
            ...x,
            percentage: (x.total / Math.max(1, totalIncome + totalExpenses)) * 100,
          }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 10);

        const periodMap = new Map<string, MonthlyData>();
        rows.forEach((tx) => {
          const period = this.toPeriod(tx.date, groupBy);
          const prev = periodMap.get(period) ?? {
            period,
            income: 0,
            expenses: 0,
            balance: 0,
          };
          if (tx.type === 'income') prev.income += tx.amount;
          else prev.expenses += tx.amount;
          prev.balance = prev.income - prev.expenses;
          periodMap.set(period, prev);
        });

        const monthlyData = Array.from(periodMap.values()).sort((a, b) =>
          a.period.localeCompare(b.period)
        );

        return {
          success: true,
          data: {
            totalIncome,
            totalExpenses,
            balance,
            transactionCount,
            avgTransactionAmount,
            topCategories,
            monthlyData,
          },
        };
      })
    );
  }

  getMonthlyData(filter: ReportFilter): Observable<ApiResponse<MonthlyData[]>> {
    return this.getSummary(filter).pipe(
      map((res) => ({
        success: true,
        data: res.data.monthlyData,
      }))
    );
  }

  getCategoryStats(filter: ReportFilter): Observable<ApiResponse<CategoryStat[]>> {
    return this.getSummary(filter).pipe(
      map((res) => ({
        success: true,
        data: res.data.topCategories,
      }))
    );
  }

  downloadExcel(_filter: ReportFilter): Observable<Blob> {
    return throwError(() => new Error('Backend report export endpoint not available'));
  }
}