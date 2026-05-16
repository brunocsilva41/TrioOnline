# 🤝 Guia de Contribuição (Onboarding)

Bem-vindo ao TrioOnline! Estamos felizes em ter você no time. Como um projeto AAA, mantemos padrões de código e processos extremamente rigorosos.

---

## 🏁 Primeiros Passos

1.  **Leia o `README.md`**: Entenda a visão geral do projeto.
2.  **Explore a Bíblia de Engenharia**: Localizada em `/PLANNING/52_ENGINEERING_BIBLE`. Ela contém as regras que impedem bugs de sincronismo.
3.  **Configuração de Ambiente**:
    -   Certifique-se de usar `pnpm`.
    -   Configure as extensões do VSCode sugeridas (ESLint, Prettier, Tailwind IntelliSense).

---

## 🛠️ Workflow de Desenvolvimento

Seguimos o padrão **Research -> Strategy -> Execution**:

1.  **Issue/Task**: Pegue uma task no board.
2.  **Branch**: Crie uma branch seguindo o padrão `feat/nome-da-task` ou `fix/nome-do-bug`.
3.  **Desenvolvimento**:
    -   Nunca use hacks ou `any` no TypeScript.
    -   Adicione testes unitários para qualquer lógica nova em `packages/core-engine`.
    -   Mantenha a cobertura de testes acima de 95%.
4.  **Lint & Testes Locais**:
    ```bash
    pnpm lint
    pnpm test
    ```
5.  **Pull Request**:
    -   Descreva as mudanças claramente.
    -   A aprovação do **QA Master Agent** e do **Project Orchestrator** é obrigatória no CI.

---

## 📏 Padrões de Código

-   **Arquitetura**: Prefira composição sobre herança.
-   **Determinismo**: Jamais use `Math.random()` ou `Date.now()` dentro de pacotes de lógica de jogo.
-   **Segurança**: Nunca logue informações sensíveis (JWT, Keys).
-   **Performance**: Evite re-renders desnecessários no React. Use `Zustand` para estado global e `Framer Motion` para animações desacopladas do estado de render.

---

## 🤖 Interagindo com Agentes

Você notará comentários automáticos em seus PRs vindos de nossos Agentes. Eles são especialistas em áreas específicas (Segurança, Performance, UX). Se um agente bloquear seu PR, analise a justificativa técnica fornecida e ajuste o código.

---

## 🆘 Precisa de Ajuda?

-   Consulte o `index.md` em `/AGENTS` para saber quem é o "dono" de cada área.
-   Verifique a `EDGE_CASE_BIBLE` em `/PLANNING` para soluções de problemas comuns de rede e estado.
