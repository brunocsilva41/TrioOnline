/**
 * PROJECT TRINITY - Core Game Engine
 * 
 * DOC-ID: [08_A_TURN_STATE_MACHINE]
 * COMPLIANCE: [PL-52-001] (Engineering Bible)
 * 
 * Authoritative Turn State Machine (FSM) for TRINITY.
 * This class is strictly deterministic and follows the Tick-based timing Law.
 */

export enum MatchPhase {
  WAITING_PLAYERS = "WAITING_PLAYERS",
  DEALING_CARDS = "DEALING_CARDS",
  PLAYER_TURN_IDLE = "PLAYER_TURN_IDLE",
  PLAYER_TURN_REVEAL_1 = "PLAYER_TURN_REVEAL_1",
  PLAYER_TURN_REVEAL_2 = "PLAYER_TURN_REVEAL_2",
  EVALUATING_BOARD = "EVALUATING_BOARD",
  TURN_TRANSITION_COOLDOWN = "TURN_TRANSITION_COOLDOWN",
  GAME_OVER = "GAME_OVER",
}

export type ActionType =
  | "START_GAME"
  | "ACTION_REVEAL"
  | "FINISH_DEALING"
  | "EVALUATION_COMPLETE"
  | "COOLDOWN_COMPLETE"
  | "TICK_UPDATE";

export interface GameAction {
  type: ActionType;
  payload?: any;
}

export class TurnStateMachine {
  private currentState: MatchPhase = MatchPhase.WAITING_PLAYERS;
  private isProcessingAction: boolean = false;
  private currentTick: number = 0;
  private expirationTick: number = 0;
  private matchSeed: number;
  private tickRate: number; // Ticks per second (Default: 20 ticks = 1 second)

  // Callbacks for external systems (Colyseus Room, Logger, etc.)
  public onStateChange: (state: MatchPhase, tick: number) => void = () => {};
  public onEmitEvent: (event: string, payload?: any) => void = () => {};

  /**
   * @param seed Deterministic seed for PRNG (Bible Law I)
   * @param tickRate Number of ticks per second (Bible Law II compliance)
   */
  constructor(seed: number, tickRate: number = 20) {
    this.matchSeed = seed;
    this.tickRate = tickRate;
  }

  /**
   * Authoritative entry point for all game logic changes.
   * Implements Lei V (Single-threaded Mutex) and Risco 1 (Double Tap Drop).
   */
  public async dispatch(action: GameAction, tick: number): Promise<void> {
    if (this.isProcessingAction) {
      // Risco 1: Silent drop if another action is currently being processed.
      return;
    }

    this.isProcessingAction = true;
    this.currentTick = tick;

    try {
      await this.handleTransition(action);
      this.checkTimeouts();
    } catch (error) {
      // Log error in a deterministic way (avoiding non-deterministic side effects if possible)
      console.error(`[FSM_CRITICAL] Error at Tick ${tick}:`, error);
    } finally {
      this.isProcessingAction = false;
    }
  }

