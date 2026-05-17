# DECK GENERATION & DISTRIBUTION

**ID:** [02_GD_DISTRIBUTION]
**VERSION:** 1.0.0
**STATUS:** IMPLEMENTED
**COMPLIANCE:** [PL-52-001] (Deterministic Game Engine)

## 1. Deck Composition
The TRINITY deck is composed of exactly **36 cards**.
- **Values:** 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12.
- **Quantity:** 3 copies of each value.

## 2. Deterministic Shuffle
To ensure fairness and replayability (reproducing specific matches for debugging or anti-cheat), the shuffle algorithm is strictly deterministic.

### 2.1 Algorithm: Fisher-Yates (Knuth Shuffle)
The server uses the Fisher-Yates algorithm to shuffle the deck.

### 2.2 PRNG: LCG (Linear Congruential Generator)
A seeded LCG is used to generate the pseudo-random numbers required by the Fisher-Yates algorithm.
- **Formula:** `next = (a * current + c) % m`
- **Implementation Parameters:** 
  - `m = 2^31 - 1` (Mersenne prime)
  - `a = 48271` (Park-Miller parameters)

## 3. Distribution Table
Cards are distributed according to the number of players in the room. All remaining cards are placed face-down on the table.

| Players | Hand Size | Total in Hands | Table Size | Total Cards |
| :--- | :--- | :--- | :--- | :--- |
| 2 | 7 | 14 | 22 | 36 |
| 3 | 7 | 21 | 15 | 36 |
| 4 | 6 | 24 | 12 | 36 |
| 5 | 6 | 30 | 6 | 36 |
| 6 | 5 | 30 | 6 | 36 |
| 7 | 4 | 28 | 8 | 36 |
| 8 | 4 | 32 | 4 | 36 |

## 4. Integrity Validation
Before a match starts, the `DeckManager` performs an integrity check:
1. **Count Check:** Verify exactly 36 cards.
2. **Frequency Check:** Verify exactly 3 copies of each value from 1 to 12.
3. **Distribution Check:** Verify the sum of hands and table cards equals 36.

## 5. Implementation Reference
The authoritative implementation can be found in `packages/core-engine/src/DeckManager.ts`.
