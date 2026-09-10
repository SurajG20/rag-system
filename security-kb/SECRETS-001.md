# Hardcoded secrets and credential exposure

Priority: critical
OWASP: A04:2025 Cryptographic Failures, A02:2025 Security Misconfiguration
CWE: CWE-798, CWE-259, CWE-321

## What to look for
API keys, passwords, tokens, private keys, AWS keys (AKIA...), GitHub tokens (ghp_, gho_), Stripe keys (sk_live_), JWT secrets, database connection strings (postgres://, mongodb://, mysql://), hardcoded credentials in source, config, .env committed, docker-compose.yml, hardcoded `password = "..."`, `api_key = "..."`, `BEGIN PRIVATE KEY`, `BEGIN RSA PRIVATE KEY`.

Also check: secrets in git history, secrets in logs, secrets in URLs, default credentials like admin/admin.

## Bad examples
```js
const API_KEY = "sk-live-abc123";
const password = "admin123";
mongoose.connect("mongodb://admin:secret123@prod/db");
```

## How to fix
Move secrets to environment variables or a secret manager (AWS Secrets Manager, Vault, Doppler). Never commit `.env`. Rotate any keys that were committed. Add pre-commit scanning with gitleaks or trufflehog. Use `process.env.OPENAI_API_KEY` pattern.
