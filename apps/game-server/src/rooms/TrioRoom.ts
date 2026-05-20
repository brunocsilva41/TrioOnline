import { Room, Client } from "colyseus";
import { GameState } from "../schemas/GameState";
import { Player } from "../schemas/Player";
import { Card } from "../schemas/Card";
import { Trio } from "../schemas/Player";
import { DeckManager } from "@trinity/core-engine";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * PROJECT TRINITY - TrioRoom (Official TRIO Rules)
 *
 * Turn actions:
 *   1) ASK_PLAYER_CARD — ask ANY player (including yourself) for lowest/highest
 *   2) REVEAL_TABLE_CARD — flip a face-down table card
 *
 * Matching:
 *   - First reveal sets target value
 *   - Subsequent reveals must match; mismatch → all cards flip back, turn ends
 *   - 3 matches = TRIO collected
 *
 * Win: 3 trios, or all three 7s (instant win)
 * Turn timer: 2 minutes
 */
export class TrioRoom extends Room<GameState> {
    private commandQueue: Array<{ sessionId: string; type: string; payload: any }> = [];
    private isProcessing = false;
    private turnOrderList: string[] = [];
    private reconnectTimeout = 30000;
    private tableCardTrueValues: number[] = [];
    private gameStartTime: number = 0;

    // Turn state
    private turnRevealedCards: Array<{
        cardId: number;
        value: number;
        source: "table" | "hand";
        ownerSessionId: string; // for hand cards: who owns it; for table: ""
        tableIndex: number;     // for table cards: index; for hand: -1
    }> = [];
    private turnMatchValue: number | null = null;
    private turnLocked = false; // prevent actions during mismatch animation

    private static TURN_TICKS = 2400; // 2 min @ 20Hz
    private static TRIOS_TO_WIN = 3;

    onCreate(options: any) {
        this.setState(new GameState());
        const maxPlayers = Math.min(8, Math.max(2, options.maxPlayers || 8));
        this.state.maxPlayers = maxPlayers;
        this.state.minPlayers = options.minPlayers || 2;
        // Increase maxClients to allow spectators beyond players
        this.maxClients = 25; 

        // Every room gets a code (for sharing). Private rooms are hidden from listing.
        this.state.roomCode = this.generateRoomCode();
        this.state.isPrivate = !!options.isPrivate;
        this.setPrivate(this.state.isPrivate);

        this.setMetadata({
            roomCode: this.state.roomCode, isPrivate: this.state.isPrivate,
            maxPlayers: this.state.maxPlayers, playerCount: 0,
            status: "waiting", hostName: options.hostName || "Unknown"
        });

        this.registerMessages();
        this.startTickLoop();
    }

    private registerMessages() {
        this.onMessage("TOGGLE_READY", (c) => this.enqueue(c.sessionId, "TOGGLE_READY", {}));
        this.onMessage("START_GAME", (c) => this.enqueue(c.sessionId, "START_GAME", {}));
        this.onMessage("KICK_PLAYER", (c, p) => this.enqueue(c.sessionId, "KICK_PLAYER", p));
        this.onMessage("UPDATE_SETTINGS", (c, s) => this.enqueue(c.sessionId, "UPDATE_SETTINGS", s));
        this.onMessage("EMOTE", (c, p: { emote: string }) => {
            const pl = this.state.players.get(c.sessionId);
            if (pl) { 
                pl.lastEmote = p.emote; 
                pl.lastEmoteTick = this.state.currentTick; 
                this.broadcast("PLAYER_EMOTE", { sessionId: c.sessionId, emote: p.emote });
            }
        });
        this.onMessage("NUDGE", (c, p: { targetSessionId: string }) => {
            this.broadcast("PLAYER_NUDGED", { from: c.sessionId, to: p.targetSessionId });
        });

        // Game actions
        this.onMessage("REVEAL_TABLE_CARD", (c, p) => this.enqueue(c.sessionId, "REVEAL_TABLE_CARD", p));
        this.onMessage("ASK_PLAYER_CARD", (c, p) => this.enqueue(c.sessionId, "ASK_PLAYER_CARD", p));
        this.onMessage("REVEAL_OWN_CARD", (c, p) => this.enqueue(c.sessionId, "REVEAL_OWN_CARD", p));

        // Host closes the room
        this.onMessage("CLOSE_ROOM", (c) => {
            const p = this.state.players.get(c.sessionId);
            if (!p || !p.isHost) return;
            this.state.status = "finished";
            this.log("ROOM_CLOSED");
            this.broadcast("ROOM_CLOSED", {});
            this.clock.setTimeout(() => this.disconnect(), 2000);
        });
    }

