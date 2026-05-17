import { Schema, type } from "@colyseus/schema";

/**
 * Card schema representing a game card.
 * Client Ignorance Pattern: value is 0 until isRevealed is true (server-authoritative).
 */
export class Card extends Schema {
    @type("uint8") id: number = 0;

    // Actual value (1-12). Obfuscated as 0 in client until revealed.
    @type("uint8") value: number = 0;

    @type("boolean") isRevealed: boolean = false;

    // Location tracking for animations
    @type("string") location: string = "table"; // table, hand, scored

    // Owner session ID (empty if on table)
    @type("string") ownerId: string = "";
}
