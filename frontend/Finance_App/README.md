# FinanceApp – Angular 17

Aplicación de gestión de finanzas personales/empresariales.

## Tech Stack

- **Angular 17** (standalone components, signals, new control flow `@if/@for`)
- **Angular Material 17** (UI components)
- **SheetJS (xlsx)** (exportación Excel cliente-side)
- **RxJS 7** (gestión de estado asíncrono)
- **TypeScript 5.4**

---

## Estructura del proyecto

```
src/app/
├── core/
│   ├── constants/      # API endpoints
│   ├── interceptors/   # auth + error HTTP interceptors
│   ├── models/         # interfaces TypeScript (Transaction, Category, Report, User...)
│   └── services/       # TransactionService, CategoryService, ReportService, AuthService, ExcelExportService
├── features/
│   ├── dashboard/      # Resumen financiero + tarjetas KPI
│   ├── transactions/   # CRUD de ingresos/gastos + tabla + form dialog
│   ├── categories/     # CRUD de categorías
│   └── reports/        # Generación de reportes + exportación Excel
├── layout/
│   ├── header/         # Barra superior con menú de usuario
│   ├── main-layout/    # Shell principal (sidebar + router-outlet)
│   └── sidebar/        # Navegación lateral colapsable
└── shared/
    ├── components/
    │   └── confirm-dialog/  # Dialog reutilizable de confirmación
    └── pipes/
        └── abs.pipe.ts      # Pipe valor absoluto
```

---

## API Python Backend

La app espera una API REST en `http://localhost:8000/api/v1` (configurable en `src/environments/environment.ts`).

### Endpoints esperados

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST   | `/auth/login` | Login – devuelve `{ accessToken, user }` |
| GET    | `/auth/me` | Usuario autenticado |
| GET    | `/transactions` | Lista paginada con filtros |
| POST   | `/transactions` | Crear transacción |
| PUT    | `/transactions/:id` | Actualizar |
| DELETE | `/transactions/:id` | Eliminar |
| GET    | `/transactions/summary` | Totales del período |
| GET    | `/categories` | Lista de categorías |
| POST   | `/categories` | Crear categoría |
| PUT    | `/categories/:id` | Actualizar |
| DELETE | `/categories/:id` | Eliminar |
| GET    | `/reports/summary` | Resumen del reporte |
| GET    | `/reports/monthly` | Datos mensuales |
| GET    | `/reports/by-category` | Desglose por categoría |
| GET    | `/reports/export` | Devuelve blob .xlsx |

### Formato de respuesta esperado (JSON)

```json
// Respuesta simple
{ "data": { ... }, "success": true, "message": "..." }

// Respuesta paginada
{ "data": [...], "total": 100, "page": 1, "pageSize": 10, "totalPages": 10 }
```

---

## Instalación y arranque

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm start

# Build producción
npm run build
```

---

## Seguridad

- El Bearer token se almacena en `sessionStorage` (se limpia al cerrar pestaña).
- Para mayor seguridad en producción, usar **HttpOnly cookies** en el backend Python y deshabilitar el almacenamiento del token en el frontend.
- El `AuthInterceptor` intercepta 401 y cierra sesión automáticamente.
- El `ErrorInterceptor` muestra mensajes de error amigables via MatSnackBar.
