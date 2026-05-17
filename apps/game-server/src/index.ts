import http from "http";
import express from "express";
import cors from "cors";
import { Server, matchMaker } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { TrioRoom } from "./rooms/TrioRoom";

const port = Number(process.env.PORT || 2567);
const app = express();

// CORS must be the very first middleware — allows all origins
app.use(cors());
app.options("*", cors()); // Handle all OPTIONS preflight requests

app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
});

// Room listing
app.get("/rooms", async (_req, res) => {
    try {
        const rooms = await matchMaker.query({ name: "trio_room" });
        const publicRooms = rooms
            .filter(r => !r.private && !r.locked)
            .map(r => ({
                roomId: r.roomId,
                roomCode: r.metadata?.roomCode || "",
                playerCount: r.metadata?.playerCount || 0,
                maxPlayers: r.metadata?.maxPlayers || 8,
                status: r.metadata?.status || "waiting",
                hostName: r.metadata?.hostName || "Unknown",
            }));
        res.json({ rooms: publicRooms
        });
    } catch (e) {
        res.json({ rooms: [] });
    }
});

// Join by code
app.post("/join-by-code", async (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "Code required" });
    try {
        const rooms = await matchMaker.query({ name: "trio_room" });
        const match = rooms.find(r => r.metadata?.roomCode === code.toUpperCase());
        if (match) res.json({ roomId: match.roomId });
        else res.status(404).json({ error: "Room not found" });
    } catch (e) {
        res.status(500).json({ error: "Server error" });
    }
});

// Create HTTP server from Express app (CORS already applied)
const httpServer = http.createServer(app);

const gameServer = new Server({
    transport: new WebSocketTransport({ server: httpServer }),
});

gameServer.define("trio_room", TrioRoom).enableRealtimeListing();

httpServer.listen(port, () => {
    console.log(`[Trinity] Server on port ${port}`);
});
