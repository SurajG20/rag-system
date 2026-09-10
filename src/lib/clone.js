const os = require("os");
const fs = require("fs");
const path = require("path");
const simpleGit = require("simple-git");

function parseGithubUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid URL");
  }
  if (parsed.protocol !== "https:" || parsed.hostname !== "github.com") {
    throw new Error("Only public GitHub HTTPS URLs are supported");
  }
  const parts = parsed.pathname.replace(/\.git$/, "").split("/").filter(Boolean);
  if (parts.length < 2) {
    throw new Error("Invalid GitHub repo URL");
  }
  const owner = parts[0];
  const repo = parts[1];
  return {
    owner,
    repo,
    display: `https://github.com/${owner}/${repo}`,
    cloneUrl: `https://github.com/${owner}/${repo}.git`,
  };
}

async function cloneRepo(url) {
  const info = parseGithubUrl(url);
  const dest = path.join(
    os.tmpdir(),
    "rag-scan",
    `${info.owner}-${info.repo}-${Date.now()}`
  );
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  await simpleGit().clone(info.cloneUrl, dest, ["--depth", "1"]);
  return { ...info, dest };
}

function cleanupClone(dest) {
  fs.rmSync(dest, { recursive: true, force: true });
}

module.exports = { parseGithubUrl, cloneRepo, cleanupClone };
