FROM node:18-alpine AS builder
WORKDIR /app
COPY frontend/Finance_App/package*.json ./
RUN npm ci
COPY frontend/Finance_App/ .
RUN npm run build -- --configuration production

FROM nginx:alpine
COPY frontend/nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/dist/finance-app/browser /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]