---
ID: PL-51-002
OWNER: Database Architect Agent
REVIEWERS: SRE Agent, Orchestrator
SYSTEMS AFFECTED: Postgres RDS, Prisma Client, Game End-Match Logic
RISK SCORE: 8/10
IMPLEMENTATION COMPLEXITY: Medium
PRODUCTION PRIORITY: P1
---

# SYSTEM: DATABASE FAILOVER & MATCH RECOVERY

## 1. OBJETIVO E ESCOPO
Definir o mecanismo de salvaguarda quando o banco de dados principal (Postgres) entra em failover ou recusa conexões (Connection Pool Exhaustion) exatamente no momento em que uma partida ranqueada termina e os MMRs precisam ser gravados.
**Escopo:** Tratamento de erros do Prisma, Fila de Retentativa (DLQ) no Redis, e Reconstrução Assíncrona de Match Logs.

## 2. ARQUITETURA DO PIPELINE DE RECOVERY

### 2.1 A Trilha Feliz (The Happy Path)
1. Jogo acaba -> Computa MMR -> Envia Transação pro Prisma -> Atualiza Row -> Fim.

### 2.2 O Cenário de Desastre (Database Offline)
1. Jogo acaba -> Prisma tenta gravar -> Erro: `P1001: Can't reach database server`.
2. **O Padrão de Circuit Breaker:** O Game Server detecta a falha na camada do repositório. Ele NÃO crashea o Colyseus Room. Ele NÃO emite tela de "Erro Fatal" para o cliente.
3. O servidor emite para a sala WS: `MATCH_SAVED_PENDING_SYNC`. A UI exibe: "Partida finalizada. Os pontos serão creditados em breve". (UX Graceful Degradation).
4. O servidor embrulha o payload da transação (MMR Deltas, Player IDs, Match Log S3 Link) em um JSON.
5. Faz push desse JSON para uma Dead Letter Queue (DLQ) no Redis: `LPUSH db_recovery_queue '{payload}'`.
6. Encerra a sala WebSocket normalmente, liberando a RAM do Node.js.

### 2.3 O Worker de Reconstrução
- No namespace `ns-matchmaker-workers`, existe um CronJob Node.js (`RecoveryWorker`).
- Ele roda a cada 30 segundos. Ele faz um pop na fila: `RPOP db_recovery_queue`.
- Tenta salvar no Postgres novamente. Se o banco voltou (Failover completo pela AWS RDS), a transação é commitada. Se falhar, empurra de volta para a fila com Delay Exponencial.

## 3. RISCOS E EDGE CASES
- **Risco de Corrupção (Ordem de Partidas):** Se o banco cair por 10 minutos, o Jogador A pode jogar a Partida 1 e a Partida 2. Se a Partida 2 for processada pela DLQ *antes* da Partida 1, a matemática de volatilidade do Glicko-2 ficará corrompida.
- *Mitigação Estrita:* A DLQ não é globalmente paralela para o mesmo usuário. O Worker processa os logs de recuperação *sequencialmente* agrupados por `user_id` baseando-se no timestamp da partida.

## 4. METRICS & OBSERVABILITY
- Alerta Crítico P0: Se `LLEN db_recovery_queue` (Tamanho da fila no Redis) ultrapassar 1.000 itens, significa que o Banco caiu de forma catastrófica (Acionar SRE On-Call).