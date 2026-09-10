const fs = require("fs");
const path = require("path");

const SKIP_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "vendor",
  "__pycache__",
  ".venv",
  "venv",
  "coverage",
  ".next",
  "data",
]);

const SKIP_EXT = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".pdf",
  ".zip",
  ".gz",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".mp4",
  ".lock",
  ".map",
  ".bin",
  ".exe",
  ".dll",
  ".so",
  ".dylib",
]);

const SKIP_FILES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "composer.lock",
  "go.sum",
  "cargo.lock",
]);

const SOURCE_EXT = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
  ".py",
  ".go",
  ".rb",
  ".java",
  ".kt",
  ".rs",
  ".php",
  ".cs",
  ".c",
  ".cc",
  ".cpp",
  ".h",
  ".hpp",
  ".vue",
  ".svelte",
  ".html",
  ".env",
]);

const MAX_CHUNKS = 80;

const CHUNK_SIZE = 800;
const MAX_FILE_BYTES = 200_000;

function walk(dir, files = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    if (entry.name.startsWith(".") && entry.name !== ".env.example") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(full, files);
      continue;
    }
    if (SKIP_FILES.has(entry.name.toLowerCase())) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (SKIP_EXT.has(ext)) continue;
    if (!SOURCE_EXT.has(ext) && entry.name !== ".env.example") continue;
    files.push(full);
  }
  return files;
}

function chunkText(text) {
  const chunks = [];
  for (let i = 0; i < text.length; i += CHUNK_SIZE) {
    chunks.push(text.slice(i, i + CHUNK_SIZE));
  }
  return chunks;
}

function chunkRepo(rootDir) {
  const files = walk(rootDir);
  const out = [];
  for (const file of files) {
    const stat = fs.statSync(file);
    if (stat.size > MAX_FILE_BYTES) continue;
    let text;
    try {
      text = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }
    if (!text.trim()) continue;
    const rel = path.relative(rootDir, file).split("\\").join("/");
    chunkText(text).forEach((piece, i) => {
      if (out.length < MAX_CHUNKS) {
        out.push({ path: rel, text: piece, chunk: i });
      }
    });
    if (out.length >= MAX_CHUNKS) break;
  }
  return out;
}

module.exports = { chunkRepo };
