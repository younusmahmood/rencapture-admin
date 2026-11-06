# RenCapture Admin — production image.
#
# Stateless, same as rencapture-web: no PHI, and no clinic data of any kind,
# is ever written to the container's filesystem. Every screen fetches from
# Convex per request. This app additionally holds no session-worthy secret of
# its own beyond SESSION_SECRET — the operator allowlist lives in the shared
# Convex backend, not here.

ARG NODE_IMAGE=public.ecr.aws/docker/library/node:22-alpine

FROM ${NODE_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

FROM ${NODE_IMAGE} AS build
WORKDIR /app
ARG CONVEX_URL
ENV CONVEX_URL=$CONVEX_URL
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM ${NODE_IMAGE} AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=47391

RUN addgroup -S app && adduser -S app -G app

COPY --from=deps  --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/dist ./dist
COPY --chown=app:app package.json ./package.json
COPY --chown=app:app serve.mjs ./serve.mjs

USER app
EXPOSE 47391

HEALTHCHECK --interval=30s --timeout=4s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||47391)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "serve.mjs"]
