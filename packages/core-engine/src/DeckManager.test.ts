import { DeckManager } from "./DeckManager";

describe("DeckManager", () => {
  it("should generate a deck with exactly 36 cards", () => {
    const deck = DeckManager.generateDeck();
    expect(deck.length).toBe(36);
  });

  it("should have 3 copies of each card from 1 to 12", () => {
    const deck = DeckManager.generateDeck();
    const counts = new Map<number, number>();
    for (const card of deck) {
      counts.set(card, (counts.get(card) || 0) + 1);
    }
    
    expect(counts.size).toBe(12);
    for (let i = 1; i <= 12; i++) {
      expect(counts.get(i)).toBe(3);
    }
  });

  it("should shuffle deterministically with a seed", () => {
    const deck = DeckManager.generateDeck();
    const seed = 12345;
    const shuffled1 = DeckManager.shuffle(deck, seed);
    const shuffled2 = DeckManager.shuffle(deck, seed);
    const shuffled3 = DeckManager.shuffle(deck, 54321);

    expect(shuffled1).toEqual(shuffled2);
    expect(shuffled1).not.toEqual(shuffled3);
  });

  it("should validate a correct deck", () => {
    const deck = DeckManager.generateDeck();
    expect(DeckManager.validate(deck)).toBe(true);
  });

  it("should fail validation for incorrect decks", () => {
    expect(DeckManager.validate([])).toBe(false);
    expect(DeckManager.validate(new Array(36).fill(1))).toBe(false);
    
    const invalidDeck = DeckManager.generateDeck();
    invalidDeck[0] = 99;
    expect(DeckManager.validate(invalidDeck)).toBe(false);
  });

  it("should distribute cards correctly for 2 players", () => {
    const deck = DeckManager.generateDeck();
    const shuffled = DeckManager.shuffle(deck, 1);
    const distribution = DeckManager.distribute(2, shuffled);

    expect(distribution.hands.length).toBe(2);
    expect(distribution.hands[0].length).toBe(7);
    expect(distribution.hands[1].length).toBe(7);
    expect(distribution.table.length).toBe(22);
  });

  it("should distribute cards correctly for 8 players", () => {
    const deck = DeckManager.generateDeck();
    const shuffled = DeckManager.shuffle(deck, 1);
    const distribution = DeckManager.distribute(8, shuffled);

    expect(distribution.hands.length).toBe(8);
    for (const hand of distribution.hands) {
      expect(hand.length).toBe(4);
    }
    expect(distribution.table.length).toBe(4);
  });

  it("should throw error for invalid player counts", () => {
    const deck = DeckManager.generateDeck();
    const shuffled = DeckManager.shuffle(deck, 1);

    expect(() => DeckManager.distribute(1, shuffled)).toThrow();
    expect(() => DeckManager.distribute(9, shuffled)).toThrow();
  });
});
