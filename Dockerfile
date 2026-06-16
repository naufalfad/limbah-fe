# Stage 1: Build Environment (Node.js)
FROM node:20-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Kompilasi React/Vite menjadi file statis HTML/CSS/JS murni
RUN npm run build

# Stage 2: Production Environment (Nginx Alpine)
FROM nginx:alpine
# Pindahkan hasil kompilasi dari Stage 1 ke dalam Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# [CRITICAL HACK] Konfigurasi Nginx untuk React Router (Single Page Application)
# Mencegah error 404 Not Found saat user melakukan refresh halaman (F5) pada URL spesifik
RUN sed -i 's/location \/ {/location \/ { try_files $uri $uri\/ \/index.html;/g' /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
