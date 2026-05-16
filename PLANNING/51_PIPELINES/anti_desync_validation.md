---
ID: PL-51-003
OWNER: QA Master Agent
REVIEWERS: Frontend Architect, Backend Architect
SYSTEMS AFFECTED: Cypress/Playwright Test Suite, Colyseus Client
RISK SCORE: 7/10
IMPLEMENTATION COMPLEXITY: High
PRODUCTION PRIORITY: P1
---

# SYSTEM: ANTI-DESYNC VALIDATION PIPELINE

## 1. OBJETIVO E ESCOPO
WebSockets sofrem atrasos. Pacotes chegam em blocos. A pipeline de Anti-Desync garante que, não importa o quão agressiva seja a latência de um usuário, a representação visual das cartas na mesa (Frontend DOM) sempre será um espelho perfeito da verdade no Backend.
**Escopo:** Algoritmo de Snapshot Hashing e Reconciliação Cliente-Servidor.

## 2. ARQUITETURA DE VALIDAÇÃO (The Checksum Protocol)

### 2.1 O Problema
O Zustand atualiza as cartas individualmente via patches (ex: Carta 4 virou). Em redes ruins, o cliente pode perder um patch minúsculo, mas o WebSocket continua vivo. O jogador continua jogando, mas está vendo uma carta fechada que na verdade está aberta para os outros.

### 2.2 O Checksum de Estado (State Hashing)
- A cada 5 turnos, ou imediatamente após um `TRIO_FORMED`, o Backend computa um Hash leve MD5/MurmurHash do estado atual da mesa (ex: "Carta 1:Aberta, Carta 2:Fechada" = Hash `a1b2c3d4`).
- O servidor envia um pacote discreto: `{ type: 'SYNC_CHECK', hash: 'a1b2c3d4' }`.
- O Colyseus Client (Frontend) intercepta. Ele roda a exata mesma função de hash em cima do seu cache do Zustand.
- Compara os hashes.

### 2.3 A Correção de Rota (The Snap)
- Se `Hash(Client) === Hash(Server)`: Ignora, joga fora. Redes perfeitas.
- Se `Hash(Client) !== Hash(Server)`: DESYNC DETECTADO.
  - O Cliente congela a UI imediatamente (`pointer-events: none`).
  - O Cliente despacha `client.send('REQUEST_FULL_STATE')`.
  - O Backend envia a árvore de estado JSON completa.
  - O Cliente apaga seu Zustand inteiro e o repopula instantaneamente. A tela "pisca" para o estado correto.
  - O Cliente envia para o Datadog: `[WARN] Desync corrected for User 123`.

## 3. PIPELINE DE TESTES DE INTEGRAÇÃO (CI/CD)
O Agent de Testes roda um script Playwright antes de cada Deploy de Produção:
1. Conecta o Browser ao Server.
2. Injeta via console: `window.__force_corrupt_local_state()`. (Vira uma carta apenas visualmente).
3. Avança o jogo via Bot no lado do Server.
4. O teste aguarda no máximo 2 segundos. Se a carta não for forçadamente corrigida pelo algoritmo de Checksum para o estado real, o teste **FALHA** e o deploy é cancelado.

## 4. IMPACTO
Garante que o Suporte ao Cliente nunca receba um ticket dizendo "Apertei na carta certa e o jogo deu erro!", pois o jogo não permite que um estado corrompido viva por mais de alguns milissegundos.