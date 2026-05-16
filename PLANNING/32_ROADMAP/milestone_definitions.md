# DOC-ID: [32_A_MILESTONE_DEFINITIONS]
# SYSTEM: TRINITY ROADMAP
## 1. OBJETIVO E ESCOPO
Definir as barreiras absolutas de progresso. Nenhuma linha de código de uma milestone posterior pode ser escrita ou mergeada se a milestone anterior não possuir 100% de cobertura de testes (DoD).

## 2. A CRONOLOGIA (The Critical Path)

### M0: The Skeleton (Semana 1)
- **Goal:** Repositório Turborepo, Next.js e Colyseus rodando localmente.
- **DoD:** `pnpm dev` sobe todos os pacotes. Linter (ESLint) restrito falhando o build se houver `any` no Typescript.
- **Blocker:** Não iniciar frontend gráfico aqui.

### M1: The Ghost Engine (Semana 2-3)
- **Goal:** Máquina de estados jogável via CLI ou botões HTML brutos.
- **DoD:** 4 browsers abertos, conectam na sala, viram cartas e completam Trios enviando deltas sem crashar.
- **Blocker:** Colyseus Schema.

### M2: The Marionette (Semana 4-5)
- **Goal:** Hidratação do Frontend. Zustand reage ao Colyseus. Framer Motion entra em cena.
- **DoD:** Jogo parece um produto comercial rodando a 60FPS. Físicas de cartas (Dopamine Matrix) implementadas.
- **Blocker:** Desyncs entre estado visual e servidor ao clicar rápido demais (Race conditions do M1 precisam estar sanadas).

### M3: The Architect of Chaos (Semana 6-7)
- **Goal:** Edge Cases Bíblicos e Anti-Cheat.
- **DoD:** Toxiproxy injetado no ambiente de teste. Testes automatizados derrubam a conexão do Client na metade de uma animação e provam que a reconexão restaura o board perfeitamente em 2 segundos.
- **Blocker:** Bot Seamless Takeover (Se o player não voltar, o bot tem que assumir para M4 fluir).

### M4: The Loop (Semana 8-9)
- **Goal:** Matchmaking (Glicko2), Banco de Dados, Login Supabase e Economia.
- **DoD:** O jogador agora "existe". Ele cria conta, entra na fila, acha partida, ganha MMR e compra 1 Emote na loja.
- **Blocker:** Redis Sharding.

### M5: Soft Launch / Beta (Semana 10+)
- **Goal:** Lançamento regional silencioso para teste de servidor (Deploy em K8s / Fly.io).
- **DoD:** Cluster sobrevive a 5.000 bots sintéticos mandando sockets.
- **Blocker:** Teste de estresse (Load testing).

## 3. DEPENDÊNCIAS DE INTEGRAÇÃO
A aprovação do M3 (Chaos) pelo **QA Master Agent** é o ponto de não-retorno. Se o código for reprovado no M3, a arquitetura deve voltar para a prancheta de desenho (M1). O "sucesso" em M2 (Bonito) não importa se M3 (Estável) falhar.