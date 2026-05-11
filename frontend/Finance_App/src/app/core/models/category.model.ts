export type CategoryType = 'income' | 'expense' | 'both';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  color?: string;
  icon?: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface CreateCategoryDto {
  name: string;
  type: CategoryType;
  color?: string;
  icon?: string;
  description?: string;
}

export type UpdateCategoryDto = Partial<CreateCategoryDto>;
