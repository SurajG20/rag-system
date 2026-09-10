require("dotenv").config();

const fs = require("fs");
const path = require("path");
const express = require("express");
const scanRouter = require("./routes/scan");
const { reindexChecks } = require("./lib/analyze");

const app = express();
const port = Number(process.env.PORT) || 3000;
const dist = path.join(__dirname, "../web/dist");

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use(scanRouter);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(dist, "index.html"));
  });
}

const server = app.listen(port, async () => {
  console.log(`listening on ${port}`);
  try {
    await reindexChecks();
    console.log("security-kb indexed");
  } catch (err) {
    console.error("failed to index security-kb:", err.message);
  }
});

server.timeout = 0;
server.requestTimeout = 0;
server.headersTimeout = 0;
server.keepAliveTimeout = 120000;
