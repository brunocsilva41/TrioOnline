# Game Flow Architecture

## Room Lifecycle

```
WAITING → COUNTDOWN → DEALING → PLAYING → FINISHED
   ↑                                         ↓
   └─────────── (rematch) ──────────────────┘
```

### States

| Status     | Description                                      | Duration    |
|------------|--------------------------------------------------|-------------|
| `waiting`  | Lobby phase. Players join, ready up, host config | Until start |
| `countdown`| 3-2-1 countdown. Room locked, no new joins       | 3 seconds   |
| `dealing`  | Cards distributed with animation                 | 4 seconds   |
| `playing`  | Active gameplay with turn rotation               | Until end   |
| `finished` | Results screen, stats, rematch option            | Until leave |

---

## Host Authority

The **first player** to join becomes Host automatically.

### Host Permissions (lobby only):
- `START_GAME` — requires all non-host players ready + min 2 players
- `KICK_PLAYER` — remove a player from the room
- `UPDATE_SETTINGS` — change maxPlayers (2-8)

### Host Migration:
If the host disconnects during `waiting`, the next oldest player inherits host.
During gameplay, no host migration occurs (game continues).

---

## Deck Generation & Distribution

### Deck Composition (36 cards):
- Values 1 through 12
- Exactly 3 copies of each value
- Total: 12 × 3 = 36

### Adaptive Distribution Table:

| Players | Cards/Hand | Total in Hands | Table Cards |
|---------|-----------|----------------|-------------|
| 2       | 7         | 14             | 22          |
| 3       | 7         | 21             | 15          |
| 4       | 6         | 24             | 12          |
| 5       | 6         | 30             | 6           |
| 6       | 5         | 30             | 6           |
| 7       | 4         | 28             | 8           |
| 8       | 4         | 32             | 4           |

### Integrity Guarantees:
- `hands_total + table_cards = 36` (always)
- Validated before dealing via `DeckManager.validate()`
- Seeded PRNG (Park-Miller LCG) ensures deterministic replay

---

## Shuffle Algorithm

1. Server generates `matchSeed` (random integer 1 to 2^31-2)
2. `DeckManager.generateDeck()` creates ordered 36-card array
3. `DeckManager.shuffle(deck, seed)` applies Fisher-Yates with seeded LCG
4. `DeckManager.validate(shuffled)` confirms integrity
5. `DeckManager.distribute(playerCount, shuffled)` splits into hands + table
6. Seed stored in match record for replay reconstruction

---

## Reconnection Flow

1. Player disconnects → `player.isOnline = false`
2. Server waits 30 seconds (`allowReconnection`)
3. If player returns → restore seat, hand, turn state
4. If timeout expires → bot takes over (`isManagedByBot = true`)
5. Action log window (last 10 events) syncs missed events on reconnect

---

## Room Types

### Public Room
- Visible in room browser via `/rooms` API endpoint
- `enableRealtimeListing()` on Colyseus definition
- Anyone can join if slots available

### Private Room
- 6-character alphanumeric code (no ambiguous chars: 0/O, 1/I excluded)
- Join only via code or invite link
- Not visible in browser

---

## Command Queue (Law V Compliance)

All player commands enter a FIFO queue per room instance:
```
WebSocket message → enqueueCommand() → processNextCommand()
```
- Only one command processes at a time
- Prevents race conditions between simultaneous reveals
- Maintains deterministic state progression

---

## Adaptive Table Layout

| Players | Layout Style | Description                     |
|---------|-------------|----------------------------------|
| 2       | Horizontal  | Left and right of table          |
| 3-4     | Cross       | Cardinal positions around table  |
| 5-8     | Circular    | Even distribution around ellipse |

Player positions computed via angle math:
```
angle = (index / count) × 2π - π/2
x = 50% + radius × cos(angle)
y = 50% + radius × sin(angle)
```
