import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TransactionService } from './transaction.service';
import { environment } from '../../../environments/environment';

describe('TransactionService', () => {
  let service: TransactionService;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}transactions/`;
  const row = (id: number, amount: string, type: 'INCOME' | 'EXPENSE' = 'EXPENSE') => ({ id, amount, currency: 'ARS' as const, custom_currency: null, currency_display: 'ARS', date: `2026-08-0${id}`, description: `Row ${id}`, category: id, category_name: `Cat ${id}`, category_type: type });

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [TransactionService, provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(TransactionService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('maps, filters, sorts, and pages transactions', () => {
    service.getAll({ search: 'row', minAmount: 10, maxAmount: 30, page: 1, pageSize: 2, sortBy: 'amount', sortDir: 'asc', startDate: '2026-08-01', endDate: '2026-08-31', categoryId: '1', type: 'expense', currency: 'ARS' }).subscribe((result) => {
      expect(result.total).toBe(2);
      expect(result.data[0].amount).toBe(10);
      expect(result.data[0].type).toBe('expense');
    });
    const request = http.expectOne((r) => r.url === base);
    expect(request.request.params.get('start_date')).toBe('2026-08-01');
    expect(request.request.params.get('cat_type')).toBe('EXPENSE');
    request.flush([
      { ...row(1, '20'), category: 1 },
      { ...row(2, '10'), category: 1 },
      { ...row(3, '40'), category: 1 },
    ]);
  });

  it('loads transactions without a filter using default paging', () => {
    service.getAll().subscribe((result) => expect(result.pageSize).toBe(10));
    const request = http.expectOne(base);
    expect(request.request.params.keys()).toEqual([]);
    request.flush([]);
  });

  it('supports CRUD and custom currency mapping', () => {
    const custom = { ...row(1, '12.5'), currency: 'CUSTOM' as const, custom_currency: 'GBP', currency_display: 'GBP' };
    service.getById('1').subscribe((r) => expect(r.data.customCurrency).toBe('GBP'));
    let request = http.expectOne(`${base}1/`); request.flush(custom);
    service.create({ amount: 12, categoryId: '1', date: '2026-08-01', description: 'x', type: 'expense', currency: 'CUSTOM', customCurrency: 'GBP' }).subscribe();
    request = http.expectOne(base); expect(request.request.body).toEqual(jasmine.objectContaining({ category: 1, custom_currency: 'GBP' })); request.flush(custom);
    service.update('1', { amount: 13, categoryId: '1', date: '2026-08-01', currency: 'ARS' }).subscribe();
    request = http.expectOne(`${base}1/`); expect(request.request.body.custom_currency).toBeNull(); request.flush(row(1, '13'));
    service.remove('1').subscribe((r) => expect(r.success).toBeTrue());
    request = http.expectOne(`${base}1/`); request.flush(null);
  });

  it('calculates income, expenses, balance, and count', () => {
    service.getSummary().subscribe((r) => expect(r.data).toEqual({ totalIncome: 100, totalExpenses: 25, balance: 75, transactionCount: 2 }));
    const request = http.expectOne(base); request.flush([row(1, '100', 'INCOME'), row(2, '25')]);
  });
});
