# Etapa 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

COPY frontend/Finance_App/package*.json ./

RUN npm ci

COPY frontend/Finance_App/ .

RUN npm run build -- --configuration production

# Etapa 2: Nginx
FROM nginx:alpine

COPY frontend/nginx.conf /etc/nginx/nginx.conf

COPY --from=builder /app/dist/Finance_App /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]