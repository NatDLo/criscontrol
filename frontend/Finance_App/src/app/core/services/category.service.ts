import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { Category, CreateCategoryDto, UpdateCategoryDto, ApiResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getAll(type?: string): Observable<ApiResponse<Category[]>> {
    let params = new HttpParams();
    if (type) params = params.set('type', type);
    return this.http.get<ApiResponse<Category[]>>(
      `${this.baseUrl}${API_ENDPOINTS.CATEGORIES.BASE}`,
      { params }
    );
  }

  create(dto: CreateCategoryDto): Observable<ApiResponse<Category>> {
    return this.http.post<ApiResponse<Category>>(
      `${this.baseUrl}${API_ENDPOINTS.CATEGORIES.BASE}`,
      dto
    );
  }

  update(id: string, dto: UpdateCategoryDto): Observable<ApiResponse<Category>> {
    return this.http.put<ApiResponse<Category>>(
      `${this.baseUrl}${API_ENDPOINTS.CATEGORIES.BY_ID(id)}`,
      dto
    );
  }

  remove(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.baseUrl}${API_ENDPOINTS.CATEGORIES.BY_ID(id)}`
    );
  }
}
