"use client";
import { useState, useEffect, useCallback } from "react";
import { useAdmin } from "@/components/admin/AdminContext";
import { TrendingUp, MousePointerClick, Users, HeartHandshake, RefreshCw } from "lucide-react";

interface Summary {
  totals: { all: number; month: number; week: number };
  byEvent: { _id: string; count: number }[];
  topCases: { _id: string; name: string; count: number }[];
  topCategories: { _id: string; label: string; count: number }[];
  topAmounts: { _id: string; count: number }[];
  dailyActivity: { _id: { y: number; m: number; d: number }; count: number }[];
  recent: { _id: string; event: string; meta?: Record<string, string>; timestamp: string }[];
}

const EVENT_LABELS: Record<string, string> = {
  page_view:      "Page Views",
  donate_intent:  "Donate Button Clicks",
  case_select:    "Case Selections",
  category_click: "Category Clicks",
};

function StatCard({ label, value, sub, icon }: { label: string; value: number | string; sub?: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#141414] p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-white/40 text-xs font-medium">{label}</p>
        <span className="text-white/20">{icon}</span>
      </div>
      <p className="text-white text-3xl font-bold tabular-nums">{value.toLocaleString()}</p>
      {sub && <p className="text-white/30 text-xs mt-1">{sub}</p>}
    </div>
  );
}

function MiniBar({ label, count, max, accent = "#C9A84C" }: { label: string; count: number; max: number; accent?: string }) {
  const pct = max > 0 ? Math.max(4, Math.round((count / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <p className="text-white/60 text-xs w-40 truncate flex-shrink-0">{label}</p>
      <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: accent }} />
      </div>
      <span className="text-white/40 text-xs w-8 text-right tabular-nums">{count}</span>
    </div>
  );
}

