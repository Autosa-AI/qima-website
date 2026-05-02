"use client";
import { useState, useEffect, useCallback } from "react";
import { useAdmin } from "@/components/admin/AdminContext";
import { useToast } from "@/components/admin/Toast";
import ConfirmModal from "@/components/admin/ConfirmModal";
import FormField from "@/components/admin/FormField";
import { Plus, Edit2, Trash2, Zap } from "lucide-react";

interface Category {
  _id: string;
  slug: string;
  icon: string;
  ar: { label: string };
  en: { label: string };
}

interface Case {
  _id: string;
  number: string;
  categoryId: string;
  ar: { name: string; brief: string; story: string; need: string };
  en: { name: string; brief: string; story: string; need: string };
  isActive: boolean;
  isUrgent: boolean;
  order: number;
  responsibleAdminId?: string;
  responsibleAdminName?: string;
}

interface AdminOption { _id: string; name: string; email: string }

interface FormState {
  categoryId: string;
  arName: string; arBrief: string; arStory: string; arNeed: string;
  enName: string; enBrief: string; enStory: string; enNeed: string;
  isUrgent: boolean;
  responsibleAdminId: string; // "" = unassigned
}

const EMPTY_FORM: FormState = {
  categoryId: "",
  arName: "", arBrief: "", arStory: "", arNeed: "",
  enName: "", enBrief: "", enStory: "", enNeed: "",
  isUrgent: false,
  responsibleAdminId: "",
};

