# DOC-ID: [03_C_DOPAMINE_TIMING_MATRIX]
# SYSTEM: TRINITY UX & GAME FEEL
## 1. OBJETIVO E ESCOPO
Mapear matematicamente os intervalos de tempo (delays) entre as ações do usuário e a resposta visual do sistema. O objetivo não é "velocidade máxima", mas sim "velocidade psicológica ótima" para maximizar engajamento, antecipação e recompensas (Flow State).

## 2. A MATRIZ DE TEMPO (The Juiciness Constants)
Toda interação no Framer Motion e no Web Audio API deve obedecer estas constantes absolutas:

### 2.1. Ação: Escolher uma Carta (Card Hover & Select)
- **Hover Delay:** `0ms`. Imediato. A carta sobe 5px.
- **Select Haptic:** Vibrar motor Taptic em `light` mode.
- **Tension Phase:** Ao confirmar a escolha, o fundo deve escurecer (`opacity: 0.3`) e o alvo deve ser destacado com um glow pulsante.
- **Dopamine Goal:** Controle e responsividade absoluta, transicionando para foco total no alvo.

### 2.2. Ação: Revelar Carta (The Reveal Tension)
A revelação nunca é instantânea. O cérebro precisa antecipar.
- **Fase 1 (Deep Tension):** A carta treme violentamente (heavy vibration) e a "câmera" (UI) sofre micro-shakes. Duração: `600ms`.
- **Fase 2 (Suspense Delay):** Um breve congelamento de `150ms` no pico da vibração antes do flip.
- **Fase 3 (High-Glow Flip):** Duração de `400ms`. Durante o flip, a carta emite um flare/glow intenso e sofre um micro-zoom (`scale: 1.2`).
- **Fase 4 (Leitura):** Congela por `400ms`.
- **Dopamine Goal:** Slot-machine effect. A expectativa é mais viciante que a revelação em si.

### 2.3. Ação: Formar um TRIO (The Jackpot)
- **Fase 1 (Impacto):** Time scale congela brevemente (Hit-stop de `200ms`). Som explosivo (Heavy Bass).
- **Fase 2 (Slow Motion Convergence):** Cartas viajam para o centro em slow motion (`duration: 1200ms`, `type: spring`, `stiffness: 40`).
- **Fase 3 (Massive Explosion):** Partículas massivas, shake de tela violento. UI exibe Banner Neon. Som Ascendente Majestoso.
- **Cooldown:** `1500ms` obrigatórios de bloqueio de UI para forçar o jogador a "apreciar" o momento.
- **Dopamine Goal:** Catarse total. Recompensa visual e auditiva proporcional à dificuldade.

### 2.4. Ação: Errar a Sequência (The Thud)
- **Fase 1 (Processamento):** UI espera `600ms`. O jogador precisa perceber que errou.
- **Fase 2 (Rejection):** Cartas viram abruptamente de volta em `150ms`. Som seco e grave. Tela ganha leve shake lateral (Camera shake `10px`).
- **Dopamine Goal:** Frustração imediata seguida de alívio rápido liberando para o próximo turno. "Quase ganhei, preciso tentar de novo".

## 3. CHECKLIST TÉCNICO
- [ ] `useTensionDelay` Hook criado no Frontend para abstrair essas constantes.
- [ ] Mutex no Zustand que bloqueia inputs durante as fases de Animação.
- [ ] Testes de UI validam se botões estão em `pointer-events: none` durante o Cooldown.