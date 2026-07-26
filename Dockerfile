# ── Stage 1: Builder ─────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install deps with caching
COPY package*.json ./
RUN npm ci --ignore-scripts

# Copy source and build
COPY . .
RUN npm run build

# ── Stage 2: Production server ────────────────────────────────────
FROM nginx:alpine AS production

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy built app
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create non-root user
RUN addgroup -g 1001 -S nginx_group && \
    adduser -u 1001 -S nginx_user -G nginx_group

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
