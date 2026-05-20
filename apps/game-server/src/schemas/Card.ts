import { Schema, type, filter } from "@colyseus/schema";

/**
 * Card schema representing a game card.
 * Client Ignorance Pattern: value is obfuscated via @filter until isRevealed is true.
 */
export class Card extends Schema {
    @type("uint8") id: number = 0;

    // Actual value (1-12). Obfuscated via filter until revealed or owned.
    @filter(function(this: Card, client: any, _value: number) {
        return this.isRevealed || (!!this.ownerId && client.sessionId === this.ownerId);
    })
    @type("uint8") value: number = 0;

    @type("boolean") isRevealed: boolean = false;

    // Location tracking for animations
    @type("string") location: string = "table"; // table, hand, scored

    // Owner session ID (empty if on table)
    @type("string") ownerId: string = "";
}
