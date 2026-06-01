# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build arg for API URL
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci --silent

COPY . .
RUN npm run build


# ── Stage 2: Production server ────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Remove default nginx site
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create non-root user for nginx worker
RUN addgroup -S nginxgroup && adduser -S nginxuser -G nginxgroup

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost/nginx-health || exit 1

CMD ["nginx", "-g", "daemon off;"]
