# DOC-ID: [17_B_GLICKO2_MMR_ALGORITHM]
# SYSTEM: TRINITY MATCHMAKING
## 1. OBJETIVO E ESCOPO
Definir a matemática e o fluxo de dados para a alocação de pontuação (Matchmaking Rating - MMR) após o término de partidas ranqueadas. O sistema descarta o algoritmo Elo padrão em favor do Glicko-2, que suporta volatilidade e variação de incerteza (RD - Rating Deviation).
**Escopo In-Bounds:** Cálculo de delta MMR (ganho/perda), atualização no DB PostgreSQL, injeção da flag de 'Smurf'.
**Escopo Out-Bounds:** Pareamento no Redis (isso pertence ao ticket `17_A`).

## 2. ARQUITETURA E FLUXOS DE ESTADO
O Glicko-2 trabalha com 3 variáveis para cada jogador:
- **Rating (R):** A habilidade presumida (Base 1500).
- **Rating Deviation (RD):** Nível de confiança na habilidade (Base 350, diminui ao jogar, aumenta ao ficar offline).
- **Volatility (σ):** Mede o grau de flutuação de performance do jogador (Base 0.06).

### 2.1 Fluxo de Atualização (Post-Match)
1. Evento `MATCH_ENDED` disparado pelo Game Server (Colyseus).
2. O servidor constrói uma Array com os resultados dos 4 a 6 jogadores: `[{ userId, score, R, RD, σ }]` onde `score` é 1 para vitória, 0.5 para empate (raro), 0 para derrota.
3. O algoritmo calcula o novo Rating em um job isolado.
4. Servidor dispara uma Transaction no Prisma:
   - Atualiza `users.mmr`, `users.rd`, `users.volatility`.
   - Insere `match_history_log`.
5. Emite WebSocket Delta `MMR_UPDATED` para renderizar a barra de XP no frontend.

## 3. DEPENDÊNCIAS
- **Inputs:** Requer a posição final da partida (`scoredTrios` count).
- **Outputs:** Database Postgres e State do WebSocket.

## 4. RISCOS E EDGE CASES
- **Risco 1 (Derrota por Disconnect):** Um jogador cai e perde a partida por timeout.
  - *Edge Case Rule:* O sistema DEVE aplicar a penalidade integral ao R do jogador, mas NÃO DEVE aumentar sua Volatility, pois a derrota não refletiu oscilação de habilidade, e sim falha técnica.
- **Risco 2 (Smurf Detection via RD):** Jogador experiente cria conta nova (R:1500, RD:350). Ganha 10 partidas seguidas.
  - *Solução:* O multiplicador de `σ` (Volatility) reage agressivamente a win-streaks quando o RD está alto. O Rating saltará para 1900 em 5 partidas, pareando o Smurf com sua bracket real instantaneamente, protegendo a base iniciante.
- **Risco 3 (Race Condition de Fim de Partida):** Servidor cai milissegundos antes da gravação no Postgres.
  - *Solução:* Idempotência. A transação leva o `Match_UUID`. Se o Job Worker rodar novamente, ele não pode aplicar o mesmo MMR delta duas vezes.

## 5. MÉTRICAS E TESTES
### 5.1. Checklist
- [ ] Matemática do Glicko2 verificada contra a biblioteca `glicko2-lite` via testes unitários.
- [ ] Transações Prisma com `SERIALIZABLE` isolation level.

## 6. IMPACTOS E POSSÍVEIS REGRESSÕES
Ajustar a constante global do sistema (`tau` factor) pode causar inflação ou deflação severa de Elo ao longo de uma temporada, arruinando os quadros de liderança. O `tau` deve ser fixado em `0.5` na Fase 1.