const http = require("http");
const port = process.env.PORT || 8080;
console.log("[start.js env]", JSON.stringify({ PORT: process.env.PORT, PWD: process.cwd(), NODE_ENV: process.env.NODE_ENV }));
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ status: "ok" }));
});
server.listen(port, "0.0.0.0", () => {
  console.log(`[start.js] Listening on ${port}`);
});
