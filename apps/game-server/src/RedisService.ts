import Redis from "ioredis";

/**
 * PROJECT TRINITY - RedisService
 * 
 * Centralized Redis connection and caching logic.
 * Used for Leaderboards, Presence, and scaling.
 */
const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

let connectionAttempts = 0;

export const redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 1, 
    retryStrategy: (times) => {
        const delay = Math.min(times * 500, 10000);
        return delay;
    },
});

redis.on("error", (err) => {
    connectionAttempts++;
    // Only log every 5 attempts to avoid console spam during startup/local dev
    if (connectionAttempts % 5 === 1) {
        console.warn(`[Redis] Connection attempt failed: ${err.message || 'Check if Redis is running'}`);
    }
});

redis.on("connect", () => {
    console.log("[Redis] Connected successfully to:", REDIS_URL);
    connectionAttempts = 0;
});

export class RedisService {
    /**
     * Cache a value with TTL
     */
    static async set(key: string, value: any, ttlSeconds: number = 60) {
        try {
            await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
        } catch (e) {
            console.warn(`[Redis] Cache set failed for ${key}`);
        }
    }

    /**
     * Get a cached value
     */
    static async get<T>(key: string): Promise<T | null> {
        try {
            const data = await redis.get(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.warn(`[Redis] Cache get failed for ${key}`);
            return null;
        }
    }

    /**
     * Delete a key
     */
    static async del(key: string) {
        try {
            await redis.del(key);
        } catch (e) {}
    }
}
