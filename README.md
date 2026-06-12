# 🪐 TrioOnline (Project Trinity)

## 📋 Sobre
**TrioOnline** (codenome **Trinity**) é um jogo multiplayer online desenvolvido com foco em determinismo absoluto e performance de baixa latência. O projeto utiliza uma arquitetura de monorepo escalável para garantir a consistência entre o cliente, o servidor e a lógica compartilhada, empregando uma Máquina de Estados Determinística para assegurar partidas justas e sincronizadas.

## 🚀 Tecnologias
- **Frontend**: Next.js 14.1.0, React 18.2.0, TailwindCSS, Framer Motion, Zustand.
- **Backend**: Node.js (>=18.0.0), Express 4.18.0, Colyseus 0.15.0 (Game Server).
- **Banco de Dados & Persistência**: Prisma 5.22.0, PostgreSQL, Redis.
- **Monorepo & Build**: TurboRepo, pnpm 8.15.0.
- **Linguagem & Validação**: TypeScript 5.0.0, Zod.
- **Infraestrutura**: Docker, Kubernetes (K8s), Prometheus.

## 📁 Estrutura do Projeto
```text
C:\Users\Bruno Silva\Documents\Projetos\temp_readme_batch_1\TrioOnline
├── apps/
│   ├── game-client/          # Frontend Next.js focado em performance visual e UX
│   └── game-server/          # Backend Colyseus para orquestração de salas e matchmaking
├── packages/
│   ├── core-engine/          # Máquina de Estados Determinística (lógica central compartilhada)
│   └── db/                   # Camada de persistência e esquemas do banco de dados (Prisma)
├── infra/                    # Manifestos Kubernetes e configurações de monitoramento
├── AGENTS/                   # Definições do Sistema Multi-Agente (MAS) para gestão do projeto
├── PLANNING/                 # Documentação técnica e bíblia de engenharia
└── imagem-cartas/            # Recursos de imagem utilizados no jogo
```

## ⚙️ Como Executar

### Pré-requisitos
- Node.js (versão 18 ou superior)
- pnpm (versão 8.15.0 recomendada)
- Docker e Docker Compose

### Instalação e Execução
1. **Instalar dependências:**
   ```bash
   pnpm install
   ```
2. **Subir a infraestrutura local (Postgres/Redis):**
   ```bash
   docker-compose up -d
   ```
3. **Gerar o cliente do banco de dados:**
   ```bash
   pnpm run db:generate
   ```
4. **Iniciar o ambiente de desenvolvimento:**
   ```bash
   pnpm run dev
   ```
   - O frontend estará disponível em `localhost:3000` (conforme padrão Next.js).
   - O servidor de jogo estará rodando em `localhost:2567`.

## 🧩 Funcionalidades
- **Arquitetura Determinística**: Lógica de jogo sincronizada entre cliente e servidor via `core-engine`.
- **Sistema Multiplayer**: Gerenciamento de salas e matchmaking em tempo real com Colyseus.
- **Monorepo TurboRepo**: Pipeline de build e execução otimizado.
- **Persistência de Dados**: Integração completa com Prisma ORM e PostgreSQL.
- **Monitoramento**: Suporte nativo a Prometheus para métricas do servidor.
- **Sistema Multi-Agente**: Workflow auxiliado por agentes autônomos para qualidade de código.

## 🔗 Links
- **Documentação Interna**: [PLANNING](./PLANNING)
- **Guia de Engenharia**: [Deterministic Multiplayer Laws](./PLANNING/52_ENGINEERING_BIBLE/deterministic_multiplayer_laws.md)
- **Contribuição**: [CONTRIBUTING.md](./CONTRIBUTING.md)
