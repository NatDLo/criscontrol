FROM python:3.8-slim

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código
COPY backend/ .

# Crear carpeta de static files
RUN mkdir -p /app/staticfiles

# Recolectar static files
RUN python manage.py collectstatic --noinput || true

# Exponer puerto
EXPOSE 8000

# Comando para iniciar con gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "backend.wsgi:application"]