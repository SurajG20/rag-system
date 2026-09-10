# Weak cryptography and insecure randomness

Priority: medium
OWASP: A04:2025 Cryptographic Failures
CWE: CWE-327, CWE-328, CWE-330, CWE-760

## What to look for
MD5 or SHA1 for passwords or tokens, hardcoded IVs, ECB mode, DES/3DES/RC4, Math.random for tokens/session/password-reset, disabled TLS verification (rejectUnauthorized:false, NODE_TLS_REJECT_UNAUTHORIZED=0, verify:false), http:// for sensitive APIs, weak bcrypt rounds (<10), unsalted hashes, reversible encryption with hardcoded key, JWT signed with weak secret like "secret" or "123456".

## Bad examples
```js
crypto.createHash("md5").update(pw).digest("hex");
const token = Math.random().toString(36);
https.request({ rejectUnauthorized: false });
jwt.sign(payload, "secret");
```

## How to fix
Use bcrypt/argon2/scrypt for passwords (bcrypt cost 12+). Use crypto.randomBytes / crypto.randomUUID / secrets module for tokens. Use AES-256-GCM with random 96-bit nonce. Enforce TLS 1.2+, never disable cert verification. Store keys in env/secret manager, rotate regularly.
