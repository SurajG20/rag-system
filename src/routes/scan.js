const express = require("express");
const { cloneRepo, cleanupClone } = require("../lib/clone");
const { chunkRepo } = require("../lib/chunk");
const { reindexChecks, indexRepoCode, analyzeRepo } = require("../lib/analyze");

const router = express.Router();

router.post("/kb/reindex", async (_req, res) => {
  try {
    const result = await reindexChecks();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/scan", async (req, res) => {
  req.setTimeout(0);
  res.setTimeout(0);
  if (req.socket) req.socket.setTimeout(0);

  const url = req.body && req.body.url;
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "body.url is required" });
  }

  let dest;
  try {
    console.log("scan start", url.trim());
    const cloned = await cloneRepo(url.trim());
    dest = cloned.dest;
    const chunks = chunkRepo(cloned.dest);
    console.log("cloned", cloned.display, "chunks", chunks.length);
    await indexRepoCode(cloned.display, chunks);
    const recommendations = await analyzeRepo();
    console.log("scan done", recommendations.length);
    res.json({ repo: cloned.display, recommendations });
  } catch (err) {
    console.error("scan failed", err);
    const status = /Invalid|Only public|required/.test(err.message) ? 400 : 500;
    if (!res.headersSent) {
      res.status(status).json({ error: err.message });
    }
  } finally {
    if (dest) cleanupClone(dest);
  }
});

module.exports = router;
