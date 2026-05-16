# DOC-ID: [20_A_ETHICAL_REVENUE_MODEL]
# SYSTEM: TRINITY MONETIZATION & BUSINESS
## 1. OBJETIVO E ESCOPO
Estabelecer as regras definitivas e éticas para a geração de receita do TRINITY. Nosso pilar central é: **Zero Pay-to-Win**. Gastar dinheiro não afeta a RNG do jogo, não dá dicas de cartas, nem garante partidas fáceis.
**Escopo:** Economia de Tokens, Battle Pass, Loja de Cosméticos e sistemas de escassez artificial para manter o valor das skins.

## 2. ARQUITETURA ECONÔMICA (The Dual Currency)
- **Soft Currency (T-Coins):** Ganhos jogando partidas (Win=100, Loss=25) e completando Daily Quests. Usados para comprar "Emotes Comuns", desbloquear modos secundários (ex: Custom Rooms VIP) ou re-rolar Quests Diárias.
- **Hard Currency (Trinity Gems):** Comprados com dinheiro real ($$$) via Stripe / Apple Pay / Google Pay. Usados para adquirir o *Premium Battle Pass* e *Holo-Cards/Skins VFX*.

### 2.1 O Battle Pass System
- **Modelo:** Sazonal (1 Temporada = 60 Dias).
- **Estrutura:** 50 Níveis (Tiers). Ganha-se "XP de Passe" passivamente ao jogar.
- **Free Track:** Oferece T-Coins, alguns Emotes e pacotes de "Card Backs" estáticos.
- **Premium Track (Custo: 900 Gems = ~$9.99):** Desbloqueia as "3D Holo-Cards" da temporada, Board Skins (Cenários para a mesa) e Títulos Neon para o Avatar. Retorna até 1000 Gems ao longo dos 50 níveis (premiando o engajamento contínuo: se o usuário jogar muito, o próximo passe "se paga").

### 2.2 Cosmetic System Architecture
Apenas cosméticos visuais são comercializados:
1. **Card Backs:** A textura da parte de trás das cartas.
2. **Card Faces (Foil/Holo):** A arte 3D na face frontal (ex: Números esculpidos em néon ou chamas).
3. **Table Skins (Playmats):** O fundo 3D onde o jogo ocorre (ex: "Mesa de Mahjong", "Mesa Cyberpunk").
4. **VFX Finishers (The Flex):** Animação exclusiva exibida para TODOS na sala quando o jogador faz o Trio vencedor (ex: Um dragão chinês queima as cartas restantes).
5. **Interactive Emotes:** Gifs e animações sonoras curtas para usar durante o turno alheio.

## 3. RISCOS E EDGE CASES
- **Risco 1 (O "Chargeback Fraud"):** Jogador compra Gems, usa para comprar skins e em seguida abre estorno no cartão de crédito na Apple Store.
  - *Solução:* O webhook de estorno do Stripe/Apple (`charge.dispute.created`) é conectado ao backend. O servidor debita as Gems da conta na mesma hora. Se as Gems estiverem negativas, a conta recebe "Shadow Ban" da loja, e os itens cosméticos equipados são automaticamente revertidos para o padrão (Default) até o saldo regularizar.
- **Risco 2 (Apatia Econômica):** Se o Free Track não der NENHUMA Gema e NENHUM item legal, a conversão para pagamento cai (Pilar de ancoragem cognitiva do Fortnite: dê gostinhos de conteúdo premium de graça, e a pessoa desejará comprar mais).
  - *Solução:* O Free Track fornecerá exatas 300 Gems aos jogadores mais hardcore que atingirem nível máximo. Isso garante que a longo prazo um Free-to-Play consiga comprar um passe e entrar na roda do engajamento.

## 4. MÉTRICAS E VALIDAÇÃO (KPIs)
- **ARPDAU (Average Revenue Per Daily Active User):** Deve ser monitorado via Mixpanel e mantido acima de $0.10.
- **Conversion Rate:** Meta de 5% da base MAU convertendo para o Battle Pass dentro dos primeiros 15 dias da temporada.