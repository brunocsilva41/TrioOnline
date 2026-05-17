import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";
import { Player } from "./Player";
import { Card } from "./Card";

/**
 * PROJECT TRINITY - GameState Schema
 *
 * Complete room state synchronized via Colyseus binary deltas.
 * Supports 2-8 players with adaptive card distribution.
 */
export class GameState extends Schema {
    @type({ map: Player }) players = new MapSchema<Player>();

    // Table cards (face-down cards on the shared table)
    @type([Card]) tableCards = new ArraySchema<Card>();

    // Room status lifecycle: waiting → countdown → dealing → playing → finished
    @type("string") status: string = "waiting";

    @type("string") activePlayerSessionId: string = "";
    @type("uint8") turnOrder: number = 0;

    // Room configuration
    @type("string") roomCode: string = "";
    @type("boolean") isPrivate: boolean = false;
    @type("uint8") maxPlayers: number = 8;
    @type("uint8") minPlayers: number = 2;
    @type("string") hostSessionId: string = "";

    // Game timing (tick-based, Law II compliant)
    @type("uint32") currentTick: number = 0;
    @type("uint32") expirationTick: number = 0;
    @type("uint8") tickRate: number = 20;

    // Match metadata
    @type("uint32") matchSeed: number = 0;
    @type("uint8") round: number = 0;
    @type("uint8") tableCardCount: number = 0;
    @type("uint8") handSize: number = 0;

    // Countdown before game starts (3, 2, 1...)
    @type("uint8") countdown: number = 0;

    // Spectators
    @type("uint16") spectatorCount: number = 0;

    // Rolling event log for reconnection (last 10 events)
    @type(["string"]) actionLogWindow = new ArraySchema<string>();
}
