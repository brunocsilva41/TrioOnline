---
ID: EC-002
OWNER: Edge Case Agent
REVIEWERS: Frontend Architect, Performance Optimization Agent
SEVERITY: HIGH
PROBABILITY: High
---

# EDGE CASE BIBLE: THE REACT RENDER THRASHING (EC-002)

## 1. CAUSA RAIZ E DESCRIÇÃO
O Frontend do TRINITY é reativo ao State Patch do WebSocket.
**Cenário:** Um jogador revela uma carta. O servidor de jogo, seguindo as Leis Determinísticas, atualiza o tempo da sala (Timer) para 15 segundos e também vira a carta.
Como o Colyseus emite deltas em alta frequência, o Frontend recebe:
- Frame 1: Timer 14.9s
- Frame 2: Timer 14.8s
- Frame 3: Carta `isRevealed = true`
- Frame 4: Timer 14.7s

**A Falha (Render Thrashing):** Se o componente React raiz (`<GameTable />`) estiver consumindo o State inteiro do Zustand (ex: `const state = useGameStore()`), TODO O DOM DA MESA (incluindo as 36 cartas, 4 avatares e chat) será re-renderizado e recalculado no Browser a CADA décimo de segundo que o timer atualizar. Isso paralisa a thread do Safari no iOS e a animação do Framer Motion gagueja terrivelmente, destruindo a qualidade AAA.

## 2. REPRODUÇÃO
1. No React DevTools, ativar a opção "Highlight updates when components render".
2. Entrar em uma partida.
3. Se a tela inteira piscar verde/amarelo loucamente enquanto nada está acontecendo além de um relógio, a performance está condenada.

## 3. PREVENÇÃO E MITIGAÇÃO (COMPONENTIZAÇÃO ATÔMICA)

**Regra Absoluta do Frontend React:**
NENHUM componente pode se inscrever no objeto State inteiro. Inscrições devem ser cirúrgicas (Granular Selectors).

### O Padrão Obrigatório
O Componente Raiz (`<GameTable />`) não consome variáveis mutáveis de alta frequência. Ele se renderiza apenas UMA VEZ.

```tsx
// ❌ ERRADO (O Crime do Thrashing)
function Card({ index }) {
  const state = useGameStore(); // Lê tudo!
  const myCard = state.cards[index];
  return <div className={myCard.isRevealed ? "up" : "down"} />;
}

// ✅ CERTO (A Seleção Atômica)
function Card({ index }) {
  // O componente Card[5] só re-renderiza se expecificamente a carta 5 mudar.
  const isRevealed = useGameStore(state => state.cards[index].isRevealed);
  return <div className={isRevealed ? "up" : "down"} />;
}
```

### Isolamento do Timer
O componente de Relógio (`<TurnTimer />`) deve ser um nó isolado na árvore DOM (geralmente fora do fluxo normal CSS, `position: absolute`) consumindo exclusivamente `useGameStore(state => state.currentTime)`.

## 4. MONITORAMENTO E TESTES
- O CI Pipeline rodará o **Lighthouse CI** que falhará se a métrica de `Total Blocking Time (TBT)` exceder 150ms.
- O Profiler de CPU do dev mode deve ser inspecionado semanalmente pelo Performance Agent para garantir que a Main Thread está "verde" (Idle) durante 90% do tempo de uma partida ativa.