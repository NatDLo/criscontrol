export type CategoryType = 'income' | 'expense' | 'both';
export type BackendCategoryType = 'INCOME' | 'EXPENSE';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  cat_type: BackendCategoryType;
  description?: string;
  isActive: boolean;
  color?: string;
  icon?: string;
}

export interface CreateCategoryDto {
  name: string;
  type: CategoryType;
  color?: string;
  icon?: string;
  description?: string;
}

export type UpdateCategoryDto = Partial<CreateCategoryDto>;
