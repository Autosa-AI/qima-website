"use client";
import { useState, useEffect, useCallback } from "react";
import { useAdmin } from "@/components/admin/AdminContext";
import { useToast } from "@/components/admin/Toast";
import ConfirmModal from "@/components/admin/ConfirmModal";
import FormField from "@/components/admin/FormField";
import { Plus, Edit2, Trash2, ChevronUp, ChevronDown } from "lucide-react";

interface Story {
  _id: string;
  imageUrl: string;
  accent: string;
  order: number;
  isActive: boolean;
  ar: { title: string; location: string; tag: string; story: string };
  en: { title: string; location: string; tag: string; story: string };
}

interface FormState {
  imageUrl: string;
  accent: string;
  order: number;
  arTitle: string;
  arLocation: string;
  arTag: string;
  arStory: string;
  enTitle: string;
  enLocation: string;
  enTag: string;
  enStory: string;
}

const ACCENT_PRESETS = [
  "#4F8EF7", "#C9A84C", "#34D399", "#A78BFA", "#F97316", "#F43F5E",
];

const EMPTY_FORM: FormState = {
  imageUrl: "", accent: "#C9A84C", order: 1,
  arTitle: "", arLocation: "", arTag: "", arStory: "",
  enTitle: "", enLocation: "", enTag: "", enStory: "",
};