    // === FIFO Queue (Law V) ===
    private enqueue(sid: string, type: string, payload: any) {
        this.commandQueue.push({ sessionId: sid, type, payload });
        this.processNext();
    }
    private processNext() {
        if (this.isProcessing || this.commandQueue.length === 0) return;
        this.isProcessing = true;
        const cmd = this.commandQueue.shift()!;
        try {
            switch (cmd.type) {
                case "TOGGLE_READY": this.lobbyToggleReady(cmd.sessionId); break;
                case "START_GAME": this.lobbyStartGame(cmd.sessionId); break;
                case "KICK_PLAYER": this.lobbyKickPlayer(cmd.sessionId, cmd.payload); break;
                case "UPDATE_SETTINGS": this.lobbyUpdateSettings(cmd.sessionId, cmd.payload); break;
                case "REVEAL_TABLE_CARD": this.gameRevealTableCard(cmd.sessionId, cmd.payload); break;
                case "ASK_PLAYER_CARD": this.gameAskPlayerCard(cmd.sessionId, cmd.payload); break;
                case "REVEAL_OWN_CARD": this.gameRevealOwnCard(cmd.sessionId, cmd.payload); break;
            }
        } catch (e) { console.error("[TrioRoom] Error:", e); }
        this.isProcessing = false;
        this.processNext();
    }

    // ────────────────────────────────────────────
    // LOBBY
    // ────────────────────────────────────────────

    private lobbyToggleReady(sid: string) {
        const p = this.state.players.get(sid);
        if (!p || this.state.status !== "waiting" || p.isHost) return;
        p.isReady = !p.isReady;
        this.log(`PLAYER_READY:${sid}:${p.isReady}`);
    }

    private lobbyStartGame(sid: string) {
        const p = this.state.players.get(sid);
        if (!p || !p.isHost || this.state.status !== "waiting") return;
        const all = Array.from(this.state.players.values());
        if (all.length < this.state.minPlayers || !all.every(x => x.isHost || x.isReady)) {
            this.clients.find(c => c.sessionId === sid)?.send("ERROR", {
                code: "CANNOT_START", message: "Todos precisam estar prontos. Mínimo 2 jogadores."
            });
            return;
        }
        this.startCountdown();
    }

    private lobbyKickPlayer(sid: string, payload: { targetSessionId: string }) {
        const host = this.state.players.get(sid);
        if (!host || !host.isHost || this.state.status !== "waiting") return;
        if (payload.targetSessionId === sid) return;
        const tc = this.clients.find(c => c.sessionId === payload.targetSessionId);
        if (tc) { tc.send("KICKED", {}); tc.leave(4000); }
    }

    private lobbyUpdateSettings(sid: string, s: any) {
        const p = this.state.players.get(sid);
        if (!p || !p.isHost || this.state.status !== "waiting") return;
        if (s.maxPlayers !== undefined) {
            const n = Math.min(8, Math.max(2, s.maxPlayers));
            if (n >= this.state.players.size) { this.state.maxPlayers = n; this.maxClients = n; }
        }
    }

    // ────────────────────────────────────────────
    // GAME START
    // ────────────────────────────────────────────

    private startCountdown() {
        this.state.status = "countdown";
        this.state.countdown = 3;
        // Do NOT lock the room to allow observers to join ongoing matches
        let c = 3;
        const iv = this.clock.setInterval(() => {
            c--; this.state.countdown = c;
            if (c <= 0) { iv.clear(); this.dealCards(); }
        }, 1000);
    }

