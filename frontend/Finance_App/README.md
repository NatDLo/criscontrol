# FinanceApp – Angular 17

Personal and business finance management application.

## Tech Stack

- **Angular 17** (standalone components, signals, new control flow `@if/@for`)
- **Angular Material 17** (UI components)
- **SheetJS (xlsx)** (client-side Excel export)
- **RxJS 7** (asynchronous state management)
- **TypeScript 5.4**

---

## Estructura del proyecto

```
src/app/
├── core/
│   ├── constants/      # API endpoints
│   ├── interceptors/   # auth + error HTTP interceptors
│   ├── models/         # TypeScript interfaces (Transaction, Category, Report, User...)
│   └── services/       # TransactionService, CategoryService, ReportService, AuthService, ExcelExportService
├── features/
│   ├── dashboard/      # Financial summary + KPI cards
│   ├── transactions/   # Income/expense CRUD + table + form dialog
│   ├── categories/     # Category CRUD
│   └── reports/        # Report generation + Excel export
├── layout/
│   ├── header/         # Top bar with user menu
│   ├── main-layout/    # Main shell (sidebar + router-outlet)
│   └── sidebar/        # Collapsible side navigation
└── shared/
    ├── components/
    │   └── confirm-dialog/  # Reusable confirmation dialog
    └── pipes/
        └── abs.pipe.ts      # Pipe valor absoluto
```

---

## Python Backend API

La app usa `http://127.0.0.1:8000/api/` en desarrollo, configurable en `src/environments/environment.ts`.

### Endpoints

| Method | Route | Description |
|--------|------|-------------|
| POST | `/auth/login/` | Login y tokens JWT |
| GET/PATCH | `/auth/me/` | Usuario autenticado |
| POST | `/auth/refresh/` | Renovar access token |
| POST | `/auth/logout/` | Invalidar refresh token |
| GET/POST | `/categories/` | List or create categories |
| GET/PUT/DELETE | `/categories/:id/` | Manage a category |
| GET/POST | `/transactions/` | List or create transactions |
| GET/PUT/DELETE | `/transactions/:id/` | Manage a transaction |

### Expected JSON Response Format

```json
// Respuesta simple
{ "data": { ... }, "success": true, "message": "..." }

// Respuesta paginada
{ "data": [...], "total": 100, "page": 1, "pageSize": 10, "totalPages": 10 }
```

---

## Installation And Start

```bash
# Install dependencies
npm install

# Development server
npm start

# Production build
npm run build
```

## Tests y cobertura

```bash
npm test -- --watch=false --browsers=ChromeHeadless --code-coverage
```

The report is generated at `coverage/finance-app/index.html`. The suite covers HTTP services, authentication, guards, interceptors, reports, Excel export, pipes, and reusable components.

## Docker

From the repository root:

```bash
docker compose up -d --build
```

The frontend is published at `http://localhost`, and Nginx serves the production build.

---

## Security

- The Bearer token is stored in `sessionStorage` (which is cleared when the tab is closed).
- For stronger production security, use **HttpOnly cookies** in the Python backend and disable token storage in the frontend.
- `AuthInterceptor` intercepts 401 responses and logs the user out automatically.
- `ErrorInterceptor` displays friendly error messages through MatSnackBar.