export default function StoriesPage() {
  const { fetchWithAuth } = useAdmin();
  const { toast } = useToast();

  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [activeTab, setActiveTab] = useState<"ar" | "en">("ar");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Story | null>(null);

  const fetchStories = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/api/stories");
      const data = await res.json();
      if (data.success) setStories(data.data ?? []);
    } catch {
      toast("Failed to load stories", "error");
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, toast]);

  useEffect(() => { fetchStories(); }, [fetchStories]);

  function openAdd() {
    setEditingId(null);
    const maxOrder = stories.reduce((m, s) => Math.max(m, s.order), 0);
    setForm({ ...EMPTY_FORM, order: maxOrder + 1 });
    setActiveTab("ar");
    setShowModal(true);
  }

  function openEdit(s: Story) {
    setEditingId(s._id);
    setForm({
      imageUrl: s.imageUrl,
      accent: s.accent,
      order: s.order,
      arTitle: s.ar.title,
      arLocation: s.ar.location,
      arTag: s.ar.tag,
      arStory: s.ar.story,
      enTitle: s.en.title,
      enLocation: s.en.location,
      enTag: s.en.tag,
      enStory: s.en.story,
    });
    setActiveTab("ar");
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.imageUrl.trim() || !form.arTitle.trim() || !form.enTitle.trim()) {
      toast("Please fill in all required fields", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        imageUrl: form.imageUrl.trim(),
        accent: form.accent,
        order: form.order,
        ar: { title: form.arTitle.trim(), location: form.arLocation.trim(), tag: form.arTag.trim(), story: form.arStory.trim() },
        en: { title: form.enTitle.trim(), location: form.enLocation.trim(), tag: form.enTag.trim(), story: form.enStory.trim() },
      };

      const res = editingId
        ? await fetchWithAuth(`/api/stories/${editingId}`, { method: "PUT", body: JSON.stringify(payload) })
        : await fetchWithAuth("/api/stories", { method: "POST", body: JSON.stringify(payload) });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast(editingId ? "Story updated" : "Story created", "success");
      setShowModal(false);
      fetchStories();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(s: Story) {
    try {
      const res = await fetchWithAuth(`/api/stories/${s._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast("Story deleted", "success");
      fetchStories();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to delete", "error");
    } finally {
      setConfirmDelete(null);
    }
  }

  async function handleToggleActive(s: Story) {
    try {
      const res = await fetchWithAuth(`/api/stories/${s._id}`, {
        method: "PUT",
        body: JSON.stringify({
          imageUrl: s.imageUrl, accent: s.accent, order: s.order,
          ar: s.ar, en: s.en, isActive: !s.isActive,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      fetchStories();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update", "error");
    }
  }

  async function handleReorder(s: Story, dir: -1 | 1) {
    try {
      await fetchWithAuth(`/api/stories/${s._id}`, {
        method: "PATCH",
        body: JSON.stringify({ order: s.order + dir }),
      });
      fetchStories();
    } catch {
      toast("Failed to reorder", "error");
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white text-2xl font-bold">Impact Stories</h1>
          <p className="text-white/40 text-sm mt-1">Manage the carousel stories</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C9A84C] text-black text-sm font-bold hover:bg-[#d4b05a] transition-colors"
        >
          <Plus size={16} />
          Add Story
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-[#141414] border border-white/[0.06] animate-pulse" />
          ))}
        </div>
      ) : stories.length === 0 ? (
        <div className="text-center py-16 text-white/25 text-sm">No stories yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {stories.map((s) => (
            <div
              key={s._id}
              className="rounded-2xl border bg-[#141414] overflow-hidden transition-all"
              style={{ borderColor: `${s.accent}30` }}
            >
              {/* Preview image */}
              <div className="relative h-36 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.imageUrl}
                  alt={s.en.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                  <div
                    className="w-6 h-6 rounded-full border-2 flex-shrink-0"
                    style={{ background: s.accent, borderColor: `${s.accent}60` }}
                  />
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleReorder(s, -1)} className="p-1 text-white/50 hover:text-white transition-colors">
                      <ChevronUp size={12} />
                    </button>
                    <span className="text-white/40 text-xs">{s.order}</span>
                    <button onClick={() => handleReorder(s, 1)} className="p-1 text-white/50 hover:text-white transition-colors">
                      <ChevronDown size={12} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-white font-semibold text-sm truncate">{s.en.title}</p>
                    <p className="text-white/40 text-xs mt-0.5">{s.en.location}</p>
                  </div>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full border font-medium flex-shrink-0"
                    style={{ color: s.accent, borderColor: `${s.accent}40`, background: `${s.accent}10` }}
                  >
                    {s.en.tag}
                  </span>
                </div>
                <p className="text-white/40 text-xs leading-relaxed line-clamp-2 mb-3">
                  {s.en.story}
                </p>

                <div className="flex items-center gap-2 justify-between">
                  <button
                    onClick={() => handleToggleActive(s)}
                    className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      s.isActive
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                        : "bg-white/5 text-white/30 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    {s.isActive ? "Active" : "Inactive"}
                  </button>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => setConfirmDelete(s)} className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative z-10 w-full max-w-xl rounded-2xl border border-white/10 bg-[#141414] shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between">
              <h2 className="text-white font-bold">{editingId ? "Edit Story" : "Add Story"}</h2>
              <button onClick={() => setShowModal(false)} className="text-white/30 hover:text-white text-xl leading-none">&times;</button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <FormField
                label="Image URL"
                required
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: (e.target as HTMLInputElement).value }))}
                placeholder="https://images.unsplash.com/..."
              />

              <div className="grid grid-cols-2 gap-4">
                {/* Accent presets */}
                <div>
                  <label className="block text-white/60 text-xs font-medium mb-2">Accent Color</label>
                  <div className="flex flex-wrap gap-2">
                    {ACCENT_PRESETS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setForm((f) => ({ ...f, accent: color }))}
                        className="w-7 h-7 rounded-full border-2 transition-all"
                        style={{
                          background: color,
                          borderColor: form.accent === color ? "#fff" : "transparent",
                          boxShadow: form.accent === color ? `0 0 0 3px ${color}40` : "none",
                        }}
                      />
                    ))}
                  </div>
                  <input
                    type="text"
                    value={form.accent}
                    onChange={(e) => setForm((f) => ({ ...f, accent: e.target.value }))}
                    className="mt-2 w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-[#C9A84C]/60 transition-colors"
                    placeholder="#C9A84C"
                  />
                </div>

                <FormField
                  label="Order"
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm((f) => ({ ...f, order: parseInt((e.target as HTMLInputElement).value) || 1 }))}
                />
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
                  <FormField label="Title" required value={form.arTitle} onChange={(e) => setForm((f) => ({ ...f, arTitle: (e.target as HTMLInputElement).value }))} placeholder="أحمد · ٤٢ عامًا" />
                  <FormField label="Location" required value={form.arLocation} onChange={(e) => setForm((f) => ({ ...f, arLocation: (e.target as HTMLInputElement).value }))} placeholder="إمبابة، الجيزة" />
                  <FormField label="Tag" required value={form.arTag} onChange={(e) => setForm((f) => ({ ...f, arTag: (e.target as HTMLInputElement).value }))} placeholder="عامل مصنع" />
                  <FormField label="Story" textarea required rows={4} value={form.arStory} onChange={(e) => setForm((f) => ({ ...f, arStory: (e.target as HTMLTextAreaElement).value }))} placeholder="القصة..." />
                </div>
              ) : (
                <div className="space-y-4">
                  <FormField label="Title" required value={form.enTitle} onChange={(e) => setForm((f) => ({ ...f, enTitle: (e.target as HTMLInputElement).value }))} placeholder="Ahmed · Age 42" />
                  <FormField label="Location" required value={form.enLocation} onChange={(e) => setForm((f) => ({ ...f, enLocation: (e.target as HTMLInputElement).value }))} placeholder="Imbaba, Giza" />
                  <FormField label="Tag" required value={form.enTag} onChange={(e) => setForm((f) => ({ ...f, enTag: (e.target as HTMLInputElement).value }))} placeholder="Factory Worker" />
                  <FormField label="Story" textarea required rows={4} value={form.enStory} onChange={(e) => setForm((f) => ({ ...f, enStory: (e.target as HTMLTextAreaElement).value }))} placeholder="Story..." />
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-white/[0.06] flex gap-3 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-white/60 bg-white/5 hover:bg-white/10 transition-colors">
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
          title="Delete Story"
          message={`This will deactivate "${confirmDelete.en.title}".`}
          danger
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
