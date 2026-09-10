const fs = require("fs");
const path = require("path");
const ort = require("onnxruntime-web");

const ROOT = path.join(process.cwd(), "data", "models", "all-MiniLM-L6-v2");
const VOCAB_URL =
  "https://huggingface.co/Xenova/all-MiniLM-L6-v2/resolve/main/vocab.txt";
const MODEL_URL =
  "https://huggingface.co/Xenova/all-MiniLM-L6-v2/resolve/main/onnx/model_quantized.onnx";
const MAX_LEN = 128;

let ready;

function wasmDir() {
  return path.join(process.cwd(), "node_modules", "onnxruntime-web", "dist") + path.sep;
}

async function ensureFile(url, dest) {
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) return;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const res = await fetch(url, {
    headers: { "User-Agent": "rag-system" },
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`failed to download ${url} (${res.status})`);
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

function loadVocab(file) {
  const tokens = fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean);
  const map = new Map();
  tokens.forEach((t, i) => map.set(t, i));
  return map;
}

function wordpiece(word, vocab) {
  if (vocab.has(word)) return [word];
  const pieces = [];
  let start = 0;
  while (start < word.length) {
    let end = word.length;
    let found = null;
    while (start < end) {
      const sub = (start > 0 ? "##" : "") + word.slice(start, end);
      if (vocab.has(sub)) {
        found = sub;
        break;
      }
      end -= 1;
    }
    if (!found) return ["[UNK]"];
    pieces.push(found);
    start = end;
  }
  return pieces;
}

function encode(text, vocab) {
  const words = text
    .toLowerCase()
    .replace(/([.,!?;:()[\]{}"'`])/g, " $1 ")
    .split(/\s+/)
    .filter(Boolean);
  const tokens = ["[CLS]"];
  for (const word of words) {
    tokens.push(...wordpiece(word, vocab));
    if (tokens.length >= MAX_LEN - 1) break;
  }
  tokens.push("[SEP]");
  const ids = tokens.map((t) => (vocab.has(t) ? vocab.get(t) : vocab.get("[UNK]")));
  const attention = ids.map(() => 1);
  while (ids.length < MAX_LEN) {
    ids.push(vocab.get("[PAD]") ?? 0);
    attention.push(0);
  }
  return {
    ids: ids.slice(0, MAX_LEN),
    attention: attention.slice(0, MAX_LEN),
  };
}

function meanPool(hidden, attention, seq, dim) {
  const out = new Float32Array(dim);
  let count = 0;
  for (let i = 0; i < seq; i++) {
    if (!attention[i]) continue;
    count += 1;
    for (let j = 0; j < dim; j++) out[j] += hidden[i * dim + j];
  }
  const n = Math.max(count, 1);
  let norm = 0;
  for (let j = 0; j < dim; j++) {
    out[j] /= n;
    norm += out[j] * out[j];
  }
  norm = Math.sqrt(norm) || 1;
  return Array.from(out, (v) => v / norm);
}

async function init() {
  if (ready) return ready;
  ready = (async () => {
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.wasmPaths = wasmDir();
    const vocabPath = path.join(ROOT, "vocab.txt");
    const modelPath = path.join(ROOT, "model_quantized.onnx");
    await ensureFile(VOCAB_URL, vocabPath);
    await ensureFile(MODEL_URL, modelPath);
    const vocab = loadVocab(vocabPath);
    const session = await ort.InferenceSession.create(modelPath, {
      executionProviders: ["wasm"],
    });
    return { vocab, session };
  })();
  return ready;
}

async function embedOne(text, vocab, session) {
  const { ids, attention } = encode(text, vocab);
  const seq = ids.length;
  const inputIds = new ort.Tensor(
    "int64",
    BigInt64Array.from(ids.map(BigInt)),
    [1, seq]
  );
  const mask = new ort.Tensor(
    "int64",
    BigInt64Array.from(attention.map(BigInt)),
    [1, seq]
  );
  const feeds = { input_ids: inputIds, attention_mask: mask };
  if (session.inputNames.includes("token_type_ids")) {
    feeds.token_type_ids = new ort.Tensor("int64", new BigInt64Array(seq), [1, seq]);
  }
  const out = await session.run(feeds);
  const tensor = out[session.outputNames[0]];
  const dim = tensor.dims[2] || 384;
  return meanPool(tensor.data, attention, seq, dim);
}

async function embed(texts) {
  const { vocab, session } = await init();
  const input = Array.isArray(texts) ? texts : [texts];
  const vectors = [];
  for (const text of input) {
    vectors.push(await embedOne(String(text).slice(0, 8000), vocab, session));
  }
  return vectors;
}

module.exports = { embed };
