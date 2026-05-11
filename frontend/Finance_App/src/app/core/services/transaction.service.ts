import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getAll(filter?: TransactionFilter): Observable<PaginatedResponse<Transaction>> {
    const params = this.toHttpParams(filter);
    return this.http.get<PaginatedResponse<Transaction>>(
      `${this.baseUrl}${API_ENDPOINTS.TRANSACTIONS.BASE}`,
      { params }
    );
  }

  getById(id: string): Observable<ApiResponse<Transaction>> {
    return this.http.get<ApiResponse<Transaction>>(
      `${this.baseUrl}${API_ENDPOINTS.TRANSACTIONS.BY_ID(id)}`
    );
  }

  create(dto: CreateTransactionDto): Observable<ApiResponse<Transaction>> {
    return this.http.post<ApiResponse<Transaction>>(
      `${this.baseUrl}${API_ENDPOINTS.TRANSACTIONS.BASE}`,
      dto
    );
  }

  update(id: string, dto: UpdateTransactionDto): Observable<ApiResponse<Transaction>> {
    return this.http.put<ApiResponse<Transaction>>(
      `${this.baseUrl}${API_ENDPOINTS.TRANSACTIONS.BY_ID(id)}`,
      dto
    );
  }

  remove(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.baseUrl}${API_ENDPOINTS.TRANSACTIONS.BY_ID(id)}`
    );
  }

  getSummary(startDate?: string, endDate?: string): Observable<ApiResponse<TransactionSummary>> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate)   params = params.set('endDate', endDate);
    return this.http.get<ApiResponse<TransactionSummary>>(
      `${this.baseUrl}${API_ENDPOINTS.TRANSACTIONS.SUMMARY}`,
      { params }
    );
  }

  private toHttpParams(obj?: TransactionFilter): HttpParams {
    let params = new HttpParams();
    Object.entries(obj ?? {}).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return params;
  }
}
