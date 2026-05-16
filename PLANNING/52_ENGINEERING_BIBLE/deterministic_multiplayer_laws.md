---
ID: PL-52-001
OWNER: Project Orchestrator
REVIEWERS: Backend Architect, Multiplayer Network Agent
SYSTEMS AFFECTED: Colyseus Engine, Core Logic
RISK SCORE: 10/10 (Architectural Core)
IMPLEMENTATION COMPLEXITY: Extreme
---

# THE ENGINEERING BIBLE: DETERMINISTIC MULTIPLAYER LAWS

## 1. O MANDATO DETERMINÍSTICO
Todo estado computado no jogo TRINITY deve ser **Estritamente Determinístico**. Dados os mesmos inputs, na mesma ordem, a máquina de estados deve cuspir exatamente o mesmo output, em qualquer CPU, sob qualquer arquitetura Node.js.

## 2. AS 5 LEIS INQUEBRÁVEIS

### Lei I: A Proibição do Math.random()
Nenhum código dentro da pasta `/packages/core-engine` pode invocar a função `Math.random()` nativa do V8. 
- *Motivo:* Ela depende da seed entrópica da máquina host no momento da execução, impossibilitando reconstrução de estado e replays determinísticos.
- *Obrigatório:* Utilizar um PRNG (Pseudo-Random Number Generator) como o Alea (biblioteca `seedrandom`), inicializado com a `Match_Seed` gerada pelo servidor no momento do Handshake (`DEALING_CARDS`).

### Lei II: O Tempo não existe (Ignorância de Date.now)
A máquina lógica (`TurnStateMachine`) não deve calcular limites baseando-se no `Date.now()` livremente espalhado pelo código.
- *Motivo:* Clock drift em containers Kubernetes causará desync entre os turnos.
- *Obrigatório:* O Servidor Master de Partida despacha "Ticks" de tempo (Tick = número inteiro de frames decorridos desde o start). Todas as lógicas de Timeout devem ser baseadas em: `if (currentTick > expirationTick) { nextTurn() }`.

### Lei III: Imutabilidade do Estado Anterior
Variáveis de estado de array e objetos da partida não sofrem reassignment puro sem registro (Mutations em state pattern).
- *Obrigatório:* Quando um turno termina, o estado não apenas altera `currentPlayer`, ele emite um `Action Object` imutável (Event Sourcing) que empurra a alteração. Para fins de performance real-time, o schema do Colyseus sofre a mutação internamente, mas o log de replay é apensado.

### Lei IV: Desacoplamento Absoluto de View
O backend (`game-server`) e a lógica central não sabem se o jogo está rodando num iPhone de 2018 ou num PC Gamer, muito menos em React ou Unity.
- *Obrigatório:* A resposta do backend é sempre um State Data Puro. Sem tags HTML, sem comandos de UI (Exibição de popups). Ele diz: `player[A].scoredTrios = 1`. A view que se vire para entender isso e disparar os confetes de comemoração.

### Lei V: Single Threaded Mutex
O Node.js roda Javascript em uma Thread, mas Eventos IO são assíncronos. Se dois pacotes WebSocket chegam, a fila assíncrona pode encavalar a validação.
- *Obrigatório:* Todo Command enviado à sala entra em um `Fila_FIFO`. A função `processNextCommand()` engatilha. Enquanto ela roda, se um novo payload chegar, ele vai para a pilha de array local. Jamais dois processamentos de revelação ocorrem em paralelo usando `Promise.all` na sala. Race conditions estão abolidos.

## 3. CHECKLIST DO ARQUITETO
Antes de aprovar qualquer PR na engine:
- [ ] Existe alguma variável global que vaza estado entre instâncias diferentes da classe `MatchRoom`?
- [ ] A lógica de distribuição de cartas inicial respeita a seed determinística?
- [ ] Se eu baixar o JSON de Ações da Partida do S3 e jogar na engine vazia local, o resultado final da array é byte-por-byte idêntico ao do banco? Se não, a Lei do Determinismo falhou. Reprove.