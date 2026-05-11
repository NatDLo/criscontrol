import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import {
  ReportFilter,
  ReportSummary,
  MonthlyData,
  CategoryStat,
  ApiResponse,
} from '../models';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getSummary(filter: ReportFilter): Observable<ApiResponse<ReportSummary>> {
    return this.http.get<ApiResponse<ReportSummary>>(
      `${this.baseUrl}${API_ENDPOINTS.REPORTS.SUMMARY}`,
      { params: this.toParams(filter) }
    );
  }

  getMonthlyData(filter: ReportFilter): Observable<ApiResponse<MonthlyData[]>> {
    return this.http.get<ApiResponse<MonthlyData[]>>(
      `${this.baseUrl}${API_ENDPOINTS.REPORTS.MONTHLY}`,
      { params: this.toParams(filter) }
    );
  }

  getCategoryStats(filter: ReportFilter): Observable<ApiResponse<CategoryStat[]>> {
    return this.http.get<ApiResponse<CategoryStat[]>>(
      `${this.baseUrl}${API_ENDPOINTS.REPORTS.BY_CATEGORY}`,
      { params: this.toParams(filter) }
    );
  }

  /**
   * Requests an Excel file from the backend.
   * The Python API should return a binary .xlsx blob.
   */
  downloadExcel(filter: ReportFilter): Observable<Blob> {
    return this.http.get(
      `${this.baseUrl}${API_ENDPOINTS.REPORTS.EXPORT}`,
      { params: this.toParams(filter), responseType: 'blob' }
    );
  }

  private toParams(filter: ReportFilter): HttpParams {
    let params = new HttpParams();
    (Object.entries(filter) as [string, unknown][]).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') return;
      if (Array.isArray(value)) {
        value.forEach((v) => (params = params.append(key, String(v))));
      } else {
        params = params.set(key, String(value));
      }
    });
    return params;
  }
}
