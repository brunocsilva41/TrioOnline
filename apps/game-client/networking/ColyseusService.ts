import { Client, Room } from "colyseus.js";
import { useGameStore, PlayerData, CardData, AppPhase } from "../store/useGameStore";
import { SERVER_ENDPOINTS } from "../lib/serverEndpoint";

/**
 * PROJECT TRINITY - ColyseusService
 *
 * Manages WebSocket connection lifecycle, room creation/joining,
 * and real-time state synchronization with Zustand store.
 */

const SESSION_KEY = "trinity_session";

function normalizeConnectionError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error;
  return new Error(`${fallback}. Verifique se o servidor está online em ${SERVER_ENDPOINTS.httpUrl}.`);
}

interface SavedSession {
  roomId: string;
  sessionId: string;
  displayName: string;
  reconnectionToken?: string;
}

class ColyseusService {
  private client: Client;
  private room: Room | null = null;

  constructor() {
    this.client = new Client(SERVER_ENDPOINTS.wsUrl);
  }

  // ── Session persistence ──

  private saveSession() {
    if (!this.room) return;
    const data: SavedSession = {
      roomId: this.room.id,
      sessionId: this.room.sessionId,
      displayName: localStorage.getItem("trinity_name") || "Player",
      reconnectionToken: this.room.reconnectionToken,
    };
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch {}
  }

  private clearSession() {
    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
  }

