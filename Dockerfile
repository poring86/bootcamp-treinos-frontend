FROM node:24-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.30.0 --activate

WORKDIR /app

# ------- Dependencies -------
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ------- Build -------
FROM deps AS build
COPY . .
# We need environment variables for build time sometimes (e.g. static export)
# For Next.js dev/standalone we can pass them at runtime
RUN pnpm run build

# ------- Production -------
FROM base AS production
ENV NODE_ENV=production

# Next.js standalone mode is better for Docker but requires next.config.ts setup
# For now we'll do a standard start if standalone is not configured
# But since it's a bootcamp project, let's keep it simple or try standalone
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules

EXPOSE 3000

CMD ["pnpm", "start"]
