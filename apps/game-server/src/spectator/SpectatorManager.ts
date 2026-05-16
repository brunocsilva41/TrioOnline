import { Client } from "colyseus";

/**
 * SpectatorManager handles the lifecycle and validation of spectators in a room.
 * Ensures spectators receive state updates but cannot perform game-altering actions.
 */
export class SpectatorManager {
    private spectators: Set<string> = new Set();

    /**
     * Adds a client as a spectator.
     */
    public addSpectator(client: Client) {
        this.spectators.add(client.sessionId);
    }

    /**
     * Removes a client from the spectator list.
     */
    public removeSpectator(client: Client) {
        this.spectators.delete(client.sessionId);
    }

    /**
     * Checks if a session ID belongs to a spectator.
     */
    public isSpectator(sessionId: string): boolean {
        return this.spectators.has(sessionId);
    }

    /**
     * Returns the number of active spectators.
     */
    public get count(): number {
        return this.spectators.size;
    }

    /**
     * Clears all spectators.
     */
    public clear() {
        this.spectators.clear();
    }
}
