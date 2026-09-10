const path = require("path");
const lancedb = require("@lancedb/lancedb");

const DB_PATH = path.join(process.cwd(), "data", "lancedb");

let dbPromise;

function getDb() {
  if (!dbPromise) dbPromise = lancedb.connect(DB_PATH);
  return dbPromise;
}

async function tableExists(name) {
  const db = await getDb();
  const names = await db.tableNames();
  return names.includes(name);
}

async function replaceTable(name, rows) {
  const db = await getDb();
  if (!rows.length) {
    throw new Error(`cannot create empty table ${name}`);
  }
  return db.createTable(name, rows, { mode: "overwrite" });
}

async function indexCode(repo, rows) {
  await replaceTable("code", rows.map((row, i) => ({
    id: `${repo}:${row.path}:${row.chunk}:${i}`,
    repo,
    path: row.path,
    text: row.text,
    vector: row.vector,
  })));
}

async function indexChecks(rows) {
  await replaceTable("checks", rows.map((row) => ({
    id: row.id,
    title: row.title,
    text: row.text,
    vector: row.vector,
  })));
}

function asVector(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value.toArray === "function") return Array.from(value.toArray());
  return Array.from(value);
}

async function listChecks() {
  if (!(await tableExists("checks"))) return [];
  const db = await getDb();
  const table = await db.openTable("checks");
  const rows = await table.query().toArray();
  return rows.map((row) => ({
    ...row,
    vector: asVector(row.vector),
  }));
}

async function searchCode(vector, limit = 8) {
  if (!(await tableExists("code"))) return [];
  const db = await getDb();
  const table = await db.openTable("code");
  return table.vectorSearch(asVector(vector)).limit(limit).toArray();
}

module.exports = { indexCode, indexChecks, listChecks, searchCode };
