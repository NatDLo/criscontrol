# Backend CrisControl

REST API built with Django 4.2 and Django REST Framework. It uses PostgreSQL in Docker and SQLite as a local fallback when `DATABASE_URL` is not defined.

## Aplicaciones

- `users`: custom email-based user, JWT, registration, verification, profile, and password management.
- `categories`: per-user income and expense categories.
- `transactions`: financial transactions with filters, currencies, and owner isolation.

## Local Execution

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The Docker image uses Python 3.8 and `dj-database-url==2.1.0`, which is compatible with that Python version.

## Endpoints

Base: `/api/`

| Method | Route | Purpose |
|---|---|---|
| POST | `/auth/register/` | Create an account |
| POST | `/auth/login/` | Obtain JWT tokens |
| POST | `/auth/refresh/` | Refresh the access token |
| POST | `/auth/logout/` | Blacklist the refresh token |
| GET/PATCH | `/auth/me/` | Read or update the profile |
| POST | `/auth/change-password/` | Change the password |
| GET | `/auth/verify-email/<uidb64>/<token>/` | Verify an email |
| GET/POST | `/categories/` | List or create categories |
| GET/PUT/PATCH/DELETE | `/categories/<id>/` | Manage an owned category |
| GET/POST | `/transactions/` | List or create transactions |
| GET/PUT/PATCH/DELETE | `/transactions/<id>/` | Manage an owned transaction |

Protected routes require `Authorization: Bearer <access-token>`.

## Transaction Filters

`GET /api/transactions/` accepts `start_date`, `end_date`, `category`, `cat_type`, and `currency`.

## Tests And Coverage

Desde `backend/`:

```bash
python manage.py test
coverage run --source=. manage.py test
coverage report -m
coverage html
coverage report --fail-under=100
```

The HTML report is generated at `htmlcov/index.html`. The suite tests models, serializers, endpoints, authentication, permissions, filters, and currency rules.

## Data And Backup

In Docker, the `postgres_data` volume preserves PostgreSQL data when containers are recreated. Create a backup with:

```bash
docker compose exec -T db pg_dump -U postgres -d criscontrol > backup_criscontrol.sql
```

Restore it with:

```bash
docker compose exec -T db psql -U postgres -d criscontrol < backup_criscontrol.sql
```

Never use `docker compose down -v` to stop the environment if you need to preserve the data.
