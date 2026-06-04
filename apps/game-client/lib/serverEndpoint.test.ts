import assert from "node:assert/strict";
import { deriveServerEndpoints, getRetryDelayMs } from "./serverEndpoint";

assert.deepEqual(deriveServerEndpoints("ws://localhost:2567"), {
  rawUrl: "ws://localhost:2567",
  wsUrl: "ws://localhost:2567",
  httpUrl: "http://localhost:2567",
});

assert.deepEqual(deriveServerEndpoints("https://trio.example.com/"), {
  rawUrl: "https://trio.example.com",
  wsUrl: "wss://trio.example.com",
  httpUrl: "https://trio.example.com",
});

assert.equal(getRetryDelayMs(0), 2000);
assert.equal(getRetryDelayMs(1), 4000);
assert.equal(getRetryDelayMs(2), 8000);
assert.equal(getRetryDelayMs(9), 15000);
