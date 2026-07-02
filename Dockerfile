# ─────────────────────────────────────────────────────────────────
# Stage 1: Build
# ─────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

# Enforce non-interactive installs
ENV CI=true \
    NODE_ENV=production

WORKDIR /build

# Install dependencies first (layer cache optimised)
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy source and build
COPY . .
RUN npm run typecheck && \
    npm run lint && \
    npm run build

# ─────────────────────────────────────────────────────────────────
# Stage 2: Serve (hardened nginx)
# ─────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Remove default content and configs
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

# Copy hardened nginx config
COPY nginx.conf /etc/nginx/conf.d/bms.conf

# Copy build artefacts
COPY --from=builder /build/dist /usr/share/nginx/html

# Non-root user execution
RUN addgroup -g 1001 -S bmsgroup && \
    adduser  -u 1001 -S bmsuser -G bmsgroup && \
    chown -R bmsuser:bmsgroup /usr/share/nginx/html && \
    chown -R bmsuser:bmsgroup /var/cache/nginx && \
    chown -R bmsuser:bmsgroup /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown bmsuser:bmsgroup /var/run/nginx.pid

USER bmsuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
