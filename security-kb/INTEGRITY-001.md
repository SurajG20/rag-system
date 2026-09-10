# Unvalidated redirects, integrity and error-handling failures

Priority: medium
OWASP: A08:2025 Software and Data Integrity Failures, A10:2025 Mishandling of Exceptional Conditions
CWE: CWE-601, CWE-754, CWE-755

## What to look for
res.redirect(req.query.next / req.body.returnTo) open redirect, integrity missing on cloned repos (no commit SHA pin, no signature verify), CDN scripts without SRI integrity hash, auto-update without checksum, failing open: `catch{ continue / return ok }` skipping authz/validation, unchecked return values from auth/verify, crash loops on malformed chunk/embed, verbose exception leaks (SQL, paths, OPENAI errors to client), tmp/data dirs not cleaned on failure (cleanupClone skipped).

## Bad examples
```js
res.redirect(req.query.next);
try { user = verify(token); } catch { user = { id: req.body.id }; }
catch (e) { res.json({ error: e.stack }); }
```

## How to fix
Allowlist redirect targets (relative paths only, no //evil). Pin clone to commit SHA, verify signatures where possible, use SRI for CDN. Fail closed: on exception deny + log + generic 500. Always cleanup tmp clones in finally. Validate all return values, handle embedding/LLM failures with 503 + retry budget, never leak stack/SQL to client.
