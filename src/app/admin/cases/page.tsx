"use client";
import { useState, useEffect, useCallback } from "react";
import { useAdmin } from "@/components/admin/AdminContext";
import { useToast } from "@/components/admin/Toast";
import ConfirmModal from "@/components/admin/ConfirmModal";
import FormField from "@/components/admin/FormField";
import { Plus, Edit2, Trash2, Zap, ImageIcon, ChevronDown, User, Phone, Image as ImageIconLucide, X as XIcon, RotateCcw, PartyPopper } from "lucide-react";
import ShareImageGenerator, { type CaseForImage } from "@/components/admin/ShareImageGenerator";
import CaseCompletionShare, { type CaseForCompletion } from "@/components/admin/CaseCompletionShare";

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
  targetAmount?: number;
  raisedAmount?: number;
  beneficiary?: { name?: string; phone?: string; proofImageUrl?: string };
}

interface AdminOption { _id: string; name: string; email: string }

interface FormState {
  categoryId: string;
  arName: string; arBrief: string; arStory: string; arNeed: string;
  enName: string; enBrief: string; enStory: string; enNeed: string;
  isUrgent: boolean;
  responsibleAdminId: string;
  targetAmount: string;
  raisedAmount: string;
  beneficiaryName: string;
  beneficiaryPhone: string;
  beneficiaryProof: string; // URL after upload
}

const EMPTY_FORM: FormState = {
  categoryId: "",
  arName: "", arBrief: "", arStory: "", arNeed: "",
  enName: "", enBrief: "", enStory: "", enNeed: "",
  isUrgent: false,
  responsibleAdminId: "",
  targetAmount: "",
  raisedAmount: "",
  beneficiaryName: "",
  beneficiaryPhone: "",
  beneficiaryProof: "",
};

