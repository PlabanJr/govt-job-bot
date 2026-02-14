FROM node:20-alpine AS base
WORKDIR /app

COPY package.json tsconfig.base.json tsconfig.json ./
COPY apps ./apps
COPY packages ./packages

RUN npm install
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=base /app/package.json ./
COPY --from=base /app/apps ./apps
COPY --from=base /app/packages ./packages

ENV NODE_ENV=production

CMD ["node", "apps/api/dist/index.js"]
