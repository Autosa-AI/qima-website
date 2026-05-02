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
  { href: "/admin/admins", label: "Admins", icon: <Users size={18} />, ownerOnly: true },
  { href: "/admin/audit", label: "Audit Log", icon: <ScrollText size={18} /> },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { admin, logout } = useAdmin();

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-[#111111] border-r border-white/[0.06] flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#C9A84C]/15 border border-[#C9A84C]/30 flex items-center justify-center">
            <Sparkles size={15} className="text-[#C9A84C]" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Qima</p>
            <p className="text-white/30 text-[10px]">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          if (item.ownerOnly && admin?.role !== "owner") return null;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/20"
                  : "text-white/50 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <span
                className={isActive ? "text-[#C9A84C]" : "text-white/40"}
              >
                {item.icon}
              </span>
              {item.label}
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
}
