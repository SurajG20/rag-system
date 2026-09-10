# Debug, admin endpoints and security misconfiguration

Priority: medium
OWASP: A02:2025 Security Misconfiguration, A10:2025 Mishandling of Exceptional Conditions
CWE: CWE-215, CWE-489, CWE-16

## What to look for
Debug mode enabled in production (DEBUG=true, app.set("env","development"), Flask debug=True, Django DEBUG=True), stack traces returned to clients (err.stack in res.json), unauthenticated /admin, /debug, /actuator, /metrics, /health/details, heap dump, .git exposed, directory listing, default credentials, verbose errors with SQL/paths, missing security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options), permissive express error handler leaking internals.

## Bad examples
```js
app.use((err, req, res, next) => res.status(500).json({ stack: err.stack }));
app.get("/debug/dump", dumpHandler);
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));
```

## How to fix
Disable debug in production. Protect admin/debug routes with auth + IP allowlist or remove them. Return generic 500 messages, log details server-side only. Add helmet for headers: CSP, HSTS, frameguard, nosniff. Remove .git/tmp/data from deploys. Health endpoint returns {ok:true} only.
