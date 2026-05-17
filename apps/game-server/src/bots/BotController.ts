import { Player } from "../schemas/Player";
import { GameState } from "../schemas/GameState";

/**
 * Memory Entry for the Bot AI.
 * Stores what the bot has seen or deduced.
 */
interface MemoryEntry {
    cardId: number;
    value: number;
    lastSeen: number;
}

/**
 * BotController manages AI logic for all bots in a room.
 * Implements 'Memory Matrix' and 'Humanization' as per DOC-18.
 */
export class BotController {
    // SessionId -> Memory Entries
    private memories: Map<string, MemoryEntry[]> = new Map();
    
    // Tracking attempts to avoid infinite loops (Risk 1)
    private actionAttempts: Map<string, number> = new Map();

    constructor(private room: any) {}

    /**
     * Called by the room when a card is revealed to update all bots' memories.
     */
    public onCardRevealed(cardId: number, value: number) {
        this.room.state.players.forEach((player: Player, sessionId: string) => {
            if (player.isManagedByBot) {
                this.updateBotMemory(sessionId, cardId, value);
            }
        });
    }

    /**
     * Updates a specific bot's memory with new card info.
     */
    private updateBotMemory(sessionId: string, cardId: number, value: number) {
        if (!this.memories.has(sessionId)) {
            this.memories.set(sessionId, []);
        }
        
        const memory = this.memories.get(sessionId)!;
        
        // If we already know this card, update it
        const existing = memory.find(m => m.cardId === cardId);
        if (existing) {
            existing.value = value;
            existing.lastSeen = Date.now();
        } else {
            memory.push({ cardId, value, lastSeen: Date.now() });
        }
    }

    /**
     * Main entry point for bot turn processing.
     * Triggered by TrioRoom when it's a bot's turn.
     */
    public async processTurn(sessionId: string) {
        const player = this.room.state.players.get(sessionId);
        if (!player) return;

        // Reset attempts for this turn
        this.actionAttempts.set(sessionId, 0);

        // 1. Apply Memory Degradation (The Memory Matrix)
        this.applyDegradation(sessionId, player.botTier);

        // 2. Humanization: Initial hesitation (The Hesitation Math)
        await this.hesitate(player.botTier, "initial");

        // 3. Decide and execute action
        await this.decideAndAct(sessionId, player);
    }

    /**
     * Applies degradation to the bot's memory based on its Tier.
     */
    private applyDegradation(sessionId: string, tier: number) {
        const memory = this.memories.get(sessionId);
        if (!memory || tier === 3) return; // Tier 3 (Elite) has 100% precision

        if (tier === 1) { // Easy: 40% chance to forget each card
            this.memories.set(sessionId, memory.filter(() => Math.random() > 0.40));
        } else if (tier === 2) { // Medium: 10% chance to forget
            this.memories.set(sessionId, memory.filter(() => Math.random() > 0.10));
        }
    }

    /**
     * Artificial delay to simulate human thinking.
     */
    private async hesitate(tier: number, phase: "initial" | "reaction" | "combo") {
        let baseDelay = 1000;
        let jitter = 1500;

        if (phase === "combo") {
            // Faster 3rd reveal (Demonstrating excitement/certainty)
            baseDelay = 400;
            jitter = 500;
        } else if (phase === "initial") {
            // First play of the turn takes longer
            baseDelay = 1500;
            jitter = 2000;
            
            // Chance to send "Thinking" emote for humanization
            if (Math.random() < 0.3) {
                this.room.broadcast("EMOTE", { sessionId: this.getCurrentBotId(), type: "THINKING" });
            }
        }

        const delay = baseDelay + (Math.random() * jitter);
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    /**
     * Logic to decide which card to reveal.
     */
    private async decideAndAct(sessionId: string, player: Player) {
        const attempts = this.actionAttempts.get(sessionId) || 0;
        if (attempts >= 3) {
            console.warn(`Bot ${sessionId} reached max attempts. Forcing random action.`);
            this.forceRandomAction(sessionId);
            return;
        }
        this.actionAttempts.set(sessionId, attempts + 1);

        // Current game state from room
        const state = this.room.state as GameState;
        const revealedCards = state.tableCards.filter((c: any) => c.isRevealed);
        
        // Strategy: 
        // 1. If we have 1 or 2 cards revealed this turn, try to find a match in memory.
        // 2. If it's the 1st card, try to pick one from memory that we know has a pair.
        // 3. Otherwise, pick a logical random card.

        let targetCardId = -1;

        if (revealedCards.length > 0) {
            // We are in REVEAL_1 or REVEAL_2 state
            const currentTurnValues = revealedCards.map((c: any) => c.value);
            const targetValue = currentTurnValues[0];

            // Do we know where another card of this value is?
            const memory = this.memories.get(sessionId) || [];
            const match = memory.find(m => m.value === targetValue && !state.tableCards.toArray().find((c: any) => c.id === m.cardId)?.isRevealed);
            
            if (match) {
                targetCardId = match.cardId;
                // Humanization for 3rd card in a Trio
                if (revealedCards.length === 2) {
                    await this.hesitate(player.botTier, "combo");
                }
            }
        }

        if (targetCardId === -1) {
            targetCardId = this.pickLogicalRandomCard(sessionId, state);
        }

        if (targetCardId !== -1) {
            await this.executeReveal(sessionId, targetCardId);
        } else {
            this.forceRandomAction(sessionId);
        }
    }

    private pickLogicalRandomCard(sessionId: string, state: GameState): number {
        const unrevealed = state.tableCards.filter((c: any) => !c.isRevealed);
        if (unrevealed.length === 0) return -1;
        
        // Bots prefer table cards for the first move (usually cards with no owner in Schema)
        // Since I don't have owner yet, I'll just pick a random unrevealed one.
        const randomIndex = Math.floor(Math.random() * unrevealed.length);
        return unrevealed[randomIndex].id;
    }

    private async executeReveal(sessionId: string, cardId: number) {
        // Humanization before final "click"
        await this.hesitate(0, "reaction");
        
        // Execute reveal logic in the room
        // Assuming the room has a handleReveal method that handles both bot and player actions
        if (typeof this.room.handleReveal === "function") {
            this.room.handleReveal(sessionId, cardId);
        } else {
            console.error("Room does not implement handleReveal(sessionId, cardId)");
        }
    }

    private forceRandomAction(sessionId: string) {
        const state = this.room.state as GameState;
        const unrevealed = state.tableCards.filter((c: any) => !c.isRevealed);
        if (unrevealed.length > 0) {
            const card = unrevealed[Math.floor(Math.random() * unrevealed.length)];
            if (typeof this.room.handleReveal === "function") {
                this.room.handleReveal(sessionId, card.id);
            }
        }
    }

    private getCurrentBotId(): string {
        // Helper to get the sessionId of the bot currently processing
        return this.room.state.activePlayerSessionId;
    }
}
