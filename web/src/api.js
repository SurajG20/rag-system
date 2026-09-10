const BASE = import.meta.env.VITE_API_URL || "";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || res.statusText || "Request failed");
  }
  return data;
}

export function getHealth() {
  return request("/health");
}

export function scanRepo(url) {
  return request("/scan", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
}

export function reindexKb() {
  return request("/kb/reindex", { method: "POST" });
}
