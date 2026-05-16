/**
 * SECURITY AGENT: Rate Limiter Layer
 * Prevents packet flooding (Risk 2 from DOC-09) by limiting the rate of specific messages.
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export class RateLimiter {
  private static clientRequests: Map<string, number[]> = new Map();

  /**
   * Checks if a client has exceeded the rate limit for a specific action.
   * @param clientId Unique identifier for the client (e.g., sessionId)
   * @param config Rate limit configuration (maxRequests, windowMs)
   * @returns true if the request is allowed, false if it should be blocked
   */
  static isAllowed(clientId: string, actionType: string, config: RateLimitConfig = { maxRequests: 5, windowMs: 2000 }): boolean {
    const now = Date.now();
    const key = `${clientId}:${actionType}`;
    
    if (!this.clientRequests.has(key)) {
      this.clientRequests.set(key, [now]);
      return true;
    }

    const timestamps = this.clientRequests.get(key)!;
    
    // Filter out timestamps outside the current window
    const validTimestamps = timestamps.filter(ts => now - ts < config.windowMs);
    
    if (validTimestamps.length >= config.maxRequests) {
      console.warn(`[SECURITY_AGENT] Rate limit exceeded for client ${clientId} on action ${actionType}`);
      return false;
    }

    validTimestamps.push(now);
    this.clientRequests.set(key, validTimestamps);
    return true;
  }

  /**
   * Specific check for the REVEAL action.
   * Risk 2 compliance: Max 5 actions in 2 seconds.
   */
  static isRevealAllowed(clientId: string): boolean {
    return this.isAllowed(clientId, "REVEAL", { maxRequests: 5, windowMs: 2000 });
  }

  /**
   * Cleans up stored data for a client when they disconnect.
   */
  static clearClient(clientId: string) {
    for (const key of this.clientRequests.keys()) {
      if (key.startsWith(`${clientId}:`)) {
        this.clientRequests.delete(key);
      }
    }
  }
}
