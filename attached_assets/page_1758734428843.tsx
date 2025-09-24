"use client";

import { useEffect, useState } from "react";
import { listCSVs, uploadCSV, queryCSV } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function DataPage() {
  const router = useRouter();

  const [files, setFiles] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [q, setQ] = useState("");
  const [resultText, setResultText] = useState("");
  const [tableHtml, setTableHtml] = useState<string>("");
  const [img, setImg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 🔒 Client-side guard to handle forward/back cache
  useEffect(() => {
    const hasCookie = document.cookie.split("; ").some((c) => c.startsWith("nex_token="));
    const hasLocal = !!localStorage.getItem("nex_token");
    if (!hasCookie && !hasLocal) {
      router.replace("/login?next=/data");
    }
  }, [router]);

  async function refresh() {
    const res = await listCSVs();
    setFiles(res.files || []);
    if (!selected && res.files?.length) setSelected(res.files[0]);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    await uploadCSV(f);
    await refresh();
  }

  async function runQuery() {
    if (!q || !selected) return;
    setLoading(true);
    setImg(null);
    setTableHtml("");
    setResultText("");

    try {
      const res = await queryCSV(q, selected);

      // 1) Chart image
      if ("imageUrl" in res) {
        setImg(res.imageUrl);
        return;
      }

      // 2) HTML table
      if ("html" in res) {
        setTableHtml(res.html || "");
        return;
      }

      // 3) Text-only normalization
      const msg =
        (res?.summary && res.summary !== "Error occurred")
          ? res.summary
          : (typeof res?.result === "string"
              ? res.result
              : (res?.message ?? (res ? JSON.stringify(res, null, 2) : "")));

      setResultText(String(msg ?? ""));
    } catch (e: any) {
      setResultText(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh bg-gray-950 text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold">Data</h1>

        {/* Upload */}
        <div className="rounded-2xl border border-white/10 p-5">
          <label className="block text-sm text-white/70 mb-2">Upload CSV</label>
          <input
            type="file"
            accept=".csv"
            onChange={handleUpload}
            className="file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-white hover:file:bg-white/20"
          />
        </div>

        {/* File + Query */}
        <div className="rounded-2xl border border-white/10 p-5 grid md:grid-cols-3 gap-4">
          <div className="space-y-3">
            <label className="block text-sm text-white/70">Choose file</label>
            {/* Native select with readable colors */}
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full rounded-lg bg-white text-black border border-white/10 p-2"
            >
              <option value="" className="text-black">-- Select --</option>
              {files.map((f) => (
                <option key={f} value={f} className="text-black">{f}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 space-y-3">
            <label className="block text-sm text-white/70">Ask a data question</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="e.g., total sales by month table format"
              className="w-full rounded-lg bg-white/5 border border-white/10 p-2"
              onKeyDown={(e) => { if (e.key === "Enter") runQuery(); }}
            />
            <button
              onClick={runQuery}
              disabled={loading || !q || !selected}
              className="rounded-lg bg-white/10 hover:bg-white/20 px-4 py-2"
            >
              {loading ? "Running..." : "Run"}
            </button>
          </div>
        </div>

        {/* Result */}
        <div className="rounded-2xl border border-white/10 p-5">
          <h2 className="text-lg font-medium">Result</h2>
          <div className="mt-3">
            {img ? (
              <img
                src={img}
                alt="chart"
                className="rounded-xl border border-white/10"
              />
            ) : tableHtml ? (
              <div
                className="overflow-x-auto rounded-xl border border-white/10"
                dangerouslySetInnerHTML={{ __html: tableHtml }}
              />
            ) : (
              <p className="text-sm text-white/90">
                {resultText || "No result yet."}
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
