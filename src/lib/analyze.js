const { loadChecks } = require("./kb");
const { embed, chatJson } = require("./openai");
const { indexChecks, listChecks, indexCode, searchCode } = require("./vector");

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

const SYSTEM = `You are a security reviewer. Use only the retrieved code chunks as evidence.
If there is no real issue in the chunks, return {"recommendations":[]}.
Do not invent files or code. Each recommendation must include a path from the chunks.
Return JSON: {"recommendations":[{"priority":"critical|high|medium|low","title":"...","path":"...","why":"...","fix":"..."}]}`;

async function reindexChecks() {
  const checks = loadChecks();
  if (!checks.length) throw new Error("no markdown files in security-kb/");
  const vectors = await embed(checks.map((c) => c.text));
  await indexChecks(
    checks.map((c, i) => ({
      ...c,
      vector: vectors[i],
    }))
  );
  return { count: checks.length };
}

async function indexRepoCode(repo, chunks) {
  if (!chunks.length) throw new Error("no source files to index");
  const batchSize = 64;
  const withVectors = [];
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    console.log(`embedding chunks ${i + 1}-${Math.min(i + batchSize, chunks.length)}/${chunks.length}`);
    const vectors = await embed(batch.map((c) => c.text));
    batch.forEach((c, j) => withVectors.push({ ...c, vector: vectors[j] }));
  }
  await indexCode(repo, withVectors);
}

async function analyzeRepo() {
  const checks = await listChecks();
  if (!checks.length) {
    await reindexChecks();
  }
  const docs = (await listChecks()).sort((a, b) => a.id.localeCompare(b.id));
  const findings = [];

  for (const check of docs) {
    const hits = await searchCode(check.vector, 8);
    if (!hits.length) continue;
    const evidence = hits
      .slice(0, 4)
      .map((h) => `FILE: ${h.path}\n${String(h.text).slice(0, 600)}`)
      .join("\n\n---\n\n");
    const user = `Security check ${check.id}: ${check.title}\n\n${check.text}\n\nRetrieved code:\n${evidence}`;
    let parsed;
    try {
      console.log(`checking ${check.id}`);
      parsed = await chatJson(SYSTEM, user);
    } catch (err) {
      console.error(`check ${check.id} failed:`, err.message);
      continue;
    }
    const recs = Array.isArray(parsed.recommendations)
      ? parsed.recommendations
      : [];
    for (const rec of recs) {
      if (!rec.path || !rec.title) continue;
      findings.push({
        priority: PRIORITY_ORDER[rec.priority] != null ? rec.priority : "medium",
        checkId: check.id,
        title: rec.title,
        path: rec.path,
        why: rec.why || "",
        fix: rec.fix || "",
      });
    }
  }

  findings.sort(
    (a, b) =>
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
      a.checkId.localeCompare(b.checkId)
  );
  return findings;
}

module.exports = { reindexChecks, indexRepoCode, analyzeRepo };