export default function InsightsPage() {
  const { fetchWithAuth, admin } = useAdmin();
  const [data, setData]         = useState<Summary | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await fetchWithAuth("/api/analytics");
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to load");
      setData(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => { if (admin?.role === "owner") load(); }, [load, admin]);

  if (admin?.role !== "owner") {
    return <div className="p-8 text-center text-white/30 mt-20">Owner access required.</div>;
  }

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white text-2xl font-bold">Insights</h1>
          <p className="text-white/40 text-sm mt-1">Cumulative visitor & interaction analytics</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white/50 border border-white/10 hover:border-white/20 hover:text-white transition-all disabled:opacity-40"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}

      {loading && !data ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="h-28 rounded-2xl bg-[#141414] border border-white/[0.06] animate-pulse" />)}
        </div>
      ) : data ? (
        <>
          {/* ── KPI row ───────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Total Events"
              value={data.totals.all}
              sub="All time"
              icon={<TrendingUp size={16} />}
            />
            <StatCard
              label="This Month"
              value={data.totals.month}
              sub="Last 30 days"
              icon={<MousePointerClick size={16} />}
            />
            <StatCard
              label="This Week"
              value={data.totals.week}
              sub="Last 7 days"
              icon={<Users size={16} />}
            />
            <StatCard
              label="Donate Intents"
              value={data.byEvent.find(e => e._id === "donate_intent")?.count ?? 0}
              sub="WhatsApp button clicks"
              icon={<HeartHandshake size={16} />}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* ── Daily activity chart ──────────────────────────────── */}
            <div className="rounded-2xl border border-white/[0.06] bg-[#141414] p-5">
              <h3 className="text-white/60 text-xs font-medium mb-4 uppercase tracking-widest">Daily Activity — Last 30 Days</h3>
              {data.dailyActivity.length === 0 ? (
                <p className="text-white/20 text-sm text-center py-8">No data yet</p>
              ) : (
                <div className="flex items-end gap-1 h-24">
                  {(() => {
                    const max = Math.max(...data.dailyActivity.map(d => d.count), 1);
                    // Fill last 30 days
                    const filled: number[] = [];
                    const today = new Date();
                    for (let i = 29; i >= 0; i--) {
                      const d = new Date(today.getTime() - i * 86_400_000);
                      const match = data.dailyActivity.find(
                        a => a._id.y === d.getFullYear() && a._id.m === d.getMonth() + 1 && a._id.d === d.getDate()
                      );
                      filled.push(match?.count ?? 0);
                    }
                    return filled.map((v, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full rounded-sm transition-all"
                          style={{
                            height: `${Math.max(2, Math.round((v / max) * 96))}px`,
                            background: v > 0 ? "#C9A84C" : "rgba(255,255,255,0.04)",
                          }}
                          title={`${v} events`}
                        />
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>

            {/* ── Events breakdown ─────────────────────────────────── */}
            <div className="rounded-2xl border border-white/[0.06] bg-[#141414] p-5">
              <h3 className="text-white/60 text-xs font-medium mb-4 uppercase tracking-widest">Events Breakdown</h3>
              {data.byEvent.length === 0 ? (
                <p className="text-white/20 text-sm text-center py-8">No events yet</p>
              ) : (
                <div className="space-y-1">
                  {data.byEvent.slice(0, 8).map(e => (
                    <MiniBar
                      key={e._id}
                      label={EVENT_LABELS[e._id] ?? e._id}
                      count={e.count}
                      max={data.byEvent[0]?.count ?? 1}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-6">
            {/* ── Top cases ───────────────────────────────────────── */}
            <div className="rounded-2xl border border-white/[0.06] bg-[#141414] p-5">
              <h3 className="text-white/60 text-xs font-medium mb-4 uppercase tracking-widest">Top Selected Cases</h3>
              {data.topCases.length === 0 ? (
                <p className="text-white/20 text-sm text-center py-6">No selections yet</p>
              ) : (
                <div className="space-y-1">
                  {data.topCases.map(c => (
                    <MiniBar
                      key={c._id}
                      label={`#${c._id}${c.name ? ` · ${c.name}` : ""}`}
                      count={c.count}
                      max={data.topCases[0]?.count ?? 1}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── Top categories ──────────────────────────────────── */}
            <div className="rounded-2xl border border-white/[0.06] bg-[#141414] p-5">
              <h3 className="text-white/60 text-xs font-medium mb-4 uppercase tracking-widest">Top Categories</h3>
              {data.topCategories.length === 0 ? (
                <p className="text-white/20 text-sm text-center py-6">No clicks yet</p>
              ) : (
                <div className="space-y-1">
                  {data.topCategories.map(c => (
                    <MiniBar
                      key={c._id}
                      label={c.label || c._id}
                      count={c.count}
                      max={data.topCategories[0]?.count ?? 1}
                      accent="#A78BFA"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── Amount distribution ─────────────────────────────── */}
            <div className="rounded-2xl border border-white/[0.06] bg-[#141414] p-5">
              <h3 className="text-white/60 text-xs font-medium mb-4 uppercase tracking-widest">Donation Amounts</h3>
              {data.topAmounts.length === 0 ? (
                <p className="text-white/20 text-sm text-center py-6">No intents yet</p>
              ) : (
                <div className="space-y-1">
                  {data.topAmounts.map(a => (
                    <MiniBar
                      key={a._id}
                      label={a._id === "custom" ? "Custom amount" : `EGP ${a._id}`}
                      count={a.count}
                      max={data.topAmounts[0]?.count ?? 1}
                      accent="#34D399"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Recent events ───────────────────────────────────────── */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#141414] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <h3 className="text-white/60 text-xs font-medium uppercase tracking-widest">Recent Events</h3>
            </div>
            {data.recent.length === 0 ? (
              <p className="text-white/20 text-sm text-center py-8">No events yet</p>
            ) : (
              <table className="w-full">
                <tbody className="divide-y divide-white/[0.03]">
                  {data.recent.map(e => (
                    <tr key={e._id} className="hover:bg-white/[0.015] transition-colors">
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-white/5 text-white/50 border border-white/[0.06]">
                          {EVENT_LABELS[e.event] ?? e.event}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-white/30 text-xs">
                        {e.meta && Object.entries(e.meta)
                          .filter(([, v]) => v)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(" · ")}
                      </td>
                      <td className="px-5 py-3 text-white/25 text-xs text-right whitespace-nowrap">
                        {new Date(e.timestamp).toLocaleString("en-GB", {
                          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
