# Missing authentication on routes

Priority: high
OWASP: A07:2025 Authentication Failures
CWE: CWE-306, CWE-287

## What to look for
Express/Fastify/Koa HTTP handlers that read or change data with no auth middleware, session check, JWT verify, API key check, passport.authenticate, requireAuth, isAuthenticated. Public POST/PUT/DELETE/PATCH that mutate state. Routes like /api/users, /api/docs, /scan, /admin without `auth`, `verifyToken`, `jwt.verify`, `req.user` check. Weak session: Math.random tokens, JWT with algorithm none, missing expiry, tokens in URL query.

## Bad examples
```js
app.post("/api/docs", (req, res) => { db.save(req.body); });
router.delete("/users/:id", deleteUser); // no auth middleware
jwt.verify(token, secret, { algorithms: ["none"] });
```

## How to fix
Require authentication on mutating and sensitive routes. Deny by default: `app.use(authMiddleware)` then allowlist public routes (/health, /login). Validate JWT with explicit algorithm (HS256/RS256), short expiry, rotate secrets. Regenerate session on login, invalidate on logout. Enforce strong password hashing (bcrypt/argon2) and rate-limit login.
