# Room Lifecycle Strategy - Trio Online

## 1. Lifecycle Overview
The Trio game follows a state-based lifecycle to ensure synchronization between all players and the server.

### States:
1. **Lobby (waiting)**: Players are joining, setting 'Ready' status.
2. **Dealing (dealing)**: Server is shuffling and distributing cards.
3. **Playing (playing)**: Active gameplay turn by turn.
4. **Finished (finished)**: Game concluded, showing results.

---

## 2. Phase Details

### Phase A: Lobby (Waiting)
- **Host Authority**: The first player to join is designated as `Host`.
- **Private/Public**: 
    - Public rooms appear in the lobby list.
    - Private rooms require a 6-digit code to join.
- **Player Limit**: Support for 2 to 8 players.
- **Ready System**:
    - All non-host players must be 'Ready'.
    - Host does not need to be 'Ready' but is the only one who can trigger the 'Start' command.
- **Dynamic Slots**: The room `maxClients` is enforced by Colyseus.

### Phase B: Dealing
- **Trigger**: Host sends `START_GAME` message.
- **Validation**:
    - Server checks if `players.length >= 2`.
    - Server checks if all non-host players are `isReady === true`.
- **Action**:
    - Status changes to `dealing`.
    - Cards are initialized and shuffled.
    - `GameState` is updated with the deck and player hands.

### Phase C: Playing
- **Transition**: Automatically follows `dealing` once cards are distributed.
- **Turn Management**: `activePlayerSessionId` is set to the first player in the rotation.
- **Actions**: Players interact with the board or other players' hands (as per Trio rules).

---

## 3. Host Authority & Room Management

### Host Permissions:
- Change room settings (max players, private/public).
- Kick players (to be implemented).
- Start the game.

### Host Migration:
- If the Host leaves during the **Lobby** phase:
    - The next player in the `players` map (oldest connection) is promoted to Host.
- If the Host leaves during **Playing**:
    - The game may continue with a bot or be terminated if too few players remain.

---

## 4. Message Protocol (Lobby)

| Action | Sender | Description |
|--------|--------|-------------|
| `TOGGLE_READY` | Player | Toggles `isReady` state. |
| `START_GAME` | Host | Transitions room from `waiting` to `dealing`. |
| `KICK_PLAYER` | Host | Removes a specific player from the room. |
| `UPDATE_SETTINGS`| Host | Updates `maxPlayers` or `isPrivate`. |
