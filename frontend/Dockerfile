FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY frontend/package*.json ./frontend/

RUN npm install

COPY frontend/ ./frontend/
COPY tailwind.config.js postcss.config.js ./

RUN npm run build --workspace=frontend

FROM nginx:alpine AS runner

COPY --from=builder /app/frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
