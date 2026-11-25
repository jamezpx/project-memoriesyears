# ---- Stage 1: Build ----
FROM node:24-alpine AS builder

# Install pnpm globally
RUN npm install -g pnpm

WORKDIR /app

# Copy dependency manifests first for better Docker layer caching
COPY package.json pnpm-lock.yaml ./

# Install dependencies strictly from lockfile
RUN pnpm install --frozen-lockfile

# Copy source code and build
COPY . .
RUN pnpm build


# ---- Stage 2: Serve ----
FROM nginx:alpine AS runner

# Remove default nginx config and copy our custom one
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static output (includes public/zeroperl.wasm -> dist/zeroperl.wasm)
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
