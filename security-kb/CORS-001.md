# Overly permissive CORS and missing CSRF protection

Priority: medium
OWASP: A01:2025 Broken Access Control, A02:2025 Security Misconfiguration
CWE: CWE-942, CWE-352

## What to look for
Access-Control-Allow-Origin set to *, credentials:true with wildcard origin, cors({ origin: "*" }), missing CSRF protection on cookie-based mutating routes, SameSite=None without Secure, state-changing GET routes, no Origin/Referer check, no CSRF token (csurf, csrf-sync) on POST/PUT/DELETE with cookie auth.

## Bad examples
```js
app.use(cors({ origin: "*", credentials: true }));
res.setHeader("Access-Control-Allow-Origin", "*");
app.post("/transfer", cookieAuth, doTransfer); // no csrf
```

## How to fix
Allowlist origins: `cors({ origin: ["https://app.example.com"], credentials: true })`. Do not combine wildcard origin with credentials. Use CSRF tokens or SameSite=Lax/Strict cookies for cookie auth. Prefer SameSite + custom header / double-submit for APIs. Make mutations POST/PUT/DELETE only, never GET.
