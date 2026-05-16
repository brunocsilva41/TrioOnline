/**
 * ANTI-CHEAT AGENT: Cheat Heuristics Analyzer
 * Implements behavioral analysis and APM (Actions Per Minute) tracking to detect automated gameplay.
 * Specification: Flag 'FLAG_SUSPICIOUS_BOT' if 3 cards are revealed < 150ms without mouse movement.
 */

export interface ActionLogEvent {
    playerId: string;
    type: 'CARD_REVEAL' | 'MOUSE_MOVE' | 'TRIO_MATCH' | string;
    timestamp: number;
    cardId?: number;
    metadata?: any;
}

export class CheatHeuristics {
    private static readonly HUMAN_REACTION_THRESHOLD_MS = 150;

    /**
     * Analyzes a sequence of events for a match to detect bot-like patterns.
     * @param events List of ActionLogEvent collected during the match.
     * @returns List of security flags.
     */
    static analyze(events: ActionLogEvent[]): string[] {
        const flags: string[] = [];
        const playerEvents = this.groupByPlayer(events);

        for (const [playerId, history] of playerEvents.entries()) {
            const sortedHistory = [...history].sort((a, b) => a.timestamp - b.timestamp);
            
            if (this.detectSuspiciousBotPattern(playerId, sortedHistory)) {
                flags.push(`FLAG_SUSPICIOUS_BOT:${playerId}`);
            }

            const apm = this.calculateAPM(sortedHistory);
            if (apm > 500) { // Extremely high APM for a card game
                flags.push(`FLAG_HIGH_APM:${playerId}:${Math.round(apm)}`);
            }
        }

        return flags;
    }

    /**
     * Calculates Actions Per Minute (APM) for a given player based on their event history.
     * Mouse moves are excluded from the action count to focus on intentional game interactions.
     */
    static calculateAPM(events: ActionLogEvent[]): number {
        if (events.length < 2) return 0;

        const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);
        const firstActionTs = sorted[0].timestamp;
        const lastActionTs = sorted[sorted.length - 1].timestamp;
        const durationMs = lastActionTs - firstActionTs;
        
        if (durationMs === 0) return 0;

        const actions = events.filter(e => e.type !== 'MOUSE_MOVE').length;
        return (actions / durationMs) * 60000;
    }

    /**
     * Groups events by playerId for individual analysis.
     */
    private static groupByPlayer(events: ActionLogEvent[]): Map<string, ActionLogEvent[]> {
        const map = new Map<string, ActionLogEvent[]>();
        for (const event of events) {
            if (!map.has(event.playerId)) {
                map.set(event.playerId, []);
            }
            map.get(event.playerId)!.push(event);
        }
        return map;
    }

    /**
     * Detects if a player has revealed 3 cards in a timeframe impossible for human reading/reaction.
     * Logic: 3 consecutive CARD_REVEAL events with delta < 150ms and NO MOUSE_MOVE between them.
     */
    private static detectSuspiciousBotPattern(playerId: string, history: ActionLogEvent[]): boolean {
        const revealIndices = history
            .map((e, idx) => e.type === 'CARD_REVEAL' ? idx : -1)
            .filter(idx => idx !== -1);

        // We need at least 3 reveals to check the pattern
        if (revealIndices.length < 3) return false;

        for (let r = 0; r <= revealIndices.length - 3; r++) {
            const idx1 = revealIndices[r];
            const idx2 = revealIndices[r + 1];
            const idx3 = revealIndices[r + 2];

            const e1 = history[idx1];
            const e2 = history[idx2];
            const e3 = history[idx3];

            const delta1 = e2.timestamp - e1.timestamp;
            const delta2 = e3.timestamp - e2.timestamp;

            // Check if the intervals between the 3 reveals are below human threshold
            if (delta1 < this.HUMAN_REACTION_THRESHOLD_MS && delta2 < this.HUMAN_REACTION_THRESHOLD_MS) {
                // Verify if there was any mouse movement during this sequence.
                // A human would almost certainly trigger mouse move events to reach different cards.
                const hasMouseMove = history.slice(idx1, idx3 + 1).some(e => e.type === 'MOUSE_MOVE');

                if (!hasMouseMove) {
                    console.warn(`[SECURITY_AGENT] Suspicious Bot behavior detected for player ${playerId}. 3 reveals in < 150ms without mouse movement.`);
                    return true;
                }
            }
        }

        return false;
    }
}
