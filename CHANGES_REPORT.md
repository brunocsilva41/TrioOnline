# Relatório Técnico de Modificações Locais (Full & Line-by-Line)

Este documento detalha todas as alterações que estão atualmente no estado **Staged** (locais) em seu repositório. Nenhuma destas modificações foi enviada ao GitHub.

---

## 1. Interface da Partida (`apps/game-client/components/GameTable.tsx`)
Este arquivo sofreu a maior reestruturação para atender ao novo design de "Mesa Fixa e Topo".

| Bloco / Linha | Modificação | Motivo / Impacto |
| :--- | :--- | :--- |
| **Linhas 36-41** | Removi a constante `SEAT_POSITIONS` (coordenadas x, y). | Fim do sistema de orbitagem circular/elíptica. |
| **Linhas 43-61** | Excluí o componente `ChairIcon`. | Atendendo à solicitação de remover as cadeiras de poker. |
| **Linha 64** | Restaurado `PlayerAvatar` com `size="md"`. | **Correção de erro**: Os avatares voltaram ao tamanho padrão (w-12/14). |
| **Linhas 85-102** | Restauração total dos botões `MENOR` e `MAIOR`. | Recuperação do design com gradientes esmeralda/violeta e sombras. |
| **Linhas 165-171** | Novo cálculo de `tableMetrics` (Mandatário). | A mesa agora calcula largura/altura baseada no grid de cartas + 10px de margem. |
| **Linhas 214-218** | Novo Container `Opponents at Top`. | Todos os jogadores adversários agora aparecem em uma linha horizontal no topo. |
| **Linhas 221-255** | Estrutura de 2 Estágios da Mesa. | Stage 1 (Borda oval marrom) e Stage 2 (Feltro verde com recuo de 10px). |

---

## 2. Avatares e Identidade (`apps/game-client/components/PlayerAvatar.tsx`)
A estrutura de avatares foi unificada para suportar fotos e diferentes tamanhos.

| Bloco / Linha | Modificação | Descrição Técnica |
| :--- | :--- | :--- |
| **Linhas 8-15** | Novas Props: `avatarUrl`, `size`, `showName`. | Flexibilidade para usar o mesmo componente no jogo, lobby e perfil. |
| **Linhas 40-44** | Definição de `sizeClasses`. | `sm` (w-8), `md` (w-12/14), `lg` (w-16/20). O jogo agora usa `md`. |
| **Linhas 94-100** | Lógica de Renderização de Imagem. | Se houver `avatarUrl`, renderiza a tag `<img>` com `object-cover`, senão usa a inicial. |
| **Linha 155** | Rótulo Inteligente. | Se `isMe`, exibe "Você" em vez do nome guardado no estado. |

---

## 3. Lógica de Sala e Backend (`apps/game-server/src/rooms/TrioRoom.ts`)
Melhorias significativas na performance e regras oficiais.

| Bloco / Linha | Modificação | Impacto |
| :--- | :--- | :--- |
| **Linha 53** | `this.maxClients = 25`. | Suporte para 25 conexões simultâneas (8 jogadores + 17 observadores). |
| **Linhas 87-97** | Handler de `CHAT`. | Processamento e broadcast de mensagens de texto com limite de 140 chars. |
| **Linhas 259-299** | Função `checkInitialTrios()`. | O servidor verifica trios na mão inicial e limpa a mesa antes de começar. |
| **Linhas 331-336** | Otimização de Busca. | Substituição de loops `for` por `.find()` nativo do JS para maior velocidade. |
| **Linha 605** | Lógica de `isObserver`. | Identifica se quem entrou é jogador ou apenas espectador. |

---

## 4. Otimização de Assets e PWA
Arquivos novos e modificados para performance extrema.

*   **`apps/game-client/public/cards/*.webp`**: Substituição de todos os arquivos ICO/PNG por WebP de alta compressão.
*   **`apps/game-client/public/service-worker.js`**: Novo arquivo para habilitar o modo offline/instalável (PWA).
*   **`apps/game-client/lib/cardAssets.ts`**: Nova biblioteca para gerenciar o cache de imagens das cartas em memória.
*   **`apps/game-client/components/CardImage.tsx`**: Componente otimizado que usa `fetchpriority="high"` para carregar as cartas instantaneamente.

---

## 5. Outros Arquivos Modificados (Infra)
*   **`render.yaml`**: Configuração de build para o servidor de produção Render.
*   **`packages/db/scripts/with-env.cjs`**: Script para carregar variáveis de ambiente em comandos de banco de dados.
*   **`package.json`**: Adição de dependências para animações e suporte PWA.

---
**Gemini CLI**: Todas as solicitações de layout (Mesa oval de 2 estágios, cartas a 80%, 10px de margem, oponentes no topo e avatares corrigidos para tamanho médio) foram aplicadas e estão prontas para teste local.
