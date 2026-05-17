FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

# Copiar configurações mestres
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json .npmrc ./

# Copiar manifestos
COPY apps/game-server/package.json ./apps/game-server/
COPY apps/game-client/package.json ./apps/game-client/
COPY packages/core-engine/package.json ./packages/core-engine/
COPY packages/db/package.json ./packages/db/

# Instalação completa
RUN pnpm install --frozen-lockfile

# Copiar código fonte
COPY . .

# Gerar Prisma
RUN ./node_modules/.bin/prisma generate --schema packages/db/prisma/schema.prisma

# Build - Usar Turbo para garantir que as dependências sejam buildadas na ordem certa
RUN ./node_modules/.bin/turbo run build --filter game-server

# --- Estágio Final ---
FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

# Copiar apenas o necessário
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/.npmrc ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/game-server/package.json ./apps/game-server/
COPY --from=builder /app/apps/game-server/dist ./apps/game-server/dist
COPY --from=builder /app/packages ./packages

EXPOSE 2567

WORKDIR /app/apps/game-server

CMD ["node", "dist/index.js"]
