FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY apps/game-server/package*.json ./apps/game-server/
COPY packages ./packages

RUN npm install

COPY . .

RUN npm run build -w apps/game-server

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/apps/game-server/package*.json ./apps/game-server/
COPY --from=builder /app/apps/game-server/dist ./apps/game-server/dist
COPY --from=builder /app/node_modules ./node_modules
# Copy scripts if they are not in dist
COPY --from=builder /app/apps/game-server/src/scripts ./apps/game-server/src/scripts

EXPOSE 2567

CMD ["npm", "start", "-w", "apps/game-server"]
