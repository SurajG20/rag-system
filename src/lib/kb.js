const fs = require("fs");
const path = require("path");

const KB_DIR = path.join(process.cwd(), "security-kb");

function loadChecks() {
  if (!fs.existsSync(KB_DIR)) return [];
  return fs
    .readdirSync(KB_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((file) => {
      const text = fs.readFileSync(path.join(KB_DIR, file), "utf8").trim();
      const id = path.basename(file, ".md");
      const titleMatch = text.match(/^#\s+(.+)$/m);
      return {
        id,
        title: titleMatch ? titleMatch[1].trim() : id,
        text,
      };
    });
}

module.exports = { loadChecks, KB_DIR };
