"use client";
import { useState } from "react";
import { AdminProvider } from "@/components/admin/AdminContext";
import { ToastProvider } from "@/components/admin/Toast";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { usePathname } from "next/navigation";
import { Menu, Sparkles } from "lucide-react";

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLoginPage = pathname === "/admin" || pathname === "/admin/";

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]" style={{ fontFamily: "Urbanist, sans-serif" }}>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]" style={{ fontFamily: "Urbanist, sans-serif" }}>
      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-[#111111] border-b border-white/[0.06] flex items-center px-4 gap-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-white/50 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/[0.06]"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#C9A84C]/15 border border-[#C9A84C]/30 flex items-center justify-center">
            <Sparkles size={13} className="text-[#C9A84C]" />
          </div>
          <p className="text-white font-bold text-sm">Qima Admin</p>
        </div>
      </header>

      <div className="flex min-h-screen">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 lg:ml-60 min-h-screen overflow-x-hidden pt-14 lg:pt-0">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <AdminProvider>
        <AdminLayoutInner>{children}</AdminLayoutInner>
      </AdminProvider>
    </ToastProvider>
  );
}
