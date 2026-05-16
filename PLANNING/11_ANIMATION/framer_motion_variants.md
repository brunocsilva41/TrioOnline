# DOC-ID: [11_A_FRAMER_MOTION_VARIANTS]
# SYSTEM: TRINITY UI/ANIMATION
## 1. OBJETIVO E ESCOPO
Definir o catálogo rigoroso de `Variants` do Framer Motion para o ciclo de vida visual das cartas. A consistência da física (Spring, Damping, Mass) é o que diferencia o jogo de um projeto amador.
**Escopo:** Todos os estados visuais que um componente `<Card />` pode assumir na renderização React.

## 2. ARQUITETURA E FLUXOS (The Variants Dictionary)
O componente não possui `useState` local para posição. Ele obedece cegamente a propriedade `variant` mapeada do Zustand/Colyseus.

### 2.1. Variantes Base (Typescript Definition)
```typescript
const cardVariants = {
  hidden_deck: { scale: 0.8, opacity: 0, y: -200, rotateY: 180 },
  hidden_table: { scale: 1, opacity: 1, y: 0, rotateY: 180, transition: { type: "spring", stiffness: 200, damping: 20 } },
  hidden_hand_self: { scale: 1, opacity: 1, y: 0, rotateY: 0, transition: { type: "spring", stiffness: 300, damping: 25 } },
  tension_shake: { 
    x: [0, -5, 5, -5, 5, 0], 
    transition: { duration: 0.35, repeat: Infinity } 
  },
  revealed_table: { 
    rotateY: 0, scale: 1.1, zIndex: 10, boxShadow: "0px 10px 30px rgba(0,255,255,0.4)",
    transition: { type: "spring", stiffness: 260, damping: 20, mass: 1.2 }
  },
  trio_fusion: {
    x: "50vw", y: "50vh", scale: 0.2, opacity: 0, rotateZ: 720,
    transition: { duration: 0.6, ease: "backIn" }
  },
  fail_thud: {
    rotateY: 180, scale: 1, zIndex: 1, y: [0, 20, 0],
    transition: { type: "spring", stiffness: 400, damping: 10 }
  }
}
```

## 3. DEPENDÊNCIAS
- **Inputs:** Flag `isRevealed` e `isTrioFormed` vindas do Zustand Global Store.
- **Outputs:** Modificações no Virtual DOM (via GPU Canvas `will-change: transform`).

## 4. RISCOS E EDGE CASES
- **Risco 1 (Animation Desync por Re-render):** Se o React disparar um re-render do componente pai (A Mesa) no meio da animação de flip, o Framer Motion reseta a variante, fazendo a carta "pular".
  - *Solução:* Componentes `<Card />` devem ser embrulhados em `React.memo` fazendo shallow compare rígido das props. O Pai NUNCA deve atualizar o estado apenas para alterar uma única carta.
- **Risco 2 (Z-Index Overlap):** Durante a fusão de um Trio, as cartas passam por cima dos avatares dos outros jogadores, mas ficam presas atrás de modals abertos (Chat).
  - *Solução:* Criação do `<Portal id="animation-layer">`. Na variante `trio_fusion`, o componente desmonta do grid local e remonta no Portal de tela cheia usando `layoutId` (Shared Layout Animation do Framer).

## 5. IMPACTOS
Se mal configurado, dispositivos Android mid-range (ex: Moto G) sofrerão queda de FPS para < 20. O uso rigoroso de `transform` em oposição a `top/left/margin` é obrigatório, pois `transform` não aciona o fluxo de Layout e Paint do browser, rodando puramente no processo de Compositing (GPU).