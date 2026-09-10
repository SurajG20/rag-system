# Server-side request forgery (SSRF)

Priority: high
OWASP: A01:2025 Broken Access Control
CWE: CWE-918

## What to look for
fetch, axios, got, needle, request, http.get, https.request, curl using a user-supplied URL without allowlisting hostnames: `fetch(req.body.url)`, `axios.get(req.query.target)`, `http.get(userUrl)`, cloneRepo(url) without validation, webhook forwarding, PDF/HTML to image fetchers, RAG document ingest from URL, open redirect + server fetch combo. Missing block for private/link-local IPs: 127.0.0.1, 169.254.169.254 (cloud metadata), 10/8, 172.16/12, 192.168/16, ::1.

## Bad examples
```js
fetch(req.body.url).then(r => r.text());
axios.get(req.query.feedUrl);
simpleGit().clone(req.body.url, dest);
```

## How to fix
Allowlist destinations (protocol https only + hostname allowlist). Block private/link-local IPs by resolving DNS then checking IP ranges. Do not pass raw user URLs to the server HTTP client. For GitHub clone case: validate hostname is github.com + owner/repo pattern, enforce --depth 1, timeout, no credentials in URL. Require auth for fetch endpoints.
