import { Schema, type, ArraySchema } from "@colyseus/schema";
import { Card } from "./Card";

/**
 * Trio schema - a set of three cards of the same value collected by a player.
 */
export class Trio extends Schema {
    @type("uint8") value: number = 0;
}

/**
 * Player schema - represents a participant in the game room.
 * Supports lobby presence, ready state, host authority, and in-game hand.
 */
export class Player extends Schema {
    @type("string") sessionId: string = "";
    @type("string") userId: string = "";
    @type("string") displayName: string = "";
    @type("string") avatarUrl: string = "";

    // Connection state
    @type("boolean") isOnline: boolean = true;
    @type("boolean") isAfk: boolean = false;
    @type("uint32") lastActivityTick: number = 0;

    // Room role
    @type("boolean") isHost: boolean = false;
    @type("boolean") isReady: boolean = false;
    @type("boolean") isManagedByBot: boolean = false;
    @type("uint8") botTier: number = 0; // 0: Human, 1: Easy, 2: Medium, 3: Hard

    // Seating & presence
    @type("uint8") seatingPosition: number = 0;
    @type("string") emotionState: string = "idle"; // idle, thinking, reacting, celebrating, afk

    // Player's hand (only visible to the owning client via filtered state)
    @type([Card]) hand = new ArraySchema<Card>();
    @type("uint8") handCount: number = 0; // Visible to all (card count only)

    // Scoring
    @type([Trio]) trios = new ArraySchema<Trio>();
    @type("uint8") score: number = 0;

    // Emote system
    @type("string") lastEmote: string = "";
    @type("uint32") lastEmoteTick: number = 0;
}
