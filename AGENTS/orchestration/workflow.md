# TRINITY: WORKFLOW DE ORQUESTRAÇÃO MULTI-AGENTE

## 1. OBJETIVO DO WORKFLOW
Definir o rito de passagem para o ciclo de vida do desenvolvimento no Projeto TRINITY, assegurando a mais alta qualidade através de um "pipeline de verificação robótica".

## 2. PIPELINE DE EXECUÇÃO (A ORDEM DE PRODUÇÃO)

O projeto é executado sequencialmente através da cooperação dos agentes. Nenhum agente pula etapas.

### FASE 1: THE FOUNDATION (Alicerces)
1. **Orchestrator Agent** define o Milestone. (Ex: "Implementar Game Loop").
2. **Backend Architect Agent** escreve as interfaces TS e a lógica pura (Schema).
3. **Database Architect Agent** valida se o log pode ser armazenado para replay.
4. **Orchestrator Valida**: Há gargalo de memória? A matemática do turno é estanque? Se OK -> Aprova Fase 1.

### FASE 2: THE NETWORK BRIDGE (A Rede)
1. **Multiplayer Network Agent** conecta a Lógica Pura ao Colyseus. Define pacotes e payloads.
2. **Security Agent** tenta quebrar a documentação da rede, procurando exploits (Payload tampering).
3. **Orchestrator Valida**: Se houver falha de segurança reportada, refatora FASE 2. Se OK -> Aprova.

### FASE 3: THE CLIENT PROJECTION (O Frontend)
1. **Frontend Architect Agent** lê os schemas e define as stores Zustand e os Providers React.
2. **UX Psychology Agent** analisa os tempos propostos para turnos no backend e impõe Delays Artificiais (Tensão) na pipeline de View.
3. **Animation/VFX Agent** define as curvas de Bezier e Spring Stiffness para as views do React.

### FASE 4: THE HARDENING (QA & Battering Ram)
1. **Edge Case Agent** levanta todos os problemas imagináveis na integração Frontend + Backend.
2. **QA Master Agent** escreve a suíte de testes de regressão teórica baseada nos riscos.
3. **Orchestrator Valida Final**: Verifica se há gaps na experiência final versus a documentação.

## 3. ARBITRAGEM DE CONFLITOS (Conflict Resolution)
Se o *Performance Agent* disser que "Animações 3D consomem muita GPU e vão travar em Androids antigos" mas o *UX Agent* exigir 3D para retenção, o **Orchestrator Agent** entra para mediar, usando a regra: "Acessibilidade Performance > Estética Pura". O Veredito será: "Fallback 2D no Canvas para devices low-tier, 3D ativo apenas para High-tier. Re-desenhar spec."

## 4. PROCESSO DE ITERAÇÃO CONTÍNUA
Este fluxo não é uma cachoeira travada, é um pipeline espiral. Enquanto o *Execution Agent* programa a Fase 1, o *Architect Agent* já está definindo a Fase 2. Todo output deve ser salvo em `.md` no respectivo diretório sob `/PLANNING` antes de ser aceito como código rodante.