"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getRetryDelayMs, SERVER_ENDPOINTS } from "../lib/serverEndpoint";

export type ServerStatus = "checking" | "online" | "offline";

interface HealthPayload {
  status?: string;
  database?: string;
  uptime?: number;
}

export function useServerStatus() {
  const [status, setStatus] = useState<ServerStatus>("checking");
  const [database, setDatabase] = useState<string>("unknown");
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null);
  const failureCountRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusRef = useRef<ServerStatus>("checking");

  const clearScheduledCheck = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const checkStatus = useCallback(async () => {
    clearScheduledCheck();
    if (statusRef.current !== "online") {
      statusRef.current = "checking";
      setStatus("checking");
    }

    const startedAt = performance.now();
    let nextStatus: ServerStatus = "offline";
    try {
      const response = await fetch(`${SERVER_ENDPOINTS.httpUrl}/health`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Health check failed");

      const payload = (await response.json()) as HealthPayload;
      nextStatus = payload.status === "ok" ? "online" : "offline";

      statusRef.current = nextStatus;
      setStatus(nextStatus);
      setDatabase(payload.database || "unknown");
      setLatencyMs(Math.round(performance.now() - startedAt));
      setLastCheckedAt(Date.now());
      failureCountRef.current = nextStatus === "online" ? 0 : failureCountRef.current + 1;
    } catch {
      failureCountRef.current += 1;
      statusRef.current = "offline";
      setStatus("offline");
      setDatabase("unknown");
      setLatencyMs(null);
      setLastCheckedAt(Date.now());
    } finally {
      const delay = nextStatus === "online" ? 20000 : getRetryDelayMs(failureCountRef.current);
      timeoutRef.current = setTimeout(checkStatus, delay);
    }
  }, []);

  useEffect(() => {
    void checkStatus();
    return clearScheduledCheck;
  }, [checkStatus]);

  return {
    status,
    database,
    latencyMs,
    lastCheckedAt,
    checkNow: checkStatus,
    httpUrl: SERVER_ENDPOINTS.httpUrl,
  };
}
