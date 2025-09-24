"use client"; 

import { useEffect, useMemo, useRef, useState } from "react";
import InjectDataModal from "@/components/warehouse/InjectDataModal";
import SourceCapacityWidget from "@/components/warehouse/SourceCapacityWidget";
import JobCreateModal, { Job } from "@/components/warehouse/JobCreateModal";
import TopNav from "@/components/nav/TopNav";
import SourceExplorerDrawer, { SqlDataset } from "@/components/warehouse/SourceExplorerDrawer";

type Tab = "datasets" | "sources" | "jobs";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

/** Limits (wire to backend later) */
const SOURCE_LIMITS: Record<string, { label: string; limit: number; used?: number }> = {
  csv: { label: "CSV / Excel", limit: 100, used: 0 },
  mysql: { label: "MySQL", limit: 10, used: 0 },
  azuresql: { label: "Azure SQL", limit: 20, used: 0 },
  sqlserver: { label: "SQL Server", limit: 20, used: 0 },
  postgresql: { label: "PostgreSQL", limit: 20, used: 0 },
  "aws-rds": { label: "AWS RDS", limit: 10, used: 0 },
  snowflake: { label: "Snowflake", limit: 50, used: 0 },
  bigquery: { label: "BigQuery", limit: 50, used: 0 },
  adls: { label: "Azure Data Lake", limit: 100, used: 0 },
  s3: { label: "Amazon S3", limit: 100, used: 0 },
  gcs: { label: "Google Cloud Storage", limit: 100, used: 0 },
  sheets: { label: "Google Sheets", limit: 50, used: 0 },
  kafka: { label: "Kafka", limit: 10, used: 0 },
  eventhub: { label: "Azure Event Hub", limit: 10, used: 0 },
  rest: { label: "REST API", limit: 100, used: 0 },
  sftp: { label: "SFTP", limit: 20, used: 0 },
};

/** Categories for sources filter */
const SOURCE_CATEGORIES: Record<string, "Databases" | "Warehouses" | "Files" | "Streams" | "APIs"> = {
  mysql: "Databases",
  azuresql: "Databases",
  sqlserver: "Databases",
  postgresql: "Databases",
  "aws-rds": "Databases",
  snowflake: "Warehouses",
  bigquery: "Warehouses",
  adls: "Files",
  s3: "Files",
  gcs: "Files",
  csv: "Files",
  sheets: "Files",
  kafka: "Streams",
  eventhub: "Streams",
  rest: "APIs",
  sftp: "APIs",
};

