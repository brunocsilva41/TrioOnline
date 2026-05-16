import { create } from 'zustand';

/**
 * PROJECT TRINITY - Game Client Store
 * 
 * DOC-ID: [EC-002_REACT_RENDER_THRASHING]
 * COMPLIANCE: [EC-002]
 * 
 * Authoritative client-side state managed via Zustand.
 * Designed for high-frequency WebSocket updates from Colyseus while 
 * preventing UI performance degradation through atomic state fields 
 * and immutable surgical updates.
 */

export enum GameStatus {
  WAITING_PLAYERS = "WAITING_PLAYERS",
  DEALING_CARDS = "DEALING_CARDS",
  PLAYER_TURN_IDLE = "PLAYER_TURN_IDLE",
  PLAYER_TURN_REVEAL_1 = "PLAYER_TURN_REVEAL_1",
  PLAYER_TURN_REVEAL_2 = "PLAYER_TURN_REVEAL_2",
  EVALUATING_BOARD = "EVALUATING_BOARD",
  TURN_TRANSITION_COOLDOWN = "TURN_TRANSITION_COOLDOWN",
  GAME_OVER = "GAME_OVER",
}

export interface CardData {
  id: number;
  value: number;
  isRevealed: boolean;
}

export interface TrioData {
  value: number;
}

export interface PlayerData {
  sessionId: string;
  userId: string;
  isOnline: boolean;
  trios: TrioData[];
}

interface GameStoreState {
  // --- ATOMIC STATE FIELDS (EC-002 Compliance) ---
  // These fields are separated to allow components to subscribe to 
  // high-frequency updates (like ticks) without re-rendering the whole UI.
  status: GameStatus;
  activePlayerSessionId: string | null;
  currentTick: number;
  expirationTick: number;
  tickRate: number;
  
  // --- COLLECTIONS ---
  // Handled with surgical immutable updates to preserve object references 
  // for unchanged items, preventing render thrashing in lists.
  cards: CardData[];
  players: Record<string, PlayerData>;
  actionLogWindow: string[];

  // --- UX & Performance (EC-004 Compliance) ---
  ux: {
    isThermalThrottled: boolean;
  };

  // --- SETTERS FOR HYDRATION & UPDATES ---
  syncFullState: (state: Partial<GameStoreState>) => void;
  setStatus: (status: GameStatus) => void;
  setActivePlayer: (sessionId: string | null) => void;
  setTickData: (currentTick: number, expirationTick: number) => void;
  setThermalThrottled: (isThrottled: boolean) => void;
  
  // Player Management
  setPlayers: (players: Record<string, PlayerData>) => void;
  updatePlayer: (sessionId: string, data: Partial<PlayerData>) => void;
  
  // Card Management
  setCards: (cards: CardData[]) => void;
  updateCard: (index: number, data: Partial<CardData>) => void;
  
  // Action Log
  setActionLog: (logs: string[]) => void;
}

/**
 * useGameStore Hook
 * 
 * HOW TO USE (EC-002 RULE):
 * ❌ NEVER DO: const { cards } = useGameStore();
 * ✅ ALWAYS DO: const card = useGameStore(state => state.cards[index]);
 * 
 * This ensures that if Card[2] changes, Card[5] DOES NOT re-render.
 */
export const useGameStore = create<GameStoreState>((set) => ({
  // Initial State
  status: GameStatus.WAITING_PLAYERS,
  activePlayerSessionId: null,
  currentTick: 0,
  expirationTick: 0,
  tickRate: 20,
  cards: [],
  players: {},
  actionLogWindow: [],
  ux: {
    isThermalThrottled: false,
  },

  // Hydration: Used when first joining a room or during major state syncs.
  syncFullState: (newState) => set((state) => ({ ...state, ...newState })),

  // Atomic Setters: High-frequency or status changes.
  setStatus: (status) => set({ status }),
  setActivePlayer: (activePlayerSessionId) => set({ activePlayerSessionId }),
  setTickData: (currentTick, expirationTick) => set({ currentTick, expirationTick }),
  setThermalThrottled: (isThermalThrottled) => set((state) => ({
    ux: { ...state.ux, isThermalThrottled }
  })),

  // Player Updates: Uses surgical lookup to avoid breaking references of other players.
  setPlayers: (players) => set({ players }),
  updatePlayer: (sessionId, data) => set((state) => {
    const player = state.players[sessionId];
    if (!player) return state;
    return {
      players: {
        ...state.players,
        [sessionId]: { ...player, ...data }
      }
    };
  }),

  // Card Updates: Uses index-based surgical update.
  // This is critical for 36-card board performance.
  setCards: (cards) => set({ cards }),
  updateCard: (index, data) => set((state) => {
    const card = state.cards[index];
    if (!card) return state;
    
    // Create new array for Zustand but keep references to UNCHANGED cards.
    const newCards = [...state.cards];
    newCards[index] = { ...card, ...data };
    
    return { cards: newCards };
  }),

  // Action Log Update
  setActionLog: (actionLogWindow) => set({ actionLogWindow }),
}));
