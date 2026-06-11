const http = require("http");
const port = process.env.PORT || 2567;
console.log("[start.js] Starting minimal server...");
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ status: "ok", message: "minimal server" }));
});
server.listen(port, "0.0.0.0", () => {
  console.log(`[start.js] Minimal server listening on port ${port}`);
});
