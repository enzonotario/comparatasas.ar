# syntax=docker/dockerfile:1
# Multi-stage Bun image for Nuxt SSR on Coolify (NITRO_PRESET=bun).
# Debian slim (glibc) for native deps (nuxt-og-image / @takumi-rs).

FROM oven/bun:1.3-slim AS deps
WORKDIR /app

COPY package.json bun.lock bunfig.toml pnpm-workspace.yaml ./

RUN bun install --frozen-lockfile

FROM deps AS build
WORKDIR /app
COPY . .

ENV NODE_ENV=production
ENV NITRO_PRESET=bun
ENV HOST=0.0.0.0
ENV PORT=3000

# generate-fci-tna hits api.argentinadatos.com; needs build-time network.
# Run TS with Bun directly (tsx under bun fails on ./cjs/index.cjs).
# Fondos pages use Nitro SWR at runtime (see nuxt.config) to avoid prerender OOM.
RUN bun scripts/generate-fci-nominal-tna.ts \
  && bunx --bun nuxi build

FROM oven/bun:1.3-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV NITRO_PRESET=bun
ENV HOST=0.0.0.0
ENV PORT=3000

# curl: Coolify healthchecks require curl/wget in the image.
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/.output ./.output
COPY --from=build /app/package.json ./package.json

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=5 \
  CMD curl -fsS http://127.0.0.1:3000/ >/dev/null || exit 1

CMD ["bun", "run", ".output/server/index.mjs"]
