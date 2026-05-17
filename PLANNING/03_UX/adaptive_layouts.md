# Adaptive Layouts & Avatar UX Strategy

## 1. Dynamic Table Positioning
The game table automatically adjusts player positions based on the current player count to optimize screen real estate and maintain visual balance.

### Layout Configurations:
- **2 Players (Horizontal):**
  - Positions: `[Center-Left, Center-Right]`
  - Use case: Head-to-head duel.
- **4 Players (Cross):**
  - Positions: `[Bottom, Left, Top, Right]`
  - Use case: Standard competitive match.
- **6 Players (Circular):**
  - Positions: Distributed every 60 degrees.
  - Calculation: `x = cos(angle) * radius`, `y = sin(angle) * radius`.
- **8 Players (Full Table):**
  - Positions: Distributed every 45 degrees.
  - Layout: Maximum capacity, smaller avatars if necessary to avoid HUD overlap.

## 2. Dynamic HUD & Spacing
- **Center-to-Avatar distance:** Increases with player count to avoid crowding the central card grid.
- **HUD Scaling:** HUD elements (Timer, Room Status) move further to the edges or scale down when 8 players are present.
- **Rotation:** Avatars are slightly angled towards the center of the table based on their position.

## 3. Avatar States & Animations
Avatars are "alive" and provide clear visual feedback on player status.

### Status Indicators:
- **Online:** Solid emerald glow on status orb.
- **Offline:** Solid rose color.
- **AFK:** Pulsing amber orb + "Zzz" animation after 30s of inactivity.
- **Thinking:** Active player shows a rotating neural nexus or dots (already partially implemented, to be enhanced).

### Idle Animations:
- **Breathe:** Subtle scaling (1.0 to 1.05) and Y-offset oscillation.
- **Eye Blink:** Periodic clip-path animation or opacity change on a "glance" layer.
- **Micro-movements:** Random subtle rotations to simulate "living" presence.

## 4. Implementation Details
- Use `framer-motion` for all transitions between layout changes.
- Layouts are recalculated whenever the `players` object in `useGameStore` changes.
- Responsive design ensures these layouts scale from mobile (portrait/landscape) to desktop.
