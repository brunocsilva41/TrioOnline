---
ID: EC-004
OWNER: Edge Case Agent
REVIEWERS: Mobile Optimization Agent, UX Psychology Agent
SEVERITY: HIGH
PROBABILITY: Very High (Em países tropicais / Verão)
---

# EDGE CASE BIBLE: MOBILE THERMAL THROTTLING (EC-004)

## 1. CAUSA RAIZ E DESCRIÇÃO
O jogo TRINITY possui shaders WebGL brilhantes (Three.js/Framer Motion) e roda nativamente no browser via PWA.
**Cenário:** O jogador está no Brasil, ao meio-dia, jogando no 4G com o brilho da tela no máximo em um iPhone 12 ou Android Intermediário. O processador aquece para > 45ºC.
**A Falha (Thermal Throttling):** O Sistema Operacional (iOS/Android) engatilha defesas termais de hardware. O clock da CPU/GPU é cortado pela metade. A Main Thread do browser que estava cravada em 60 FPS desaba para 12 FPS. As animações de carta "Spring" ficam em câmera lenta (durando 1500ms em vez de 400ms). O Turno do Backend (15 segundos) expira enquanto o cliente ainda está processando a animação da *primeira* carta. O jogador é punido por Timeout devido a lentidão física do celular.

## 2. REPRODUÇÃO
1. Rodar Chrome com CPU Throttling ativado (6x slowdown).
2. Tentar virar 3 cartas e observar o relógio de Turno da Engine.

## 3. PREVENÇÃO E MITIGAÇÃO (THE ADAPTIVE ENGINE)

### 3.1 Detecção de FPS Drop (Client-Side)
- O PWA implementa um hook `useFpsMonitor`.
- Se a média móvel de FPS cair abaixo de 24 nos últimos 3 segundos ativos (não em background), o Zustand ativa a flag `state.ux.isThermalThrottled = true`.

### 3.2 Degradação Graciosa Visual (Graceful Degradation)
- Se a flag `isThermalThrottled` estiver `true`:
  1. O componente de Partículas (`<TrioExplosion />`) cancela os efeitos de luz/Sombra.
  2. As propriedades `transition: { type: "spring" }` do Framer Motion recebem um override fallback para `transition: { type: "tween", duration: 0.1 }` (Movimento linear e veloz, sem computação física pesada).
  3. Shaders WebGL são desativados (Cartas caem do modo `Holo` para o modo `Flat`).

### 3.3 A Comunicação Cliente-Servidor (Hardware Ping)
O Timer da Engine não pode perdoar lentidão indiscriminadamente (Risco de Hack de Time-extension).
- O Frontend **NÃO** avisa o Backend para "esperar mais tempo". Isso seria uma falha de segurança (Exploit de Clock). O Timer do Backend permanece rígido.
- A única defesa viável é *acelerar cirurgicamente a UI no cliente*, conforme passo 3.2, para que o jogador de dispositivo fraco/quente possa terminar seu turno físico antes do timer implacável de 15s do backend expirar.

## 4. METRICS E LOGGING
O Analytics Agent coleta os dados: Se mais de 10% dos usuários sofrerem acionamento da flag `isThermalThrottled`, o Mobile Optimization Agent deve reescrever os shaders base de WebGL, pois eles são fundamentalmente pesados demais para produção AAA massiva.