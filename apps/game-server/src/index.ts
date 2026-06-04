import http from "http";
import express from "express";
import cors from "cors";
import crypto from "crypto";
import path from "path";
import { Server, matchMaker } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { RedisPresence } from "@colyseus/redis-presence";
import { RedisDriver } from "@colyseus/redis-driver";
import { prisma, databaseConfigured } from "./db";
import { TrioRoom } from "./rooms/TrioRoom";
import { RedisService, redis } from "./RedisService";

// Fatal error handlers
process.on("unhandledRejection", (reason, promise) => {
    console.error("[Fatal] Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
    console.error("[Fatal] Uncaught Exception:", error);
    // Give some time for logs to be sent
    setTimeout(() => process.exit(1), 1000);
});

const port = Number(process.env.PORT || 2567);
const app = express();

function logDatabaseError(scope: string, error: unknown) {
    const message = error instanceof Error ? error.message.split("\n")[0] : String(error);

    if (!databaseConfigured) {
        console.warn(`[${scope}] DATABASE_URL ausente. Recursos de perfil/ranking ficam desativados no modo local.`);
        return;
    }

    console.warn(`[${scope}] Banco indisponível: ${message}`);
}

function requireDatabase(res: express.Response) {
    if (databaseConfigured) return true;
    res.status(503).json({
        error: "Database unavailable",
        message: "Configure DATABASE_URL ou crie um .env local a partir de .env.example.",
    });
    return false;
}

// Simple hash for password
const hashPassword = (password: string) => {
    return crypto.createHash("sha256").update(password).digest("hex");
};

// CORS Configuration - Be extremely permissive for Render deployment
app.use(cors({
    origin: (origin, callback) => {
        // Allow all origins
        callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
}));

app.options("*", cors()); // Handle all OPTIONS preflight requests

app.use(express.json());

// Request logging
app.use((req, res, next) => {
    // Skip logging for frequent background checks to keep console clean
    if (req.url === "/health" || req.url === "/api/leaderboard") {
        return next();
    }
    console.log(`[Trinity] ${req.method} ${req.url} - ${req.ip}`);
    next();
});

// Add a root endpoint for basic health check
app.get("/", (req, res) => {
    res.json({ message: "Trinity Game Server is running", timestamp: new Date().toISOString() });
});

// === AUTH & PROFILE ROUTES ===

app.post("/api/register", async (req, res) => {
    if (!requireDatabase(res)) return;
    try {
        const { username, email, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: "Username and password required" });
        
        const existingUsername = await prisma.user.findUnique({ where: { username } });
        if (existingUsername) return res.status(400).json({ error: "Username already taken" });
        
        if (email) {
            const existingEmail = await prisma.user.findUnique({ where: { email } });
            if (existingEmail) return res.status(400).json({ error: "Email already registered" });
        }
        
        const user = await prisma.user.create({
            data: {
                username,
                email: email || null,
                password_hash: hashPassword(password),
                auth_provider: "local",
                provider_id: `local_${username}_${Date.now()}`
            }
        });
        
        res.json({ id: user.id, username: user.username, total_matches: user.total_matches, total_wins: user.total_wins, total_trios: user.total_trios, total_playtime_seconds: user.total_playtime_seconds, created_at: user.created_at });
    } catch (e) {
        logDatabaseError("Auth Register", e);
        res.status(500).json({ error: "Server error during registration" });
    }
});

app.post("/api/login", async (req, res) => {
    if (!requireDatabase(res)) return;
    try {
        const { login, password } = req.body; // login can be email or username
        if (!login || !password) return res.status(400).json({ error: "Login and password required" });
        
        const isEmail = String(login).includes("@");
        const user = await prisma.user.findFirst({
            where: isEmail ? { email: login } : { username: login }
        });
        
        if (!user || user.password_hash !== hashPassword(password)) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        
        // Register login
        await prisma.userLogin.create({ data: { user_id: user.id } }).catch(() => {});
        
        res.json({ id: user.id, username: user.username, total_matches: user.total_matches, total_wins: user.total_wins, total_trios: user.total_trios, total_playtime_seconds: user.total_playtime_seconds, created_at: user.created_at });
    } catch (e) {
        logDatabaseError("Auth Login", e);
        res.status(500).json({ error: "Server error during login" });
    }
});

app.get("/api/leaderboard", async (req, res) => {
    if (!databaseConfigured) {
        return res.json({ leaderboard: [], database: "unconfigured" });
    }

    try {
        // Try Cache first (Step A: Optimization)
        const cached = await RedisService.get("trinity_leaderboard");
        if (cached) return res.json({ leaderboard: cached, source: "cache" });

        const topPlayers = await prisma.user.findMany({
            orderBy: { total_wins: 'desc' },
            take: 10,
            select: {
                id: true,
                username: true,
                total_matches: true,
                total_wins: true,
                total_playtime_seconds: true,
                total_trios: true
            }
        });

        // Save to cache for 30 seconds
        await RedisService.set("trinity_leaderboard", topPlayers, 30);
        res.json({ leaderboard: topPlayers, source: "database" });
    } catch (e) {
        logDatabaseError("API Leaderboard", e);
        res.json({ leaderboard: [], database: "error" });
    }
});

app.get("/api/profile/:id", async (req, res) => {
    if (!requireDatabase(res)) return;
    try {
        const user = await prisma.user.findUnique({ where: { id: req.params.id } });
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json({ id: user.id, username: user.username, total_matches: user.total_matches, total_wins: user.total_wins, total_trios: user.total_trios, total_playtime_seconds: user.total_playtime_seconds, created_at: user.created_at });
    } catch (e) {
        res.status(500).json({ error: "Server error fetching profile" });
    }
});

app.post("/api/profile/update", async (req, res) => {
    if (!requireDatabase(res)) return;
    try {
        const { id, currentPassword, newUsername, newPassword } = req.body;
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return res.status(404).json({ error: "User not found" });
        
        if (user.password_hash && user.password_hash !== hashPassword(currentPassword)) {
            return res.status(401).json({ error: "Current password incorrect" });
        }
        
        const dataToUpdate: any = {};
        if (newUsername) {
            const existing = await prisma.user.findUnique({ where: { username: newUsername } });
            if (existing && existing.id !== id) return res.status(400).json({ error: "Username already taken" });
            dataToUpdate.username = newUsername;
        }
        if (newPassword) {
            dataToUpdate.password_hash = hashPassword(newPassword);
        }
        
        const updated = await prisma.user.update({
            where: { id },
            data: dataToUpdate
        });
        
        res.json({ id: updated.id, username: updated.username });
    } catch (e) {
        logDatabaseError("API Profile update", e);
        res.status(500).json({ error: "Server error updating profile" });
    }
});

// Health check with timeout to prevent hanging on Render
app.get("/health", async (_req, res) => {
    let dbStatus = "ok";
    if (!databaseConfigured) {
        dbStatus = "unconfigured";
    } else {
        try {
            // Add a timeout to the DB check
            const dbCheck = prisma.$queryRaw`SELECT 1`;
            const timeout = new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Database timeout")), 3000)
            );
            await Promise.race([dbCheck, timeout]);
        } catch (e) {
            dbStatus = "error";
            console.warn(`[Health Check] Database issue: ${e instanceof Error ? e.message : String(e)}`);
        }
    }
    res.json({ 
        status: "ok", 
        uptime: process.uptime(), 
        database: dbStatus,
        version: "1.0.1",
        timestamp: new Date().toISOString()
    });
});

// Room listing
app.get("/rooms", async (_req, res) => {
    try {
        const rooms = await matchMaker.query({ name: "trio_room" });
        const publicRooms = rooms
            .filter(r => !r.private) // Allow locked rooms (ongoing games) to be listed for observers
            .map(r => ({
                roomId: r.roomId,
                roomCode: r.metadata?.roomCode || "",
                playerCount: r.metadata?.playerCount || 0,
                maxPlayers: r.metadata?.maxPlayers || 8,
                status: r.metadata?.status || "waiting",
                hostName: r.metadata?.hostName || "Unknown",
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

httpServer.listen(port, "0.0.0.0", () => {
    console.log(`[Trinity] Server listening on port ${port} (0.0.0.0)`);
});
