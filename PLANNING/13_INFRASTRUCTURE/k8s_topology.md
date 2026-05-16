# DOC-ID: [13_A_K8S_TOPOLOGY]
# SYSTEM: TRINITY INFRASTRUCTURE
## 1. OBJETIVO E ESCOPO
Definir a topologia de orquestração de containers via Kubernetes (K8s) para suportar até 500k CCU (Concurrent Users). O desafio aqui não é apenas volume de requisições REST (stateless), mas a manutenção de centenas de milhares de conexões WebSocket abertas simultaneamente (Stateful).

## 2. ARQUITETURA E FLUXOS
### 2.1 Separação de Cargas de Trabalho (Workloads)
A infraestrutura K8s é dividida em 3 namespaces distintos para isolamento de CPU/Memória:
- **`ns-game-servers`**: Contém os Pods Node.js executando o Colyseus. Estes pods são *stateful* e memória-intensivos. Eles NUNCA devem ser escalados verticalmente ao extremo, mas sim horizontalmente (sharding de salas). Um pod morre? Apenas as 500 pessoas nele caem (e reconectam a outro), não o cluster todo.
- **`ns-api-gateway`**: Pods NestJS/Express para requisições stateless (Login, Loja, Histórico de Partida, Ranking). Escalonam rapidamente baseados em tráfego HTTP bruto (HPA clássico).
- **`ns-matchmaker-workers`**: Cron jobs e workers Node.js puros que processam a fila de pareamento armazenada no Redis, sem expor portas HTTP/WS.

### 2.2 Estratégia de Ingress e Load Balancing
Como WebSockets exigem TCP/IP contínuo:
- Usaremos **NGINX Ingress Controller** configurado especificamente para WebSockets:
  - `nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"`
  - `nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"`
- **Sticky Sessions (Sessões Presas):** Obrigatórias. Uma vez que o Cliente se conecta à Sala #XYZ rodando no Pod-A, todas as suas requisições de reconnect devem ser roteadas para o Pod-A. Usaremos Redis Pub/Sub e um roteador customizado (Dynamic Proxy) ou o serviço nativo do Colyseus Discovery.

## 3. DEPENDÊNCIAS
- **Redis Cluster:** Usado extensivamente para Pub/Sub entre Pods e como source of truth para o Matchmaker (Listas ordenadas de MMR).
- **PostgreSQL (Gerenciado/RDS):** Banco primário, fora do K8s, para máxima segurança e resiliência de I/O de disco.

## 4. RISCOS E EDGE CASES
- **Risco 1 (O "Thundering Herd" da Reconexão):** O servidor Redis tem uma oscilação de 2 segundos. Os game-servers desconectam 50 mil usuários. Todos tentam reconectar ao mesmo milissegundo, causando um ataque DDoS auto-infligido e derrubando os NGINX Ingress.
  - *Solução:* O Cliente (Frontend) possui Jitter no algoritmo de reconexão: `reconnect_delay = base_delay (1s) + Math.random() * 2000ms`. Isso espalha a onda de impacto (thundering herd) ao longo de 3 segundos, permitindo que o Ingress respire.
- **Risco 2 (Scaling Down Inseguro):** O HPA (Horizontal Pod Autoscaler) detecta baixa CPU às 3 da manhã e decide desligar pods de `game-servers` que ainda possuem partidas rolando.
  - *Solução:* **Graceful Termination**. O Pod não morre instantaneamente por `SIGTERM`. Ele usa o lifecycle hook `preStop`. O script intercepta a ordem de desligamento, notifica o Matchmaker para NÃO enviar novas salas para este Pod, e avisa o K8s: "Aguarde, ainda tenho 4 salas rodando, demorará no máximo 15 minutos (duração max de uma partida)".

## 5. IMPACTOS
Arquitetura mal desenhada para stateful websockets causa "Connection Resets" constantes na ponta do usuário (sintoma de pod restarting via OOM Killer). Monitorar o `Memory Working Set` de cada Pod é crítico.