    private dealCards() {
        this.state.status = "dealing";
        const n = this.state.players.size;
        this.state.matchSeed = Math.floor(Math.random() * 2147483646) + 1;
        const deck = DeckManager.generateDeck();
        const shuffled = DeckManager.shuffle(deck, this.state.matchSeed);
        if (!DeckManager.validate(shuffled)) { this.state.status = "waiting"; this.unlock(); return; }

        const dist = DeckManager.distribute(n, shuffled);
        this.state.handSize = dist.hands[0].length;
        this.state.tableCardCount = dist.table.length;
        this.tableCardTrueValues = [...dist.table];

        const entries = Array.from(this.state.players.entries());
        this.turnOrderList = entries.map(([s]) => s);

        let cid = 0;
        for (let i = 0; i < entries.length; i++) {
            const [sid, player] = entries[i];
            player.hand.clear();
            player.handCount = dist.hands[i].length;
            for (let ci = 0; ci < dist.hands[i].length; ci++) {
                const card = new Card();
                card.id = cid++;
                card.value = dist.hands[i][ci];
                card.isRevealed = false;
                card.location = "hand";
                card.ownerId = sid;
                player.hand.push(card);
            }
        }

        this.state.tableCards.clear();
        for (let i = 0; i < dist.table.length; i++) {
            const card = new Card();
            card.id = 200 + i;
            card.value = 0;
            card.isRevealed = false;
            card.location = "table";
            card.ownerId = "";
            this.state.tableCards.push(card);
        }

        this.clock.setTimeout(() => this.beginPlaying(), 4000);
    }

    private beginPlaying() {
        this.gameStartTime = Date.now();
        this.state.status = "playing";
        this.state.round = 1;
        const idx = Math.floor(Math.random() * this.turnOrderList.length);
        this.state.turnOrder = idx;
        this.state.activePlayerSessionId = this.turnOrderList[idx];
        this.state.expirationTick = this.state.currentTick + TrioRoom.TURN_TICKS;
        this.turnRevealedCards = [];
        this.turnMatchValue = null;
        this.turnLocked = false;
        this.log(`TURN_START:${this.state.activePlayerSessionId}`);
    }

    // ────────────────────────────────────────────
    // GAME ACTIONS
    // ────────────────────────────────────────────

    private gameRevealTableCard(sid: string, payload: { cardIndex: number }) {
        if (this.state.status !== "playing" || this.state.activePlayerSessionId !== sid || this.turnLocked) return;
        const idx = payload.cardIndex;
        if (idx < 0 || idx >= this.state.tableCards.length) return;
        const card = this.state.tableCards.at(idx);
        if (!card || card.isRevealed || card.location === "scored") return;

        card.value = this.tableCardTrueValues[idx];
        card.isRevealed = true;
        this.log(`TABLE_REVEAL:${sid}:${idx}:${card.value}`);
        this.processReveal(sid, card.id, card.value, "table", "", idx);
    }

    private gameAskPlayerCard(sid: string, payload: { targetSessionId: string; position: "lowest" | "highest" }) {
        if (this.state.status !== "playing" || this.state.activePlayerSessionId !== sid || this.turnLocked) return;
        const target = this.state.players.get(payload.targetSessionId);
        if (!target || target.hand.length === 0) return;

        // Find the lowest or highest non-revealed card
        let cardIdx = -1;
        const handArr = target.hand.toArray();
        if (payload.position === "lowest") {
            for (let i = 0; i < handArr.length; i++) {
                if (!handArr[i].isRevealed) { cardIdx = i; break; }
            }
        } else {
            for (let i = handArr.length - 1; i >= 0; i--) {
                if (!handArr[i].isRevealed) { cardIdx = i; break; }
            }
        }
        if (cardIdx === -1) return;

        const card = target.hand.at(cardIdx)!;
        card.isRevealed = true;
        this.log(`HAND_REVEAL:${sid}:${payload.targetSessionId}:${payload.position}:${card.value}`);
        this.processReveal(sid, card.id, card.value, "hand", payload.targetSessionId, -1);
    }

    private gameRevealOwnCard(sid: string, payload: { position: "lowest" | "highest" }) {
        if (this.state.status !== "playing" || this.state.activePlayerSessionId !== sid || this.turnLocked) return;
        const player = this.state.players.get(sid);
        if (!player || player.hand.length === 0) return;

        // Find own lowest or highest non-revealed card
        let cardIdx = -1;
        const handArr = player.hand.toArray();
        if (payload.position === "lowest") {
            for (let i = 0; i < handArr.length; i++) {
                if (!handArr[i].isRevealed) { cardIdx = i; break; }
            }
        } else {
            for (let i = handArr.length - 1; i >= 0; i--) {
                if (!handArr[i].isRevealed) { cardIdx = i; break; }
            }
        }
        if (cardIdx === -1) return;

        const card = player.hand.at(cardIdx)!;
        card.isRevealed = true;
        this.log(`OWN_REVEAL:${sid}:${payload.position}:${card.value}`);
        this.processReveal(sid, card.id, card.value, "hand", sid, -1);
    }