export default function CasesPage() {
  const { fetchWithAuth } = useAdmin();
  const { toast } = useToast();

  const [cases, setCases]         = useState<Case[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [admins, setAdmins]         = useState<AdminOption[]>([]);
  const [filterCat, setFilterCat]   = useState<string>("all");
  const [loading, setLoading]       = useState(true);
  const [showPanel, setShowPanel]   = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [form, setForm]             = useState<FormState>(EMPTY_FORM);
  const [activeTab, setActiveTab]   = useState<"ar" | "en">("ar");
  const [saving, setSaving]         = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Case | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [casesRes, catsRes, adminsRes] = await Promise.all([
        fetchWithAuth("/api/cases"),
        fetchWithAuth("/api/categories"),
        fetchWithAuth("/api/admins"),
      ]);
      const [casesData, catsData, adminsData] = await Promise.all([
        casesRes.json(), catsRes.json(), adminsRes.json(),
      ]);
      if (casesData.success)  setCases(casesData.data ?? []);
      if (catsData.success)   setCategories(catsData.data ?? []);
      if (adminsData.success) setAdmins(adminsData.data ?? []);
    } catch {
      toast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function getCategoryLabel(id: string): string {
    const cat = categories.find((c) => c._id === id);
    return cat ? `${cat.icon} ${cat.en.label}` : "—";
  }

  function openAdd() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, categoryId: categories[0]?._id ?? "" });
    setActiveTab("ar");
    setShowPanel(true);
  }

  function openEdit(c: Case) {
    setEditingId(c._id);
    setForm({
      categoryId: c.categoryId,
      arName: c.ar.name, arBrief: c.ar.brief, arStory: c.ar.story, arNeed: c.ar.need,
      enName: c.en.name, enBrief: c.en.brief, enStory: c.en.story, enNeed: c.en.need,
      isUrgent: c.isUrgent,
      responsibleAdminId: c.responsibleAdminId ?? "",
    });
    setActiveTab("ar");
    setShowPanel(true);
  }

  async function handleSave() {
    if (!form.categoryId || !form.arName.trim() || !form.enName.trim()) {
      toast("Please fill in all required fields", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        categoryId: form.categoryId,
        ar: { name: form.arName.trim(), brief: form.arBrief.trim(), story: form.arStory.trim(), need: form.arNeed.trim() },
        en: { name: form.enName.trim(), brief: form.enBrief.trim(), story: form.enStory.trim(), need: form.enNeed.trim() },
        isUrgent: form.isUrgent,
        responsibleAdminId: form.responsibleAdminId || null,
      };

      const res = editingId
        ? await fetchWithAuth(`/api/cases/${editingId}`, { method: "PUT", body: JSON.stringify(payload) })
        : await fetchWithAuth("/api/cases", { method: "POST", body: JSON.stringify(payload) });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast(editingId ? "Case updated" : "Case created", "success");
      setShowPanel(false);
      fetchData();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(c: Case) {
    try {
      const res = await fetchWithAuth(`/api/cases/${c._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast("Case deleted", "success");
      fetchData();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to delete", "error");
    } finally {
      setConfirmDelete(null);
    }
  }

  async function handleToggle(c: Case, field: "isUrgent" | "isActive") {
    try {
      const res = await fetchWithAuth(`/api/cases/${c._id}`, {
        method: "PATCH",
        body: JSON.stringify({ [field]: !c[field] }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      fetchData();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update", "error");
    }
  }

  const filtered = filterCat === "all"
    ? cases
    : cases.filter((c) => c.categoryId === filterCat);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-2xl font-bold">Cases</h1>
          <p className="text-white/40 text-sm mt-1">Manage donation cases</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C9A84C] text-black text-sm font-bold hover:bg-[#d4b05a] transition-colors"
        >
          <Plus size={16} />
          Add Case
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setFilterCat("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
            filterCat === "all"
              ? "bg-[#C9A84C]/15 border-[#C9A84C]/40 text-[#C9A84C]"
              : "border-white/10 text-white/40 hover:border-white/20 hover:text-white"
          }`}
        >
          All ({cases.length})
        </button>
        {categories.map((cat) => {
          const count = cases.filter((c) => c.categoryId === cat._id).length;
          return (
            <button
              key={cat._id}
              onClick={() => setFilterCat(cat._id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                filterCat === cat._id
                  ? "bg-[#C9A84C]/15 border-[#C9A84C]/40 text-[#C9A84C]"
                  : "border-white/10 text-white/40 hover:border-white/20 hover:text-white"
              }`}
            >
              {cat.icon} {cat.en.label} ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-[#141414] border border-white/[0.06] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-white/25 text-sm">No cases found.</div>
      ) : (
        <div className="rounded-2xl border border-white/[0.06] bg-[#141414] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">#</th>
                <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Name (AR)</th>
                <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Brief (AR)</th>
                <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Need</th>
                <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Category</th>
                <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Responsible</th>
                <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Urgent</th>
                <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map((c) => (
                <tr key={c._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3.5 text-white/40 text-xs font-mono">{c.number}</td>
                  <td className="px-4 py-3.5 text-white text-sm max-w-[160px] truncate">{c.ar.name}</td>
                  <td className="px-4 py-3.5 text-white/50 text-xs max-w-[180px] truncate">{c.ar.brief}</td>
                  <td className="px-4 py-3.5 text-[#C9A84C]/80 text-xs">{c.ar.need}</td>
                  <td className="px-4 py-3.5 text-white/50 text-xs">{getCategoryLabel(c.categoryId)}</td>
                  <td className="px-4 py-3.5 text-xs">
                    {c.responsibleAdminName
                      ? <span className="text-[#C9A84C]/80">{c.responsibleAdminName}</span>
                      : <span className="text-white/20">—</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => handleToggle(c, "isUrgent")}
                      className={`p-1.5 rounded-lg transition-all ${
                        c.isUrgent
                          ? "text-yellow-400 bg-yellow-500/10"
                          : "text-white/20 hover:text-yellow-400/50"
                      }`}
                    >
                      <Zap size={14} />
                    </button>
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => handleToggle(c, "isActive")}
                      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        c.isActive
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                          : "bg-white/5 text-white/30 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      {c.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 justify-end">
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => setConfirmDelete(c)} className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Side panel */}
      {showPanel && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPanel(false)} />
          <div className="relative ml-auto z-10 w-full max-w-lg h-full bg-[#141414] border-l border-white/10 flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between">
              <h2 className="text-white font-bold">{editingId ? "Edit Case" : "Add Case"}</h2>
              <button onClick={() => setShowPanel(false)} className="text-white/30 hover:text-white text-xl leading-none">&times;</button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Category */}
              <div>
                <label className="block text-white/60 text-xs font-medium mb-1.5">Category <span className="text-[#C9A84C]">*</span></label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#C9A84C]/60 transition-colors"
                >
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id} className="bg-[#141414]">
                      {cat.icon} {cat.en.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Responsible admin picker */}
              <div>
                <label className="block text-white/60 text-xs font-medium mb-1.5">
                  Responsible Admin
                  <span className="text-white/30 font-normal ml-1">(appears in donor WhatsApp message)</span>
                </label>
                <select
                  value={form.responsibleAdminId}
                  onChange={e => setForm(f => ({ ...f, responsibleAdminId: e.target.value }))}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#C9A84C]/60 transition-colors"
                >
                  <option value="" className="bg-[#141414]">-- Unassigned --</option>
                  {admins.map(a => (
                    <option key={a._id} value={a._id} className="bg-[#141414]">
                      {a.name} ({a.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Urgent toggle */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setForm((f) => ({ ...f, isUrgent: !f.isUrgent }))}
                  className={`w-10 h-5 rounded-full border transition-all relative ${
                    form.isUrgent ? "bg-yellow-400/20 border-yellow-400/40" : "bg-white/5 border-white/10"
                  }`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
                    form.isUrgent ? "left-5 bg-yellow-400" : "left-0.5 bg-white/30"
                  }`} />
                </button>
                <span className="text-white/60 text-sm">Mark as urgent</span>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 p-1 bg-white/[0.04] rounded-xl">
                {(["ar", "en"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab ? "bg-[#C9A84C] text-black" : "text-white/50 hover:text-white"
                    }`}
                  >
                    {tab === "ar" ? "العربية" : "English"}
                  </button>
                ))}
              </div>

              {activeTab === "ar" ? (
                <div className="space-y-4">
                  <FormField label="Name" required value={form.arName} onChange={(e) => setForm((f) => ({ ...f, arName: (e.target as HTMLInputElement).value }))} placeholder="أحمد عبد الرحمن" />
                  <FormField label="Brief" required value={form.arBrief} onChange={(e) => setForm((f) => ({ ...f, arBrief: (e.target as HTMLInputElement).value }))} placeholder="عامل مصنع · ٣ أطفال" />
                  <FormField label="Story" textarea required rows={5} value={form.arStory} onChange={(e) => setForm((f) => ({ ...f, arStory: (e.target as HTMLTextAreaElement).value }))} placeholder="القصة الكاملة..." />
                  <FormField label="Need" required value={form.arNeed} onChange={(e) => setForm((f) => ({ ...f, arNeed: (e.target as HTMLInputElement).value }))} placeholder="٤٠٠ جنيه / شهر" />
                </div>
              ) : (
                <div className="space-y-4">
                  <FormField label="Name" required value={form.enName} onChange={(e) => setForm((f) => ({ ...f, enName: (e.target as HTMLInputElement).value }))} placeholder="Ahmed Abdel Rahman" />
                  <FormField label="Brief" required value={form.enBrief} onChange={(e) => setForm((f) => ({ ...f, enBrief: (e.target as HTMLInputElement).value }))} placeholder="Factory worker · 3 children" />
                  <FormField label="Story" textarea required rows={5} value={form.enStory} onChange={(e) => setForm((f) => ({ ...f, enStory: (e.target as HTMLTextAreaElement).value }))} placeholder="Full story..." />
                  <FormField label="Need" required value={form.enNeed} onChange={(e) => setForm((f) => ({ ...f, enNeed: (e.target as HTMLInputElement).value }))} placeholder="EGP 400 / month" />
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-white/[0.06] flex gap-3 justify-end">
              <button onClick={() => setShowPanel(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-white/60 bg-white/5 hover:bg-white/10 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-xl text-sm font-bold bg-[#C9A84C] text-black hover:bg-[#d4b05a] disabled:opacity-50 transition-colors">
                {saving ? "Saving…" : editingId ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Delete Case"
          message={`This will deactivate case #${confirmDelete.number} "${confirmDelete.en.name}".`}
          danger
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
