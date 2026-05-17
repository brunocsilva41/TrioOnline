/**
 * PROJECT TRINITY - Core Game Engine
 * 
 * DOC-ID: [08_B_DECK_MANAGER]
 * COMPLIANCE: [PL-52-001] (Engineering Bible)
 * 
 * Authoritative Deck Management for TRINITY.
 * Handles generation, deterministic shuffling, and distribution of cards.
 */

export interface DeckDistribution {
  hands: number[][]; // Array of hands, one for each player
  table: number[];   // Cards remaining on the table
}

export class DeckManager {
  private static readonly DECK_SIZE = 36;
  private static readonly CARD_COPIES = 3;
  private static readonly MIN_CARD_VALUE = 1;
  private static readonly MAX_CARD_VALUE = 12;

  /**
   * Generates a standard deck of 36 cards (3 of each from 1 to 12).
   */
  public static generateDeck(): number[] {
    const deck: number[] = [];
    for (let value = this.MIN_CARD_VALUE; value <= this.MAX_CARD_VALUE; value++) {
      for (let i = 0; i < this.CARD_COPIES; i++) {
        deck.push(value);
      }
    }
    return deck;
  }

  /**
   * Deterministic Fisher-Yates shuffle using a seeded PRNG.
   * COMPLIANCE: Bible Law I (Determinism)
   */
  public static shuffle(deck: number[], seed: number): number[] {
    const shuffled = [...deck];
    let currentSeed = seed;

    // Simple LCG (Linear Congruential Generator) for determinism
    // m = 2^31 - 1 (Mersenne prime), a = 48271 (Park-Miller)
    const nextRandom = () => {
      currentSeed = (currentSeed * 48271) % 2147483647;
      return currentSeed / 2147483647;
    };

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(nextRandom() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }

  /**
   * Validates deck integrity to prevent loss or duplication.
   */
  public static validate(deck: number[]): boolean {
    if (deck.length !== this.DECK_SIZE) return false;

    const counts = new Map<number, number>();
    for (const card of deck) {
      if (card < this.MIN_CARD_VALUE || card > this.MAX_CARD_VALUE) return false;
      counts.set(card, (counts.get(card) || 0) + 1);
    }

    if (counts.size !== this.MAX_CARD_VALUE) return false;

    for (let value = this.MIN_CARD_VALUE; value <= this.MAX_CARD_VALUE; value++) {
      if (counts.get(value) !== this.CARD_COPIES) return false;
    }

    return true;
  }

  /**
   * Distributes cards to players and the table based on the official distribution table.
   * @param playerCount Number of players (2-8)
   * @param shuffledDeck Pre-shuffled deck
   */
  public static distribute(playerCount: number, shuffledDeck: number[]): DeckDistribution {
    if (playerCount < 2 || playerCount > 8) {
      throw new Error("Invalid player count. TRINITY supports 2 to 8 players.");
    }

    if (!this.validate(shuffledDeck)) {
      throw new Error("Invalid deck integrity.");
    }

    const config = this.getDistributionConfig(playerCount);
    const hands: number[][] = [];
    let offset = 0;

    // Distribute to player hands
    for (let i = 0; i < playerCount; i++) {
      const hand = shuffledDeck.slice(offset, offset + config.handSize);
      hands.push(hand.sort((a, b) => a - b)); // Sort hand for better UX
      offset += config.handSize;
    }

    // Remaining cards go to the table
    const table = shuffledDeck.slice(offset);

    if (table.length !== config.tableSize) {
      throw new Error(`Distribution mismatch: expected ${config.tableSize} on table, got ${table.length}`);
    }

    return { hands, table };
  }

  /**
   * Official distribution table rules.
   */
  private static getDistributionConfig(playerCount: number): { handSize: number, tableSize: number } {
    switch (playerCount) {
      case 2: return { handSize: 7, tableSize: 22 };
      case 3: return { handSize: 7, tableSize: 15 };
      case 4: return { handSize: 6, tableSize: 12 };
      case 5: return { handSize: 6, tableSize: 6 };
      case 6: return { handSize: 5, tableSize: 6 };
      case 7: return { handSize: 4, tableSize: 8 };
      case 8: return { handSize: 4, tableSize: 4 };
      default: throw new Error("Unsupported player count");
    }
  }
}
