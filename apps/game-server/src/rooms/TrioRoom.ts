import { Room, Client, ServerError } from "colyseus";
import { GameState } from "../schemas/GameState";
import { Player } from "../schemas/Player";
import { BotController } from "../bots/BotController";
import { SpectatorManager } from "../spectator/SpectatorManager";
import { PayloadValidator } from "../security/PayloadValidator";
import { RateLimiter } from "../security/RateLimiter";
import { healthMonitor } from "../systems/HealthMonitor";

/**
 * TrioRoom implements the core game logic and networking lifecycle for Project TRINITY.
 * Adheres to DOC-ID: [09_A_WEBSOCKET_LIFECYCLE] and EC-005 (Memory Leak Prevention).
 */
export class TrioRoom extends Room<GameState> {
    private timers: NodeJS.Timeout[] = [];
    private botController: BotController;
    private spectatorManager: SpectatorManager;

    /**
     * Called when the room is created.
     */
    onCreate(options: any) {
        console.log("TrioRoom created!", options);
        this.setState(new GameState());
        this.botController = new BotController(this);
        this.spectatorManager = new SpectatorManager();

        // Example of a game tick timer. 
        // All timers must be tracked for cleanup in onDispose (EC-005).
        const gameTick = setInterval(() => {
            this.onTick();
        }, 1000);
        this.timers.push(gameTick);

        // Register message handlers
        this.registerMessageHandlers();

        // Initial metrics
        healthMonitor.roomPlayerCount.set({ roomId: this.roomId }, 0);
    }

    /**
     * Authentication logic (DOC-ID: [09_A_WEBSOCKET_LIFECYCLE] 2.1)
     */
    async onAuth(client: Client, options: any) {
        if (!options.token) {
            throw new ServerError(401, "Unauthorized: No token provided");
        }

        try {
            // TODO: Integrate with Auth Gateway / KMS to validate JWT
            const userId = options.token;
            return { userId, isSpectator: options.isSpectator === true };
        } catch (error) {
            throw new ServerError(401, "Unauthorized: Invalid token");
        }
    }

    /**
     * Called when a client successfully joins the room.
     */
    onJoin(client: Client, options: any, auth: any) {
        if (auth.isSpectator) {
            this.spectatorManager.addSpectator(client);
            this.state.spectatorCount = this.spectatorManager.count;
            this.addToActionLog(`Spectator joined.`);
            console.log(`${client.sessionId} joined as spectator.`);
            return;
        }

        const player = new Player();
        player.sessionId = client.sessionId;
        player.userId = auth.userId;
        player.isOnline = true;
        player.isManagedByBot = false;

        this.state.players.set(client.sessionId, player);
        this.addToActionLog(`Player ${player.userId} joined.`);
        
        console.log(`${client.sessionId} joined!`);
    }

    /**
     * Handle player disconnection with Seamless Reconnect (DOC-ID: [09_A_WEBSOCKET_LIFECYCLE] 2.3)
     */
    async onLeave(client: Client, consented: boolean) {
        if (this.spectatorManager.isSpectator(client.sessionId)) {
            this.spectatorManager.removeSpectator(client);
            this.state.spectatorCount = this.spectatorManager.count;
            this.addToActionLog(`Spectator left.`);
            console.log(`${client.sessionId} (spectator) left.`);
            return;
        }

        const player = this.state.players.get(client.sessionId);
        if (!player) return;

        player.isOnline = false;
        this.addToActionLog(`Player ${player.userId} disconnected.`);

        if (consented) {
            console.log(`${client.sessionId} left intentionally. Activating Bot takeover.`);
            player.isManagedByBot = true;
            player.botTier = 1; // Default to Easy for intentional leaves
            return;
        }

        // Wait for reconnection (20 seconds window)
        try {
            console.log(`${client.sessionId} connection lost, waiting 20s for reconnection...`);
            await this.allowReconnection(client, 20);
            
            // Reconnected!
            player.isOnline = true;
            player.isManagedByBot = false;
            this.addToActionLog(`Player ${player.userId} reconnected.`);
            console.log(`${client.sessionId} reconnected!`);
        } catch (e) {
            // Reconnection timed out - Activate Bot Takeover (DOC-18)
            console.log(`${client.sessionId} reconnection timed out. Bot taking over.`);
            player.isManagedByBot = true;
            player.botTier = 2; // Default to Medium for accidental disconnects
            this.addToActionLog(`Bot took over for ${player.userId}.`);
        }
    }

    /**
     * Authoritative reveal handler used by both players and bots.
     */
    public handleReveal(sessionId: string, cardId: number) {
        if (this.spectatorManager.isSpectator(sessionId)) {
            console.warn(`Spectator ${sessionId} tried to REVEAL. Action blocked.`);
            return;
        }

        const player = this.state.players.get(sessionId);
        if (!player) return;

        // Validation logic here (Risk 2 from DOC-08)
        const card = this.state.cards.find(c => c.id === cardId);
        if (!card || card.isRevealed) return;

        // Update state
        card.isRevealed = true;
        // In a real game, card.value would be set here from a hidden deck
        
        // Notify BotController of the revelation for memory updates
        this.botController.onCardRevealed(cardId, card.value);

        this.addToActionLog(`Player ${player.userId} revealed card ${cardId}.`);
        
        // Check for turn progression logic...
    }

    /**
     * Clean up resources to prevent memory leaks (EC-005)
     */
    onDispose() {
        console.log("Room", this.roomId, "disposing...");
        this.timers.forEach(clearInterval);
        this.timers = [];
        this.state.players.clear();
        this.spectatorManager.clear();
        
        // @ts-ignore
        this.state.actionLogWindow = null;
        // @ts-ignore
        this.state.cards = null;
        // @ts-ignore
        this.botController = null;
        // @ts-ignore
        this.spectatorManager = null;
    }

    private registerMessageHandlers() {
        this.onMessage("REVEAL", (client, message) => {
            this.handleReveal(client.sessionId, message.cardId);
        });

        this.onMessage("ROOM_CHAT", (client, message: { text: string }) => {
            if (!message.text || message.text.length > 150) return;
            
            const player = this.state.players.get(client.sessionId);
            if (!player) return;

            this.broadcast("ROOM_CHAT", {
                senderId: player.userId,
                username: player.userId, // Ideally use a username field
                text: message.text,
                timestamp: Date.now()
            });
        });
    }

    private onTick() {
        // If it's a bot's turn, trigger bot logic
        const activePlayer = this.state.players.get(this.state.activePlayerSessionId);
        if (activePlayer && activePlayer.isManagedByBot) {
            // We only trigger if it's not already thinking (this should be handled by FSM or BotController internal state)
            this.botController.processTurn(this.state.activePlayerSessionId);
        }
    }

    private addToActionLog(message: string) {
        this.state.actionLogWindow.push(message);
        if (this.state.actionLogWindow.length > 10) {
            this.state.actionLogWindow.shift();
        }
    }
}
