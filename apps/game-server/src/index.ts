import { Server, matchMaker } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { createServer } from "http";
import express from "express";
import { TrioRoom } from "./rooms/TrioRoom";

const port = Number(process.env.PORT || 2567);
const app = express();

// CORS — must be BEFORE everything else, including Colyseus matchmake routes
app.use((_req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (_req.method === "OPTIONS") {
        res.sendStatus(200);
        return;
    }
    next();
});

app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
});

// Room listing (public rooms)
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

// Join by code
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

gameServer.define("trio_room", TrioRoom)
    .enableRealtimeListing();

server.listen(port, () => {
    console.log(`[Trinity] Game server on ws://localhost:${port}`);
});
