# DOC-ID: [08_A_TURN_STATE_MACHINE]
# SYSTEM: TRINITY CORE ENGINE
## 1. OBJETIVO E ESCOPO
O objetivo primário deste documento é definir a Máquina de Estados Finita (FSM) que controla o fluxo autoritativo de turnos do jogo TRINITY. 
**Escopo In-Bounds:** Controle de quem pode agir, timeouts de ação, validação de transição de estado, expiração de turnos (grace period), e dispatch de penalidades por tempo esgotado.
**Escopo Out-Bounds:** Este sistema NÃO processa a lógica de vitória, NÃO anima a UI e NÃO cuida do envio do socket. Ele puramente computa o estado lógico.

## 2. ARQUITETURA E FLUXOS DE ESTADO
A FSM será construída em TypeScript utilizando uma abstração orientada a objetos livre de dependências externas de rede.

### 2.1. Nodos de Estado
*   `WAITING_PLAYERS`: Estado inicial da sala.
*   `DEALING_CARDS`: Transição assíncrona. Gera a seed determinística.
*   `PLAYER_TURN_IDLE`: O turno de um jogador iniciou. Aguardando a 1ª intenção de revelação.
*   `PLAYER_TURN_REVEAL_1`: 1ª carta revelada aguardando leitura ou próxima ação.
*   `PLAYER_TURN_REVEAL_2`: 2ª carta revelada. Aguardando 3ª ação.
*   `EVALUATING_BOARD`: Estado bloqueante (Mutex). Calcula se houve sucesso ou falha.
*   `TURN_TRANSITION_COOLDOWN`: Tempo morto obrigatório (ex: 1200ms) para as animações de frontend finalizarem antes do próximo IDLE.
*   `GAME_OVER`: Condição de parada alcançada.

### 2.2. Fluxo de Transição (Happy Path)
1. `TurnManager` entra em `PLAYER_TURN_IDLE`. Timer de 15s inicia.
2. Evento `ACTION_REVEAL` recebido.
3. Transição para `PLAYER_TURN_REVEAL_1`. Timer recomeça com 10s.
4. Evento `ACTION_REVEAL` recebido.
5. Transição para `PLAYER_TURN_REVEAL_2`. Timer recomeça com 10s.
6. Evento `ACTION_REVEAL` recebido.
7. Transição para `EVALUATING_BOARD`. Timer congela.
8. Dispatch `TRIO_SUCCESS`.
9. Transição para `TURN_TRANSITION_COOLDOWN`.
10. Loop volta para `PLAYER_TURN_IDLE` (mesmo jogador continua pois acertou).

## 3. DEPENDÊNCIAS
- **Inputs:** Requer `ValidationEngine` para confirmar se a intenção de revelação é matemática e mecanicamente legal.
- **Outputs:** Emite `onStateChange` que será assinado pelo `Room` do Colyseus para broadcasting.

## 4. RISCOS E EDGE CASES (The Bible)
- **Risco 1 (Double Tap):** Jogador clica múltiplas vezes gerando 2 `ACTION_REVEAL` no mesmo milissegundo.
  - *Solução:* Implementar flag atômica `isProcessingAction`. Qualquer ação recebida enquanto `isProcessingAction === true` deve ser silenciosamente descartada (Dropping).
- **Risco 2 (Clock Drift Timeout):** O `setTimeout` do Node.js sofre atraso devido ao Event Loop Lag e executa a expiração de turno 300ms atrasado, enquanto o cliente já forçou a próxima ação.
  - *Solução:* Comparação de Timestamps `Date.now()`. O cliente envia no payload da ação o timestamp local. O servidor compara: se a ação chegou antes de `turn_expires_at + 150ms` (grace ping), ele aceita.
- **Risco 3 (Infinite Cooldown):** O estado `TURN_TRANSITION_COOLDOWN` nunca dispara o `next()` por falha em alguma Promisse interna.
  - *Solução:* Todo estado de transição deve possuir um `hard_fallback_timer`. Exemplo: `setTimeout(() => forceNext(), 3000)`.

## 5. MÉTRICAS E TESTES
### 5.1. Critérios de Validação (DoD)
- O tempo médio de processamento de uma transição de estado não deve exceder 2ms no backend.
- Cobertura de código (Jest) obrigatória em 100% para o módulo `TurnManager.ts`.

### 5.2. Test Plan (Automated)
```typescript
// Pseudocode Jest
test('Deve descartar ação dupla enviada no mesmo tick', async () => {
    const fsm = new TurnStateMachine();
    fsm.start(player1);
    
    // Dispara 3 ações simultâneas sem await resolution
    Promise.all([
        fsm.dispatch({ type: 'REVEAL', target: 'CARD_3' }),
        fsm.dispatch({ type: 'REVEAL', target: 'CARD_4' }),
    ]);

    expect(fsm.currentState).toBe('PLAYER_TURN_REVEAL_1');
    expect(fsm.revealBuffer.length).toBe(1); // A segunda foi dropada
});
```

## 6. IMPACTOS E POSSÍVEIS REGRESSÕES
- Se modificado de forma leviana, pode quebrar o sincronismo com as animações do cliente. Se o tempo de `TURN_TRANSITION_COOLDOWN` for menor que o de `TrioExplosionVfx`, o próximo jogador poderá revelar cartas antes da tela do oponente ter limpado a mesa visualmente.

## 7. PLANO DE ROLLBACK
- As configurações de timers e grace periods devem vir de variáveis de ambiente do sistema (`TURN_DURATION_MS`, `GRACE_PERIOD_MS`). Em caso de falha de UX, ajustar via API de Configuração a quente sem precisar re-deployar o container.