/* ---------- small utils ---------- */
function formatTimeAgo(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = Math.max(0, Date.now() - d.getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

type DatasetMeta = { rows?: number; updatedAt?: string };
type KPI = { id: string; name: string; url: string; createdAt: string };

export default function WarehousePage() {
  const [tab, setTab] = useState<Tab>("datasets");

  // Connect Source modal
  const [openConnect, setOpenConnect] = useState(false);

  // Datasets (CSV wired)
  const [datasets, setDatasets] = useState<string[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [qDatasets, setQDatasets] = useState("");

  // Per-file metadata (rows, last updated) stored locally
  const [meta, setMeta] = useState<Record<string, DatasetMeta>>({});

  // Source capacity (CSV used updates from backend)
  const [capacity, setCapacity] = useState(() =>
    Object.entries(SOURCE_LIMITS).map(([id, v]) => ({
      id,
      label: v.label,
      used: v.used ?? 0,
      limit: v.limit,
    }))
  );

  // Jobs
  const [jobs, setJobs] = useState<Job[]>([]);
  const [openCreateJob, setOpenCreateJob] = useState(false);

  // Source Explorer (browsing DB connections/schemas/tables)
  const [openExplorer, setOpenExplorer] = useState(false);
  const [explorerEngine, setExplorerEngine] = useState<string>("mysql");

  // SQL datasets (from connections + Superset sync)
  const [datasetsSql, setDatasetsSql] = useState<SqlDataset[]>([]);

  // KPIs saved for dashboard (Superset chart URLs)
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [kpiName, setKpiName] = useState("");
  const [kpiUrl, setKpiUrl] = useState("");

  // Superset embed + sync
  const SUP_DATASET_ADD_URL = "http://localhost:8088/dataset/add/";
  const [supersetLoaded, setSupersetLoaded] = useState(false);
  const [supersetHint, setSupersetHint] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const pollStopAtRef = useRef<number>(0);

  /** Load CSV datasets and update CSV used count */
  async function loadCsvDatasetsAndCapacity() {
    setLoadingList(true);
    try {
      const res = await fetch(`${API_BASE}/list_csv`, { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      const files: string[] = res.ok && Array.isArray(data?.files) ? data.files : [];
      setDatasets(files);
      setCapacity((prev) => prev.map((e) => (e.id === "csv" ? { ...e, used: files.length } : e)));
    } catch {/* noop */} finally {
      setLoadingList(false);
    }
  }

  /** Local meta */
  function loadMeta() {
    try {
      const raw = localStorage.getItem("nex_dataset_meta");
      if (raw) setMeta(JSON.parse(raw));
    } catch {}
  }
  function saveMeta(next: Record<string, DatasetMeta>) {
    setMeta(next);
    try {
      localStorage.setItem("nex_dataset_meta", JSON.stringify(next));
    } catch {}
  }

  /** Jobs */
  function loadJobs() {
    try {
      const raw = localStorage.getItem("nex_jobs");
      if (raw) setJobs(JSON.parse(raw));
    } catch {}
  }
  function saveJobs(next: Job[]) {
    setJobs(next);
    try {
      localStorage.setItem("nex_jobs", JSON.stringify(next));
    } catch {}
  }

  /** SQL datasets local */
  function loadSqlDatasets() {
    try {
      const raw = localStorage.getItem("nex_datasets_sql");
      if (raw) setDatasetsSql(JSON.parse(raw));
    } catch {}
  }
  function saveSqlDatasets(next: SqlDataset[]) {
    setDatasetsSql(next);
    try {
      localStorage.setItem("nex_datasets_sql", JSON.stringify(next));
    } catch {}
  }

  /** KPIs local */
  function loadKpis() {
    try {
      const raw = localStorage.getItem("nex_dashboard_kpis");
      if (raw) setKpis(JSON.parse(raw));
    } catch {}
  }
  function saveKpis(next: KPI[]) {
    setKpis(next);
    try {
      localStorage.setItem("nex_dashboard_kpis", JSON.stringify(next));
    } catch {}
  }

  useEffect(() => {
    loadCsvDatasetsAndCapacity();
    loadMeta();
    loadJobs();
    loadSqlDatasets();
    loadKpis();
  }, []);

  const filteredCsv = useMemo(() => {
    const s = qDatasets.trim().toLowerCase();
    if (!s) return datasets;
    return datasets.filter((f) => f.toLowerCase().includes(s));
  }, [datasets, qDatasets]);

  const filteredSql = useMemo(() => {
    const s = qDatasets.trim().toLowerCase();
    if (!s) return datasetsSql;
    return datasetsSql.filter((d) => {
      const name = d.schema ? `${d.connName}.${d.schema}.${d.table}` : `${d.connName}.${d.table}`;
      return (
        name.toLowerCase().includes(s) ||
        (d.engine || "").toLowerCase().includes(s) ||
        (d.connName || "").toLowerCase().includes(s)
      );
    });
  }, [datasetsSql, qDatasets]);

  // Derive "in-use" connections
  const usedConnections = useMemo(() => {
    const m = new Map<number, { id: number; name: string; engine: string }>();
    for (const d of datasetsSql) {
      if (!m.has(d.connId)) m.set(d.connId, { id: d.connId, name: d.connName, engine: d.engine });
    }
    return Array.from(m.values());
  }, [datasetsSql]);

  // Jobs metrics
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((j) => j.active).length;
  const errorJobs = jobs.filter((j) => j.lastRunStatus === "error").length;

  // Info popover state for Sources tab
  const [showInfo, setShowInfo] = useState(false);
  const infoBtnRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (showInfo && infoBtnRef.current && !infoBtnRef.current.contains(e.target as Node)) {
        setShowInfo(false);
      }
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [showInfo]);

  /** ---- Superset datasets sync ----
   * Expects a backend endpoint: GET /superset/datasets
   * Return shape example:
   * { result: [{ id, table_name, schema, database: { id, database_name, engine } }, ...] }
   */
  async function syncSupersetDatasets() {
    try {
      const r = await fetch(`${API_BASE}/superset/datasets`, { credentials: "include" });
      const data = await r.json().catch(() => ({}));
      const items = Array.isArray(data?.result) ? data.result : [];

      if (items.length === 0) return;

      const next = [...datasetsSql];
      const seen = new Set(next.map(d => d.id));

      for (const it of items) {
        const db = it.database || {};
        const dbId = Number(db.id);
        const schema = it.schema || "";
        const table = it.table_name || it.table || it.datasource_name || "";
        const connName = db.database_name || "DB";
        const engine = db.engine || "";

        if (!dbId || !table) continue;

        const id = `${dbId}:${schema || ""}:${table}`;
        if (!seen.has(id)) {
          next.push({
            id,
            connId: dbId,
            connName,
            engine,
            schema: schema || undefined,
            table,
            addedAt: new Date().toISOString(),
          });
          seen.add(id);
        }
      }
      if (next.length !== datasetsSql.length) {
        saveSqlDatasets(next);
      }
    } catch (e) {
      // noop; show manual hint in UI if needed
    }
  }

  // When Sources tab becomes active, attempt to embed + start short auto-sync polling
  useEffect(() => {
    if (tab !== "sources") {
      setSupersetHint(null);
      setSupersetLoaded(false);
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      return;
    }

    // Show hint if iframe didn't load after 3s
    const hintTimer = setTimeout(() => {
      if (!supersetLoaded) {
        setSupersetHint(
          "If this embed is blank or blocked, allow framing in Superset (X-Frame-Options / CSP) for your Next.js origin."
        );
      }
    }, 3000);

    // Kick off an initial sync and then poll for a short window (e.g., 2 minutes)
    syncSupersetDatasets();
    pollStopAtRef.current = Date.now() + 2 * 60 * 1000; // stop in 2 minutes
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      if (Date.now() > pollStopAtRef.current) {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
        return;
      }
      syncSupersetDatasets();
    }, 8000);

    return () => {
      clearTimeout(hintTimer);
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <main className="min-h-dvh bg-gray-950 text-white">
      {/* Global sticky navigation (logo links to Dashboard) */}
      <TopNav variant="dashboard" />

      {/* Page content */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Title + primary action */}
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Warehouse</h1>
          <button
            onClick={() => setOpenConnect(true)}
            className="rounded-lg bg-indigo-500/90 hover:bg-indigo-500 px-3 py-2 text-sm"
          >
            Connect Source
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-white/10">
          <div className="flex gap-2">
            {(["datasets", "sources", "jobs"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-2 text-sm rounded-lg my-2 ${
                  tab === t ? "bg-white/15" : "hover:bg-white/10 text-white/80"
                }`}
              >
                {t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Minimal overview */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-sm text-white/60">Overview</div>
          <div className="mt-4 grid grid-cols-4 gap-4">
            <Metric label="Datasets" value={String(filteredCsv.length + filteredSql.length)} />
            <Metric label="Last run" value="—" />
            <Metric label="Errors" value="0" />
            <Metric label="Status" value="OK" />
          </div>
        </section>

        {/* ---- DATASETS TAB (CSV + SQL tables) ---- */}
        {tab === "datasets" && (
          <section className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between gap-3">
              <div className="font-semibold">Datasets</div>
              <div className="flex items-center gap-2">
                <input
                  value={qDatasets}
                  onChange={(e) => setQDatasets(e.target.value)}
                  placeholder="Search datasets…"
                  className="rounded-md bg-white/10 border border-white/10 px-2.5 py-1.5 text-sm outline-none"
                />
                <button
                  onClick={async () => {
                    await loadCsvDatasetsAndCapacity();
                    loadMeta();
                    loadSqlDatasets();
                    // Also pull any fresh Superset datasets
                    await syncSupersetDatasets();
                  }}
                  className="rounded-md bg-white/10 hover:bg-white/20 px-3 py-1.5 text-sm"
                >
                  Refresh
                </button>
              </div>
            </div>

            {loadingList ? (
              <div className="p-6 text-sm text-white/60">Loading…</div>
            ) : filteredCsv.length + filteredSql.length === 0 ? (
              <div className="p-6 text-sm text-white/60">
                No datasets yet. Use <b>Sources</b> to register SQL datasets, or upload a <b>CSV</b>.
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {/* Columns: Name | Source | Type | Rows | Last Updated */}
                <Row cols={["Name", "Source", "Type", "Rows", "Last Updated"]} head />

                {/* CSV */}
                {filteredCsv.map((fname) => {
                  const m = meta[fname];
                  return (
                    <Row
                      key={`csv:${fname}`}
                      cols={[
                        fname,
                        "CSV",
                        "File",
                        m?.rows !== undefined ? String(m.rows) : "—",
                        formatTimeAgo(m?.updatedAt),
                      ]}
                    />
                  );
                })}

                {/* SQL tables */}
                {filteredSql.map((s) => {
                  const displayName = s.schema ? `${s.connName}.${s.schema}.${s.table}` : `${s.connName}.${s.table}`;
                  return (
                    <Row
                      key={`sql:${s.id}`}
                      cols={[
                        displayName,
                        s.connName || s.engine?.toUpperCase() || "SQL",
                        "SQL Table",
                        s.rows !== undefined ? String(s.rows) : "—",
                        formatTimeAgo(s.addedAt),
                      ]}
                    />
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ---- SOURCES TAB (embedded Superset Dataset Picker) ---- */}
        {tab === "sources" && (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-0 overflow-hidden">
            {/* Header / Actions */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Sources</h2>
                <div className="relative">
                  <button
                    ref={infoBtnRef}
                    onClick={(e) => { e.stopPropagation(); setShowInfo((v) => !v); }}
                    className="size-6 rounded-full border border-white/20 text-xs text-white/80 hover:bg-white/10"
                    title="Notes"
                  >
                    i
                  </button>
                  {showInfo && (
                    <div className="absolute left-0 top-8 w-96 rounded-lg border border-white/10 bg-gray-900 p-3 text-sm shadow-xl z-10">
                      <div className="text-white/70">
                        This tab embeds Superset’s <b>Dataset Picker</b>. Create datasets here. We’ll auto-sync them for 2 minutes,
                        and you can also click <b>Sync from Superset</b> anytime to pull newly created datasets.
                        If the embed is blank, allow framing in Superset (X-Frame-Options / CSP).
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => syncSupersetDatasets()}
                  className="rounded-md bg-white/10 hover:bg-white/20 px-3 py-1.5 text-sm"
                >
                  Sync from Superset
                </button>
                <button
                  onClick={() => setOpenConnect(true)}
                  className="rounded-md bg-indigo-500/90 hover:bg-indigo-500 px-3 py-1.5 text-sm"
                >
                  Connect Source
                </button>
              </div>
            </div>

            {/* Embed area */}
            <div className="h-[70vh] relative">
              {!supersetLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
                    Loading Superset Dataset Picker…
                  </div>
                </div>
              )}
              <iframe
                ref={iframeRef}
                src={SUP_DATASET_ADD_URL}
                className="w-full h-full border-0"
                // The sandbox below is permissive enough for Superset UI; tweak if needed.
                sandbox="allow-same-origin allow-forms allow-scripts allow-popups allow-modals allow-downloads"
                onLoad={() => setSupersetLoaded(true)}
              />
            </div>

            {/* Embed hint / troubleshooting */}
            {supersetHint && (
              <div className="p-3 text-xs text-amber-300 border-t border-white/10 bg-amber-950/20">
                {supersetHint}
              </div>
            )}

            {/* In-use connections (derived from saved SQL datasets) */}
            <div className="p-4 border-t border-white/10">
              <div className="font-semibold mb-2">Connections in Use</div>
              {usedConnections.length === 0 ? (
                <div className="text-sm text-white/60">No connections in use yet.</div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {usedConnections.map((c) => (
                    <div key={c.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                      <div className="text-sm font-medium truncate">{c.name}</div>
                      <div className="text-xs text-white/60 mt-1 uppercase">{c.engine}</div>
                      <div className="mt-2">
                        <button
                          className="rounded-md bg-white/10 hover:bg-white/20 px-2 py-1 text-xs"
                          onClick={() => { setExplorerEngine(c.engine); setOpenExplorer(true); }}
                        >
                          Explore
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick add KPI from Superset to Dashboard */}
            <div className="p-4 border-t border-white/10">
              <div className="font-semibold mb-2">Add KPI to Dashboard (from Superset)</div>
              <div className="space-y-3">
                <div className="text-xs text-white/60">
                  In Superset, open a chart and copy its URL (Explore permalink or chart view). Paste it below to add to your Dashboard.
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    value={kpiName}
                    onChange={(e) => setKpiName(e.target.value)}
                    placeholder="KPI name (e.g., Monthly Revenue)"
                    className="flex-1 rounded-md bg-white/10 border border-white/10 px-2.5 py-1.5 text-sm outline-none"
                  />
                  <input
                    value={kpiUrl}
                    onChange={(e) => setKpiUrl(e.target.value)}
                    placeholder="Paste Superset chart URL"
                    className="flex-[2] rounded-md bg-white/10 border border-white/10 px-2.5 py-1.5 text-sm outline-none"
                  />
                  <button
                    className="rounded-md bg-indigo-500/90 hover:bg-indigo-500 px-3 py-1.5 text-sm"
                    onClick={() => {
                      if (!kpiName.trim() || !kpiUrl.trim()) return;
                      const next: KPI[] = [
                        ...kpis,
                        { id: `${Date.now()}`, name: kpiName.trim(), url: kpiUrl.trim(), createdAt: new Date().toISOString() },
                      ];
                      saveKpis(next);
                      setKpiName("");
                      setKpiUrl("");
                    }}
                  >
                    Save to Dashboard
                  </button>
                </div>

                {kpis.length > 0 && (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {kpis.map((k) => (
                      <div key={k.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <div className="text-sm font-medium">{k.name}</div>
                        <div className="text-xs text-white/60 truncate mt-1">{k.url}</div>
                        <div className="mt-2 flex gap-2">
                          <a
                            href={k.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-md bg-white/10 hover:bg-white/20 px-2 py-1 text-xs"
                          >
                            Open
                          </a>
                          <button
                            className="rounded-md bg-white/10 hover:bg-white/20 px-2 py-1 text-xs"
                            onClick={() => {
                              const next = kpis.filter((x) => x.id !== k.id);
                              saveKpis(next);
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ---- JOBS TAB ---- */}
        {tab === "jobs" && (
          <section className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="font-semibold">Jobs</div>
              <button
                onClick={() => setOpenCreateJob(true)}
                className="rounded-lg bg-indigo-500/90 hover:bg-indigo-500 px-3 py-2 text-sm"
                title="Create Job"
              >
                Create Job
              </button>
            </div>

            <div className="p-4 grid grid-cols-3 gap-4">
              <Metric label="Total Jobs" value={String(totalJobs)} />
              <Metric label="Active Jobs" value={String(activeJobs)} />
              <Metric label="Errors" value={String(errorJobs)} />
            </div>

            <div className="divide-y divide-white/10">
              <Row cols={["Name", "Source", "Type", "Schedule", "Status", "Last Run"]} head />
              {jobs.length === 0 ? (
                <div className="p-6 text-sm text-white/60">
                  No jobs yet. Use <b>Create Job</b> to keep your data up to date.
                </div>
              ) : (
                jobs.map((j) => (
                  <div key={j.id} className="grid" style={{ gridTemplateColumns: `repeat(6, minmax(0,1fr))` }}>
                    <Cell>{j.name}</Cell>
                    <Cell>{j.sourceName ?? j.sourceType.toUpperCase()}</Cell>
                    <Cell className="uppercase">{j.sourceType}</Cell>
                    <Cell>{j.scheduleHuman ?? j.scheduleCron ?? "—"}</Cell>
                    <Cell>
                      <span className={`px-2 py-0.5 rounded text-xs ${j.active ? "bg-green-500/20 text-green-300" : "bg-white/10 text-white/70"}`}>
                        {j.active ? "Active" : "Paused"}
                      </span>
                    </Cell>
                    <Cell>
                      {j.lastRunStatus === "ok" && <span className="text-green-300 text-sm">OK</span>}
                      {j.lastRunStatus === "error" && <span className="text-red-300 text-sm">Error</span>}
                      {j.lastRunStatus === "never" && <span className="text-white/60 text-sm">Never</span>}
                    </Cell>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </div>

      {/* Modals */}
      <InjectDataModal
        open={openConnect}
        onClose={() => setOpenConnect(false)}
        onCsvUploaded={async (p) => {
          const next = { ...meta, [p.filename]: { rows: p.rows, updatedAt: new Date().toISOString() } };
          saveMeta(next);
          await loadCsvDatasetsAndCapacity();
        }}
      />
      <JobCreateModal
        open={openCreateJob}
        onClose={() => setOpenCreateJob(false)}
        onCreate={(job) => {
          const next = [...jobs, job];
          saveJobs(next);
          setOpenCreateJob(false);
        }}
      />

      {/* Explorer Drawer (optional browsing) */}
      <SourceExplorerDrawer
        open={openExplorer}
        engine={explorerEngine}
        onClose={() => setOpenExplorer(false)}
        onAddDataset={(d) => {
          const exists = datasetsSql.some((x) => x.id === d.id);
          if (!exists) {
            const next = [...datasetsSql, d];
            saveSqlDatasets(next);
          }
          setOpenExplorer(false);
          setTab("datasets");
        }}
      />
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs text-white/60">{label}</div>
      <div className="text-xl font-semibold mt-1">{value}</div>
    </div>
  );
}

function Row({ cols, head = false }: { cols: string[]; head?: boolean }) {
  return (
    <div className={`${head ? "bg-white/5 text-white/70" : ""} grid`} style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(0,1fr))` }}>
      {cols.map((c, i) => (
        <div key={i} className="px-4 py-3 text-sm">{c}</div>
      ))}
    </div>
  );
}
function Cell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-4 py-3 text-sm ${className}`}>{children}</div>;
}
