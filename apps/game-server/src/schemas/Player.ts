import { Schema, type, ArraySchema } from "@colyseus/schema";

/**
 * Trio schema representing a set of three cards of the same value collected by a player.
 */
export class Trio extends Schema {
    @type("uint8") value: number;
}

/**
 * Player schema representing a participant in the game.
 */
export class Player extends Schema {
    @type("string") sessionId: string;
    @type("string") userId: string;
    @type("boolean") isOnline: boolean = true;
    @type("boolean") isManagedByBot: boolean = false;
    @type("uint8") botTier: number = 0; // 0: Human, 1: Easy, 2: Medium, 3: Hard
    
    @type([ Trio ]) trios = new ArraySchema<Trio>();
}
