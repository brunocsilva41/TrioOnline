FROM node:20-alpine AS builder

WORKDIR /app

# Instalar pnpm globalmente para consistência do monorepo
RUN npm install -g pnpm

# Copiar apenas os arquivos de configuração para instalar dependências (camada de cache)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/game-server/package.json ./apps/game-server/
COPY packages ./packages

# Instalação limpa
RUN pnpm install --frozen-lockfile

# Copiar o restante do código (O .dockerignore impede que node_modules local entre aqui)
COPY . .

# Build do servidor
RUN pnpm run build --filter game-server

# --- Estágio Final ---
FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/apps/game-server ./apps/game-server
COPY --from=builder /app/packages ./packages

# Instalar apenas dependências de produção
RUN pnpm install --prod --frozen-lockfile

EXPOSE 2567

CMD ["pnpm", "run", "start", "--filter", "game-server"]
