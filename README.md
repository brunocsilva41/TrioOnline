# 🪐 TrioOnline (Project Trinity)

[![Architecture: Monorepo](https://img.shields.io/badge/Architecture-Monorepo-blueviolet)](https://github.com/your-repo/trinity)
[![Engine: Deterministic](https://img.shields.io/badge/Engine-Deterministic-orange)](/PLANNING/52_ENGINEERING_BIBLE/deterministic_multiplayer_laws.md)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red)]()

**TrioOnline** (codenamed **Trinity**) é um jogo multiplayer AAA desenvolvido com foco em determinismo absoluto, performance de baixa latência e uma arquitetura baseada em múltiplos agentes autônomos. Este projeto utiliza o estado da arte em engenharia de software para garantir partidas justas, escaláveis e resilientes.

---

## 🏗️ Estrutura do Monorepo

O projeto está organizado como um monorepo escalável para facilitar a consistência entre o cliente, servidor e lógica compartilhada.

-   **`apps/game-client`**: Frontend React/Next.js focado em performance visual e UX (PWA, Framer Motion, Shaders).
-   **`apps/game-server`**: Backend Colyseus (Node.js) responsável pela orquestração de salas, matchmaking e segurança.
-   **`packages/core-engine`**: O coração do jogo. Contém a Máquina de Estados Determinística compartilhada entre cliente e servidor.
-   **`packages/db`**: Camada de persistência com Prisma, Postgres e Redis.
-   **`infra`**: Manifestos Kubernetes (K8s) e configurações de monitoramento.
-   **`AGENTS`**: Definições e prompts do Sistema Multi-Agente (MAS) que gerencia a qualidade do projeto.
-   **`PLANNING`**: A Bíblia de Engenharia e documentos de design técnico.

---

## ⚖️ As 5 Leis Inquebráveis (Engenharia)

Para manter o determinismo absoluto, todo desenvolvedor deve seguir a [Bíblia de Engenharia](/PLANNING/52_ENGINEERING_BIBLE/deterministic_multiplayer_laws.md):

1.  **Lei I: Proibição do `Math.random()`**: Use sempre o PRNG baseado em Seed do projeto.
2.  **Lei II: O Tempo não existe**: Todas as lógicas de timeout devem basear-se em *Ticks* de servidor, nunca em `Date.now()`.
3.  **Lei III: Imutabilidade do Estado**: Alterações de estado são tratadas como Event Sourcing.
4.  **Lei IV: Desacoplamento Absoluto**: A lógica central não conhece a UI. O backend envia dados puros.
5.  **Lei V: Single Threaded Mutex**: Race conditions são evitadas via fila FIFO atômica por sala.

---

## 🚀 Como Rodar o Projeto (Local)

### Pré-requisitos
-   Docker e Docker Compose
-   Node.js 18+ & PNPM

### Setup Rápido
1.  Clone o repositório.
2.  Instale as dependências: `pnpm install`.
3.  Suba a infraestrutura local:
    ```bash
    docker-compose up -d
    ```
4.  O servidor estará rodando em `localhost:2567` e o banco de dados em `localhost:5432`.

---

## 🚢 Pipeline de Deploy & DevOps

Nosso processo de deploy é focado em **Zero Downtime** e **Canary Rollouts**.

1.  **CI (Continuous Integration)**: Validação estrita com Lint, TSC, 95% de cobertura de testes e testes E2E com Playwright.
2.  **Stateful CD**: Utilizamos ArgoCD para gerenciar o cluster K8s. Deploys de Game Server usam a estratégia `Graceful Drain` (15 minutos para encerrar partidas ativas enquanto novas salas sobem na versão nova).
3.  **Observabilidade**: Monitoramento em tempo real via Datadog/Prometheus com rollback automático se a taxa de erro subir 5%.

---

## 🤖 Sistema de Agentes (MAS)

Este projeto é mantido por uma equipe de agentes especializados. Antes de realizar mudanças críticas, consulte o agente responsável no diretório `/AGENTS`.

-   **Project Orchestrator**: Garantia de qualidade e workflow.
-   **Backend Architect**: Performance e State Machine.
-   **SRE Agent**: Estabilidade e Uptime.

---

## 📄 Documentação Relacionada
-   [Guia de Contribuição & Onboarding](/CONTRIBUTING.md)
-   [Bíblia de Engenharia (Determinismo)](/PLANNING/52_ENGINEERING_BIBLE/deterministic_multiplayer_laws.md)
-   [Estratégia de Deploy](/PLANNING/51_PIPELINES/cicd_canary_rollout.md)
