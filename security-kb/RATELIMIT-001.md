# Missing rate limiting and insecure design (DoS / abuse)

Priority: medium
OWASP: A06:2025 Insecure Design, A10:2025 Mishandling of Exceptional Conditions
CWE: CWE-770, CWE-400, CWE-307

## What to look for
Expensive endpoints with no rate limit: POST /scan (git clone + embed + LLM), POST /kb/reindex, /login without lockout, unbounded body (express.json without limit), unbounded clone size/depth, unbounded chunk/embed batch, no timeout on fetch/clone/OpenAI, no queue/concurrency cap, login/password-reset allowing enumeration (different messages for user-exists), missing CAPTCHA/backoff on auth.

## Bad examples
```js
app.use(express.json());
app.post("/scan", scanHandler); // no limiter, no timeout, no size cap
app.post("/login", login); // unlimited attempts
```

## How to fix
Add express-rate-limit per IP+user on /scan, /login, /kb/reindex (e.g. 10/min + burst). Set `express.json({limit:"100kb"})`, clone --depth 1 + size/timeout, OpenAI timeout + max tokens, job queue with concurrency 2-3. Return generic auth errors to block enumeration. Require human check for expensive ops. Fail closed on overload with 429.
