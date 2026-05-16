# DOC-ID: [16_B_HIDDEN_CARD_OBFUSCATION]
# SYSTEM: TRINITY SECURITY / ANTI-CHEAT
## 1. OBJETIVO E ESCOPO
Erradicar matematicamente a possibilidade de cheats do tipo "Wallhack / X-Ray". Em um jogo web (Node.js/React), tudo que chega ao cliente pode ser lido no *Chrome DevTools > Network > WS Frames*.
**Escopo:** Proteção do Payload Colyseus e inibição da engenharia reversa de memória (Memory Scraping) das variáveis de estado do React.

## 2. ARQUITETURA E FLUXOS DE ESTADO
A arquitetura se apoia no princípio da *Ignorância do Cliente* (Client Ignorance).

### 2.1 O Paradoxo da Mão do Inimigo
- **Regra de Ouro:** O backend **JAMAIS** transmite o valor de uma carta oculta para o cliente, mesmo criptografado.
- *Fluxo Errado (Permite Hack):* Backend envia `[{id: 1, value: 7, isRevealed: false}]`. Hacker intercepta o JSON no DevTools e cria um script que lê o valor 7 antes de virar.
- *Fluxo Certo (Trinity Standard):* Backend envia `[{id: 1, value: null, isRevealed: false}]`. Apenas o array físico de cartas do backend possui `value = 7`. O DevTools do hacker verá `null`.
- *O Momento da Revelação:* Quando a ação é validada no backend, ele aplica o patch de estado: `state.cards[1].value = 7; state.cards[1].isRevealed = true`. Só então a rede propaga o dado para o browser. Se o hacker interceptar agora, não importa, a carta já é pública.

### 2.2 O Deck Original e a Semente (Seed)
A disposição inicial da mesa e das mãos não deve ser calculada por `Math.random()` simples (previsível), mas por um PRNG (Pseudo-Random Number Generator) severo usando uma Seed assinada no servidor.
A Seed NUNCA é enviada ao cliente, impedindo que bots reconstruam a "fábrica" do baralho simulando o PRNG localmente.

## 3. DEPENDÊNCIAS
- **Inputs:** Colyseus Schema.
- **Outputs:** State Synchronization payload.

## 4. RISCOS E EDGE CASES
- **Risco 1 (Data Leak por Log acidental):** Um desenvolvedor no Frontend coloca um `console.log(state)` para debugar, e um log esquecido acaba no build de produção.
  - *Solução:* Configurar o `Terser/SWC` no Next.js `next.config.js` para dropar todos os statements de `console.*` no ambiente de produção.
- **Risco 2 (Replay Injection):** Hacker usa uma ferramenta para reenviar a payload binária de "REVEAL_INTENT" exata que ele capturou em outro turno, forçando um desync.
  - *Solução:* O Servidor utiliza um `sequenceId` atrelado ao JWT. Cada ação do cliente obriga o incremento de +1. Se a payload antiga chegar com `seq: 4` e o servidor já está no `seq: 6`, ele descarta a payload silenciosamente (previne replay attacks).

## 5. MÉTRICAS E TESTES
- O Payload final inspecionado no DevTools deve mostrar o tamanho das strings de log e propriedades irrelevantes ofuscadas por `Mangle` (Terser). `value` e `id` são propriedades tipadas do Schema binário e já são ilegíveis em texto puro.