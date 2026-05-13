/**
 * Centralized API endpoint constants.
 * Update BASE_PATH if the Python backend uses a different prefix.
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN:   '/auth/login/',
    LOGOUT:  '/auth/logout/',
    ME:      '/auth/me/',
    REFRESH: '/auth/refresh/',
    REGISTER: '/auth/register/',
    CHANGE_PASSWORD: '/auth/change-password/',
  },

  TRANSACTIONS: {
    BASE:    '/transactions/',
    BY_ID:   (id: string) => `/transactions/${id}/`,
  },

  CATEGORIES: {
    BASE:  '/categories/',
    BY_ID: (id: string) => `/categories/${id}/`,
  },

} as const;
