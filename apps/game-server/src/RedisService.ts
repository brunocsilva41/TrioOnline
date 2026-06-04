import Redis from "ioredis";

/**
 * PROJECT TRINITY - RedisService
 * 
 * Centralized Redis connection and caching logic.
 * Used for Leaderboards, Presence, and scaling.
 */
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 100, 3000),
});

redis.on("error", (err) => {
    console.warn("[Redis] Error connecting:", err.message);
});

redis.on("connect", () => {
    console.log("[Redis] Connected successfully");
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
