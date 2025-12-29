# Stage 1: Server build
FROM node:22.12-alpine AS server

RUN apk add --no-cache build-base python3 \
  && apk upgrade --no-cache

WORKDIR /app

COPY server/package*.json ./

RUN npm ci --ignore-scripts

COPY server .

RUN npx patch-package \
  && npm run setup-python \
  && npm run build \
  && npm prune --production

# Stage 2: Client build
FROM node:22.12-alpine AS client

WORKDIR /app

COPY client/package*.json ./

RUN npm ci --ignore-scripts

COPY client .

RUN npx patch-package \
  && DISABLE_ESLINT_PLUGIN=true npm run build

# Stage 3: Final image
FROM node:22.12-alpine

LABEL org.opencontainers.image.title="Planka" \
      org.opencontainers.image.description="The kanban-style project mastering tool for everyone" \
      org.opencontainers.image.licenses="Apache-2.0"

ENV NODE_ENV=production

RUN apk add --no-cache bash python3 \
  && apk upgrade --no-cache

USER node
WORKDIR /app

COPY --chown=node:node LICENSE.md .
COPY --chown=node:node ["LICENSES/PLANKA Community License DE.md", "LICENSE_DE.md"]

COPY --from=server --chown=node:node /app/node_modules node_modules
COPY --from=server --chown=node:node /app/dist .

COPY --from=client --chown=node:node /app/dist public
COPY --from=client --chown=node:node /app/dist/index.html views

RUN python3 -m venv .venv \
  && .venv/bin/pip3 install -r requirements.txt --no-cache-dir \
  && mv .env.sample .env \
  && npm config set update-notifier false

VOLUME /app/public/favicons
VOLUME /app/public/user-avatars
VOLUME /app/public/background-images
VOLUME /app/private/attachments

EXPOSE 1337

HEALTHCHECK --interval=10s --timeout=2s --start-period=15s \
  CMD node ./healthcheck.js

CMD ["./start.sh"]
