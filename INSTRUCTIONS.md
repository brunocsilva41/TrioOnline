# 🎮 PROJETO TRINITY - GUIA MESTRE DE EXECUÇÃO

Este guia contém as instruções definitivas para rodar o Projeto Trinity em ambiente de desenvolvimento e produção.

---

## 🛠️ 1. EXECUÇÃO LOCAL (DESENVOLVIMENTO)

O projeto utiliza um Monorepo baseado em **Turborepo** e **pnpm**.

### Pré-requisitos:
- Node.js v18+
- pnpm (`npm install -g pnpm`)
- Docker Desktop (Para Banco de Dados e Redis)

### Passo a Passo:
1. **Instalar Dependências:**
   ```bash
   pnpm install
   ```

2. **Subir Infraestrutura (Postgres/Redis):**
   ```bash
   docker-compose up -d
   ```

3. **Configurar Variáveis de Ambiente:**
   - Copie os arquivos `.env.example` para `.env` nas pastas `apps/game-server` e `apps/game-client`.

4. **Rodar o Projeto:**
   ```bash
   pnpm dev
   ```
   - O **Frontend** estará em: `http://localhost:3000`
   - O **Backend** estará em: `http://localhost:2567`

---

## 🚀 2. DEPLOY COMPLETO (RENDER.COM)

O deploy é automatizado via o arquivo `render.yaml`.

### Passo a Passo:
1. **Repositório:** Certifique-se de que seu código está em um repositório no GitHub ou GitLab.
2. **Conta no Render:** Acesse [render.com](https://render.com) e crie uma conta.
3. **Novo Blueprint:**
   - Clique em **"New"** -> **"Blueprint"**.
   - Conecte seu repositório.
4. **Configuração:**
   - O Render lerá o arquivo `render.yaml` automaticamente.
   - Ele criará o Banco de Dados, o Redis, o Servidor e o Cliente.
5. **Ajuste Final (WebSocket):**
   - Após o primeiro deploy do `trinity-server`, copie a URL gerada (ex: `trinity-server.onrender.com`).
   - Vá nas configurações do `trinity-client` no dashboard do Render e atualize a variável `NEXT_PUBLIC_GAME_SERVER_URL` para `wss://trinity-server.onrender.com`.

---

## 🔍 3. TESTES DE PRODUÇÃO

- **Sanity Check:** Acesse `/health` no servidor para verificar se o Colyseus está online.
- **PWA:** No Chrome, clique no ícone de "Instalar" na barra de endereços para testar o modo Offline/Standalone.
- **E2E:** Rode `pnpm test:e2e` para validar o fluxo de match entre dois usuários reais simulados.

---

## 📜 4. LEIS DE ENGENHARIA (Lembrete)
Qualquer alteração deve respeitar os documentos na pasta `/PLANNING`:
- **PL-52-001:** Determinismo Absoluto.
- **EC-002:** Prevenção de Render Thrashing.
- **EC-005:** Limpeza de Memória WebSocket.

---
**Status do Sistema:** PRONTO PARA LANÇAMENTO.
