# --- Stage 1: Install dependencies ---
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN corepack enable pnpm

# Install dependencies based on the preferred package manager
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# --- Stage 2: Build the application ---
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable pnpm
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 👇 THÊM ĐOẠN NÀY
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_GOOGLE_REDIRECT_URI
ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_WS_URL

ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_GOOGLE_REDIRECT_URI=$NEXT_PUBLIC_GOOGLE_REDIRECT_URI
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL

RUN echo "GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID"
RUN echo "GOOGLE_REDIRECT_URI=$NEXT_PUBLIC_GOOGLE_REDIRECT_URI"
RUN echo "BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL"
RUN echo "WS_URL=$NEXT_PUBLIC_WS_URL"

RUN pnpm run build

# --- Stage 3: Production runner ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000

# Memory optimization for resource-constrained environment
# --max-old-space-size sets the heap limit. Suggested 450MB - 512MB for 1GB host.
ENV NODE_OPTIONS="--max-old-space-size=450"

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]
