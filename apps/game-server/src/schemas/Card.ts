import { Schema, type } from "@colyseus/schema";

/**
 * Card schema representing a game card.
 * Implements hidden card obfuscation: value remains 0 until isRevealed is true.
 */
export class Card extends Schema {
    @type("uint8") id: number;
    
    @type("uint8") value: number = 0; // Default 0 for obfuscation (Client Ignorance principle)
    
    @type("boolean") isRevealed: boolean = false;
}
