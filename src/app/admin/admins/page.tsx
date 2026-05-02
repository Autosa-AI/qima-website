"use client";
import { useState, useEffect, useCallback } from "react";
import { useAdmin } from "@/components/admin/AdminContext";
import { useToast } from "@/components/admin/Toast";
import ConfirmModal from "@/components/admin/ConfirmModal";
import FormField from "@/components/admin/FormField";
import { Plus, UserX, UserCheck, Crown } from "lucide-react";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: "owner" | "admin";
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

interface FormState {
  name: string;
  email: string;
  password: string;
}

const EMPTY_FORM: FormState = { name: "", email: "", password: "" };

export default function AdminsPage() {
  const { fetchWithAuth, admin: currentAdmin } = useAdmin();
  const { toast } = useToast();

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<FormState>>({});
  const [saving, setSaving] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState<AdminUser | null>(null);

  const fetchAdmins = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/api/admins");
      const data = await res.json();
      if (data.success) setAdmins(data.data ?? []);
      else if (res.status === 403) toast("Owner access required", "error");
    } catch {
      toast("Failed to load admins", "error");
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, toast]);

  useEffect(() => {
    if (currentAdmin?.role === "owner") fetchAdmins();
  }, [fetchAdmins, currentAdmin]);

  if (currentAdmin?.role !== "owner") {
    return (
      <div className="p-8 text-center">
        <p className="text-white/40 mt-16">Owner access required to manage admins.</p>
      </div>
    );
  }

  function validate(): boolean {
    const errors: Partial<FormState> = {};
    if (!form.name.trim()) errors.name = "Name is required";
    if (!form.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Invalid email";
    if (!form.password) errors.password = "Password is required";
    else if (form.password.length < 8) errors.password = "Min 8 characters";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleCreate() {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await fetchWithAuth("/api/admins", {
        method: "POST",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast("Admin created", "success");
      setShowModal(false);
      setForm(EMPTY_FORM);
      fetchAdmins();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to create", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(a: AdminUser) {
    try {
      const res = await fetchWithAuth(`/api/admins/${a._id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !a.isActive }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast(`Admin ${a.isActive ? "deactivated" : "activated"}`, "success");
      fetchAdmins();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update", "error");
    } finally {
      setConfirmToggle(null);
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white text-2xl font-bold">Admins</h1>
          <p className="text-white/40 text-sm mt-1">Manage admin accounts</p>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setFormErrors({}); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C9A84C] text-black text-sm font-bold hover:bg-[#d4b05a] transition-colors"
        >
          <Plus size={16} />
          Add Admin
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-[#141414] border border-white/[0.06] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.06] bg-[#141414] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-5 py-3 text-white/40 text-xs font-medium">Name</th>
                <th className="text-left px-5 py-3 text-white/40 text-xs font-medium">Email</th>
                <th className="text-left px-5 py-3 text-white/40 text-xs font-medium">Role</th>
                <th className="text-left px-5 py-3 text-white/40 text-xs font-medium">Status</th>
                <th className="text-left px-5 py-3 text-white/40 text-xs font-medium">Created</th>
                <th className="text-left px-5 py-3 text-white/40 text-xs font-medium">Last Login</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {admins.map((a) => {
                const isSelf = a._id === currentAdmin?._id;
                return (
                  <tr
                    key={a._id}
                    className={`hover:bg-white/[0.02] transition-colors ${isSelf ? "bg-[#C9A84C]/[0.03]" : ""}`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-medium">{a.name}</span>
                        {isSelf && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#C9A84C]/20 text-[#C9A84C] font-bold">you</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-white/50 text-sm">{a.email}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                        a.role === "owner"
                          ? "bg-[#C9A84C]/15 text-[#C9A84C] border-[#C9A84C]/30"
                          : "bg-white/5 text-white/40 border-white/10"
                      }`}>
                        {a.role === "owner" && <Crown size={10} />}
                        {a.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${
                        a.isActive
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}>
                        {a.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-white/30 text-xs">
                      {new Date(a.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3.5 text-white/30 text-xs">
                      {a.lastLoginAt
                        ? new Date(a.lastLoginAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                        : "Never"}
                    </td>
                    <td className="px-5 py-3.5">
                      {!isSelf && a.role !== "owner" && (
                        <button
                          onClick={() => setConfirmToggle(a)}
                          className={`p-1.5 rounded-lg transition-all ${
                            a.isActive
                              ? "text-white/30 hover:text-red-400 hover:bg-red-500/10"
                              : "text-white/30 hover:text-emerald-400 hover:bg-emerald-500/10"
                          }`}
                          title={a.isActive ? "Deactivate" : "Activate"}
                        >
                          {a.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Admin Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-[#141414] p-6 shadow-2xl">
            <h2 className="text-white font-bold text-lg mb-5">Add Admin</h2>
            <div className="space-y-4">
              <FormField
                label="Full Name"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: (e.target as HTMLInputElement).value }))}
                placeholder="Jane Smith"
                error={formErrors.name}
              />
              <FormField
                label="Email"
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: (e.target as HTMLInputElement).value }))}
                placeholder="jane@qima.org"
                error={formErrors.email}
              />
              <FormField
                label="Password"
                required
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: (e.target as HTMLInputElement).value }))}
                placeholder="Min 8 characters"
                error={formErrors.password}
              />
              <p className="text-white/30 text-xs">
                Role will be set to <strong className="text-white/50">admin</strong> (cannot create another owner via dashboard).
              </p>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-white/60 bg-white/5 hover:bg-white/10 transition-colors">
                Cancel
              </button>
              <button onClick={handleCreate} disabled={saving} className="px-4 py-2 rounded-xl text-sm font-bold bg-[#C9A84C] text-black hover:bg-[#d4b05a] disabled:opacity-50 transition-colors">
                {saving ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmToggle && (
        <ConfirmModal
          title={confirmToggle.isActive ? "Deactivate Admin" : "Activate Admin"}
          message={`Are you sure you want to ${confirmToggle.isActive ? "deactivate" : "activate"} ${confirmToggle.name}?`}
          danger={confirmToggle.isActive}
          onConfirm={() => handleToggle(confirmToggle)}
          onCancel={() => setConfirmToggle(null)}
          confirmLabel={confirmToggle.isActive ? "Deactivate" : "Activate"}
        />
      )}
    </div>
  );
}
