const http = require("http");

// Log uncaught errors
process.on("uncaughtException", (err) => {
  console.error("[start.js] UNCAUGHT EXCEPTION:", err.message, err.stack);
  startFallback();
});

process.on("unhandledRejection", (reason) => {
  console.error("[start.js] UNHANDLED REJECTION:", reason);
});

let fallbackStarted = false;
function startFallback() {
  if (fallbackStarted) return;
  fallbackStarted = true;
  const port = process.env.PORT || 2567;
  const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "fallback" }));
  });
  server.listen(port, "0.0.0.0", () => {
    console.log(`[fallback] Listening on port ${port}`);
  });
}

try {
  console.log("[start.js] Loading server...");
  require("./dist/index.js");
  console.log("[start.js] Server loaded successfully");
} catch (e) {
  console.error("[start.js] LOAD FAILED:", e.message);
  console.error(e.stack);
  startFallback();
}
