"use client";
import { useState, useEffect, useCallback } from "react";
import { useAdmin } from "@/components/admin/AdminContext";
import { TrendingUp, MousePointerClick, Users, HeartHandshake, RefreshCw, Banknote, Trash2 } from "lucide-react";

interface Summary {
  totals: { all: number; month: number; week: number };
  byEvent: { _id: string; count: number }[];
  topCases: { _id: string; name: string; count: number }[];
  topCategories: { _id: string; label: string; count: number }[];
  topAmounts: { _id: string; count: number }[];
  dailyActivity: { _id: { y: number; m: number; d: number }; count: number }[];
  recent: { _id: string; event: string; meta?: Record<string, string>; timestamp: string }[];
}

interface DonationStats {
  totalRaised: number;
  totalTarget: number;
  byCategory: { slug: string; label: string; raised: number; target: number; cases: number }[];
}

interface DonationHistory {
  totals: { all: number; month: number; week: number; day: number };
  byCategory: { categoryId: string; label: string; total: number; count: number }[];
  topCases: { caseId: string; caseNumber: string; caseName: string; total: number; count: number }[];
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

function CategoryFundRow({ label, raised, target, cases }: { label: string; raised: number; target: number; cases: number }) {
  const pct = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : null;
  const fmt = (n: number) => n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n);
  return (
    <div className="py-3 border-b border-white/[0.04] last:border-0">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-white/80 text-sm font-medium">{label}</span>
          <span className="text-white/25 text-xs">{cases} case{cases !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#C9A84C] font-bold tabular-nums">{fmt(raised)} EGP</span>
          {target > 0 && <span className="text-white/25">/ {fmt(target)}</span>}
        </div>
      </div>
      {pct !== null ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.max(2, pct)}%`, background: pct >= 100 ? "#34D399" : "#C9A84C" }}
            />
          </div>
          <span className="text-xs tabular-nums font-semibold w-9 text-right" style={{ color: pct >= 100 ? "#34D399" : "#C9A84C" }}>
            {pct}%
          </span>
        </div>
      ) : (
        <p className="text-white/20 text-xs">No target set</p>
      )}
    </div>
  );
}

export default function InsightsPage() {
  const { fetchWithAuth, admin } = useAdmin();
  const [data, setData]               = useState<Summary | null>(null);
  const [donationStats, setDonationStats] = useState<DonationStats | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [showResetAnalytics, setShowResetAnalytics] = useState(false);
  const [resettingAnalytics, setResettingAnalytics] = useState(false);
  const [donationHistory, setDonationHistory]       = useState<DonationHistory | null>(null);
  const [historyPeriod, setHistoryPeriod]           = useState<"day" | "week" | "month" | "all">("all");
  const [showResetHistory, setShowResetHistory]     = useState(false);
  const [resettingHistory, setResettingHistory]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [analyticsRes, casesRes, catsRes, donationsRes] = await Promise.all([
        fetchWithAuth("/api/analytics"),
        fetchWithAuth("/api/cases"),
        fetchWithAuth("/api/categories"),
        fetchWithAuth("/api/donations"),
      ]);
      const [analyticsJson, casesJson, catsJson, donationsJson] = await Promise.all([
        analyticsRes.json(), casesRes.json(), catsRes.json(), donationsRes.json(),
      ]);

      if (!analyticsJson.success) throw new Error(analyticsJson.error ?? "Failed to load");
      setData(analyticsJson.data);

      if (casesJson.success && catsJson.success) {
        const cases: { categoryId: string; raisedAmount?: number; targetAmount?: number }[] = casesJson.data ?? [];
        const cats:  { _id: string; slug: string; ar: { label: string }; en: { label: string } }[] = catsJson.data ?? [];

        let totalRaised = 0;
        let totalTarget = 0;
        const catMap: Record<string, { raised: number; target: number; cases: number }> = {};

        cats.forEach(c => { catMap[c._id] = { raised: 0, target: 0, cases: 0 }; });

        cases.forEach(c => {
          const r = c.raisedAmount ?? 0;
          const t = c.targetAmount ?? 0;
          totalRaised += r;
          totalTarget += t;
          if (catMap[c.categoryId]) {
            catMap[c.categoryId].raised += r;
            catMap[c.categoryId].target += t;
            catMap[c.categoryId].cases  += 1;
          }
        });

        setDonationStats({
          totalRaised,
          totalTarget,
          byCategory: cats.map(c => ({
            slug:   c.slug,
            label:  c.en.label,
            raised: catMap[c._id]?.raised ?? 0,
            target: catMap[c._id]?.target ?? 0,
            cases:  catMap[c._id]?.cases  ?? 0,
          })).filter(c => c.cases > 0),
        });
      }

      if (donationsJson.success) {
        setDonationHistory(donationsJson.data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  async function handleResetAnalytics() {
    setResettingAnalytics(true);
    try {
      const res  = await fetchWithAuth("/api/analytics", { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setData(null);
      setDonationStats(null);
      setShowResetAnalytics(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setResettingAnalytics(false);
    }
  }

  async function handleResetHistory() {
    setResettingHistory(true);
    try {
      const res  = await fetchWithAuth("/api/donations", { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setDonationHistory(null);
      setShowResetHistory(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setResettingHistory(false);
    }
  }

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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowResetAnalytics(true)}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-400/60 border border-red-500/20 hover:border-red-500/40 hover:text-red-400 transition-all disabled:opacity-40"
          >
            <Trash2 size={14} />
            Reset Analytics
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white/50 border border-white/10 hover:border-white/20 hover:text-white transition-all disabled:opacity-40"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
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
          {/* ── Fundraising stats ─────────────────────────────────────── */}
          {donationStats && (
            <div className="mb-8">
              <h2 className="text-white/40 text-xs font-medium uppercase tracking-widest mb-4">Fundraising Progress</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
                <StatCard
                  label="Total Raised"
                  value={`${(donationStats.totalRaised).toLocaleString()} EGP`}
                  sub="Across all active cases"
                  icon={<Banknote size={16} />}
                />
                <StatCard
                  label="Total Target"
                  value={`${(donationStats.totalTarget).toLocaleString()} EGP`}
                  sub="Sum of all case goals"
                  icon={<TrendingUp size={16} />}
                />
                <StatCard
                  label="Overall Progress"
                  value={donationStats.totalTarget > 0
                    ? `${Math.min(100, Math.round((donationStats.totalRaised / donationStats.totalTarget) * 100))}%`
                    : "—"}
                  sub={donationStats.byCategory.filter(c => c.target > 0 && c.raised >= c.target).length + " categor" + (donationStats.byCategory.filter(c => c.target > 0 && c.raised >= c.target).length === 1 ? "y" : "ies") + " fully funded"}
                  icon={<HeartHandshake size={16} />}
                />
              </div>

              <div className="rounded-2xl border border-white/[0.06] bg-[#141414] p-5">
                <h3 className="text-white/60 text-xs font-medium mb-4 uppercase tracking-widest">By Category</h3>
                {donationStats.byCategory.length === 0 ? (
                  <p className="text-white/20 text-sm text-center py-6">No cases with amounts yet</p>
                ) : (
                  donationStats.byCategory.map(c => (
                    <CategoryFundRow key={c.slug} label={c.label} raised={c.raised} target={c.target} cases={c.cases} />
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── Donation History ─────────────────────────────────────── */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-white/40 text-xs font-medium uppercase tracking-widest">Donation History</h2>
                <p className="text-white/20 text-xs mt-0.5">Cumulative log — unaffected by progress resets</p>
              </div>
              <button
                onClick={() => setShowResetHistory(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-red-400/50 border border-red-500/15 hover:border-red-500/35 hover:text-red-400 transition-all"
              >
                <Trash2 size={12} />
                Reset History
              </button>
            </div>

            {/* Period filter */}
            <div className="flex gap-1.5 mb-5">
              {([
                { key: "day",   label: "Today" },
                { key: "week",  label: "Last 7 days" },
                { key: "month", label: "Last 30 days" },
                { key: "all",   label: "All time" },
              ] as const).map(p => (
                <button
                  key={p.key}
                  onClick={() => setHistoryPeriod(p.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    historyPeriod === p.key
                      ? "bg-[#C9A84C]/15 border-[#C9A84C]/40 text-[#C9A84C]"
                      : "border-white/10 text-white/40 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {donationHistory ? (
              <div className="grid md:grid-cols-3 gap-5">
                {/* Big total */}
                <div className="rounded-2xl border border-white/[0.06] bg-[#141414] p-5 flex flex-col justify-between">
                  <p className="text-white/40 text-xs font-medium mb-2">
                    {{ day: "Today", week: "Last 7 days", month: "Last 30 days", all: "All time" }[historyPeriod]}
                  </p>
                  <div>
                    <p className="text-white text-4xl font-bold tabular-nums leading-none">
                      {(donationHistory.totals[historyPeriod]).toLocaleString()}
                    </p>
                    <p className="text-white/30 text-xs mt-1">EGP raised</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/[0.05] grid grid-cols-3 gap-2 text-center">
                    {(["day", "week", "month"] as const).map(k => (
                      <div key={k}>
                        <p className="text-white/60 text-sm font-bold tabular-nums">{(donationHistory.totals[k]).toLocaleString()}</p>
                        <p className="text-white/25 text-[10px]">{{ day: "Today", week: "7d", month: "30d" }[k]}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* By category */}
                <div className="rounded-2xl border border-white/[0.06] bg-[#141414] p-5">
                  <h3 className="text-white/60 text-xs font-medium mb-4 uppercase tracking-widest">By Category</h3>
                  {donationHistory.byCategory.length === 0 ? (
                    <p className="text-white/20 text-sm text-center py-6">No records yet</p>
                  ) : (
                    <div className="space-y-1">
                      {donationHistory.byCategory.map(c => (
                        <MiniBar
                          key={c.categoryId}
                          label={c.label}
                          count={c.total}
                          max={donationHistory.byCategory[0]?.total ?? 1}
                          accent="#C9A84C"
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Top cases */}
                <div className="rounded-2xl border border-white/[0.06] bg-[#141414] p-5">
                  <h3 className="text-white/60 text-xs font-medium mb-4 uppercase tracking-widest">Top Cases (all time)</h3>
                  {donationHistory.topCases.length === 0 ? (
                    <p className="text-white/20 text-sm text-center py-6">No records yet</p>
                  ) : (
                    <div className="space-y-1">
                      {donationHistory.topCases.map(c => (
                        <MiniBar
                          key={c.caseId}
                          label={`#${c.caseNumber} · ${c.caseName}`}
                          count={c.total}
                          max={donationHistory.topCases[0]?.total ?? 1}
                          accent="#A78BFA"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/[0.06] bg-[#141414] p-8 text-center text-white/20 text-sm">
                No donation records yet. History is logged when raisedAmount is updated on a case.
              </div>
            )}
          </div>

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

      {showResetHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowResetHistory(false)} />
          <div className="relative z-10 w-full max-w-sm bg-[#141414] border border-red-500/20 rounded-3xl p-6">
            <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
              <Trash2 size={18} className="text-red-400" />
            </div>
            <h3 className="text-white font-bold mb-1">Reset Donation History?</h3>
            <p className="text-white/40 text-sm mb-6 leading-relaxed">
              This clears the cumulative donation log. Case progress bars and all other data are <span className="text-white/70">not affected</span>.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowResetHistory(false)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white/50 bg-white/5 hover:bg-white/10 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleResetHistory}
                disabled={resettingHistory}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-red-500/80 text-white hover:bg-red-500 disabled:opacity-50 transition-colors"
              >
                {resettingHistory ? "Clearing…" : "Yes, Reset"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetAnalytics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowResetAnalytics(false)} />
          <div className="relative z-10 w-full max-w-sm bg-[#141414] border border-red-500/20 rounded-3xl p-6">
            <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
              <Trash2 size={18} className="text-red-400" />
            </div>
            <h3 className="text-white font-bold mb-1">Reset Analytics?</h3>
            <p className="text-white/40 text-sm mb-6 leading-relaxed">
              This permanently deletes all visitor events and interaction tracking. Fundraising data and cases are <span className="text-white/70">not affected</span>.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowResetAnalytics(false)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white/50 bg-white/5 hover:bg-white/10 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleResetAnalytics}
                disabled={resettingAnalytics}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-red-500/80 text-white hover:bg-red-500 disabled:opacity-50 transition-colors"
              >
                {resettingAnalytics ? "Clearing…" : "Yes, Reset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
