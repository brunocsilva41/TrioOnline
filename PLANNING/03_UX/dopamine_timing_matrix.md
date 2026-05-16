# DOC-ID: [03_C_DOPAMINE_TIMING_MATRIX]
# SYSTEM: TRINITY UX & GAME FEEL
## 1. OBJETIVO E ESCOPO
Mapear matematicamente os intervalos de tempo (delays) entre as ações do usuário e a resposta visual do sistema. O objetivo não é "velocidade máxima", mas sim "velocidade psicológica ótima" para maximizar engajamento, antecipação e recompensas (Flow State).

## 2. A MATRIZ DE TEMPO (The Juiciness Constants)
Toda interação no Framer Motion e no Web Audio API deve obedecer estas constantes absolutas:

### 2.1. Ação: Escolher uma Carta (Card Hover & Select)
- **Hover Delay:** `0ms`. Imediato. A carta sobe 5px.
- **Select Haptic:** Vibrar motor Taptic em `light` mode.
- **Dopamine Goal:** Controle e responsividade absoluta.

### 2.2. Ação: Revelar Carta do Inimigo (Suspense)
A revelação nunca é instantânea. O cérebro precisa antecipar.
- **Fase 1 (Tensão):** A carta treme no lugar por `350ms`. Efeito de som: Fricção crescendo (Riser pitch).
- **Fase 2 (Flip):** Duração de `200ms` usando easing `cubic-bezier(0.17, 0.67, 0.83, 0.67)`.
- **Fase 3 (Leitura):** Congela por `400ms` (Tempo médio para processamento cognitivo de um número por um adulto).
- **Dopamine Goal:** Slot-machine effect. A expectativa é mais viciante que a revelação em si.

### 2.3. Ação: Formar um TRIO (The Jackpot)
- **Fase 1 (Impacto):** Time scale congela brevemente (Hit-stop de `100ms`). Som estala.
- **Fase 2 (Convergence):** Cartas viajam para o centro (`duration: 600ms`, `type: spring`, `stiffness: 100`).
- **Fase 3 (Explosion):** Partículas explodem. Vibração `Heavy`. UI exibe Banner Neon. Som Ascendente Majestoso.
- **Cooldown:** `1200ms` obrigatórios de bloqueio de UI para forçar o jogador a "apreciar" o momento antes de seguir jogando.

### 2.4. Ação: Errar a Sequência (The Thud)
- **Fase 1 (Processamento):** UI espera `600ms`. O jogador precisa perceber que errou.
- **Fase 2 (Rejection):** Cartas viram abruptamente de volta em `150ms`. Som seco e grave. Tela ganha leve shake lateral (Camera shake `10px`).
- **Dopamine Goal:** Frustração imediata seguida de alívio rápido liberando para o próximo turno. "Quase ganhei, preciso tentar de novo".

## 3. CHECKLIST TÉCNICO
- [ ] `useTensionDelay` Hook criado no Frontend para abstrair essas constantes.
- [ ] Mutex no Zustand que bloqueia inputs durante as fases de Animação.
- [ ] Testes de UI validam se botões estão em `pointer-events: none` durante o Cooldown.