# 🚀 TRIO ONLINE - CLI AGENT HUB

Este guia explica como invocar e utilizar a rede de agentes especializados do TRINITY usando as ferramentas **Gemini CLI** e **Antigravity CLI**.

## 🧠 Como usar no Gemini CLI

O Gemini CLI pode invocar sub-agentes usando a ferramenta `invoke_agent`. Use os nomes abaixo:

| Área | Nome do Agente | Principal Uso |
| :--- | :--- | :--- |
| **Orquestração** | `project_orchestrator` | Planejamento, revisão de arquitetura e resolução de conflitos. |
| **Lógica Core** | `core_engine_specialist` | Regras de jogo, determinismo e TurnStateMachine. |
| **Backend** | `backend_architect` | Colyseus, WebSockets, State Sync e Node.js. |
| **Frontend** | `frontend_architect` | Next.js, Zustand, React Performance e UI. |
| **Banco de Dados** | `database_architect` | Prisma, PostgreSQL, Migrações e Queries. |
| **Infra/DevOps** | `devops_infra` | Docker, Kubernetes, CI/CD e Deploy. |
| **QA/Testes** | `qa_master` | Cobertura de testes, Bug hunting e E2E. |
| **Game Design** | `game_design_balance` | Balanceamento de deck, MMR e Game Feel. |

**Exemplo de Comando:**
> "Invoke the `core_engine_specialist` to analyze the current deck shuffling logic and ensure it follows the deterministic laws."

---

## 🌌 Como usar no Antigravity CLI (Claude/Cursor/Windsurf)

Para ferramentas que utilizam prompts de sistema ou `.cursorrules`, você pode referenciar o conteúdo dos arquivos em `/AGENTS`.

**Protocolo de Ativação:**
1. Leia o arquivo do agente: `@AGENTS/[area]/[agent_name].md`
2. Peça para o modelo assumir a **IDENTITY** e o **PRIMARY OBJECTIVE**.
3. Forneça o contexto da tarefa.

**Exemplo de Prompt:**
> "Baseado no `@AGENTS/frontend/frontend_architect_agent.md`, refatore o componente de Mesa de Jogo para evitar re-renders desnecessários no Zustand."

---

## 🛠️ Fluxo de Trabalho Recomendado

1. **Discovery:** Peça ao `project_orchestrator` para planejar a feature.
2. **Draft:** O `architect` da área (Front/Back) cria o contrato técnica.
3. **Execution:** Use o agente especializado (Core/DB/VFX) para implementar.
4. **Validation:** O `qa_master` e o `devops_infra` validam e preparam o deploy.

---
*Mantenha sempre as 5 Leis Determinísticas ativas em qualquer intervenção no `core-engine`.*
