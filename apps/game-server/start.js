process.on("uncaughtException", (err) => {
  console.error("[start.js] UNCAUGHT:", err.message, err.stack);
});
process.on("unhandledRejection", (r) => {
  console.error("[start.js] UNHANDLED:", r);
});
try {
  require("./dist/index.js");
} catch (e) {
  console.error("[start.js] LOAD FAILED:", e.message, e.stack);
  const http = require("http");
  const port = process.env.PORT || 2567;
  const srv = http.createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "fallback", error: e.message }));
  });
  srv.listen(port, "0.0.0.0", () => {
    console.log("[fallback] listening on", port);
  });
}
