import { create } from 'zustand';

/**
 * PROJECT TRINITY - Game Client Store
 *
 * DOC-ID: [EC-002_REACT_RENDER_THRASHING]
 * Surgical atomic state updates for high-frequency WebSocket sync.
 */

export type AppPhase = "lobby" | "room" | "countdown" | "dealing" | "playing" | "finished";

export interface CardData {
  id: number;
  value: number;
  isRevealed: boolean;
  location: "table" | "hand" | "scored";
  ownerId: string;
}

export interface TrioData {
  value: number;
}

export interface PlayerData {
  sessionId: string;
  userId: string;
  displayName: string;
  avatarUrl: string;
  isOnline: boolean;
  isAfk: boolean;
  isHost: boolean;
  isReady: boolean;
  seatingPosition: number;
  emotionState: string;
  handCount: number;
  hand: CardData[];
  trios: TrioData[];
  score: number;
  lastEmote: string;
  lastEmoteTick: number;
}

export interface RoomInfo {
  roomId: string;
  roomCode: string;
  playerCount: number;
  maxPlayers: number;
  status: string;
  hostName: string;
}

export interface UserProfile {
  id: string;
  username: string;
  avatar_url?: string;
  total_matches: number;
  total_wins: number;
  total_trios: number;
  total_playtime_seconds: number;
  created_at: string;
}

export interface ChatMessage {
  sessionId: string;
  displayName: string;
  text: string;
  ts: number;
}

interface GameStoreState {
  // === AUTH ===
  authUser: UserProfile | null;
  setAuthUser: (u: UserProfile | null) => void;

  // === APP PHASE ===
  phase: AppPhase;

  // === ROOM STATE ===
  roomCode: string;
  isPrivate: boolean;
  maxPlayers: number;
  hostSessionId: string;
  mySessionId: string;
  countdown: number;

  // === CHAT ===
  chatMessages: ChatMessage[];
  addChatMessage: (msg: ChatMessage) => void;

  // === GAME STATE (Atomic fields - EC-002) ===
  activePlayerSessionId: string | null;
  currentTick: number;
  expirationTick: number;
  tickRate: number;
  matchSeed: number;
  round: number;
  tableCardCount: number;
  handSize: number;

  // === COLLECTIONS ===
  tableCards: CardData[];
  players: Record<string, PlayerData>;
  myHand: CardData[];
  actionLogWindow: string[];

  // === LOBBY ===
  availableRooms: RoomInfo[];

  // === UX FLAGS (EC-004) ===
  isProcessing: boolean;
  isThermalThrottled: boolean;
  isTensionActive: boolean;
  targetedCardId: number | null;

  // === SETTERS ===
  setProcessing: (v: boolean) => void;
  setPhase: (phase: AppPhase) => void;
  setMySessionId: (id: string) => void;
  setRoomInfo: (info: { roomCode: string; isPrivate: boolean; maxPlayers: number; hostSessionId: string }) => void;
  setCountdown: (n: number) => void;
  setActivePlayer: (sessionId: string | null) => void;
  setTickData: (currentTick: number, expirationTick: number) => void;
  setMatchMeta: (seed: number, round: number, tableCardCount: number, handSize: number) => void;

  // Players
  setPlayers: (players: Record<string, PlayerData>) => void;
  addPlayer: (sessionId: string, data: PlayerData) => void;
  updatePlayer: (sessionId: string, data: Partial<PlayerData>) => void;
  removePlayer: (sessionId: string) => void;

  // Cards
  setTableCards: (cards: CardData[]) => void;
  updateTableCard: (id: number, data: Partial<CardData>) => void;
  setMyHand: (cards: CardData[]) => void;

  // Lobby
  setAvailableRooms: (rooms: RoomInfo[]) => void;

  // UX
  setThermalThrottled: (v: boolean) => void;
  setTensionActive: (v: boolean) => void;
  setTargetedCard: (id: number | null) => void;
  setActionLog: (logs: string[]) => void;
  addActionLog: (log: string) => void;

  nudgeEvent: { from: string, to: string, ts: number } | null;
  emoteEvent: { sessionId: string, emote: string, ts: number } | null;
  trioCinematicEvent: { sid: string, value: number, playerName: string, ts: number } | null;
  cardRequestEvent: { fromSid: string, toSid: string, position: "lowest" | "highest", cardValue: number, ts: number } | null;
  
