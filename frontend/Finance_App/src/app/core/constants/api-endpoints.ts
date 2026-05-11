/**
 * Centralized API endpoint constants.
 * Update BASE_PATH if the Python backend uses a different prefix.
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN:   '/auth/login',
    LOGOUT:  '/auth/logout',
    ME:      '/auth/me',
    REFRESH: '/auth/refresh',
  },

  TRANSACTIONS: {
    BASE:    '/transactions',
    BY_ID:   (id: string) => `/transactions/${id}`,
    SUMMARY: '/transactions/summary',
  },

  CATEGORIES: {
    BASE:  '/categories',
    BY_ID: (id: string) => `/categories/${id}`,
  },

  REPORTS: {
    SUMMARY:     '/reports/summary',
    MONTHLY:     '/reports/monthly',
    BY_CATEGORY: '/reports/by-category',
    EXPORT:      '/reports/export',
  },
} as const;
