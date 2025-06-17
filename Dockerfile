FROM oven/bun:alpine as base

LABEL org.opencontainers.image.title "BoiBot"
LABEL org.opencontainers.image.description "Discord bot for boi memes."
LABEL org.opencontainers.image.url="https://github.com/zerebos/BoiBot"
LABEL org.opencontainers.image.source="https://github.com/zerebos/BoiBot"
LABEL org.opencontainers.image.licenses="MIT"

# Add git for showing latest changes in about
RUN apk add --no-cache git

# Setup state for building
WORKDIR /app
ENV NODE_ENV production

# Install dependencies and allow caching
COPY --link package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun \
    bun install --production --frozen-lockfile

# Use the same base container because there's not much we can reduce
FROM base as runner

# Copy all other files over
COPY --link . /app

# Setup some default files
RUN touch settings.sqlite3 && mkdir -p .revspin

# Refresh commands when starting the bot
CMD ["sh", "-c", "bun run validate && bun run deploy && bun run start"]