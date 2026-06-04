# TrioOnline - Project Instructions

## 🌐 Browser Automation & MCP
This project is configured with a local MCP server named `browser` for web automation using Playwright.

### Core Tools
- Use `browser_open`, `browser_type`, `browser_click`, `browser_snapshot`, and `browser_screenshot` for UI interactions and testing.
- The frontend application typically runs at `http://localhost:3000`.

### Important Context
- **Backend Connection Delay:** The game-server (backend) takes approximately 10 to 30 seconds to establish a stable connection after the frontend loads. 
- **Wait Strategy:** When automating tasks like "Quick Match" (Partida Rápida), always wait for the server status to change from "CONECTANDO..." to "PARTIDA RÁPIDA" before attempting to interact with game buttons.
- **Headless Mode:** Currently configured to `BROWSER_HEADLESS=false` in `.gemini/settings.json`, so you can see the interactions happening in real-time.

## 🚀 Development Workflow
- **Frontend:** Located in `apps/game-client`.
- **Backend:** Located in `apps/game-server`.
- **Core Logic:** Shared logic is in `packages/core-engine`.

## 🛠️ Common Selectors (Lobby)
- **Nickname Input:** `input[placeholder="Seu apelido..."]`
- **Quick Match Button:** `button:has-text("PARTIDA RÁPIDA")`
- **Create Room:** `LobbyButton` with label "CRIAR"

---
*These instructions are for the Gemini CLI agent to ensure consistent behavior across sessions.*
