import { Server, matchMaker } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { createServer } from "http";
import express from "express";
import { TrioRoom } from "./rooms/TrioRoom";

const port = Number(process.env.PORT || 2567);
const app = express();

app.use(express.json());
app.use((_req: any, res: any, next: any) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    next();
});

// Health check endpoint
app.get("/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
});

// Room listing endpoint (public rooms only)
app.get("/rooms", async (_req, res) => {
    try {
        const rooms = await matchMaker.query({ name: "trio_room", private: false });
        const publicRooms = rooms.map(room => ({
            roomId: room.roomId,
            playerCount: room.metadata?.playerCount || 0,
            maxPlayers: room.metadata?.maxPlayers || 8,
            status: room.metadata?.status || "waiting",
            hostName: room.metadata?.hostName || "Unknown",
        }));
        res.json({ rooms: publicRooms });
    } catch (e) {
        res.json({ rooms: [] });
    }
});

// Join by code endpoint
app.post("/join-by-code", async (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "Code required" });

    try {
        const rooms = await matchMaker.query({ name: "trio_room" });
        const match = rooms.find(r => r.metadata?.roomCode === code.toUpperCase());
        if (match) {
            res.json({ roomId: match.roomId });
        } else {
            res.status(404).json({ error: "Room not found" });
        }
    } catch (e) {
        res.status(500).json({ error: "Server error" });
    }
});

const server = createServer(app);
const gameServer = new Server({
    transport: new WebSocketTransport({ server }),
});

// Register room type with filtering for lobby
gameServer.define("trio_room", TrioRoom)
    .enableRealtimeListing();

server.listen(port, () => {
    console.log(`[Trinity] Game server listening on ws://localhost:${port}`);
    console.log(`[Trinity] HTTP API on http://localhost:${port}`);
});
