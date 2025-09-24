"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TopNav from "@/components/nav/TopNav";

/* ----------------------------- Types & Models ----------------------------- */
type KPI = {
  id: string;
  question: string;        // e.g., "What were my sales in May?"
  value: string;           // e.g., "$1,234,567"
  lastUpdated: string;     // ISO string
  unit?: string;
};

type QA = {
  id: string;
  question: string;
  answer: string;
  createdAt: string;       // ISO
};

/* ------------------------------- Utilities -------------------------------- */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

function formatTimeAgo(iso: string) {
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

/* ------------------------------- Page ------------------------------------- */
export default function DashboardPage() {
  const router = useRouter();

  // Basic auth guard (localStorage for now; you can switch to HttpOnly cookie later)
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  // Data (local-first placeholder; wire to backend soon)
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [qa, setQa] = useState<QA[]>([]);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("nex_token") : null;
    const email = typeof window !== "undefined" ? localStorage.getItem("nex_user") : null;

    if (!token) {
      router.replace("/login?next=/dashboard");
      return;
    }

    setUserEmail(email);

    // Load KPIs & QAs from localStorage for now
    try {
      const savedKpis = localStorage.getItem("nex_kpis");
      const savedQa = localStorage.getItem("nex_qa");

      if (savedKpis) {
        setKpis(JSON.parse(savedKpis));
      } else {
        // Seed example KPIs for first render
        const sample: KPI[] = [
          {
            id: "kpi-1",
            question: "What were my sales in May?",
            value: "₹ 1,24,50,000",
            lastUpdated: new Date().toISOString(),
          },
          {
            id: "kpi-2",
            question: "How many orders did we receive yesterday?",
            value: "3,482",
            lastUpdated: new Date().toISOString(),
          },
          {
            id: "kpi-3",
            question: "Top SKU by revenue (last 7 days)?",
            value: "SKU-AX910",
            lastUpdated: new Date().toISOString(),
          },
        ];
        setKpis(sample);
        localStorage.setItem("nex_kpis", JSON.stringify(sample));
      }

      if (savedQa) {
        setQa(JSON.parse(savedQa));
      } else {
        const sampleQa: QA[] = [
          {
            id: "qa-1",
            question: "What were my sales in May?",
            answer: "₹ 1,24,50,000",
            createdAt: new Date().toISOString(),
          },
          {
            id: "qa-2",
            question: "Average order value last month?",
            answer: "₹ 4,320",
            createdAt: new Date().toISOString(),
          },
        ];
        setQa(sampleQa);
        localStorage.setItem("nex_qa", JSON.stringify(sampleQa));
      }
    } catch {
      // ignore for now
    } finally {
      setChecking(false);
    }
  }, [router]);

  // Stub: refresh all KPIs (later: call your backend to recompute)
  async function refreshKpis() {
    // Example: await fetch(`${API_BASE}/kpis/refresh`, { method: "POST" });
    const updated = kpis.map(k => ({ ...k, lastUpdated: new Date().toISOString() }));
    setKpis(updated);
    localStorage.setItem("nex_kpis", JSON.stringify(updated));
  }

  if (checking) {
    return (
      <main className="min-h-dvh bg-gray-950 text-white">
        <TopNav variant="dashboard" />
        <div className="max-w-7xl mx-auto p-6">
          <div className="h-8 w-64 bg-white/10 rounded animate-pulse" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-gray-950 text-white">
      {/* Animated, sticky global nav with Dashboard tab */}
      <TopNav variant="dashboard" />

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Heading + actions */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="text-white/60">Pinned KPIs and recent questions</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshKpis}
              className="rounded-lg bg-white/10 hover:bg-white/20 px-3 py-2 text-sm"
              title="Refresh KPIs"
            >
              Refresh
            </button>
            <a
              href="/assistant"
              className="rounded-lg bg-indigo-500/90 hover:bg-indigo-500 px-3 py-2 text-sm"
              title="Ask NEX Assistant"
            >
              Ask NEX Assistant
            </a>
          </div>
        </div>

        {/* KPI Grid */}
        <section className="mt-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpis.map(k => (
              <div
                key={k.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition"
              >
                <div className="text-xs uppercase tracking-wide text-white/60">
                  KPI
                </div>
                <div className="text-base font-semibold mt-1">
                  {k.question}
                </div>
                <div className="text-2xl font-bold mt-3">{k.value}</div>
                <div className="text-xs text-white/50 mt-2">
                  Last updated {formatTimeAgo(k.lastUpdated)}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Q&A */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Recent Q&A</h2>
          <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 divide-y divide-white/10">
            {qa.length === 0 && (
              <div className="p-4 text-white/60">No questions yet. Ask something in NEX Assistant.</div>
            )}
            {qa.map(item => (
              <div key={item.id} className="p-4">
                <div className="text-sm text-white/70">Q: {item.question}</div>
                <div className="text-base font-semibold mt-1">A: {item.answer}</div>
                <div className="text-xs text-white/50 mt-1">
                  {formatTimeAgo(item.createdAt)}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
