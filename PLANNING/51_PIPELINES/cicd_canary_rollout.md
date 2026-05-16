---
ID: PL-51-001
OWNER: DevOps Agent
REVIEWERS: Project Orchestrator, SRE Agent
SYSTEMS AFFECTED: K8s Cluster, Next.js Frontend, Colyseus Game Servers
RISK SCORE: 9/10
IMPLEMENTATION COMPLEXITY: High
PRODUCTION PRIORITY: P0 (Blocker for Launch)
FAILURE SEVERITY: Critical (Downtime total)
RECOVERY STRATEGY: Automated ArgoCD Rollback
---

# SYSTEM: TRINITY CI/CD & CANARY ROLLOUT PIPELINE

## 1. OBJETIVO E ESCOPO
Definir o fluxo de CI/CD que permite deploys diários para o Game Server do TRINITY sem derrubar jogadores que estão no meio de uma partida.
**Escopo In-Bounds:** GitHub Actions workflow, Construção de Imagens Docker multi-arch, ArgoCD sync, e o padrão `Graceful Stateful Drain`.
**Escopo Out-Bounds:** Processamento de infraestrutura como código (Terraform) - isso pertence a outro documento.

## 2. ARQUITETURA DO PIPELINE (The Blueprint)

### Fase 1: Continuous Integration (CI)
1. Desenvolvedor abre PR para `main`.
2. GitHub Action `pr-validation.yml` engatilha:
   - `pnpm lint` (Bloqueia se houver warnings).
   - `pnpm tsc --noEmit` (Checagem de tipos estrita).
   - `pnpm test:unit` (Jest, bloqueia se `< 95%` branch coverage na pasta `core-engine`).
   - `pnpm test:e2e` (Playwright Headless, levanta infra efêmera, roda 2 matches completos).
3. Merge em `main` liberado apenas se aprovado por CodeOwner e CI.

### Fase 2: Image Build & Publish
1. Push na `main` dispara `build-and-push.yml`.
2. Cria a imagem Docker baseada no SHA do commit. Taggeada como `trinity-server:sha-1234abc`.
3. Faz push para o ECR (AWS Elastic Container Registry).
4. Altera o repositório GitOps (ArgoCD repo) injetando a nova TAG de imagem no `deployment.yaml`.

### Fase 3: Continuous Deployment (CD - O Padrão Stateful)
O deploy de servidores WebSocket requer um tratamento especial. Não podemos usar `RollingUpdate` padrão do Kubernetes.
1. ArgoCD detecta mudança de Tag.
2. Inicia Deployment Híbrido:
   - Os Pods V1 (Antigos) recebem sinal (Graceful Drain). Eles rejeitam conexões novas, mas continuam processando as salas de WebSocket ativas. O NGINX retira eles do load balancer para tráfego novo.
   - Os Pods V2 (Novos) são levantados. O NGINX Ingress envia todas as *novas* solicitações de Matchmaking para a V2.
3. **Hard Limit:** Após 15 minutos (Duração máxima matemática de uma partida de TRINITY), se o Pod V1 não morreu naturalmente, o K8s dispara `SIGKILL`.

## 3. EDGE CASES DO DEPLOY
- **Edge Case (State Mismatch):** O Frontend do cliente atualizou silenciosamente via Service Worker PWA para a versão V2, mas o usuário reconectou (via rede ruim) e o load balancer o jogou para uma sala rodando no servidor V1. A payload serializada do cliente V2 tenta ler propriedades ausentes no V1.
  - *Mitigação:* Protocol Versioning. Handshake WebSocket exige `client_version`. O servidor V1 rejeita clientes V2 com código 4006. O PWA então força um Hard Reload na tela (`window.location.reload()`) para recomeçar o processo de fila no server correto.

## 4. METRICS & OBSERVABILITY
- **Deployment Duration:** Máximo aceitável de 20 minutos (devido ao Graceful Drain).
- **Error Rate Pós-Deploy:** O Datadog monitora a linha do tempo. Se a taxa de erros HTTP 5xx ou WS 1006 subir 5% acima da baseline nos 10 minutos após os Pods V2 receberem tráfego, o trigger automático de rollback é acionado.

## 5. ROLLBACK STRATEGY (O Botão de Pânico Automático)
1. Datadog detecta a anomalia (Error Rate Spikes ou CPU limit hit).
2. Datadog emite webhook para o ArgoCD.
3. ArgoCD executa `git revert` atômico no repositório de GitOps.
4. K8s aplica a imagem V1 anterior.
5. Os pods V2 (Bugados) entram em graceful termination imediato enviando mensagem WebSocket de broadcast: `CRITICAL_ERROR_MATCH_ABORTED`. As contas dos jogadores naquela sala **NÃO** perdem MMR e ganham reembolso de T-Coins.

## 6. DEFINITION OF DONE (DoD) DO DEPLOY
O Deploy V2 só é considerado completo (Done) quando o contador de Pods V1 chega exatamente a `0` e o cluster volta à estabilidade de healthchecks por 5 minutos contínuos.