# CrisControl

CrisControl is a personal finance application with an Angular frontend, a Django REST API, and PostgreSQL.

## Arquitectura

- `frontend/Finance_App`: Angular 17 application served by Nginx.
- `backend`: Django REST Framework API with JWT authentication.
- `db`: PostgreSQL 15.
- `docker-compose.yml`: local orchestration for the three services.

## Requirements

- Docker Desktop with Compose v2.
- Node.js 18+ and npm when running Angular outside Docker.
- Python 3.8+ when running Django outside Docker.

## Start With Docker

From the repository root:

```bash
docker compose up -d --build
docker compose ps
```

Local URLs:

- Frontend: http://localhost
- API: http://localhost:8000
- Django administration: http://localhost:8000/admin/

The backend runs migrations and collects static files on startup. PostgreSQL stores its data in the named `postgres_data` volume.

## Common Operations

```bash
docker compose logs -f backend
docker compose exec backend python manage.py createsuperuser
docker compose exec backend python manage.py check
docker compose down
```

Do not use `docker compose down -v` or `docker system prune --volumes` if you want to preserve the database.

## Backup And Restore

Create a backup:

```bash
docker compose exec -T db pg_dump -U postgres -d criscontrol > backup_criscontrol.sql
```

Restore an SQL backup:

```bash
docker compose exec -T db psql -U postgres -d criscontrol < backup_criscontrol.sql
```

## Development And Quality

Detailed documentation is available in [backend/README.md](backend/README.md) and [frontend/Finance_App/README.md](frontend/Finance_App/README.md).

```bash
cd backend
python manage.py test
coverage run --source=. manage.py test
coverage report -m --fail-under=100
```

```bash
cd frontend/Finance_App
npm ci
npm test -- --watch=false --code-coverage
npm run build
```

## Environment Variables

For development, Docker reads `SECRET_KEY` from `.env`; if it is missing, a local development key is used. In production, configure a secure key, allowed hosts, CORS origins, and credentials outside the repository.
