import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { Category, CreateCategoryDto, UpdateCategoryDto, ApiResponse } from '../models';

type BackendCategoryType = 'INCOME' | 'EXPENSE';

interface BackendCategory {
  id: number;
  name: string;
  description: string | null;
  cat_type: BackendCategoryType;
  icon: string;
  color: string;
}

interface BackendCategoryPayload {
  name: string;
  description?: string;
  cat_type: BackendCategoryType;
  icon?: string;
  color?: string;
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);

  private api(path: string): string {
    const base = environment.apiUrl.replace(/\/+$/, '');
    const cleanPath = path.replace(/^\/+/, '');
    return `${base}/${cleanPath}`;
  }

  private toFrontend(cat: BackendCategory): Category {
    return {
      id: String(cat.id),
      name: cat.name,
      description: cat.description ?? '',
      cat_type: cat.cat_type,
      type: cat.cat_type === 'INCOME' ? 'income' : 'expense',
      isActive: true,
      icon: cat.icon ?? 'category',
      color: cat.color ?? (cat.cat_type === 'INCOME' ? '#10B981' : '#EF4444'),
    };
  }

  private toBackend(dto: CreateCategoryDto | UpdateCategoryDto): BackendCategoryPayload {
    const type = dto.type === 'income' ? 'INCOME' : 'EXPENSE';
    return {
      name: (dto.name ?? '').trim(),
      description: dto.description ?? '',
      cat_type: type,
      icon: dto.icon ?? 'category',
      color: dto.color ?? (type === 'INCOME' ? '#10B981' : '#EF4444'),
    };
  }

  getAll(type?: string): Observable<ApiResponse<Category[]>> {
    let params = new HttpParams();

    if (type && type !== 'all') {
      const catType = type === 'income' ? 'INCOME' : 'EXPENSE';
      params = params.set('cat_type', catType);
    }

    return this.http
      .get<BackendCategory[]>(this.api(API_ENDPOINTS.CATEGORIES.BASE), { params })
      .pipe(
        map((items) => ({
          success: true,
          data: items.map((x) => this.toFrontend(x)),
        }))
      );
  }

  create(dto: CreateCategoryDto): Observable<ApiResponse<Category>> {
    return this.http
      .post<BackendCategory>(
        this.api(API_ENDPOINTS.CATEGORIES.BASE),
        this.toBackend(dto)
      )
      .pipe(
        map((item) => ({
          success: true,
          data: this.toFrontend(item),
          message: 'Categoría creada',
        }))
      );
  }

  update(id: string, dto: UpdateCategoryDto): Observable<ApiResponse<Category>> {
    return this.http
      .put<BackendCategory>(
        this.api(API_ENDPOINTS.CATEGORIES.BY_ID(id)),
        this.toBackend(dto)
      )
      .pipe(
        map((item) => ({
          success: true,
          data: this.toFrontend(item),
          message: 'Categoría actualizada',
        }))
      );
  }

  remove(id: string): Observable<ApiResponse<void>> {
    return this.http
      .delete<void>(this.api(API_ENDPOINTS.CATEGORIES.BY_ID(id)))
      .pipe(
        map(() => ({
          success: true,
          data: undefined,
          message: 'Categoría eliminada',
        }))
      );
  }
}