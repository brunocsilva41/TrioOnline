# DOC-ID: [09_A_WEBSOCKET_LIFECYCLE]
# SYSTEM: TRINITY NETWORKING
## 1. OBJETIVO E ESCOPO
Define o ciclo de vida rigoroso da conexão WebSocket via Colyseus. 
**Escopo:** Autenticação de handshake, pareamento sala/cliente, manutenção de conexão (ping/pong), detecção de dead connections e o fluxo massivamente importante de Reconexão Seamless.

## 2. ARQUITETURA E FLUXOS DE ESTADO
O protocolo roda sob WSS (Secure WebSocket).

### 2.1. Autenticação (Handshake)
1. O Cliente obtém um JWT do Auth Gateway via requisição REST padrão HTTPS.
2. O Cliente invoca `client.joinOrCreate("trio_ranked", { token: "ey..." })`.
3. O Node.js invoca a rotina `onAuth(client, options)`.
4. O servidor valida o JWT assinando com a Chave Pública KMS.
5. Se válido, injeta `user_id` na sessão da sala. Se inválido, lança erro de `401 Unauthorized` e derruba o socket no layer TCP antes de instanciar a lógica da sala.

### 2.2. Ping/Pong (Heartbeat)
Para evitar que túneis ociosos sejam mortos pelos Load Balancers (ex: AWS ALB com idle timeout de 60s), o servidor pinga o cliente a cada `15000ms`. Se dois pings não retornarem pong, o Colyseus dispara `onLeave(client, consented: false)`.

### 2.3. The Seamless Reconnect Flow (O Coração da Retenção)
A experiência Mobile AAA exige reconexão impecável devido a quedas 4G para 3G.
1. O cliente perde sinal. WebSocket dispara `close` event no browser/PWA.
2. O Colyseus Backend **congela** a remoção do jogador da lógica e entra na janela de `allowReconnection(client, 20)` (20 segundos de espera).
3. O Estado propaga um delta: `player.isOnline = false`.
4. O Frontend dos oponentes reage a isso aplicando um filtro `grayscale(100%)` na foto do jogador caído e exibindo o ícone 📶 cortado.
5. O Cliente caído recupera o sinal. O código front-end (Zustand effect) aciona `client.reconnect(roomId, sessionId)`.
6. **O Ponto Crítico:** O servidor injeta o snapshot completo do schema atual no cliente de uma vez. O Zustand atualiza tudo: cartas viradas, posições e timers.
7. `player.isOnline = true`. A partida segue.

## 3. RISCOS E EDGE CASES
- **Risco 1 (Reconnection Abuse):** Jogador tenta abrir o jogo em duas abas do navegador ao mesmo tempo.
  - *Solução:* O backend em `onAuth` verifica o cluster Redis se `active_sessions:user_id` existe. Se sim, ele envia uma payload especial de Kick na sessão antiga (`force_disconnect_duplicate`) antes de autorizar o handshake novo.
- **Risco 2 (Buffer Overflow):** Se o cliente está lagado (ping 800ms) e empilha várias ações, a rede pode mandar tudo num único burst frame.
  - *Solução:* Limitador de Taxa de Frames (Rate Limiting). O receptor do Colyseus aceitará no máximo 5 ações do tipo `REVEAL` num espaço de 2 segundos do mesmo Socket ID. O excedente é punido com drop log.
- **Risco 3 (Desync Pós Reconexão):** O jogador reconectou, mas perdeu o evento de "Trio Explosão" que aconteceu enquanto estava offline.
  - *Solução:* O servidor mantém uma fila rodante dos últimos 10 eventos críticos da sala (`ActionLogWindow`). Ao reconectar, o cliente recebe esse histórico e se o estado de suas mãos estiver diferente, ele roda uma animação de *Fast Forward* para sincronizar visualmente a tela em vez de um salto brusco.

## 4. ESTRUTURA DO PAYLOAD (Binary)
Usamos Colyseus Schema. **Proibido JSON bruto no payload do state.**
```typescript
import { Schema, type, MapSchema } from "@colyseus/schema";

export class CardSchema extends Schema {
  @type("uint8") id: number; // 0 a 35 (Index físico)
  @type("uint8") value: number; // 1 a 12. 0 se oculto.
  @type("boolean") isRevealed: boolean;
}
```
*Tamanho estimado:* < 3 Bytes por modificação de carta. Latência reduzida em redes celulares 3G.

## 5. PLANO DE TESTES E VALIDAÇÃO
- **Simulação de Caos:** Usar ferramenta `Toxiproxy` para simular 20% de perda de pacotes e jitter de 300ms a 800ms durante testes End-to-End no CI/CD. O teste só passa se a reconexão automática restaurar o estado da tela idêntico a um snapshot limpo em menos de 3000ms após a rede estabilizar.