    // ────────────────────────────────────────────
    // CORE MATCHING LOGIC
    // ────────────────────────────────────────────

    /**
     * Get the active player's lowest and highest unrevealed card values.
     * Returns null if no unrevealed cards.
     */
    private getPlayerPontas(sid: string): { lowestValue: number; lowestId: number; highestValue: number; highestId: number } | null {
        const player = this.state.players.get(sid);
        if (!player || player.hand.length === 0) return null;
        const arr = player.hand.toArray();
        let lowestIdx = -1;
        let highestIdx = -1;
        for (let i = 0; i < arr.length; i++) {
            if (!arr[i].isRevealed) { if (lowestIdx === -1) lowestIdx = i; highestIdx = i; }
        }
        if (lowestIdx === -1) return null;
        return {
            lowestValue: arr[lowestIdx].value,
            lowestId: arr[lowestIdx].id,
            highestValue: arr[highestIdx].value,
            highestId: arr[highestIdx].id,
        };
    }

    /**
     * Auto-reveal the player's own ponta card if it matches.
     * Recursively calls itself if another match is found, to automatically pull multiple cards if available.
     */
    private tryAutoTrio(activeSid: string) {
        const matching = this.turnRevealedCards.filter(c => c.value === this.turnMatchValue);
        if (matching.length >= 3) return; // Already trio

        const pontas = this.getPlayerPontas(activeSid);
        if (!pontas) return;

        // Check if lowest or highest matches
        let autoCardId = -1;
        let autoPosition = "";
        if (pontas.lowestValue === this.turnMatchValue) {
            autoCardId = pontas.lowestId;
            autoPosition = "lowest";
        } else if (pontas.highestValue === this.turnMatchValue) {
            autoCardId = pontas.highestId;
            autoPosition = "highest";
        }

        if (autoCardId === -1) return; // Player doesn't have matching ponta

        // Auto-reveal the player's card
        const player = this.state.players.get(activeSid);
        if (!player) return;
        const arr = player.hand.toArray();
        const card = arr.find((c: Card) => c.id === autoCardId);
        if (!card || card.isRevealed) return;

        card.isRevealed = true;
        this.log(`AUTO_REVEAL:${activeSid}:${autoPosition}:${card.value}`);
        this.turnRevealedCards.push({ cardId: card.id, value: card.value, source: "hand", ownerSessionId: activeSid, tableIndex: -1 });

        // Check if we reached 3
        const newMatching = this.turnRevealedCards.filter(c => c.value === this.turnMatchValue);
        if (newMatching.length >= 3) {
            this.handleTrioComplete(activeSid, newMatching);
        } else {
            // Try again recursively to pull a second matching card if it's now on the ponta
            this.tryAutoTrio(activeSid);
        }
    }

    private handleTrioComplete(activeSid: string, matching: any[]) {
        if (this.turnLocked) return;
        const ap = this.state.players.get(activeSid);
        const pName = ap ? ap.displayName : "Alguém";
        this.broadcast("TRIO_CINEMATIC", { sid: activeSid, value: this.turnMatchValue, playerName: pName });
        
        this.log(`TRIO_COMPLETE:${activeSid}:${this.turnMatchValue}`);
        this.turnLocked = true;
        this.clock.setTimeout(() => {
            this.collectTrio(activeSid, matching);
            this.turnLocked = false;
            const ap2 = this.state.players.get(activeSid);
            if (ap2) {
                const has7 = ap2.trios.toArray().some((t: Trio) => t.value === 7);
                if (has7) { this.endGame(activeSid, "TRIO_OF_SEVENS"); return; }
                if (ap2.trios.length >= TrioRoom.TRIOS_TO_WIN) { this.endGame(activeSid, "THREE_TRIOS"); return; }
            }
            this.turnRevealedCards = [];
            this.turnMatchValue = null;
            this.advanceTurn();
        }, 3500); // Increased delay for cinematic animation
    }