  public getSavedSession(): SavedSession | null {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  public async reconnectToSession(saved: SavedSession): Promise<boolean> {
    try {
      if (saved.reconnectionToken) {
        this.room = await this.client.reconnect(saved.reconnectionToken);
      } else {
        // Fallback for older sessions without token
        this.room = await this.client.joinById(saved.roomId, {
          displayName: saved.displayName,
        });
      }
      this.setupSync();
      useGameStore.getState().setMySessionId(this.room.sessionId);
      this.saveSession();
      return true;
    } catch (e) {
      console.warn("[ColyseusService] Reconnect failed:", e);
      this.clearSession();
      return false;
    }
  }

  // === ROOM MANAGEMENT ===

  public async createRoom(options: {
    isPrivate?: boolean;
    maxPlayers?: number;
    displayName?: string;
    userId?: string;
  }) {
    try {
      this.room = await this.client.create("trio_room", {
        isPrivate: options.isPrivate || false,
        maxPlayers: options.maxPlayers || 8,
        displayName: options.displayName || "Player",
        userId: options.userId,
        hostName: options.displayName || "Player",
      });

      this.setupSync();
      useGameStore.getState().setMySessionId(this.room.sessionId);
      useGameStore.getState().setPhase("room");
      this.saveSession();
      return this.room;
    } catch (e) {
      if (process.env.NODE_ENV !== "development") console.error("[ColyseusService] Create room failed:", e);
      throw normalizeConnectionError(e, "Não foi possível criar a sala");
    }
  }

  public async joinRoom(roomId: string, options: {
    displayName?: string;
    userId?: string;
    isObserver?: boolean;
  } = {}) {
    try {
      this.room = await this.client.joinById(roomId, {
        displayName: options.displayName || "Player",
        userId: options.userId,
        isObserver: options.isObserver,
      });

      this.setupSync();
      useGameStore.getState().setMySessionId(this.room.sessionId);
      useGameStore.getState().setPhase("room");
      this.saveSession();
      return this.room;
    } catch (e) {
      if (process.env.NODE_ENV !== "development") console.error("[ColyseusService] Join room failed:", e);
      throw normalizeConnectionError(e, "Não foi possível entrar na sala");
    }
  }

  public async observeRoom(roomId: string, options: {
    displayName?: string;
    userId?: string;
  } = {}) {
    return this.joinRoom(roomId, { ...options, isObserver: true });
  }

  public async joinByCode(code: string, options: {
    displayName?: string;
    userId?: string;
    isObserver?: boolean;
  } = {}) {
    try {
      const res = await fetch(`${SERVER_ENDPOINTS.httpUrl}/join-by-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.toUpperCase() }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Room not found");
      }

      const { roomId } = await res.json();
      return this.joinRoom(roomId, options);
    } catch (e) {
      if (process.env.NODE_ENV !== "development") console.error("[ColyseusService] Join by code failed:", e);
      throw normalizeConnectionError(e, "Não foi possível entrar com este código");
    }
  }

  public async quickMatch(options: {
    displayName?: string;
    userId?: string;
  } = {}) {
    try {
      this.room = await this.client.joinOrCreate("trio_room", {
        displayName: options.displayName || "Player",
        userId: options.userId,
        hostName: options.displayName || "Player", // Ensure hostName is set if room is created
      });

      this.setupSync();
      useGameStore.getState().setMySessionId(this.room.sessionId);
      useGameStore.getState().setPhase("room");
      this.saveSession();
      return this.room;
    } catch (e) {
      if (process.env.NODE_ENV !== "development") console.error("[ColyseusService] Quick match failed:", e);
      throw normalizeConnectionError(e, "Não foi possível iniciar uma partida rápida");
    }
  }

  public async fetchRooms() {
    try {
      const res = await fetch(`${SERVER_ENDPOINTS.httpUrl}/rooms`);
      const data = await res.json();
      useGameStore.getState().setAvailableRooms(data.rooms || []);
      return data.rooms;
    } catch (e) {
      if (process.env.NODE_ENV !== "development") console.error("[ColyseusService] Fetch rooms failed:", e);
      return [];
    }
  }

  // === ROOM ACTIONS ===

  public sendReady() {
    this.room?.send("TOGGLE_READY");
  }

  public sendStartGame() {
    this.room?.send("START_GAME");
  }

  public sendKickPlayer(targetSessionId: string) {
    this.room?.send("KICK_PLAYER", { targetSessionId });
  }

  public sendUpdateSettings(settings: { maxPlayers?: number }) {
    this.room?.send("UPDATE_SETTINGS", settings);
  }

  public sendEmote(emote: string) {
    this.room?.send("EMOTE", { emote });
  }

  public sendNudge(targetSessionId: string) {
    this.room?.send("NUDGE", { targetSessionId });
  }

  public sendRevealTableCard(cardIndex: number) {
    this.room?.send("REVEAL_TABLE_CARD", { cardIndex });
  }

  public sendAskPlayerCard(targetSessionId: string, position: "lowest" | "highest") {
    this.room?.send("ASK_PLAYER_CARD", { targetSessionId, position });
  }

  public sendRevealOwnCard(position: "lowest" | "highest") {
    this.room?.send("REVEAL_OWN_CARD", { position });
  }

  public sendCloseRoom() {
    this.room?.send("CLOSE_ROOM");
  }

  public leaveRoom() {
    this.room?.leave();
    this.room = null;
    this.clearSession();
    useGameStore.getState().resetGame();
  }

  public getRoom() {
    return this.room;
  }

  public getSessionId() {
    return this.room?.sessionId || "";
  }

  // === STATE SYNCHRONIZATION ===

  private setupSync() {
    if (!this.room) return;
    const store = useGameStore.getState;

    // Status → Phase mapping
    this.room.state.listen("status", (status: string) => {
      const phaseMap: Record<string, AppPhase> = {
        waiting: "room",
        countdown: "countdown",
        dealing: "dealing",
        playing: "playing",
        finished: "finished",
      };
      store().setPhase(phaseMap[status] || "room");
    });

    // Room info
    this.room.state.listen("roomCode", (v: string) => {
      store().setRoomInfo({ ...pick(store(), "isPrivate", "maxPlayers", "hostSessionId"), roomCode: v });
    });
    this.room.state.listen("isPrivate", (v: boolean) => {
      store().setRoomInfo({ ...pick(store(), "roomCode", "maxPlayers", "hostSessionId"), isPrivate: v });
    });
    this.room.state.listen("maxPlayers", (v: number) => {
      store().setRoomInfo({ ...pick(store(), "roomCode", "isPrivate", "hostSessionId"), maxPlayers: v });
    });
    this.room.state.listen("hostSessionId", (v: string) => {
      store().setRoomInfo({ ...pick(store(), "roomCode", "isPrivate", "maxPlayers"), hostSessionId: v });
    });

    // Countdown
    this.room.state.listen("countdown", (v: number) => {
      store().setCountdown(v);
    });

    // Active player & ticks
    this.room.state.listen("activePlayerSessionId", (v: string) => {
      store().setActivePlayer(v || null);
    });
    this.room.state.listen("currentTick", (v: number) => {
      store().setTickData(v, store().expirationTick);
    });
    this.room.state.listen("expirationTick", (v: number) => {
      store().setTickData(store().currentTick, v);
    });

    // Match metadata
    this.room.state.listen("matchSeed", (v: number) => {
      store().setMatchMeta(v, store().round, store().tableCardCount, store().handSize);
    });
    this.room.state.listen("round", (v: number) => {
      store().setMatchMeta(store().matchSeed, v, store().tableCardCount, store().handSize);
    });
    this.room.state.listen("tableCardCount", (v: number) => {
      store().setMatchMeta(store().matchSeed, store().round, v, store().handSize);
    });
    this.room.state.listen("handSize", (v: number) => {
      store().setMatchMeta(store().matchSeed, store().round, store().tableCardCount, v);
    });

    // Players collection
    this.room.state.players.onAdd((player: any, sessionId: string) => {
      const data: PlayerData = {
        sessionId,
        userId: player.userId,
        displayName: player.displayName,
        avatarUrl: player.avatarUrl,
        isOnline: player.isOnline,
        isAfk: player.isAfk,
        isHost: player.isHost,
        isReady: player.isReady,
        seatingPosition: player.seatingPosition,
        emotionState: player.emotionState,
        handCount: player.handCount,
        hand: [],
        trios: [],
        score: player.score,
        lastEmote: player.lastEmote,
        lastEmoteTick: player.lastEmoteTick,
      };
      store().addPlayer(sessionId, data);

      player.onChange(() => {
        store().updatePlayer(sessionId, {
          isOnline: player.isOnline,
          isAfk: player.isAfk,
          isHost: player.isHost,
          isReady: player.isReady,
          seatingPosition: player.seatingPosition,
          emotionState: player.emotionState,
          handCount: player.handCount,
          score: player.score,
          lastEmote: player.lastEmote,
          lastEmoteTick: player.lastEmoteTick,
        });
      });

      // Sync hand cards for ALL players
      const isMe = sessionId === this.room?.sessionId;

      player.hand.onAdd((card: any, _idx: number) => {
        const cardData = { id: card.id, value: card.value, isRevealed: card.isRevealed, location: card.location, ownerId: card.ownerId };

        if (isMe) {
          // My hand — full card data
          const existing = store().myHand;
          const i = existing.findIndex(c => c.id === card.id);
          if (i >= 0) { const u = [...existing]; u[i] = cardData; store().setMyHand(u); }
          else store().setMyHand([...existing, cardData]);
        }

        // ALL players — sync hand array in player data (for revealed card display)
        const p = store().players[sessionId];
        if (p) {
          const h = [...(p.hand || [])];
          const i = h.findIndex(c => c.id === card.id);
          if (i >= 0) h[i] = cardData; else h.push(cardData);
          store().updatePlayer(sessionId, { hand: h });
        }

        card.onChange(() => {
          const cd = { id: card.id, value: card.value, isRevealed: card.isRevealed, location: card.location, ownerId: card.ownerId };

          if (isMe) {
            store().setMyHand(store().myHand.map(c => c.id === card.id ? cd : c));
          }

          // Update in player data too
          const pl = store().players[sessionId];
          if (pl) {
            store().updatePlayer(sessionId, {
              hand: (pl.hand || []).map(c => c.id === card.id ? cd : c),
            });
          }
        });
      });

      player.hand.onRemove((card: any, _idx: number) => {
        if (isMe) {
          store().setMyHand(store().myHand.filter(c => c.id !== card.id));
        }
        const pl = store().players[sessionId];
        if (pl) {
          store().updatePlayer(sessionId, {
            hand: (pl.hand || []).filter(c => c.id !== card.id),
          });
        }
      });

      // Sync trios for all players
      player.trios.onAdd((trio: any) => {
        const pl = store().players[sessionId];
        if (pl) {
          store().updatePlayer(sessionId, {
            trios: [...(pl.trios || []), { value: trio.value }],
            score: (pl.score || 0) + 1,
          });
        }
      });
    });

    this.room.state.players.onRemove((_player: any, sessionId: string) => {
      store().removePlayer(sessionId);
    });

    // Table cards
    this.room.state.tableCards.onAdd((card: any, _index: number) => {
      const cardData = { id: card.id, value: card.value, isRevealed: card.isRevealed, location: card.location, ownerId: card.ownerId };
      const existing = store().tableCards;
      // Append or replace by id
      const idx = existing.findIndex(c => c.id === card.id);
      if (idx >= 0) {
        const updated = [...existing];
        updated[idx] = cardData;
        store().setTableCards(updated);
      } else {
        store().setTableCards([...existing, cardData]);
      }

      card.onChange(() => {
        store().updateTableCard(card.id, {
          value: card.value,
          isRevealed: card.isRevealed,
          location: card.location,
        });
      });
    });

    // Action log
    this.room.state.actionLogWindow.onAdd((msg: string) => {
      store().addActionLog(msg);

      // Parse for Toast
      const [type, ...args] = msg.split(":");
      const players = store().players;
      const getName = (sid: string) => players[sid]?.displayName || "Desconhecido";

      switch (type) {
        case "TABLE_REVEAL": {
          const [sid, _idx, val] = args;
          store().triggerToast(`${getName(sid)} revelou um ${val} da mesa`, "info");
          break;
        }
        case "HAND_REVEAL": {
          const [sid, targetSid, pos, val] = args;
          const posText = pos === "lowest" ? "mais baixa" : "mais alta";
          store().triggerToast(
            `${getName(sid)} pediu a ${posText} de ${getName(targetSid)} e revelou um ${val}`,
            "info"
          );
          break;
        }
        case "OWN_REVEAL": {
          const [sid, pos, val] = args;
          const posText = pos === "lowest" ? "mais baixa" : "mais alta";
          store().triggerToast(`${getName(sid)} revelou sua própria ${posText}: ${val}`, "info");
          break;
        }
        case "TRIO_COMPLETE": {
          const [sid, val] = args;
          store().triggerToast(`TRIO! ${getName(sid)} completou o trio de ${val}!`, "success", 5000);
          break;
        }
      }
    });

    // Error messages from server
    this.room.onMessage("ERROR", (payload: { code: string; message: string }) => {
      console.warn("[Server Error]", payload.code, payload.message);
    });

    this.room.onMessage("KICKED", () => {
      this.room = null;
      this.clearSession();
      store().resetGame();
    });

    this.room.onMessage("ROOM_CLOSED", () => {
      this.room = null;
      this.clearSession();
      store().resetGame();
    });

    this.room.onMessage("PLAYER_NUDGED", (payload: { from: string; to: string }) => {
      store().triggerNudge(payload.from, payload.to);
    });

    this.room.onMessage("PLAYER_EMOTE", (payload: { sessionId: string; emote: string }) => {
      store().triggerEmote(payload.sessionId, payload.emote);
    });

    this.room.onMessage("TRIO_CINEMATIC", (payload: { sid: string; value: number; playerName: string }) => {
      store().triggerTrioCinematic(payload.sid, payload.value, payload.playerName);
    });

    // Connection lifecycle
    this.room.onLeave((code: number) => {
      console.log("[ColyseusService] Left room, code:", code);
      if (code >= 4000) {
        this.clearSession();
        store().resetGame();
      }
    });
  }
}

// Utility to pick fields from store state
function pick<T extends object, K extends keyof T>(obj: T, ...keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) result[key] = obj[key];
  return result;
}

export const colyseusService = new ColyseusService();
