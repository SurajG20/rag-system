# RAG Security Scanner

Express service that clones a **public GitHub repository**, chunks the source, indexes it in **LanceDB**, and compares it against a curated **security knowledge base** to return prioritized remediation recommendations.

## Problem

Security checklists are static; every codebase is different. Teams need a fast way to **scan a repo URL** and get **actionable, context-aware** security guidance without manually grepping for patterns.

## Approach

1. **Clone** the target public repo to a temp directory (`simple-git`).
2. **Chunk** files into embeddable segments.
3. **Index** chunks in LanceDB alongside a built-in security KB (reindexed on startup).
4. **Analyze** with retrieval + LLM (OpenAI or OpenCode-compatible endpoint) to produce structured recommendations.
5. **Clean up** the clone after each scan.

## Architecture

```
POST /scan { url } → clone → chunk → indexRepoCode → analyzeRepo → JSON recommendations
GET  /health
POST /kb/reindex   → refresh security knowledge base

Optional: web/ SPA (build to web/dist) served by the same Express app
```

## Tech

Node.js · Express · LanceDB · `@lancedb/lancedb` · simple-git · OpenAI / OpenCode client · optional Vite frontend

## Decisions

| Decision | Why |
|----------|-----|
| LanceDB (embedded) | No separate vector DB to operate for a focused scanner tool. |
| Ephemeral clones | Avoid storing third-party code; predictable disk use. |
| KB reindex on boot | Security guidance stays versioned with the repo. |
| Long-running `/scan` | Large repos need disabled HTTP timeouts on the route. |

## Results

- Single API to go from **GitHub URL → recommendation list**.
- KB reindex endpoint for refreshing checks without redeploying code.
- Health endpoint for orchestration / demos.

## Demo

```bash
cp .env.example .env   # OPENAI_API_KEY or OpenCode settings
npm install
npm run dev            # API on :3000

curl -X POST http://localhost:3000/scan \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://github.com/SurajG20/BudgetWise"}'
```

### Environment

| Variable | Purpose |
|----------|---------|
| `PORT` | HTTP port (default `3000`) |
| `OPENAI_API_KEY` | LLM provider for analysis |
| OpenCode-related vars | See `.env.example` if using OpenCode zen |

## Related work

Production-grade repository intelligence lives in **[GraphMind](https://github.com/SurajG20/ai-repo-workspace)** (symbol graphs, hybrid retrieval, GraphRAG). This repo is a lighter **security-focused RAG scanner** experiment.

## License

Private / learning use — see repository settings.