export default function CasesPage() {
  const { fetchWithAuth, admin } = useAdmin();
  const isOwner = admin?.role === "owner";
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
  const [saving, setSaving]             = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Case | null>(null);
  const [showShareModal,      setShowShareModal]      = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showResetModal, setShowResetModal]   = useState(false);
  const [resetSelected, setResetSelected]     = useState<Set<string>>(new Set());
  const [resetting, setResetting]             = useState(false);
  const [beneficiaryOpen, setBeneficiaryOpen] = useState(false);
  const [uploadingProof, setUploadingProof]   = useState(false);

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
    setBeneficiaryOpen(false);
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
      targetAmount: c.targetAmount !== undefined ? String(c.targetAmount) : "",
      raisedAmount: c.raisedAmount !== undefined ? String(c.raisedAmount) : "",
      beneficiaryName:  c.beneficiary?.name  ?? "",
      beneficiaryPhone: c.beneficiary?.phone ?? "",
      beneficiaryProof: c.beneficiary?.proofImageUrl ?? "",
    });
    setActiveTab("ar");
    setBeneficiaryOpen(!!(c.beneficiary?.name || c.beneficiary?.phone || c.beneficiary?.proofImageUrl));
    setShowPanel(true);
  }

  async function handleSave() {
    if (!form.categoryId || !form.arName.trim() || !form.enName.trim()) {
      toast("Please fill in all required fields", "error");
      return;
    }
    setSaving(true);
    try {
      const hasBeneficiary = form.beneficiaryName.trim() || form.beneficiaryPhone.trim() || form.beneficiaryProof;
      const payload = {
        categoryId: form.categoryId,
        ar: { name: form.arName.trim(), brief: form.arBrief.trim(), story: form.arStory.trim(), need: form.arNeed.trim() },
        en: { name: form.enName.trim(), brief: form.enBrief.trim(), story: form.enStory.trim(), need: form.enNeed.trim() },
        isUrgent: form.isUrgent,
        responsibleAdminId: form.responsibleAdminId || null,
        ...(form.targetAmount !== "" && { targetAmount: Number(form.targetAmount) }),
        ...(form.raisedAmount !== "" && { raisedAmount: Number(form.raisedAmount) }),
        beneficiary: hasBeneficiary ? {
          ...(form.beneficiaryName.trim()  && { name:          form.beneficiaryName.trim() }),
          ...(form.beneficiaryPhone.trim() && { phone:         form.beneficiaryPhone.trim() }),
          ...(form.beneficiaryProof        && { proofImageUrl: form.beneficiaryProof }),
        } : null,
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

  async function handleResetRaised() {
    if (resetSelected.size === 0) return;
    setResetting(true);
    try {
      const res  = await fetchWithAuth("/api/cases/reset-raised", {
        method: "POST",
        body: JSON.stringify({ caseIds: Array.from(resetSelected) }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast(`Reset ${data.modified} case(s) to 0`, "success");
      setShowResetModal(false);
      setResetSelected(new Set());
      fetchData();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Reset failed", "error");
    } finally {
      setResetting(false);
    }
  }

  async function handleProofUpload(file: File) {
    setUploadingProof(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const token = typeof window !== "undefined" ? localStorage.getItem("qima_admin_token") : null;
      const res  = await fetch("/api/upload", {
        method: "POST",
        body: fd,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setForm(f => ({ ...f, beneficiaryProof: data.url }));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload failed", "error");
    } finally {
      setUploadingProof(false);
    }
  }

  const filtered = filterCat === "all"
    ? cases
    : cases.filter((c) => c.categoryId === filterCat);

  return (
    <div className="px-4 py-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-white text-2xl font-bold">Cases</h1>
          <p className="text-white/40 text-sm mt-1">Manage donation cases</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowCompletionModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 transition-colors"
          >
            <PartyPopper size={16} />
            Completion
          </button>
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 transition-colors"
          >
            <ImageIcon size={16} />
            Share Image
          </button>
          <button
            onClick={() => { setResetSelected(new Set()); setShowResetModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-medium hover:bg-white/10 hover:text-white transition-colors"
          >
            <RotateCcw size={16} />
            Reset Progress
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C9A84C] text-black text-sm font-bold hover:bg-[#d4b05a] transition-colors"
          >
            <Plus size={16} />
            Add Case
          </button>
        </div>
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
        <div className="rounded-2xl border border-white/[0.06] bg-[#141414] overflow-x-auto">
          <table className="w-full min-w-[700px]">
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

              {/* Responsible admin — auto-set on create, owner-only on edit */}
              {editingId && (
                <div>
                  <label className="block text-white/60 text-xs font-medium mb-1.5">
                    Responsible Admin
                    {!isOwner && <span className="text-white/25 font-normal ml-1">(owner only)</span>}
                  </label>
                  {isOwner ? (
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
                  ) : (
                    <div className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl px-3 py-2.5 text-white/40 text-sm">
                      {admins.find(a => a._id === form.responsibleAdminId)?.name ?? "—"}
                    </div>
                  )}
                </div>
              )}

              {/* Progress fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 text-xs font-medium mb-1.5">Target Amount (EGP)</label>
                  <input
                    type="number" min="0"
                    value={form.targetAmount}
                    onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))}
                    placeholder="e.g. 5000"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#C9A84C]/60 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-xs font-medium mb-1.5">Raised So Far (EGP)</label>
                  <input
                    type="number" min="0"
                    value={form.raisedAmount}
                    onChange={e => setForm(f => ({ ...f, raisedAmount: e.target.value }))}
                    placeholder="e.g. 2400"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#C9A84C]/60 transition-colors"
                  />
                </div>
              </div>
              {form.targetAmount && Number(form.targetAmount) > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#C9A84C] rounded-full transition-all" style={{ width: `${Math.min(100, Math.round((Number(form.raisedAmount) || 0) / Number(form.targetAmount) * 100))}%` }} />
                  </div>
                  <span className="text-[#C9A84C] text-xs font-bold">{Math.min(100, Math.round((Number(form.raisedAmount) || 0) / Number(form.targetAmount) * 100))}%</span>
                </div>
              )}

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

              {/* Beneficiary info — collapsible, optional */}
              <div className="border border-white/[0.07] rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setBeneficiaryOpen(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm text-white/60 hover:text-white/80 hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <User size={13} />
                    <span>Beneficiary Info</span>
                    <span className="text-white/25 text-xs font-normal">(optional · private)</span>
                    {(form.beneficiaryName || form.beneficiaryPhone || form.beneficiaryProof) && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
                    )}
                  </div>
                  <ChevronDown size={14} className={`transition-transform ${beneficiaryOpen ? "rotate-180" : ""}`} />
                </button>

                {beneficiaryOpen && (
                  <div className="px-4 pb-4 pt-1 space-y-4 border-t border-white/[0.06]">
                    {/* Name */}
                    <div>
                      <label className="flex items-center gap-1.5 text-white/50 text-xs font-medium mb-1.5">
                        <User size={11} /> Full name
                      </label>
                      <input
                        type="text"
                        value={form.beneficiaryName}
                        onChange={e => setForm(f => ({ ...f, beneficiaryName: e.target.value }))}
                        placeholder="e.g. محمد أحمد"
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#C9A84C]/60 transition-colors placeholder:text-white/20"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="flex items-center gap-1.5 text-white/50 text-xs font-medium mb-1.5">
                        <Phone size={11} /> Phone number
                      </label>
                      <input
                        type="tel"
                        value={form.beneficiaryPhone}
                        onChange={e => setForm(f => ({ ...f, beneficiaryPhone: e.target.value }))}
                        placeholder="e.g. 0100 000 0000"
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#C9A84C]/60 transition-colors placeholder:text-white/20"
                      />
                    </div>

                    {/* Proof image */}
                    <div>
                      <label className="flex items-center gap-1.5 text-white/50 text-xs font-medium mb-1.5">
                        <ImageIconLucide size={11} /> Proof image
                      </label>

                      {form.beneficiaryProof ? (
                        <div className="relative rounded-xl overflow-hidden border border-white/10 group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={form.beneficiaryProof} alt="Proof" className="w-full max-h-48 object-cover" />
                          <button
                            type="button"
                            onClick={() => setForm(f => ({ ...f, beneficiaryProof: "" }))}
                            className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/70 border border-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <XIcon size={12} />
                          </button>
                        </div>
                      ) : (
                        <label className={`flex flex-col items-center justify-center gap-2 w-full h-28 rounded-xl border-2 border-dashed transition-colors cursor-pointer ${uploadingProof ? "border-white/10 pointer-events-none" : "border-white/10 hover:border-[#C9A84C]/40 hover:bg-[#C9A84C]/[0.03]"}`}>
                          {uploadingProof ? (
                            <span className="text-white/30 text-xs">Uploading…</span>
                          ) : (
                            <>
                              <ImageIconLucide size={20} className="text-white/20" />
                              <span className="text-white/35 text-xs">Click to upload (JPEG/PNG/WebP · max 5 MB)</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            disabled={uploadingProof}
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleProofUpload(f); e.target.value = ""; }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                )}
              </div>
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

      {showShareModal && (
        <ShareImageGenerator
          cases={cases.filter(c => c.isActive) as CaseForImage[]}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {showCompletionModal && (
        <CaseCompletionShare
          cases={cases.filter(c => c.targetAmount && c.targetAmount > 0 && (c.raisedAmount ?? 0) >= c.targetAmount) as CaseForCompletion[]}
          onClose={() => setShowCompletionModal(false)}
        />
      )}

      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowResetModal(false)} />
          <div className="relative z-10 w-full max-w-xl bg-[#141414] border border-white/10 rounded-3xl overflow-hidden flex flex-col max-h-[85vh]">

            {/* Header */}
            <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold">Reset Fundraising Progress</h2>
                <p className="text-white/35 text-xs mt-0.5">Sets raisedAmount to 0. Cases stay active.</p>
              </div>
              <button onClick={() => setShowResetModal(false)} className="text-white/30 hover:text-white text-xl leading-none">&times;</button>
            </div>

            {/* Quick-select bar */}
            <div className="px-6 py-3 border-b border-white/[0.04] flex items-center gap-2">
              <button
                onClick={() => setResetSelected(new Set(cases.map(c => c._id)))}
                className="px-3 py-1.5 rounded-full text-xs border border-white/10 text-white/50 hover:border-white/20 hover:text-white transition-all"
              >All</button>
              <button
                onClick={() => setResetSelected(new Set(
                  cases.filter(c => c.targetAmount && c.targetAmount > 0 && (c.raisedAmount ?? 0) >= c.targetAmount).map(c => c._id)
                ))}
                className="px-3 py-1.5 rounded-full text-xs border border-emerald-500/30 text-emerald-400/70 hover:border-emerald-500/50 hover:text-emerald-400 transition-all"
              >Completed only</button>
              <button
                onClick={() => setResetSelected(new Set(cases.filter(c => (c.raisedAmount ?? 0) > 0).map(c => c._id)))}
                className="px-3 py-1.5 rounded-full text-xs border border-white/10 text-white/50 hover:border-white/20 hover:text-white transition-all"
              >Has raised</button>
              <button
                onClick={() => setResetSelected(new Set())}
                className="px-3 py-1.5 rounded-full text-xs border border-white/10 text-white/30 hover:text-white transition-all"
              >None</button>
              <span className="ml-auto text-white/30 text-xs">{resetSelected.size} selected</span>
            </div>

            {/* Case list */}
            <div className="overflow-y-auto flex-1 px-6 py-3 space-y-1.5">
              {cases.map(c => {
                const raised = c.raisedAmount ?? 0;
                const target = c.targetAmount ?? 0;
                const p = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : null;
                const checked = resetSelected.has(c._id);
                return (
                  <label key={c._id} className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${checked ? "bg-white/[0.05] border border-white/10" : "hover:bg-white/[0.03] border border-transparent"}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setResetSelected(prev => {
                          const next = new Set(prev);
                          next.has(c._id) ? next.delete(c._id) : next.add(c._id);
                          return next;
                        });
                      }}
                      className="accent-[#C9A84C] w-4 h-4 flex-shrink-0"
                    />
                    <span className="text-white/40 text-xs font-mono w-8 flex-shrink-0">#{c.number}</span>
                    <span className="text-white/80 text-sm flex-1 truncate">{c.ar.name}</span>
                    {p !== null ? (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.max(2,p)}%`, background: p >= 100 ? "#34D399" : "#C9A84C" }} />
                        </div>
                        <span className="text-xs w-8 text-right tabular-nums font-semibold" style={{ color: p >= 100 ? "#34D399" : "#C9A84C" }}>{p}%</span>
                      </div>
                    ) : (
                      raised > 0 ? (
                        <span className="text-[#C9A84C]/60 text-xs tabular-nums flex-shrink-0">{raised.toLocaleString()} EGP</span>
                      ) : (
                        <span className="text-white/15 text-xs flex-shrink-0">—</span>
                      )
                    )}
                  </label>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-between gap-3">
              <p className="text-white/30 text-xs">
                {resetSelected.size === 0 ? "Select cases to reset" : `Will reset ${resetSelected.size} case${resetSelected.size !== 1 ? "s" : ""} → raisedAmount = 0`}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setShowResetModal(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-white/50 bg-white/5 hover:bg-white/10 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleResetRaised}
                  disabled={resetSelected.size === 0 || resetting}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-red-500/80 text-white hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {resetting ? "Resetting…" : `Reset ${resetSelected.size > 0 ? resetSelected.size : ""}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
