---
ID: EC-003
OWNER: Edge Case Agent
REVIEWERS: Multiplayer Network Agent, Security Agent
SEVERITY: HIGH
PROBABILITY: High (Em Redes 3G instáveis)
---

# EDGE CASE BIBLE: THE WEBSOCKET PACKET DUPLICATION (EC-003)

## 1. CAUSA RAIZ E DESCRIÇÃO
Protocolos de rede como TCP (usado pelo WebSocket) garantem a entrega ordenada dos pacotes sob condições normais, MAS não salvam o sistema de duplicações na camada de aplicação geradas por retentativas do cliente.
**Cenário:** O usuário toca no botão "Revelar Carta". O PWA envia o frame `REVEAL_INTENT`. O 4G sofre um *hiccup* brutal. O pacote sobe, mas o ACK de resposta falha em descer. O código Frontend, achando que o pacote se perdeu (timeout interno da UI), dispara um *retry automático* enviando um SEGUNDO `REVEAL_INTENT` para a exata mesma carta.
**A Falha (Duplication Action):** A internet destrava. O servidor agora recebe as duas mensagens em sequência num espaço de 2ms. O primeiro processa com sucesso. O segundo tenta revelar uma carta que JÁ ESTÁ REVELADA (gerando uma violação de regra de jogo que pune o player, quebrando a partida injustamente).

## 2. REPRODUÇÃO
1. No Frontend, forçar um script que ao clicar envia o comando `client.send('reveal', { id: 5 })` **três vezes** num laço `for` sem await.
2. Observar como a Máquina de Estados do Backend reage a esse bombardeio idêntico.

## 3. PREVENÇÃO E MITIGAÇÃO (IDEMPOTENCY TOKENS)

**A Arquitetura de Sequence IDs e Deduping:**
A mitigação é obrigatoriamente realizada no Backend. O servidor não pode confiar que o cliente se comporte de maneira gentil.
1. **O Mutex Lock (Solução Simples):** Conforme documento PL-52-001 (Lei V), o Backend possui uma flag `isProcessingAction = true` no momento em que a primeira mensagem entra no loop. As mensagens seguintes baterão nesta porta fechada e serão enfileiradas ou descartadas.
2. **A Solução Robusta (Command Deduping):**
   - O payload do Cliente é alterado de `{ id: 5 }` para `{ intent_id: "uuid-1234", id: 5 }`.
   - O TurnManager no Backend mantém um Set de `ProcessedIntents` para o turno atual (limpado toda vez que o turno passa).
   - Ao receber o pacote 1: O intent `"uuid-1234"` é salvo no Set. Processa a ação.
   - Ao receber o pacote 2: O Backend checa `if (ProcessedIntents.has("uuid-1234")) return;`. O pacote duplicado é silenciosamente e perfeitamente destruído na camada de entrada, sem afetar o FSM.

## 4. FALLBACK BEHAVIOR
Se por ventura o bloqueio falhar e a instrução chegar ao `RuleValidator` tentando virar uma carta já virada, o Validator retornará `Error: INVALID_TARGET`. A arquitetura do Backend deve engolir esse erro específico como um *No-Op* (Operação não-nula, mas inofensiva) em vez de aplicar a punição de perda de turno, logando: `[WARN] Duplicate intent filtered at validation layer`.