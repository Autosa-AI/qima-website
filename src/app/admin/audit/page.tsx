"use client";
import { useState, useEffect, useCallback } from "react";
import { useAdmin } from "@/components/admin/AdminContext";
import { useToast } from "@/components/admin/Toast";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";

interface AuditEntry {
  _id: string;
  adminName: string;
  action: "create" | "update" | "delete" | "login" | "logout";
  collection: string;
  details: string;
  timestamp: string;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const ACTION_FILTERS = [
  { value: "all", label: "All" },
  { value: "create", label: "Create" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
];

const actionColors: Record<string, string> = {
  create: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  update: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  delete: "text-red-400 bg-red-500/10 border-red-500/20",
  login: "text-[#C9A84C] bg-[#C9A84C]/10 border-[#C9A84C]/20",
  logout: "text-white/40 bg-white/5 border-white/10",
};

export default function AuditPage() {
  const { fetchWithAuth, admin } = useAdmin();
  const isOwner = admin?.role === "owner";
  const { toast } = useToast();

  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: 20, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("all");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        ...(actionFilter !== "all" ? { action: actionFilter } : {}),
      });
      const res = await fetchWithAuth(`/api/audit?${params}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.data ?? []);
        setMeta(data.meta ?? { total: 0, page: 1, limit: 20, pages: 0 });
      }
    } catch {
      toast("Failed to load audit log", "error");
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, page, actionFilter, toast]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  function handleFilterChange(filter: string) {
    setActionFilter(filter);
    setPage(1);
  }

  return (
    <div className="px-4 py-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-white text-2xl font-bold">{isOwner ? "Audit Log" : "My Activity"}</h1>
          <p className="text-white/40 text-sm mt-1">
            {isOwner ? `${meta.total} total entries` : `${meta.total} entries · your actions only`}
          </p>
        </div>

        {/* Action filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-white/30 flex-shrink-0" />
          <div className="flex gap-1 flex-wrap">
            {ACTION_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => handleFilterChange(f.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  actionFilter === f.value
                    ? "bg-[#C9A84C]/15 border-[#C9A84C]/40 text-[#C9A84C]"
                    : "border-white/10 text-white/40 hover:border-white/20 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-[#141414] overflow-x-auto">
        <table className="w-full min-w-[520px]">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left px-5 py-3 text-white/40 text-xs font-medium">Action</th>
              {isOwner && <th className="text-left px-5 py-3 text-white/40 text-xs font-medium">Admin</th>}
              <th className="text-left px-5 py-3 text-white/40 text-xs font-medium">Collection</th>
              <th className="text-left px-5 py-3 text-white/40 text-xs font-medium">Details</th>
              <th className="text-left px-5 py-3 text-white/40 text-xs font-medium">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={isOwner ? 5 : 4} className="px-5 py-3.5">
                    <div className="h-4 bg-white/5 rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={isOwner ? 5 : 4} className="px-5 py-12 text-center text-white/25 text-sm">
                  No entries found
                </td>
              </tr>
            ) : (
              logs.map((entry) => (
                <tr key={entry._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${actionColors[entry.action] ?? "text-white/40 bg-white/5 border-white/10"}`}>
                      {entry.action}
                    </span>
                  </td>
                  {isOwner && <td className="px-5 py-3.5 text-white/70 text-sm">{entry.adminName}</td>}
                  <td className="px-5 py-3.5 text-white/40 text-xs font-mono">{entry.collection}</td>
                  <td className="px-5 py-3.5 text-white/50 text-sm max-w-sm truncate">{entry.details}</td>
                  <td className="px-5 py-3.5 text-white/30 text-xs">
                    {new Date(entry.timestamp).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {meta.pages > 1 && (
          <div className="px-5 py-4 border-t border-white/[0.06] flex items-center justify-between">
            <p className="text-white/30 text-xs">
              Page {meta.page} of {meta.pages} · {meta.total} entries
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: Math.min(5, meta.pages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(meta.pages - 4, page - 2)) + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                      pageNum === page
                        ? "bg-[#C9A84C] text-black"
                        : "text-white/40 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
                disabled={page >= meta.pages}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
