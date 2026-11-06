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

# Fondos pages use Nitro SWR at runtime (see nuxt.config) to avoid prerender OOM.
# Nominal TNA estimates are computed at runtime (/api/fci/nominal-tna.json).
RUN bunx --bun nuxi build

# Nitro's file trace skips the platform-specific optional binding of
# @takumi-rs/core, so runtime OG images (/_og/d/*) fail with
# "Cannot find native binding". The image is built for linux/amd64 (glibc).
RUN set -e; \
  src=$(find node_modules -path '*/@takumi-rs/core-linux-x64-gnu' -print -quit); \
  test -n "$src"; \
  mkdir -p .output/server/node_modules/@takumi-rs; \
  cp -rL "$src" .output/server/node_modules/@takumi-rs/

FROM oven/bun:1.3-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV NITRO_PRESET=bun
ENV HOST=0.0.0.0
ENV PORT=3000
# Bun.serve closes connections idle for 10 s by default. Cold cache misses
# (31 MB FCI catalog + nominal TNA history fetches) can take ~20-30 s.
ENV NITRO_BUN_IDLE_TIMEOUT=60

# curl: Coolify healthchecks require curl/wget in the image.
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/.output ./.output
COPY --from=build /app/package.json ./package.json

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=5 \
  CMD curl -fsS http://127.0.0.1:3000/ >/dev/null || exit 1

# --smol: more aggressive GC; keeps RSS well below the container memory limit.
CMD ["bun", "--smol", "run", ".output/server/index.mjs"]