    private processReveal(activeSid: string, cardId: number, value: number, source: "table" | "hand", ownerSid: string, tableIdx: number) {
        this.turnRevealedCards.push({ cardId, value, source, ownerSessionId: ownerSid, tableIndex: tableIdx });

        if (this.turnMatchValue === null) {
            this.turnMatchValue = value;
            this.log(`MATCH_TARGET:${value}`);
            
            // Try auto trio on first reveal as well (if player has 2 matching cards on pontas)
            this.tryAutoTrio(activeSid);
            return;
        }

        if (value !== this.turnMatchValue) {
            // MISMATCH
            this.log(`MISMATCH:${activeSid}:${value}:${this.turnMatchValue}`);
            this.turnLocked = true;
            this.clock.setTimeout(() => {
                this.hideAllRevealed();
                this.turnLocked = false;
                this.advanceTurn();
            }, 1800);
            return;
        }

        // MATCH
        this.log(`MATCH:${activeSid}:${value}`);
        
        // Always try auto-trio when a match happens
        this.tryAutoTrio(activeSid);

        const matching = this.turnRevealedCards.filter(c => c.value === this.turnMatchValue);
        if (matching.length >= 3 && !this.turnLocked) {
            this.handleTrioComplete(activeSid, matching);
        }
    }

    private collectTrio(sid: string, cards: typeof this.turnRevealedCards) {
        const player = this.state.players.get(sid);
        if (!player) return;

        for (const c of cards) {
            if (c.source === "table" && c.tableIndex >= 0) {
                const tc = this.state.tableCards.at(c.tableIndex);
                if (tc) { tc.location = "scored"; tc.value = 0; tc.isRevealed = false; }
            } else if (c.source === "hand") {
                const owner = this.state.players.get(c.ownerSessionId);
                if (owner) {
                    // Find card by ID and remove it
                    const arr = owner.hand.toArray();
                    for (let i = arr.length - 1; i >= 0; i--) {
                        if (arr[i].id === c.cardId) {
                            owner.hand.splice(i, 1);
                            break;
                        }
                    }
                    owner.handCount = owner.hand.length;
                }
            }
        }

        const trio = new Trio();
        trio.value = cards[0].value;
        player.trios.push(trio);
        player.score = player.trios.length;
        
        if (player.userId && !player.userId.startsWith("Guest_")) {
            prisma.user.update({
                where: { id: player.userId },
                data: { total_trios: { increment: 1 } }
            }).catch(e => console.error("Error updating trio stat", e));
        }
    }

    private hideAllRevealed() {
        for (const c of this.turnRevealedCards) {
            if (c.source === "table" && c.tableIndex >= 0) {
                const tc = this.state.tableCards.at(c.tableIndex);
                if (tc && tc.location !== "scored") { tc.value = 0; tc.isRevealed = false; }
            } else if (c.source === "hand") {
                const owner = this.state.players.get(c.ownerSessionId);
                if (owner) {
                    const arr = owner.hand.toArray();
                    const card = arr.find((h: Card) => h.id === c.cardId);
                    if (card) card.isRevealed = false;
                }
            }
        }
        this.turnRevealedCards = [];
        this.turnMatchValue = null;
    }

    private advanceTurn() {
        if (this.turnOrderList.length === 0) return;
        this.state.turnOrder = (this.state.turnOrder + 1) % this.turnOrderList.length;
        this.state.activePlayerSessionId = this.turnOrderList[this.state.turnOrder];
        this.state.expirationTick = this.state.currentTick + TrioRoom.TURN_TICKS;
        this.state.round++;
        this.log(`TURN_START:${this.state.activePlayerSessionId}`);
    }

    private endGame(winner: string, reason: string) {
        this.state.status = "finished";
        this.state.activePlayerSessionId = winner;
        this.log(`GAME_OVER:${winner}:${reason}`);
        
        const playtimeSecs = Math.floor((Date.now() - this.gameStartTime) / 1000);
        
        for (const [sid, player] of this.state.players.entries()) {
            if (player.userId && !player.userId.startsWith("Guest_")) {
                const isWinner = sid === winner;
                prisma.user.update({
                    where: { id: player.userId },
                    data: {
                        total_matches: { increment: 1 },
                        total_wins: { increment: isWinner ? 1 : 0 },
                        total_playtime_seconds: { increment: playtimeSecs }
                    }
                }).catch(e => console.error("Error updating end game stats", e));
            }
        }
    }