  triggerNudge: (from: string, to: string) => void;
  triggerEmote: (sessionId: string, emote: string) => void;
  triggerTrioCinematic: (sid: string, value: number, playerName: string) => void;
  triggerCardRequest: (fromSid: string, toSid: string, position: "lowest" | "highest", cardValue: number) => void;
  clearTrioCinematic: () => void;
  clearCardRequest: () => void;

  // Reset
  resetGame: () => void;
}

const initialState = {
  authUser: null as UserProfile | null,
  phase: "lobby" as AppPhase,
  roomCode: "",
  isPrivate: false,
  maxPlayers: 8,
  hostSessionId: "",
  mySessionId: "",
  countdown: 0,
  chatMessages: [] as ChatMessage[],
  activePlayerSessionId: null,
  currentTick: 0,
  expirationTick: 0,
  tickRate: 20,
  matchSeed: 0,
  round: 0,
  tableCardCount: 0,
  handSize: 0,
  tableCards: [] as CardData[],
  players: {} as Record<string, PlayerData>,
  myHand: [] as CardData[],
  actionLogWindow: [] as string[],
  availableRooms: [] as RoomInfo[],
  isProcessing: false,
  isThermalThrottled: false,
  isTensionActive: false,
  targetedCardId: null as number | null,
  nudgeEvent: null,
  emoteEvent: null,
  trioCinematicEvent: null,
};

export const useGameStore = create<GameStoreState>((set) => ({
  ...initialState,

  setAuthUser: (u) => set({ authUser: u }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  setPhase: (phase) => set({ phase }),
  setMySessionId: (mySessionId) => set({ mySessionId }),
  setRoomInfo: (info) => set(info),
  setCountdown: (countdown) => set({ countdown }),
  addChatMessage: (msg) => set((state) => ({
    chatMessages: [...state.chatMessages.slice(-49), msg]
  })),
  setActivePlayer: (activePlayerSessionId) => set({ activePlayerSessionId }),
  setTickData: (currentTick, expirationTick) => set({ currentTick, expirationTick }),
  setMatchMeta: (matchSeed, round, tableCardCount, handSize) =>
    set({ matchSeed, round, tableCardCount, handSize }),

  // Player updates - surgical
  setPlayers: (players) => set({ players }),
  addPlayer: (sessionId, data) => set((state) => ({
    players: { ...state.players, [sessionId]: data }
  })),
  updatePlayer: (sessionId, data) => set((state) => {
    const player = state.players[sessionId];
    if (!player) return state;
    return { players: { ...state.players, [sessionId]: { ...player, ...data } } };
  }),
  removePlayer: (sessionId) => set((state) => {
    const { [sessionId]: _, ...rest } = state.players;
    return { players: rest };
  }),

  // Card updates - surgical
  setTableCards: (tableCards) => set({ tableCards }),
  updateTableCard: (id, data) => set((state) => {
    const idx = state.tableCards.findIndex(c => c.id === id);
    if (idx === -1) return state;
    const newCards = [...state.tableCards];
    newCards[idx] = { ...newCards[idx], ...data };
    return { tableCards: newCards };
  }),
  setMyHand: (myHand) => set({ myHand }),

  // Lobby
  setAvailableRooms: (availableRooms) => set({ availableRooms }),
  setShowTutorial: (showTutorial) => set({ showTutorial }),

  // UX
  setThermalThrottled: (isThermalThrottled) => set({ isThermalThrottled }),
  setTensionActive: (isTensionActive) => set({ isTensionActive }),
  setTargetedCard: (targetedCardId) => set({ targetedCardId }),
  setActionLog: (actionLogWindow) => set({ actionLogWindow }),
  addActionLog: (log) => set((state) => ({
    actionLogWindow: [...state.actionLogWindow.slice(-9), log]
  })),

  cardRequestEvent: null,

  triggerNudge: (from, to) => set({ nudgeEvent: { from, to, ts: Date.now() } }),
  triggerEmote: (sessionId, emote) => set({ emoteEvent: { sessionId, emote, ts: Date.now() } }),
  triggerTrioCinematic: (sid, value, playerName) => set({ trioCinematicEvent: { sid, value, playerName, ts: Date.now() } }),
  triggerCardRequest: (fromSid, toSid, position, cardValue) => set({ cardRequestEvent: { fromSid, toSid, position, cardValue, ts: Date.now() } }),
  clearTrioCinematic: () => set({ trioCinematicEvent: null }),
  clearCardRequest: () => set({ cardRequestEvent: null }),

  // Full reset
  resetGame: () => set(initialState),
}));
