import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";
import { Player } from "./Player";
import { Card } from "./Card";

/**
 * GameState schema representing the entire state of a game room.
 */
export class GameState extends Schema {
    @type({ map: Player }) players = new MapSchema<Player>();
    
    @type([ Card ]) cards = new ArraySchema<Card>();
    
    @type("string") status: string = "waiting"; // waiting, playing, finished
    
    @type("string") activePlayerSessionId: string;

    @type("uint16") spectatorCount: number = 0;

    /**
     * Rolling queue of the last 10 critical room events for seamless reconnection.
     * (As defined in DOC-ID: [09_A_WEBSOCKET_LIFECYCLE])
     */
    @type([ "string" ]) actionLogWindow = new ArraySchema<string>();
}
