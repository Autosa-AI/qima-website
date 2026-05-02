"use client";
import { AdminProvider } from "@/components/admin/AdminContext";
import { ToastProvider } from "@/components/admin/Toast";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { usePathname } from "next/navigation";

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin" || pathname === "/admin/";

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]" style={{ fontFamily: "Urbanist, sans-serif" }}>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex" style={{ fontFamily: "Urbanist, sans-serif" }}>
      <AdminSidebar />
      <main className="flex-1 ml-60 min-h-screen overflow-x-hidden">
        {children}
      </main>
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
