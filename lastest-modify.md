# 🛠️ Relatório Técnico de Modificações - Projeto Trio Online
**Sessão:** Junho 2026 | **Engenheiro:** Gemini CLI (YOLO Mode)
**Foco:** Overhaul Visual Premium, Otimização de Performance e Correção de Fluxo de Jogo.

---

## 1. Infraestrutura e DevOps (Oracle Cloud)
O projeto está hospedado em uma instância **Oracle Cloud Free Tier** com foco em economia de recursos e performance máxima.

### Acesso e Conectividade
*   **IP Público:** `137.131.167.138`
*   **Acesso SSH:** `ssh ubuntu@137.131.167.138` (Chave privada necessária).
*   **Diretório do Projeto:** `/home/ubuntu/TrioOnline`

### Stack de Tecnologia (Native Ultra-Light)
Para rodar em apenas **1GB de RAM**, evitamos o Docker no servidor:
*   **Node.js & pnpm:** Runtime e gerenciador de pacotes otimizado.
*   **PM2:** Gerenciador de processos que mantém o `trio-server` e `trio-client` vivos.
*   **PostgreSQL 15 (Nativo):** Instalado diretamente no SO para economizar ~100MB de RAM.
*   **Redis 7 (Nativo):** Cache de leaderboard e estado de sessão ultrarrápido.

### Configurações de Hardening e Performance
*   **Swap de 3GB:** Configurado para evitar que o processo de build do Next.js sofra *Out Of Memory*. Total de 4GB de memória virtual.
*   **Port Forwarding:** Regras de `iptables` configuradas para redirecionar o tráfego da porta **80** para a **3000** (Next.js). Salvas permanentemente com `netfilter-persistent`.
*   **Limites de Memória (PM2):** O arquivo `ecosystem.config.js` limita o servidor a 400MB e o cliente a 450MB, garantindo estabilidade total.

### Automação de Deploy (CI/CD)
*   **Pipeline:** Cada push na branch `sobe-nova-visu-a-pedido-dos-fans` dispara o GitHub Actions.
*   **Fluxo:** O GitHub valida o build e, se aprovado, acessa a VM via SSH e executa o script local `/home/ubuntu/TrioOnline/deploy.sh`.
*   **Script de Deploy:** Faz o `git pull`, instala dependências, sincroniza o banco (`prisma db push`), gera o build e reinicia o PM2.

---

## 2. Infraestrutura e Estabilidade do Ambiente Local
*   **Redis Local Fix:** Alterada a string de conexão de `localhost` para `127.0.0.1` nos arquivos `.env` (Raiz, Server e Client). Isso resolveu o problema de resolução de DNS do Windows/Docker que causava `ECONNREFUSED`.
*   **Redução de Log Spam:** Implementada lógica de throttling no `RedisService.ts`. O servidor agora tenta reconectar silenciosamente e emite um alerta no console apenas a cada 5 tentativas falhas.
*   **Database Sync:** Sincronização do Prisma Client executada com sucesso após ajustes nos esquemas de pontuação.

## 3. Overhaul Visual (UI/UX) - Estética "Premium Tech"

### Lobby e Tela Inicial
*   **Layout Lateral Centralizado:** Substituição do layout vertical por uma disposição em colunas:
    *   **Coluna Esquerda:** Botões de ação (**Buscar, Criar, Entrar, Treino**) com escala aumentada em **15%**.
    *   **Coluna Direita:** Input de Nickname e botão de destaque **"JOGAR AGORA"** com animação *shimmer* (brilho escorregadio).
*   **Estética Neon & Precision Fit:** 
    *   Implementação de classes `.neon-border-emerald` e `.neon-border-amber` no `globals.css`.
    *   Botões com arredondamento total (`rounded-full`) e tamanho ajustado exatamente ao conteúdo (`w-fit`), eliminando espaços vazios.
*   **Branding:** O verso da carta (`trio_back_card.webp`) foi definido como o **Favicon** oficial.
*   **Tipografia:** Integração da fonte **Space Grotesk** para um visual moderno e técnico.

### Fundo Animado (Restaurado)
*   **FloatingCardsLounge:** Resgate do efeito de "Mar de Cartas" com cartas 3D flutuando suavemente no fundo do lobby.
*   **ParticleField:** Campo de partículas ambientais em cores temáticas.

## 4. GameTable: Otimização Espacial e Visibilidade

*   **Reequilíbrio de Altura:** 
    *   Mesa Central (Tablado): Altura máxima limitada a **460px** para evitar compressão.
    *   Player Area (Card do Usuário): Altura reduzida de 120px para **75px**.
*   **Controles de Ação de Elite:** 
    *   Botões **Menor** e **Maior** com fonte `text-[11px]` e peso `font-black`.
    *   Cores sólidas de alto contraste (Emerald/Amber) aplicadas no *hover*.
*   **Avatar Polish:** Removido o erro visual do "quadrado preto". Agora são circulares com efeito de vidro e brilho dinâmico de turno.

## 5. Lógica de Jogo e Funcionalidades

*   **Turn Discovery Panel:** Painel ao lado da mão que mostra as cartas localizadas na rodada.
*   **Reset de Partida:** `trios` e `score` são limpos no início de cada partida (`dealCards`).
*   **Trio Animation Delay:** Atraso de **1200ms** antes do início da animação de Trio para dar impacto à descoberta.
*   **Restart Flow:** O botão "Novo Jogo" limpa o `sessionStorage` para evitar conflitos de reconexão.
*   **Room Locking:** Salas são trancadas (`this.lock()`) ao fim do jogo.
*   **Emojis:** Botão SmilePlus centralizado com transmissão global.

## 6. Comandos Úteis na VM
*   **Ver logs:** `pm2 logs`
*   **Reiniciar tudo:** `pm2 restart all`
*   **Status do Banco:** `sudo systemctl status postgresql`
*   **Status do Redis:** `sudo systemctl status redis`

---
**Resultado:** O projeto atingiu um nível de polimento visual profissional e uma infraestrutura robusta e automatizada.