    // ────────────────────────────────────────────
    // TICK
    // ────────────────────────────────────────────

    private startTickLoop() {
        this.clock.setInterval(() => {
            this.state.currentTick++;
            if (this.state.status === "playing" && !this.turnLocked &&
                this.state.expirationTick > 0 && this.state.currentTick >= this.state.expirationTick) {
                this.hideAllRevealed();
                this.advanceTurn();
            }
        }, 1000 / this.state.tickRate);
    }

    // ────────────────────────────────────────────
    // PLAYER LIFECYCLE
    // ────────────────────────────────────────────

    onJoin(client: Client, options: any) {
        if (options.isObserver) {
            this.state.spectatorCount++;
            this.log(`OBSERVER_JOINED:${client.sessionId}`);
            // Send initial metadata update
            this.setMetadata({ playerCount: this.state.players.size, status: this.state.status });
            return;
        }

        // If game already started and not a reconnection, reject
        if (this.state.status !== "waiting") {
            throw new Error("Game already in progress");
        }

        if (this.state.players.size >= this.state.maxPlayers) {
            throw new Error("Room is full");
        }

        const p = new Player();
        p.sessionId = client.sessionId;
        p.userId = options.userId || `Guest_${client.sessionId.substring(0, 4)}`;
        p.displayName = options.displayName || p.userId;
        p.avatarUrl = options.avatarUrl || "";

        if (this.state.players.size === 0) {
            p.isHost = true; p.isReady = true;
            this.state.hostSessionId = client.sessionId;
            // Update metadata with the actual host name for the listing
            this.setMetadata({ hostName: p.displayName });
        }
        const occupied = new Set<number>();
        this.state.players.forEach(x => occupied.add(x.seatingPosition));
        for (let i = 0; i < this.state.maxPlayers; i++) {
            if (!occupied.has(i)) { p.seatingPosition = i; break; }
        }
        this.state.players.set(client.sessionId, p);
        this.log(`PLAYER_JOINED:${client.sessionId}:${p.displayName}`);
        this.setMetadata({ playerCount: this.state.players.size, status: this.state.status });
    }

    async onLeave(client: Client, consented: boolean) {
        const p = this.state.players.get(client.sessionId);
        if (!p) {
            // Must be an observer
            this.state.spectatorCount = Math.max(0, this.state.spectatorCount - 1);
            return;
        }
        p.isOnline = false;
        if (this.state.status === "waiting") { this.removePlayer(client.sessionId); return; }
        try {
            if (!consented) {
                await this.allowReconnection(client, this.reconnectTimeout / 1000);
                p.isOnline = true; p.isAfk = false; return;
            }
        } catch (e) {}
        if (this.state.status === "playing") { p.isManagedByBot = true; p.botTier = 1; }
        else this.removePlayer(client.sessionId);
    }

    private removePlayer(sid: string) {
        const p = this.state.players.get(sid);
        if (!p) return;
        const wasHost = p.isHost;
        this.state.players.delete(sid);
        if (wasHost && this.state.players.size > 0 && this.state.status === "waiting") {
            const nid = this.state.players.keys().next().value;
            if (nid) { const nh = this.state.players.get(nid); if (nh) { nh.isHost = true; nh.isReady = true; this.state.hostSessionId = nid; } }
        }
        this.setMetadata({ playerCount: this.state.players.size, status: this.state.status });
        if (this.state.players.size === 0 && this.state.status === "waiting") {
            this.clock.setTimeout(() => { if (this.state.players.size === 0) this.disconnect(); }, 60000);
        }
    }

    onDispose() { console.log(`[TrioRoom] ${this.roomId} disposed`); }

    private canStartGame() {
        const a = Array.from(this.state.players.values());
        return a.length >= this.state.minPlayers && a.every(p => p.isHost || p.isReady);
    }

    private generateRoomCode() {
        const ch = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let code = "";
        for (let i = 0; i < 6; i++) code += ch[Math.floor(Math.random() * ch.length)];
        return code;
    }

    private log(msg: string) {
        this.state.actionLogWindow.push(msg);
        if (this.state.actionLogWindow.length > 10) this.state.actionLogWindow.shift();
    }
}
