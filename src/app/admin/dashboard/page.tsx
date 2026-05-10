"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/components/admin/AdminContext";
import Link from "next/link";
import {
  FolderOpen,
  FileText,
  BookOpen,
  Users,
  ScrollText,
  TrendingUp,
  Plus,
} from "lucide-react";

interface Stats {
  categories: number;
  cases: number;
  stories: number;
  admins: number;
}

interface AuditEntry {
  _id: string;
  adminName: string;
  action: string;
  collection: string;
  details: string;
  timestamp: string;
}

const actionColors: Record<string, string> = {
  create: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  update: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  delete: "text-red-400 bg-red-500/10 border-red-500/20",
  login: "text-[#C9A84C] bg-[#C9A84C]/10 border-[#C9A84C]/20",
  logout: "text-white/40 bg-white/5 border-white/10",
};

export default function DashboardPage() {
  const router = useRouter();
  const { fetchWithAuth, admin, loading } = useAdmin();
  const [stats, setStats] = useState<Stats | null>(null);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && admin && admin.role !== "owner") {
      router.replace("/admin/cases");
    }
  }, [loading, admin, router]);

  useEffect(() => {
    if (loading) return;

    async function loadData() {
      try {
        const [catsRes, casesRes, storiesRes, auditRes] = await Promise.all([
          fetchWithAuth("/api/categories"),
          fetchWithAuth("/api/cases"),
          fetchWithAuth("/api/stories"),
          fetchWithAuth("/api/audit?limit=10"),
        ]);

        const [catsData, casesData, storiesData, auditData] =
          await Promise.all([
            catsRes.json(),
            casesRes.json(),
            storiesRes.json(),
            auditRes.ok ? auditRes.json() : { data: [] },
          ]);

        let adminsCount = 0;
        if (admin?.role === "owner") {
          const adminsRes = await fetchWithAuth("/api/admins");
          const adminsData = await adminsRes.json();
          adminsCount = adminsData.data?.filter(
            (a: { isActive: boolean }) => a.isActive
          ).length ?? 0;
        }

        setStats({
          categories: catsData.data?.filter(
            (c: { isActive: boolean }) => c.isActive
          ).length ?? 0,
          cases: casesData.data?.filter(
            (c: { isActive: boolean }) => c.isActive
          ).length ?? 0,
          stories: storiesData.data?.filter(
            (s: { isActive: boolean }) => s.isActive
          ).length ?? 0,
          admins: adminsCount,
        });

        setAuditLog(auditData.data ?? []);
      } catch {
        // silent
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
  }, [fetchWithAuth, admin, loading]);

  const statCards = [
    {
      label: "Active Categories",
      value: stats?.categories,
      icon: <FolderOpen size={20} />,
      href: "/admin/categories",
      color: "text-orange-400",
    },
    {
      label: "Active Cases",
      value: stats?.cases,
      icon: <FileText size={20} />,
      href: "/admin/cases",
      color: "text-blue-400",
    },
    {
      label: "Impact Stories",
      value: stats?.stories,
      icon: <BookOpen size={20} />,
      href: "/admin/stories",
      color: "text-purple-400",
    },
    ...(admin?.role === "owner"
      ? [
          {
            label: "Active Admins",
            value: stats?.admins,
            icon: <Users size={20} />,
            href: "/admin/admins",
            color: "text-emerald-400",
          },
        ]
      : []),
  ];

  const quickActions = [
    { label: "Add Category", href: "/admin/categories", icon: <Plus size={14} /> },
    { label: "Add Case", href: "/admin/cases", icon: <Plus size={14} /> },
    { label: "Add Story", href: "/admin/stories", icon: <Plus size={14} /> },
    { label: "Edit Content", href: "/admin/content", icon: <Plus size={14} /> },
  ];

  return (
    <div className="px-4 py-6 sm:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-white text-2xl font-bold">Dashboard</h1>
        <p className="text-white/40 text-sm mt-1">
          Welcome back, {admin?.name ?? "Admin"}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {loadingData
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-[#141414] border border-white/[0.06] animate-pulse"
              />
            ))
          : statCards.map((card) => (
              <Link
                key={card.label}
                href={card.href}
                className="group rounded-2xl border border-white/[0.06] bg-[#141414] p-5 hover:border-white/10 transition-all hover:bg-[#1a1a1a]"
              >
                <div className={`mb-3 ${card.color}`}>{card.icon}</div>
                <p className="text-white text-2xl font-bold">
                  {card.value ?? "—"}
                </p>
                <p className="text-white/40 text-xs mt-1">{card.label}</p>
              </Link>
            ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        {/* Audit log */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#141414] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <ScrollText size={16} className="text-white/40" />
              Recent Activity
            </div>
            <Link
              href="/admin/audit"
              className="text-white/30 text-xs hover:text-white/60 transition-colors"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {loadingData ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 px-5 flex items-center animate-pulse"
                >
                  <div className="w-full h-4 bg-white/5 rounded" />
                </div>
              ))
            ) : auditLog.length === 0 ? (
              <div className="px-5 py-8 text-center text-white/25 text-sm">
                No activity yet
              </div>
            ) : (
              auditLog.map((entry) => (
                <div
                  key={entry._id}
                  className="px-5 py-3 flex items-start gap-3"
                >
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border flex-shrink-0 mt-0.5 ${actionColors[entry.action] ?? "text-white/40 bg-white/5 border-white/10"}`}
                  >
                    {entry.action}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/70 text-sm truncate">
                      {entry.details}
                    </p>
                    <p className="text-white/30 text-xs mt-0.5">
                      {entry.adminName} ·{" "}
                      {new Date(entry.timestamp).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/[0.06] bg-[#141414] p-5">
            <div className="flex items-center gap-2 text-white font-semibold text-sm mb-4">
              <TrendingUp size={16} className="text-white/40" />
              Quick Actions
            </div>
            <div className="space-y-2">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/[0.04] transition-all"
                >
                  <span className="text-[#C9A84C]">{action.icon}</span>
                  {action.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Info card */}
          <div className="rounded-2xl border border-[#C9A84C]/20 bg-[#C9A84C]/5 p-5">
            <p className="text-[#C9A84C] text-xs font-semibold uppercase tracking-wider mb-2">
              Tip
            </p>
            <p className="text-white/50 text-xs leading-relaxed">
              Changes made here are reflected on the public site in real-time.
              Use the seed route to populate the database with default content.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
