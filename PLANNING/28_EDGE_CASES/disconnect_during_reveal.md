# DOC-ID: [28_A_DISCONNECT_DURING_REVEAL]
# SYSTEM: EDGE CASE BIBLE
## 1. DESCRIÇÃO DO CENÁRIO (The Nightmare Flow)
**Situação:** O Turno é do Jogador A. Ele pede para revelar uma carta da mesa. O pacote WebSocket viaja, chega no servidor, a lógica é validada, o estado da carta vira `Revealed`... e EXATAMENTE NESSE MILISSEGUNDO (antes da notificação voltar), o modem do Jogador A desliga.

## 2. REPRODUÇÃO
1. Cliente envia pacote `REVEAL_INTENT`.
2. Servidor processa, muta o schema e despacha o delta broadcast.
3. Socket do Cliente recebe sinal `SIGKILL` antes do recebimento da payload.

## 3. IMPACTO E SEVERIDADE
**Severidade: CRÍTICA.** 
Sem mitigação, o Cliente A jamais viu a carta que ELE virou. Mas a mesa (Jogadores B, C, D) viu. O jogo segue o fluxo e passa o turno. Quando o Jogador A reconecta, ele não tem o histórico visual do que aconteceu naqueles 5 segundos.

## 4. PREVENÇÃO E RECUPERAÇÃO
**A Arquitetura de "State Snap to View" (Zustand Override):**
1. O Colyseus dispara `onLeave` no servidor. O servidor pausa o Timer da Sala (Grace Period de 15s). A carta fica "virada na mesa".
2. O jogador A entra via 4G. Envia reconexão.
3. O cliente do Jogador A baixa o snapshot completo do schema atual.
4. **Resolução Visual:** O Cliente detecta que `carta.isRevealed = true` no snapshot do servidor, mas seu último cache local dizia `false`. O Cliente não roda a animação demorada do Framer Motion. Ele força um `snap` instântaneo (`transition: { duration: 0 }`) para exibir a carta virada.
5. **Histórico de Logs:** O cliente lê o `ActionLogWindow` (os últimos 10 deltas) do servidor e popula a Sidebar de "Log de Batalha", para que o Jogador A possa ler: "Você virou um 7 de Copas".

## 5. FALLBACK BEHAVIOR (Se falhar a reconexão)
Se após os 15s o jogador não voltar, o evento `BOT_TAKEOVER` é acionado. O Bot assume, o timer retoma, e a carta revelada é usada pelo Bot para processar a segunda revelação. O jogo nunca trava a experiência dos demais.