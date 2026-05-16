---
ID: EC-005
OWNER: SRE Agent
REVIEWERS: Backend Architect, Multiplayer Network Agent
SEVERITY: CRITICAL
PROBABILITY: High (Se houver closure events mal gerenciados)
---

# EDGE CASE BIBLE: THE WEBSOCKET MEMORY LEAK (EC-005)

## 1. CAUSA RAIZ E DESCRIÇÃO
O servidor de jogo é um processo Node.js mantido vivo continuamente (Long-lived process).
**Cenário:** Milhares de jogadores entram e saem de partidas a cada hora. O Colyseus cria instâncias da classe `MatchRoom` para alocar 4 jogadores. Quando a partida acaba, os jogadores saem e a sala deve ser destruída pelo Garbage Collector (GC) do V8.
**A Falha (Memory Leak):** O desenvolvedor backend adicionou um event listener global dentro da sala: `process.on('SIGTERM', gracefulShutdown)`. Ou, inscreveu um callback no Redis: `redisClient.subscribe('channel', callback)`. Quando a partida acaba e o `room.dispose()` é chamado, esses listeners externos continuam segurando a referência léxica (Closure) de *toda a instância da sala*. A sala vira um zumbi na memória RAM.
**O Desastre:** A RAM do container K8s vai subindo 50MB a cada hora. Em 12 horas, atinge o limite (1GB). O K8s mata o pod por `OOMKilled`. Centenas de jogadores de OUTRAS salas que estavam ativas naquele pod são desconectados brutalmente.

## 2. REPRODUÇÃO
1. Levantar servidor Node com flag `--inspect`.
2. Injetar 100 bots criando e destruindo salas repetidamente.
3. Tirar Snapshot da Heap no Chrome DevTools. As instâncias `MatchRoom` continuam lá, crescendo indefinidamente.

## 3. PREVENÇÃO E MITIGAÇÃO (THE CLEANUP MANIFESTO)

### 3.1 Strict Teardown Protocol
Dentro do Backend, TODO sistema State-ful deve implementar e honrar uma interface de destruição estrita.

```typescript
export class MatchRoom extends Room {
  private timers: NodeJS.Timeout[] = [];
  
  onCreate() {
    this.timers.push(setInterval(this.gameTick, 1000));
  }

  // OBRIGATÓRIO: A Lei da Limpeza
  onDispose() {
    // 1. Limpar todos os timers pendentes (Fatais para GC)
    this.timers.forEach(clearInterval);
    
    // 2. Limpar Listeners externos
    globalEventEmitter.off('server_shutdown', this.handleShutdown);
    
    // 3. Forçar Nulificação de arrays gigantes
    this.state.actionLog = null;
    this.state.players.clear();
  }
}
```

### 3.2 Automated OOM Detection Pipeline
- O **SRE Agent** configurará o Datadog para observar o delta da `Heap Used`. Se a RAM crescer em "escadinha" (Sawtooth pattern) por 3 horas consecutivas sem retornar à baseline original, o alarme `MEMORY_LEAK_WARNING` soará.
- O CI/CD roda um teste de Stress local. Usa a biblioteca `leakage` do Node.js. O teste repete a criação de sala 100 vezes e invoca o `global.gc()`. Se a memória inicial for significativamente menor que a final, a PR é reprovada automaticamente.

## 4. RECOVERY (O "Bandaid" SRE)
Se o leak ocorrer em produção durante um final de semana antes de um patch poder ser aplicado:
- O SRE ajusta a regra do K8s Liveness Probe. Ao invés de esperar o `OOMKilled` catastrófico que afeta todo mundo ao mesmo tempo, os pods são programados via cron para dar Restart Gradativo (Graceful Rolling Restart) às 4:00 da manhã de forma escalonada, limpando a RAM antes dela estourar, preservando o Uptime percebido pelo jogador.