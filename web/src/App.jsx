import { useEffect, useState } from "react";
import { getHealth, reindexKb, scanRepo } from "./api";

const PRIORITY_ORDER = ["critical", "high", "medium", "low"];

function App() {
  const [url, setUrl] = useState("https://github.com/SurajG20/BudgetWise");
  const [health, setHealth] = useState("checking");
  const [scanning, setScanning] = useState(false);
  const [reindexing, setReindexing] = useState(false);
  const [error, setError] = useState("");
  const [kbCount, setKbCount] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getHealth()
      .then(() => {
        if (!cancelled) setHealth("ok");
      })
      .catch(() => {
        if (!cancelled) setHealth("down");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onScan(e) {
    e.preventDefault();
    setError("");
    setKbCount(null);
    setResult(null);
    setScanning(true);
    try {
      const data = await scanRepo(url.trim());
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setScanning(false);
    }
  }

  async function onReindex() {
    setError("");
    setReindexing(true);
    try {
      const data = await reindexKb();
      setKbCount(data.count);
    } catch (err) {
      setError(err.message);
    } finally {
      setReindexing(false);
    }
  }

  const recs = result?.recommendations || [];
  const counts = PRIORITY_ORDER.reduce((acc, p) => {
    acc[p] = recs.filter((r) => r.priority === p).length;
    return acc;
  }, {});

  return (
    <div className="page">
      <header className="top">
        <div>
          <p className="kicker">RAG security scanner</p>
          <h1>Scan a public GitHub repo</h1>
        </div>
        <span className={`status status-${health}`}>
          API {health === "ok" ? "online" : health === "checking" ? "…" : "offline"}
        </span>
      </header>

      <form className="panel" onSubmit={onScan}>
        <label htmlFor="url">Repository URL</label>
        <div className="row">
          <input
            id="url"
            type="url"
            required
            placeholder="https://github.com/owner/repo"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={scanning}
          />
          <button type="submit" disabled={scanning || health !== "ok"}>
            {scanning ? "Scanning…" : "Scan"}
          </button>
          <button type="button" className="ghost" onClick={onReindex} disabled={reindexing}>
            {reindexing ? "Indexing…" : "Reindex KB"}
          </button>
        </div>
        <p className="hint">
          Clones the repo, embeds chunks, then runs each security-kb check against retrieved code.
          This can take a few minutes.
        </p>
      </form>

      {error && <p className="banner error">{error}</p>}
      {kbCount != null && !error && (
        <p className="banner ok">Indexed {kbCount} security checks.</p>
      )}

      {scanning && (
        <p className="banner muted">Clone → embed → analyze. Keep this tab open.</p>
      )}

      {result?.repo && (
        <section className="results">
          <div className="results-head">
            <h2>{result.repo}</h2>
            <p>
              {recs.length} finding{recs.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="pills">
            {PRIORITY_ORDER.map((p) => (
              <span key={p} className={`pill pill-${p}`}>
                {p} {counts[p]}
              </span>
            ))}
          </div>
          {recs.length === 0 ? (
            <p className="empty">No recommendations returned.</p>
          ) : (
            <ul className="cards">
              {recs.map((rec, i) => (
                <li key={`${rec.checkId}-${rec.path}-${i}`} className="card">
                  <div className="card-top">
                    <span className={`pill pill-${rec.priority}`}>{rec.priority}</span>
                    <span className="check">{rec.checkId}</span>
                  </div>
                  <h3>{rec.title}</h3>
                  <p className="path">{rec.path}</p>
                  {rec.why && (
                    <>
                      <h4>Why</h4>
                      <p>{rec.why}</p>
                    </>
                  )}
                  {rec.fix && (
                    <>
                      <h4>Fix</h4>
                      <p>{rec.fix}</p>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

export default App;