  /**
   * Handles state transitions based on incoming actions.
   */
  private async handleTransition(action: GameAction): Promise<void> {
    const previousState = this.currentState;

    // TICK_UPDATE is used to advance time and check for timeouts
    if (action.type === "TICK_UPDATE") {
      return; 
    }

    switch (this.currentState) {
      case MatchPhase.WAITING_PLAYERS:
        if (action.type === "START_GAME") {
          this.transitionTo(MatchPhase.DEALING_CARDS);
        }
        break;

      case MatchPhase.DEALING_CARDS:
        if (action.type === "FINISH_DEALING") {
          this.transitionTo(MatchPhase.PLAYER_TURN_IDLE);
        }
        break;

      case MatchPhase.PLAYER_TURN_IDLE:
        if (action.type === "ACTION_REVEAL") {
          this.transitionTo(MatchPhase.PLAYER_TURN_REVEAL_1);
        }
        break;

      case MatchPhase.PLAYER_TURN_REVEAL_1:
        if (action.type === "ACTION_REVEAL") {
          this.transitionTo(MatchPhase.PLAYER_TURN_REVEAL_2);
        }
        break;

      case MatchPhase.PLAYER_TURN_REVEAL_2:
        if (action.type === "ACTION_REVEAL") {
          this.transitionTo(MatchPhase.EVALUATING_BOARD);
          this.onEmitEvent("EVALUATION_START");
        }
        break;

      case MatchPhase.EVALUATING_BOARD:
        if (action.type === "EVALUATION_COMPLETE") {
          this.transitionTo(MatchPhase.TURN_TRANSITION_COOLDOWN);
        }
        break;

      case MatchPhase.TURN_TRANSITION_COOLDOWN:
        if (action.type === "COOLDOWN_COMPLETE") {
          // In a real scenario, we'd check win conditions here.
          this.transitionTo(MatchPhase.PLAYER_TURN_IDLE);
        }
        break;

      case MatchPhase.GAME_OVER:
        // Terminal state.
        break;
    }

    if (previousState !== this.currentState) {
      this.onStateChange(this.currentState, this.currentTick);
    }
  }

  /**
   * Internal transition helper that sets deterministic timeouts (Bible Law II).
   */
  private transitionTo(nextState: MatchPhase): void {
    this.currentState = nextState;

    switch (nextState) {
      case MatchPhase.PLAYER_TURN_IDLE:
        // Happy Path 1: 15s timer
        this.expirationTick = this.currentTick + (15 * this.tickRate);
        break;

      case MatchPhase.PLAYER_TURN_REVEAL_1:
      case MatchPhase.PLAYER_TURN_REVEAL_2:
        // Happy Path 3 & 5: 10s timer
        this.expirationTick = this.currentTick + (10 * this.tickRate);
        break;

      case MatchPhase.TURN_TRANSITION_COOLDOWN:
        // Cooldown: 1200ms
        this.expirationTick = this.currentTick + Math.floor(1.2 * this.tickRate);
        break;

      case MatchPhase.DEALING_CARDS:
        // Risco 3: Hard fallback for transitions (5s)
        this.expirationTick = this.currentTick + (5 * this.tickRate);
        break;

      case MatchPhase.EVALUATING_BOARD:
        // Risco 3: Hard fallback for evaluation (3s)
        this.expirationTick = this.currentTick + (3 * this.tickRate);
        break;

      default:
        this.expirationTick = 0;
        break;
    }
  }

  /**
   * Evaluates if the current state has exceeded its tick-based lifespan.
   */
  private checkTimeouts(): void {
    if (this.expirationTick > 0 && this.currentTick >= this.expirationTick) {
      this.handleTimeout();
    }
  }

  /**
   * Authoritative timeout handling.
   */
  private handleTimeout(): void {
    switch (this.currentState) {
      case MatchPhase.PLAYER_TURN_IDLE:
      case MatchPhase.PLAYER_TURN_REVEAL_1:
      case MatchPhase.PLAYER_TURN_REVEAL_2:
        // Penalize player for inaction
        this.onEmitEvent("PLAYER_TIMEOUT_PENALTY");
        this.transitionTo(MatchPhase.TURN_TRANSITION_COOLDOWN);
        break;

      case MatchPhase.DEALING_CARDS:
      case MatchPhase.EVALUATING_BOARD:
      case MatchPhase.TURN_TRANSITION_COOLDOWN:
        // Automated progression for transition states
        this.transitionTo(MatchPhase.PLAYER_TURN_IDLE);
        break;
    }

    this.onStateChange(this.currentState, this.currentTick);
  }

  // Authoritative Getters
  public getState(): MatchPhase { return this.currentState; }
  public getTick(): number { return this.currentTick; }
  public getExpirationTick(): number { return this.expirationTick; }
  public getSeed(): number { return this.matchSeed; }
}
