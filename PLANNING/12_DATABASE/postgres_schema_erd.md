# DOC-ID: [12_A_POSTGRES_SCHEMA_ERD]
# SYSTEM: TRINITY DATABASE
## 1. OBJETIVO E ESCOPO
Definir o modelo relacional estrito em PostgreSQL via Prisma ORM. O banco relacional é a Source of Truth absoluta para economia, retenção e histórico. 
**Escopo:** Tabelas Core de Usuário, Histórico de Partidas (Logs em cold storage S3) e Inventário de Cosméticos.

## 2. ARQUITETURA DE DADOS (The Schema)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  auth_provider   String   // 'google', 'apple', 'guest'
  provider_id     String   @unique
  username        String   @unique
  avatar_url      String?
  
  // ELO & Matchmaking (Atualizado via background jobs)
  mmr_rating      Float    @default(1500.0)
  mmr_rd          Float    @default(350.0)
  mmr_volatility  Float    @default(0.06)
  
  // Economy
  t_coins         Int      @default(0)
  gems            Int      @default(0)
  
  // Relations
  matches         MatchPlayer[]
  inventory       Inventory[]
  
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  @@index([mmr_rating])
}

model Match {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  game_mode       String   // 'CLASSIC', 'SPICY'
  status          String   // 'COMPLETED', 'ABORTED_BY_SERVER'
  started_at      DateTime
  ended_at        DateTime
  
  // Action Log comprimido no S3 para Replays e Anti-Cheat audits.
  // Evita inchar o banco SQL com arrays JSON gigantes de milhares de turnos.
  replay_s3_key   String?  
  
  players         MatchPlayer[]
}

model MatchPlayer {
  match_id        String   @db.Uuid
  user_id         String   @db.Uuid
  placement       Int      // 1 (Winner), 2, 3, 4
  elo_delta       Float    // Ex: +15.5
  
  match           Match    @relation(fields: [match_id], references: [id])
  user            User     @relation(fields: [user_id], references: [id])

  @@id([match_id, user_id])
}

model Cosmetic {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  type            String   // 'CARD_BACK', 'EMOTE', 'TABLE_SKIN', 'VFX'
  name            String
  rarity          String   // 'COMMON', 'EPIC', 'LEGENDARY'
  
  inventory       Inventory[]
}

model Inventory {
  user_id         String   @db.Uuid
  cosmetic_id     String   @db.Uuid
  is_equipped     Boolean  @default(false)
  acquired_at     DateTime @default(now())
  
  user            User     @relation(fields: [user_id], references: [id])
  cosmetic        Cosmetic @relation(fields: [cosmetic_id], references: [id])

  @@id([user_id, cosmetic_id])
}
```

## 3. ÍNDICES E PERFORMANCE
- **`@@index([mmr_rating])`**: Fundamental para requisições de Leaderboard (`SELECT * FROM users ORDER BY mmr_rating DESC LIMIT 100`).
- **UUIDs Gen Random**: Usar `gen_random_uuid()` nativo do Postgres v13+ ao invés de instanciar IDs no Node.js previne colisões e garante velocidade de inserção.

## 4. RISCOS E EDGE CASES
- **Risco 1 (Bloat no Log de Partidas):** Se salvarmos o JSON completo dos movimentos da partida na tabela `Match`, a tabela pode atingir dezenas de Gigabytes em semanas.
  - *Solução:* O Prisma salva as metadatas (Quem ganhou, quem jogou). O JSON pesado com os frames da partida é encodado em GZIP no Node.js e enviado para o AWS S3 (`replay_s3_key`). Se o jogador clicar em "Ver Replay", o PWA baixa direto do S3 via CloudFront, aliviando o banco.