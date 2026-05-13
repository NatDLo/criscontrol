import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import {
  Transaction,
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionFilter,
  TransactionSummary,
  PaginatedResponse,
  ApiResponse,
} from '../models';

type BackendCategoryType = 'INCOME' | 'EXPENSE';

interface BackendTransaction {
  id: number;
  amount: string | number;
  currency: 'ARS' | 'USD' | 'EUR' | 'CUSTOM';
  custom_currency: string | null;
  currency_display: string;
  date: string;
  description: string | null;
  category: number;
  category_name: string;
  category_type: BackendCategoryType;
}

interface BackendTransactionPayload {
  amount?: number;
  currency?: 'ARS' | 'USD' | 'EUR' | 'CUSTOM';
  custom_currency?: string | null;
  date?: string;
  description?: string;
  category?: number;
}

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly http = inject(HttpClient);

  private api(path: string): string {
    const base = environment.apiUrl.replace(/\/+$/, '');
    const cleanPath = path.replace(/^\/+/, '');
    return `${base}/${cleanPath}`;
  }

  private toFrontend(tx: BackendTransaction): Transaction {
    const type = tx.category_type === 'INCOME' ? 'income' : 'expense';
    return {
      id: String(tx.id),
      type,
      amount: Number(tx.amount),
      categoryId: String(tx.category),
      categoryName: tx.category_name,
      description: tx.description ?? '',
      date: tx.date,
      notes: '',
      currency: tx.currency,
      customCurrency: tx.custom_currency,
      currencyDisplay: tx.currency_display,
    };
  }

  private toBackend(dto: CreateTransactionDto | UpdateTransactionDto): BackendTransactionPayload {
    return {
      amount: dto.amount,
      date: dto.date,
      description: dto.description,
      category: dto.categoryId ? Number(dto.categoryId) : undefined,
      currency: dto.currency ?? 'ARS',
      custom_currency: dto.currency === 'CUSTOM' ? (dto.customCurrency ?? null) : null,
    };
  }

  private buildBackendParams(filter?: TransactionFilter): HttpParams {
    let params = new HttpParams();

    if (!filter) return params;

    if (filter.startDate) params = params.set('start_date', filter.startDate);
    if (filter.endDate) params = params.set('end_date', filter.endDate);
    if (filter.categoryId) params = params.set('category', filter.categoryId);

    if (filter.type && filter.type !== 'all') {
      params = params.set('cat_type', filter.type === 'income' ? 'INCOME' : 'EXPENSE');
    }

    if (filter.currency) params = params.set('currency', String(filter.currency));

    return params;
  }

  private applyClientFiltersAndPaging(
    data: Transaction[],
    filter?: TransactionFilter
  ): PaginatedResponse<Transaction> {
    let rows = [...data];
    const page = filter?.page ?? 1;
    const pageSize = filter?.pageSize ?? 10;

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      rows = rows.filter(
        (x) =>
          x.description.toLowerCase().includes(q) ||
          (x.categoryName ?? '').toLowerCase().includes(q)
      );
    }

    if (filter?.minAmount !== undefined) {
      rows = rows.filter((x) => x.amount >= Number(filter.minAmount));
    }

    if (filter?.maxAmount !== undefined) {
      rows = rows.filter((x) => x.amount <= Number(filter.maxAmount));
    }

    if (filter?.sortBy) {
      const dir = filter.sortDir === 'asc' ? 1 : -1;
      rows.sort((a, b) => {
        if (filter.sortBy === 'amount') return (a.amount - b.amount) * dir;
        if (filter.sortBy === 'date') return (a.date.localeCompare(b.date)) * dir;
        return 0;
      });
    }

    const total = rows.length;
    const start = (page - 1) * pageSize;
    const paged = rows.slice(start, start + pageSize);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return {
      data: paged,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  getAll(filter?: TransactionFilter): Observable<PaginatedResponse<Transaction>> {
    const params = this.buildBackendParams(filter);

    return this.http
      .get<BackendTransaction[]>(this.api(API_ENDPOINTS.TRANSACTIONS.BASE), { params })
      .pipe(
        map((rows) => rows.map((x) => this.toFrontend(x))),
        map((rows) => this.applyClientFiltersAndPaging(rows, filter))
      );
  }

  getById(id: string): Observable<ApiResponse<Transaction>> {
    return this.http
      .get<BackendTransaction>(this.api(API_ENDPOINTS.TRANSACTIONS.BY_ID(id)))
      .pipe(
        map((row) => ({
          success: true,
          data: this.toFrontend(row),
        }))
      );
  }

  create(dto: CreateTransactionDto): Observable<ApiResponse<Transaction>> {
    return this.http
      .post<BackendTransaction>(
        this.api(API_ENDPOINTS.TRANSACTIONS.BASE),
        this.toBackend(dto)
      )
      .pipe(
        map((row) => ({
          success: true,
          data: this.toFrontend(row),
          message: 'Transacción creada',
        }))
      );
  }

  update(id: string, dto: UpdateTransactionDto): Observable<ApiResponse<Transaction>> {
    return this.http
      .put<BackendTransaction>(
        this.api(API_ENDPOINTS.TRANSACTIONS.BY_ID(id)),
        this.toBackend(dto)
      )
      .pipe(
        map((row) => ({
          success: true,
          data: this.toFrontend(row),
          message: 'Transacción actualizada',
        }))
      );
  }

  remove(id: string): Observable<ApiResponse<void>> {
    return this.http
      .delete<void>(this.api(API_ENDPOINTS.TRANSACTIONS.BY_ID(id)))
      .pipe(
        map(() => ({
          success: true,
          data: undefined,
          message: 'Transacción eliminada',
        }))
      );
  }

  getSummary(startDate?: string, endDate?: string): Observable<ApiResponse<TransactionSummary>> {
    const filter: TransactionFilter = {
      startDate,
      endDate,
      page: 1,
      pageSize: 100000,
      sortBy: 'date',
      sortDir: 'desc',
    };

    return this.getAll(filter).pipe(
      map((res) => {
        const totalIncome = res.data
          .filter((x) => x.type === 'income')
          .reduce((acc, x) => acc + x.amount, 0);

        const totalExpenses = res.data
          .filter((x) => x.type === 'expense')
          .reduce((acc, x) => acc + x.amount, 0);

        const summary: TransactionSummary = {
          totalIncome,
          totalExpenses,
          balance: totalIncome - totalExpenses,
          transactionCount: res.data.length,
        };

        return {
          success: true,
          data: summary,
        };
      })
    );
  }
}