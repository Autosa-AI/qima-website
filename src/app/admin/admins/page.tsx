"use client";
import { useState, useEffect, useCallback } from "react";
import { useAdmin } from "@/components/admin/AdminContext";
import { useToast } from "@/components/admin/Toast";
import ConfirmModal from "@/components/admin/ConfirmModal";
import FormField from "@/components/admin/FormField";
import { Plus, UserX, UserCheck, Crown, Edit2, Trash2, KeyRound } from "lucide-react";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: "owner" | "admin";
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

interface CreateForm { name: string; email: string; password: string }
interface EditForm   { name: string; email: string; password: string }

const EMPTY_CREATE: CreateForm = { name: "", email: "", password: "" };
const EMPTY_EDIT:   EditForm   = { name: "", email: "", password: "" };

export default function AdminsPage() {
  const { fetchWithAuth, admin: currentAdmin } = useAdmin();
  const { toast } = useToast();

  const [admins, setAdmins]                 = useState<AdminUser[]>([]);
  const [loading, setLoading]               = useState(true);

  // Create
  const [showCreate, setShowCreate]         = useState(false);
  const [createForm, setCreateForm]         = useState<CreateForm>(EMPTY_CREATE);
  const [createErrors, setCreateErrors]     = useState<Partial<CreateForm>>({});
  const [creating, setCreating]             = useState(false);

  // Edit
  const [editTarget, setEditTarget]         = useState<AdminUser | null>(null);
  const [editForm, setEditForm]             = useState<EditForm>(EMPTY_EDIT);
  const [editErrors, setEditErrors]         = useState<Partial<EditForm>>({});
  const [saving, setSaving]                 = useState(false);

  // Confirm modals
  const [confirmDelete, setConfirmDelete]   = useState<AdminUser | null>(null);
  const [confirmToggle, setConfirmToggle]   = useState<AdminUser | null>(null);
  const [actioning, setActioning]           = useState(false);

  const fetchAdmins = useCallback(async () => {
    try {
      const res  = await fetchWithAuth("/api/admins");
      const data = await res.json();
      if (data.success) setAdmins(data.data ?? []);
      else toast("Failed to load admins", "error");
    } catch {
      toast("Failed to load admins", "error");
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, toast]);

  useEffect(() => {
    if (currentAdmin?.role === "owner") fetchAdmins();
    else setLoading(false);
  }, [fetchAdmins, currentAdmin]);

  if (currentAdmin?.role !== "owner") {
    return (
      <div className="p-8 text-center">
        <p className="text-white/40 mt-16">Owner access required to manage admins.</p>
      </div>
    );
  }

  /* ─── Create ─────────────────────────────────────────────────────────── */
  function validateCreate(): boolean {
    const e: Partial<CreateForm> = {};
    if (!createForm.name.trim())  e.name = "Required";
    if (!createForm.email.trim()) e.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email)) e.email = "Invalid email";
    if (!createForm.password)         e.password = "Required";
    else if (createForm.password.length < 8) e.password = "Min 8 characters";
    setCreateErrors(e);
    return !Object.keys(e).length;
  }

  async function handleCreate() {
    if (!validateCreate()) return;
    setCreating(true);
    try {
      const res  = await fetchWithAuth("/api/admins", { method: "POST", body: JSON.stringify(createForm) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast("Admin created successfully", "success");
      setShowCreate(false);
      setCreateForm(EMPTY_CREATE);
      fetchAdmins();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to create", "error");
    } finally {
      setCreating(false);
    }
  }

  /* ─── Edit ───────────────────────────────────────────────────────────── */
  function openEdit(a: AdminUser) {
    setEditTarget(a);
    setEditForm({ name: a.name, email: a.email, password: "" });
    setEditErrors({});
  }

  function validateEdit(): boolean {
    const e: Partial<EditForm> = {};
    if (!editForm.name.trim())  e.name = "Required";
    if (!editForm.email.trim()) e.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) e.email = "Invalid email";
    if (editForm.password && editForm.password.length < 8) e.password = "Min 8 characters";
    setEditErrors(e);
    return !Object.keys(e).length;
  }

  async function handleEdit() {
    if (!editTarget || !validateEdit()) return;
    setSaving(true);
    try {
      const body: Record<string, string> = { name: editForm.name.trim(), email: editForm.email.trim() };
      if (editForm.password) body.password = editForm.password;
      const res  = await fetchWithAuth(`/api/admins/${editTarget._id}`, { method: "PATCH", body: JSON.stringify(body) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast("Admin updated", "success");
      setEditTarget(null);
      fetchAdmins();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update", "error");
    } finally {
      setSaving(false);
    }
  }

  /* ─── Toggle active ──────────────────────────────────────────────────── */
  async function handleToggle(a: AdminUser) {
    setActioning(true);
    try {
      const res  = await fetchWithAuth(`/api/admins/${a._id}`, { method: "PATCH", body: JSON.stringify({ isActive: !a.isActive }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast(`Admin ${a.isActive ? "deactivated" : "activated"}`, "success");
      fetchAdmins();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update", "error");
    } finally {
      setActioning(false);
      setConfirmToggle(null);
    }
  }

  /* ─── Delete ─────────────────────────────────────────────────────────── */
  async function handleDelete(a: AdminUser) {
    setActioning(true);
    try {
      const res  = await fetchWithAuth(`/api/admins/${a._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast("Admin deleted", "success");
      fetchAdmins();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to delete", "error");
    } finally {
      setActioning(false);
      setConfirmDelete(null);
    }
  }

  /* ─── Render ─────────────────────────────────────────────────────────── */
  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white text-2xl font-bold">Admins</h1>
          <p className="text-white/40 text-sm mt-1">{admins.length} account{admins.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => { setCreateForm(EMPTY_CREATE); setCreateErrors({}); setShowCreate(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C9A84C] text-black text-sm font-bold hover:bg-[#d4b05a] transition-colors"
        >
          <Plus size={16} /> Add Admin
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-2xl bg-[#141414] border border-white/[0.06] animate-pulse" />)}
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
                <th className="text-left px-5 py-3 text-white/40 text-xs font-medium">Last Login</th>
                <th className="px-5 py-3 text-right text-white/40 text-xs font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {admins.map(a => {
                const isSelf    = a._id === currentAdmin?._id;
                const isOtherOwner = a.role === "owner" && !isSelf;

                return (
                  <tr key={a._id} className={`transition-colors ${isSelf ? "bg-[#C9A84C]/[0.03]" : "hover:bg-white/[0.015]"}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-medium">{a.name}</span>
                        {isSelf && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#C9A84C]/20 text-[#C9A84C] font-bold">you</span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-white/50 text-sm">{a.email}</td>

                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
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
                      {a.lastLoginAt
                        ? new Date(a.lastLoginAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                        : "Never"}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 justify-end">

                        {/* Edit — available for all, including self */}
                        <button
                          onClick={() => openEdit(a)}
                          title="Edit"
                          className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all"
                        >
                          <Edit2 size={14} />
                        </button>

                        {/* Toggle active — not for self, not for other owners */}
                        {!isSelf && !isOtherOwner && (
                          <button
                            onClick={() => setConfirmToggle(a)}
                            title={a.isActive ? "Deactivate" : "Activate"}
                            className={`p-1.5 rounded-lg transition-all ${
                              a.isActive
                                ? "text-white/30 hover:text-yellow-400 hover:bg-yellow-500/10"
                                : "text-white/30 hover:text-emerald-400 hover:bg-emerald-500/10"
                            }`}
                          >
                            {a.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                          </button>
                        )}

                        {/* Delete — not for self, not for other owners */}
                        {!isSelf && !isOtherOwner && (
                          <button
                            onClick={() => setConfirmDelete(a)}
                            title="Delete permanently"
                            className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Create Modal ─────────────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-[#141414] p-6 shadow-2xl">
            <h2 className="text-white font-bold text-lg mb-5">Add Admin</h2>
            <div className="space-y-4">
              <FormField label="Full Name" required value={createForm.name}
                onChange={e => setCreateForm(f => ({ ...f, name: (e.target as HTMLInputElement).value }))}
                placeholder="Jane Smith" error={createErrors.name} />
              <FormField label="Email" required type="email" value={createForm.email}
                onChange={e => setCreateForm(f => ({ ...f, email: (e.target as HTMLInputElement).value }))}
                placeholder="jane@qima.net" error={createErrors.email} />
              <FormField label="Password" required type="password" value={createForm.password}
                onChange={e => setCreateForm(f => ({ ...f, password: (e.target as HTMLInputElement).value }))}
                placeholder="Min 8 characters" error={createErrors.password} />
              <p className="text-white/25 text-xs">Role will be set to <strong className="text-white/40">admin</strong>.</p>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-white/60 bg-white/5 hover:bg-white/10 transition-colors">Cancel</button>
              <button onClick={handleCreate} disabled={creating} className="px-4 py-2 rounded-xl text-sm font-bold bg-[#C9A84C] text-black hover:bg-[#d4b05a] disabled:opacity-50 transition-colors">
                {creating ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ───────────────────────────────────────────────────── */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEditTarget(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-[#141414] p-6 shadow-2xl">
            <h2 className="text-white font-bold text-lg mb-1">Edit Admin</h2>
            <p className="text-white/35 text-xs mb-5">{editTarget.email}</p>
            <div className="space-y-4">
              <FormField label="Full Name" required value={editForm.name}
                onChange={e => setEditForm(f => ({ ...f, name: (e.target as HTMLInputElement).value }))}
                placeholder="Jane Smith" error={editErrors.name} />
              <FormField label="Email" required type="email" value={editForm.email}
                onChange={e => setEditForm(f => ({ ...f, email: (e.target as HTMLInputElement).value }))}
                placeholder="jane@qima.net" error={editErrors.email} />
              <div>
                <FormField label="New Password" type="password" value={editForm.password}
                  onChange={e => setEditForm(f => ({ ...f, password: (e.target as HTMLInputElement).value }))}
                  placeholder="Leave blank to keep current" error={editErrors.password} />
                <p className="flex items-center gap-1 text-white/25 text-xs mt-1.5">
                  <KeyRound size={10} /> Leave blank to keep the current password
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setEditTarget(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-white/60 bg-white/5 hover:bg-white/10 transition-colors">Cancel</button>
              <button onClick={handleEdit} disabled={saving} className="px-4 py-2 rounded-xl text-sm font-bold bg-[#C9A84C] text-black hover:bg-[#d4b05a] disabled:opacity-50 transition-colors">
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Toggle ───────────────────────────────────────────────── */}
      {confirmToggle && (
        <ConfirmModal
          title={confirmToggle.isActive ? "Deactivate Admin" : "Activate Admin"}
          message={`${confirmToggle.isActive ? "Deactivating" : "Activating"} ${confirmToggle.name} (${confirmToggle.email}). ${confirmToggle.isActive ? "They will no longer be able to log in." : "They will regain access to the dashboard."}`}
          danger={confirmToggle.isActive}
          confirmLabel={confirmToggle.isActive ? "Deactivate" : "Activate"}
          onConfirm={() => handleToggle(confirmToggle)}
          onCancel={() => setConfirmToggle(null)}
        />
      )}

      {/* ── Confirm Delete ───────────────────────────────────────────────── */}
      {confirmDelete && (
        <ConfirmModal
          title="Delete Admin Permanently"
          message={`This will permanently remove ${confirmDelete.name} (${confirmDelete.email}) from the system. This cannot be undone.`}
          danger
          confirmLabel={actioning ? "Deleting…" : "Delete Permanently"}
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
