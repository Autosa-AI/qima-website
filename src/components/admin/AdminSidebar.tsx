"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  BookOpen,
  Type,
  Users,
  ScrollText,
  LogOut,
  Sparkles,
  BarChart2,
  X,
} from "lucide-react";
import { useAdmin } from "./AdminContext";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  ownerOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { href: "/admin/categories", label: "Categories", icon: <FolderOpen size={18} /> },
  { href: "/admin/cases", label: "Cases", icon: <FileText size={18} /> },
  { href: "/admin/stories", label: "Stories", icon: <BookOpen size={18} /> },
  { href: "/admin/content", label: "Content", icon: <Type size={18} /> },
  { href: "/admin/admins",   label: "Admins",    icon: <Users size={18} />,    ownerOnly: true },
  { href: "/admin/insights", label: "Insights",  icon: <BarChart2 size={18} />, ownerOnly: true },
  { href: "/admin/audit",    label: "Audit Log", icon: <ScrollText size={18} /> },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { admin, loading, logout } = useAdmin();

  const sidebarContent = (
    <aside className="h-full w-60 bg-[#111111] border-r border-white/[0.06] flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#C9A84C]/15 border border-[#C9A84C]/30 flex items-center justify-center">
            <Sparkles size={15} className="text-[#C9A84C]" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Qima</p>
            <p className="text-white/30 text-[10px]">Admin Panel</p>
          </div>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="lg:hidden text-white/40 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/[0.06]"
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          if (item.ownerOnly && (loading || admin?.role !== "owner")) return null;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const label = item.href === "/admin/audit" && admin?.role !== "owner"
            ? "My Activity"
            : item.label;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/20"
                  : "text-white/50 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <span className={isActive ? "text-[#C9A84C]" : "text-white/40"}>
                {item.icon}
              </span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 border-t border-white/[0.06] pt-4">
        {admin && (
          <div className="px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] mb-2">
            <p className="text-white text-sm font-medium truncate">{admin.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                  admin.role === "owner"
                    ? "bg-[#C9A84C]/20 text-[#C9A84C]"
                    : "bg-white/10 text-white/40"
                }`}
              >
                {admin.role}
              </span>
              <span className="text-white/30 text-xs truncate">{admin.email}</span>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop: always-visible fixed sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 h-screen w-60 z-40">
        {sidebarContent}
      </div>

      {/* Mobile: slide-over overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Sidebar panel */}
          <div className="relative w-60 h-full flex-shrink-0">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
