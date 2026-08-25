import { TestBed } from '@angular/core/testing';
import { ReportService } from './report.service';
import { TransactionService } from './transaction.service';
import { of } from 'rxjs';

describe('ReportService', () => {
  let service: ReportService;
  const transactions = [
    { id: '1', type: 'income' as const, amount: 100, categoryId: '1', categoryName: 'Salary', description: 'salary', date: '2026-08-03', currency: 'ARS' as const },
    { id: '2', type: 'expense' as const, amount: 25, categoryId: '2', categoryName: 'Food', description: 'lunch', date: '2026-08-10', currency: 'ARS' as const },
  ];
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ReportService, { provide: TransactionService, useValue: { getAll: () => of({ data: transactions, total: 2, page: 1, pageSize: 100000, totalPages: 1 }) } }] });
    service = TestBed.inject(ReportService);
  });
  it('builds summary grouped by month and category', () => {
    service.getSummary({ startDate: '2026-08-01', endDate: '2026-08-31' }).subscribe((r) => {
      expect(r.data.totalIncome).toBe(100); expect(r.data.totalExpenses).toBe(25); expect(r.data.balance).toBe(75);
      expect(r.data.topCategories.length).toBe(2); expect(r.data.monthlyData[0]).toEqual(jasmine.objectContaining({ period: '2026-08', income: 100, expenses: 25, balance: 75 }));
    });
  });
  it('supports category filtering and day/week groups', () => {
    service.getSummary({ startDate: '2026-08-01', endDate: '2026-08-31', categoryIds: ['1'], groupBy: 'day' }).subscribe((r) => expect(r.data.monthlyData[0].period).toBe('2026-08-03'));
    service.getSummary({ startDate: '2026-08-01', endDate: '2026-08-31', groupBy: 'week' }).subscribe((r) => expect(r.data.monthlyData[0].period).toContain('-W'));
  });
  it('projects monthly and category data and reports unavailable export', () => {
    const filter = { startDate: '2026-08-01', endDate: '2026-08-31' };
    service.getMonthlyData(filter).subscribe((r) => expect(r.data.length).toBe(1));
    service.getCategoryStats(filter).subscribe((r) => expect(r.data.length).toBe(2));
    service.downloadExcel(filter).subscribe({ error: (error) => expect(error.message).toContain('not available') });
  });
});
