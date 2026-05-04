"use client";
import { useState, useEffect, useCallback } from "react";
import { useAdmin } from "@/components/admin/AdminContext";
import { useToast } from "@/components/admin/Toast";
import ConfirmModal from "@/components/admin/ConfirmModal";
import FormField from "@/components/admin/FormField";
import { Plus, Edit2, Trash2, ChevronUp, ChevronDown } from "lucide-react";

interface Category {
  _id: string;
  slug: string;
  icon: string;
  ar: { label: string };
  en: { label: string };
  order: number;
  isActive: boolean;
  cases?: unknown[];
}

interface FormState {
  slug: string;
  icon: string;
  arLabel: string;
  enLabel: string;
}

const EMPTY_FORM: FormState = { slug: "", icon: "", arLabel: "", enLabel: "" };

export default function CategoriesPage() {
  const { fetchWithAuth } = useAdmin();
  const { toast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<FormState>>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Category | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/api/categories");
      const data = await res.json();
      if (data.success) setCategories(data.data ?? []);
    } catch {
      toast("Failed to load categories", "error");
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, toast]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setShowModal(true);
  }

  function openEdit(cat: Category) {
    setEditingId(cat._id);
    setForm({
      slug: cat.slug,
      icon: cat.icon,
      arLabel: cat.ar.label,
      enLabel: cat.en.label,
    });
    setFormErrors({});
    setShowModal(true);
  }

  function validate(): boolean {
    const errors: Partial<FormState> = {};
    if (!form.slug.trim()) errors.slug = "Slug is required";
    if (!form.icon.trim()) errors.icon = "Icon is required";
    if (!form.arLabel.trim()) errors.arLabel = "Arabic label is required";
    if (!form.enLabel.trim()) errors.enLabel = "English label is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        slug: form.slug.trim(),
        icon: form.icon.trim(),
        ar: { label: form.arLabel.trim() },
        en: { label: form.enLabel.trim() },
      };

      const res = editingId
        ? await fetchWithAuth(`/api/categories/${editingId}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          })
        : await fetchWithAuth("/api/categories", {
            method: "POST",
            body: JSON.stringify(payload),
          });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast(editingId ? "Category updated" : "Category created", "success");
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(cat: Category) {
    try {
      const res = await fetchWithAuth(`/api/categories/${cat._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast("Category deleted", "success");
      fetchCategories();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to delete", "error");
    } finally {
      setConfirmDelete(null);
    }
  }

  async function handleToggleActive(cat: Category) {
    try {
      const res = await fetchWithAuth(`/api/categories/${cat._id}`, {
        method: "PUT",
        body: JSON.stringify({
          slug: cat.slug,
          icon: cat.icon,
          ar: cat.ar,
          en: cat.en,
          isActive: !cat.isActive,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast(`Category ${cat.isActive ? "deactivated" : "activated"}`, "success");
      fetchCategories();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update", "error");
    }
  }

  async function handleReorder(cat: Category, dir: -1 | 1) {
    try {
      await fetchWithAuth(`/api/categories/${cat._id}`, {
        method: "PATCH",
        body: JSON.stringify({ order: cat.order + dir }),
      });
      fetchCategories();
    } catch {
      toast("Failed to reorder", "error");
    }
  }

  return (
    <div className="px-4 py-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-white text-2xl font-bold">Categories</h1>
          <p className="text-white/40 text-sm mt-1">Manage donation categories</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C9A84C] text-black text-sm font-bold hover:bg-[#d4b05a] transition-colors"
        >
          <Plus size={16} />
          Add Category
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-[#141414] border border-white/[0.06] animate-pulse" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 text-white/25 text-sm">
          No categories yet. Add your first one.
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.06] bg-[#141414] overflow-x-auto">
          <table className="w-full min-w-[540px]">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-5 py-3 text-white/40 text-xs font-medium">Icon</th>
                <th className="text-left px-5 py-3 text-white/40 text-xs font-medium">Slug</th>
                <th className="text-left px-5 py-3 text-white/40 text-xs font-medium">Arabic</th>
                <th className="text-left px-5 py-3 text-white/40 text-xs font-medium">English</th>
                <th className="text-left px-5 py-3 text-white/40 text-xs font-medium">Cases</th>
                <th className="text-left px-5 py-3 text-white/40 text-xs font-medium">Status</th>
                <th className="text-left px-5 py-3 text-white/40 text-xs font-medium">Order</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {categories.map((cat) => (
                <tr key={cat._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5 text-2xl">{cat.icon}</td>
                  <td className="px-5 py-3.5 text-white/70 text-sm font-mono">{cat.slug}</td>
                  <td className="px-5 py-3.5 text-white text-sm">{cat.ar.label}</td>
                  <td className="px-5 py-3.5 text-white text-sm">{cat.en.label}</td>
                  <td className="px-5 py-3.5 text-white/40 text-sm">
                    {(cat.cases?.length ?? 0)}
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => handleToggleActive(cat)}
                      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        cat.isActive
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                          : "bg-white/5 text-white/30 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      {cat.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleReorder(cat, -1)}
                        className="p-1 text-white/30 hover:text-white/60 transition-colors"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <span className="text-white/40 text-xs w-4 text-center">{cat.order}</span>
                      <button
                        onClick={() => handleReorder(cat, 1)}
                        className="p-1 text-white/30 hover:text-white/60 transition-colors"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => openEdit(cat)}
                        className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(cat)}
                        className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#141414] p-6 shadow-2xl">
            <h2 className="text-white font-bold text-lg mb-5">
              {editingId ? "Edit Category" : "Add Category"}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="Slug"
                  required
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: (e.target as HTMLInputElement).value }))}
                  placeholder="monthly"
                  error={formErrors.slug}
                  hint="URL-safe identifier"
                />
                <FormField
                  label="Icon (emoji)"
                  required
                  value={form.icon}
                  onChange={(e) => setForm((f) => ({ ...f, icon: (e.target as HTMLInputElement).value }))}
                  placeholder="📋"
                  error={formErrors.icon}
                />
              </div>
              <FormField
                label="Arabic Label"
                required
                value={form.arLabel}
                onChange={(e) => setForm((f) => ({ ...f, arLabel: (e.target as HTMLInputElement).value }))}
                placeholder="شهريات"
                error={formErrors.arLabel}
              />
              <FormField
                label="English Label"
                required
                value={form.enLabel}
                onChange={(e) => setForm((f) => ({ ...f, enLabel: (e.target as HTMLInputElement).value }))}
                placeholder="Monthly Support"
                error={formErrors.enLabel}
              />
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white/60 bg-white/5 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-[#C9A84C] text-black hover:bg-[#d4b05a] disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving…" : editingId ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <ConfirmModal
          title="Delete Category"
          message={`This will deactivate "${confirmDelete.en.label}" and all its cases. This action can be reversed by re-activating.`}
          danger
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
