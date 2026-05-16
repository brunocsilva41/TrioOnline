# DOC-ID: [18_A_BOT_MEMORY_MATRIX]
# SYSTEM: TRINITY BOT AI & REPLACEMENT
## 1. OBJETIVO E ESCOPO
Diferente de shooters onde o Bot apenas atira e corre, o jogo TRIO é de memória e dedução. Um Bot perfeito no TRIO nunca erra, o que seria incrivelmente injusto. O Bot perfeito precisa *errar de propósito de forma realista*.
**Escopo:** Algoritmo de "Memória Degradável", Pacing de ações (Humanization) e o protocolo *Seamless Takeover* em caso de jogador desconectado.

## 2. ARQUITETURA E FLUXOS (A Mente do Bot)
O Bot herda a classe `Player` no Room State, e age exatamente via as mesmas APIs que o jogador usaria no backend.

### 2.1 A Memória Degradável (The Memory Array)
Toda vez que uma carta é virada na mesa, todos os bots recebem o evento.
O Bot armazena isso na sua classe interna: `memory.push({ cardId: 4, value: 7, timestamp: Date.now() })`.
- **Bot Fácil (Tier 1):** Possui um *Memory Window* pequeno. O CRON job interno do bot (rodando a cada turno) aplica uma rolagem de dados: `if (Math.random() < 0.40) delete memory[cardId]`. Ele frequentemente esquece uma carta recém-revelada no centro. Não sabe deduzir extremos de mãos oponentes.
- **Bot Médio (Tier 2):** Retém cartas na mesa por mais tempo. Usa a regra de Dedução Primária: se alguém revelou sua carta mais alta como um '6', o Bot sabe que este jogador não tem '7, 8, 9, 10, 11, 12' e remove do seu cálculo de probabilidade.
- **Bot Difícil (Tier 3 - Para cobrir players Elite desconectados):** Retém 100% de precisão de memória. Joga no nível de um jogador profissional.

### 2.2 Humanização (The Hesitation Math)
Um bot não joga em 1 milissegundo.
- Antes de pedir uma carta: `await sleep(base_delay + Math.random() * jitter)`.
- Se a jogada dele resulta em um Trio: Ele executa a terceira revelação mais rápido (Demonstrando empolgação/certeza).
- Se for a primeira jogada às cegas do turno: Ele demora mais, e tem chance de disparar um Emote de "Pensando".

### 2.3 The Seamless Takeover (Assunção de Posse)
Quando um humano fecha o app, os outros jogadores não devem saber que um bot assumiu. O Colyseus não avisa "O JOGADOR CAIU". Ele silenciosamente ativa a flag `player.isManagedByBot = true`. Quando o turno desse jogador chega, em vez de esperar a rede, o método `BotController.processTurn(playerId)` roda no backend, disfarçando a ausência.

## 3. RISCOS E EDGE CASES
- **Risco 1 (Loops Infinitos de Ação):** Um erro no `BotController` faz ele tentar selecionar uma carta que já foi descartada para a pilha de pontos. O pacote falha, o Bot tenta de novo na mesma hora em um loop `while`, travando o servidor (CPU 100%).
  - *Solução:* Todo bot deve ter um hard-limit de 3 tentativas falhas por turno. Se falhar na validação da game engine 3 vezes, ele força a ação "End Turn" ou "Reveal Random Unknown Table Card" para desobstruir o pipeline.
- **Risco 2 (Efeito Fantasma):** O bot faz um Trio, e na mesma fração de segundo emenda outra ação porque ele é um script, parecendo mecanicamente assustador.
  - *Solução:* O estado `TURN_TRANSITION_COOLDOWN` da Game Engine (Documento 08_A) atua bloqueando inputs. O bot deve aguardar este estado para rodar a lógica.

## 4. IMPACTOS
Muitos bots salvos na RAM do servidor em simultâneo exigem GC (Garbage Collection) eficiente no Node.js. Garantir que, ao finalizar a partida, a instância `BotController` para aquele jogador seja completamente nulificada para evitar Memory Leaks.