---
ID: EC-001
OWNER: Edge Case Agent
REVIEWERS: Backend Architect, SRE Agent
SEVERITY: CRITICAL
PROBABILITY: Medium
---

# EDGE CASE BIBLE: THE REDIS FAILOVER RACE (EC-001)

## 1. CAUSA RAIZ E DESCRIÇÃO
O ecossistema TRINITY utiliza Redis ElastiCache em cluster (1 Master, 2 Replicas) para coordenar a "Presence" (quais jogadores estão online em quais instâncias do servidor Node.js).
**Cenário:** O nó Master do Redis sofre falha de hardware e desliga. O AWS RDS engatilha o "Failover", promovendo uma Replica para Master. Esse processo leva cerca de 2.5 a 4.0 segundos.
**A Falha (Race Condition):** Durante os 3 segundos que o Redis está "read-only/indisponível", 50 usuários tentam reconectar nas suas salas ativas do Colyseus (pois a rede 4G deles piscou). O middleware do Colyseus bate no Redis para autenticar o token de sessão, falha por Timeout ou WriteError, rejeita as 50 conexões e derruba os jogadores com código `4001: Session Invalid`. O jogo foi arruinado.

## 2. REPRODUÇÃO
1. Levantar ambiente via `docker-compose`. Node.js + Redis.
2. Iniciar 50 conexões WS de bots na mesma sala.
3. Matar brutalmente o container do Redis (`docker kill redis`).
4. Derrubar e tentar reconectar os 50 bots via WS no intervalo de 1 a 2 segundos (antes do cluster Redis se auto-curar ou reconectar).

## 3. PREVENÇÃO E FALLBACK (RESILIÊNCIA OBRIGATÓRIA)

**Estratégia: The In-Memory Grace Buffer**
A arquitetura não pode depender de um hardware de 3ª parte para validar reconexões em andamento.
- **Implementação:** Toda instância (Pod K8s) do Node.js/Colyseus manterá um `Map<SessionId, UserData>` em Memória RAM Local **estritamente para os usuários que estão fisicamente alocados naquele pod**.
- Quando o usuário solicita `client.reconnect(roomId, sessionId)`:
  1. O Pod Node.js não consulta o Redis primeiro.
  2. Ele checa a RAM local: "A sala 123 está aqui? O sessionId 444 pertence a ela?".
  3. Se SIM (Cache Hit), ele autoriza a reconexão TCP imediatamente. O Redis pode estar queimando que o jogo continua.
  4. Se NÃO (O Node.js era quem havia morrido e o user bateu em outro pod limpo), ele consulta o Redis. Se o Redis também estiver caído, aí sim aplica o Backoff (Retry exponencial no lado do Frontend: tenta de novo em 1s, 2s, 4s).

## 4. TESTES AUTOMATIZADOS (Playwright + Chaos Mesh)
O Agent de QA deve criar uma pipeline (Chaos Test) rodando toda sexta-feira:
1. Roda a engine. Injeta jogadores.
2. Derruba o serviço de cache.
3. Dispara reconexões massivas em 50ms.
4. O teste deve acusar PASS apenas se `Reconnections Success Rate == 100%`. Nenhuma partida em andamento pode falhar porque a infra externa tremeu.