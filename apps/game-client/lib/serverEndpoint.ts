const DEFAULT_SERVER_URL = "ws://localhost:2567";
const MAX_RETRY_DELAY_MS = 15000;

export interface ServerEndpoints {
  rawUrl: string;
  wsUrl: string;
  httpUrl: string;
}

export function deriveServerEndpoints(input?: string): ServerEndpoints {
  const rawUrl = (input || DEFAULT_SERVER_URL).replace(/\/$/, "");
  const wsUrl = rawUrl.replace(/^https:\/\//, "wss://").replace(/^http:\/\//, "ws://");
  const httpUrl = rawUrl.replace(/^wss:\/\//, "https://").replace(/^ws:\/\//, "http://");

  return { rawUrl, wsUrl, httpUrl };
}

export function getRetryDelayMs(failureCount: number): number {
  return Math.min(MAX_RETRY_DELAY_MS, 2000 * 2 ** Math.max(0, failureCount));
}

export const SERVER_ENDPOINTS = deriveServerEndpoints(process.env.NEXT_PUBLIC_GAME_SERVER_URL);
