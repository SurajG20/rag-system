const DEFAULT_URL = "https://opencode.ai/zen/v1/chat/completions";
const DEFAULT_MODEL = "nemotron-3-ultra-free";

function timeoutMs() {
  return Number(process.env.OPENAI_TIMEOUT_MS || process.env.OPENCODE_TIMEOUT_MS || 60000);
}

function parseJsonContent(raw) {
  const text = String(raw || "").trim();
  const unfenced = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  try {
    return JSON.parse(unfenced);
  } catch {
    const start = unfenced.indexOf("{");
    const end = unfenced.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(unfenced.slice(start, end + 1));
    }
    throw new Error("OpenCode did not return JSON");
  }
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function isSocketError(err) {
  const msg = String(err && err.message ? err.message : err);
  return /socket hang up|ECONNRESET|UND_ERR_SOCKET|fetch failed|aborted|network/i.test(
    msg
  );
}

async function postChat(payload) {
  const url = process.env.OPENCODE_BASE_URL || DEFAULT_URL;
  const headers = { "Content-Type": "application/json" };
  if (process.env.OPENCODE_API_KEY) {
    headers.Authorization = `Bearer ${process.env.OPENCODE_API_KEY}`;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeoutMs()),
  });

  const body = await res.text();
  return { res, body };
}

async function postChatRetry(payload) {
  try {
    return await postChat(payload);
  } catch (err) {
    if (!isSocketError(err)) throw err;
    await sleep(1500);
    return postChat(payload);
  }
}

async function chatJson(system, user) {
  const model = process.env.OPENCODE_MODEL || DEFAULT_MODEL;
  const messages = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];

  let payload = { model, messages, temperature: 0 };
  let { res, body } = await postChatRetry(payload);

  if (res.status === 429) {
    await sleep(1500);
    ({ res, body } = await postChatRetry(payload));
  }

  if (!res.ok) {
    throw new Error(`OpenCode ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = JSON.parse(body);
  const content = data.choices?.[0]?.message?.content || "{}";
  return parseJsonContent(content);
}

module.exports = { chatJson };
