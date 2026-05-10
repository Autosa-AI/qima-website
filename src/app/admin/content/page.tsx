"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/components/admin/AdminContext";
import { useToast } from "@/components/admin/Toast";
import { Save, RotateCcw } from "lucide-react";

type Lang = "ar" | "en";
type ContentMap = Record<string, Record<string, Record<string, string>>>;

interface ContentField {
  key: string;
  label: string;
  multiline?: boolean;
}

interface ContentSection {
  id: string;
  label: string;
  fields: ContentField[];
}

const SECTIONS: ContentSection[] = [
  {
    id: "hero",
    label: "Hero",
    fields: [
      { key: "hero_slogan", label: "Slogan", multiline: true },
      { key: "hero_tagline", label: "Tagline" },
      { key: "hero_sub", label: "Subtitle", multiline: true },
      { key: "hero_cta_donate", label: "CTA Donate Button" },
      { key: "hero_cta_learn", label: "CTA Learn Button" },
    ],
  },
  {
    id: "about",
    label: "About",
    fields: [
      { key: "about_badge", label: "Badge" },
      { key: "about_title", label: "Title" },
      { key: "about_p1", label: "Paragraph 1", multiline: true },
      { key: "about_p2", label: "Paragraph 2", multiline: true },
      { key: "about_p3", label: "Paragraph 3", multiline: true },
    ],
  },
  {
    id: "mission",
    label: "Mission",
    fields: [
      { key: "mission_badge", label: "Badge" },
      { key: "mission_title", label: "Title" },
      { key: "val_dignity", label: "Value 1: Title" },
      { key: "val_dignity_desc", label: "Value 1: Description", multiline: true },
      { key: "val_impact", label: "Value 2: Title" },
      { key: "val_impact_desc", label: "Value 2: Description", multiline: true },
      { key: "val_transparency", label: "Value 3: Title" },
      { key: "val_transparency_desc", label: "Value 3: Description", multiline: true },
      { key: "val_community", label: "Value 4: Title" },
      { key: "val_community_desc", label: "Value 4: Description", multiline: true },
      { key: "val_innovation", label: "Value 5: Title" },
      { key: "val_innovation_desc", label: "Value 5: Description", multiline: true },
      { key: "val_hope", label: "Value 6: Title" },
      { key: "val_hope_desc", label: "Value 6: Description", multiline: true },
    ],
  },
  {
    id: "projects",
    label: "Projects",
    fields: [
      { key: "projects_badge", label: "Badge" },
      { key: "projects_title", label: "Title" },
      { key: "proj1_title", label: "Project 1: Title" },
      { key: "proj1_desc", label: "Project 1: Description", multiline: true },
      { key: "proj1_tag", label: "Project 1: Tag" },
      { key: "proj2_title", label: "Project 2: Title" },
      { key: "proj2_desc", label: "Project 2: Description", multiline: true },
      { key: "proj2_tag", label: "Project 2: Tag" },
      { key: "proj3_title", label: "Project 3: Title" },
      { key: "proj3_desc", label: "Project 3: Description", multiline: true },
      { key: "proj3_tag", label: "Project 3: Tag" },
      { key: "proj4_title", label: "Project 4: Title" },
      { key: "proj4_desc", label: "Project 4: Description", multiline: true },
      { key: "proj4_tag", label: "Project 4: Tag" },
    ],
  },
  {
    id: "impact",
    label: "Impact",
    fields: [
      { key: "impact_badge", label: "Badge" },
      { key: "impact_title", label: "Title" },
      { key: "impact_families", label: "Families Label" },
      { key: "impact_volunteers", label: "Volunteers Label" },
      { key: "impact_projects", label: "Projects Label" },
      { key: "impact_governorates", label: "Governorates Label" },
    ],
  },
  {
    id: "donate",
    label: "Donate",
    fields: [
      { key: "donate_badge", label: "Badge" },
      { key: "donate_title", label: "Title" },
      { key: "donate_desc", label: "Description", multiline: true },
      { key: "donate_cta", label: "CTA Button" },
      { key: "donate_secure", label: "Security Note" },
    ],
  },
  {
    id: "contact",
    label: "Contact",
    fields: [
      { key: "contact_badge", label: "Badge" },
      { key: "contact_title", label: "Title" },
      { key: "contact_sub", label: "Subtitle" },
      { key: "contact_name", label: "Name Placeholder" },
      { key: "contact_email", label: "Email Placeholder" },
      { key: "contact_message", label: "Message Placeholder", multiline: true },
      { key: "contact_send", label: "Send Button" },
    ],
  },
  {
    id: "footer",
    label: "Footer",
    fields: [
      { key: "footer_desc", label: "Description", multiline: true },
      { key: "footer_rights", label: "Rights Text" },
      { key: "footer_quick", label: "Quick Links Label" },
      { key: "footer_follow", label: "Follow Label" },
    ],
  },
];

export default function ContentPage() {
  const router = useRouter();
  const { fetchWithAuth, admin, loading } = useAdmin();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && admin && admin.role !== "owner") {
      router.replace("/admin/cases");
    }
  }, [loading, admin, router]);

  const [lang, setLang] = useState<Lang>("ar");
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const [overrides, setOverrides] = useState<ContentMap>({});
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const fetchContent = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/api/content");
      const data = await res.json();
      if (data.success) setOverrides(data.data ?? {});
    } catch {
      toast("Failed to load content", "error");
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, toast]);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  function getOverride(key: string): string | undefined {
    return overrides[lang]?.[getSectionId(key)]?.[key];
  }

  function getSectionId(key: string): string {
    for (const section of SECTIONS) {
      if (section.fields.some((f) => f.key === key)) return section.id;
    }
    return "misc";
  }

  function getEditValue(key: string): string {
    const editKey = `${lang}:${key}`;
    return editKey in edits ? edits[editKey] : (getOverride(key) ?? "");
  }

  function handleEdit(key: string, value: string) {
    setEdits((prev) => ({ ...prev, [`${lang}:${key}`]: value }));
  }

  function isModified(key: string): boolean {
    return `${lang}:${key}` in edits;
  }

  function hasOverride(key: string): boolean {
    const sectionId = getSectionId(key);
    return !!overrides[lang]?.[sectionId]?.[key];
  }

  function handleReset(key: string) {
    setEdits((prev) => {
      const next = { ...prev };
      delete next[`${lang}:${key}`];
      return next;
    });
  }

  async function handleSave(key: string, sectionId: string) {
    const value = getEditValue(key);
    const saveKey = `${lang}:${key}`;
    setSaving((p) => ({ ...p, [saveKey]: true }));
    try {
      const res = await fetchWithAuth("/api/content", {
        method: "POST",
        body: JSON.stringify({ lang, section: sectionId, key, value }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      // Update local overrides
      setOverrides((prev) => ({
        ...prev,
        [lang]: {
          ...(prev[lang] ?? {}),
          [sectionId]: {
            ...(prev[lang]?.[sectionId] ?? {}),
            [key]: value,
          },
        },
      }));
      handleReset(key);
      toast("Saved", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save", "error");
    } finally {
      setSaving((p) => ({ ...p, [saveKey]: false }));
    }
  }

  async function handleSaveAll() {
    const section = SECTIONS.find((s) => s.id === activeSection);
    if (!section) return;

    const toSave = section.fields.filter((f) => isModified(f.key));
    if (toSave.length === 0) {
      toast("No changes to save", "info");
      return;
    }

    for (const field of toSave) {
      await handleSave(field.key, activeSection);
    }
    toast(`Saved ${toSave.length} field(s)`, "success");
  }

  const currentSection = SECTIONS.find((s) => s.id === activeSection)!;

  return (
    <div className="px-4 py-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-white text-2xl font-bold">Content</h1>
          <p className="text-white/40 text-sm mt-1">Override site text content</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Language toggle */}
          <div className="flex gap-1 p-1 bg-white/[0.04] rounded-xl border border-white/[0.06]">
            {(["ar", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  lang === l ? "bg-[#C9A84C] text-black" : "text-white/50 hover:text-white"
                }`}
              >
                {l === "ar" ? "العربية" : "English"}
              </button>
            ))}
          </div>

          <button
            onClick={handleSaveAll}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C9A84C] text-black text-sm font-bold hover:bg-[#d4b05a] transition-colors"
          >
            <Save size={14} />
            Save Section
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        {/* Section nav */}
        <aside className="sm:w-44 sm:flex-shrink-0">
          <nav className="flex sm:flex-col gap-1 sm:gap-0 sm:space-y-0.5 overflow-x-auto pb-1 sm:pb-0 -mx-1 px-1 sm:mx-0 sm:px-0">
            {SECTIONS.map((section) => {
              const hasChanges = section.fields.some((f) => isModified(f.key));
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex-shrink-0 sm:w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all ${
                    activeSection === section.id
                      ? "bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/20"
                      : "text-white/50 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  {section.label}
                  {hasChanges && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Fields */}
        <div className="flex-1 min-w-0">
          <div className="rounded-2xl border border-white/[0.06] bg-[#141414] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <h2 className="text-white font-semibold">{currentSection.label}</h2>
            </div>

            {loading ? (
              <div className="p-5 space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {currentSection.fields.map((field) => {
                  const value = getEditValue(field.key);
                  const modified = isModified(field.key);
                  const hasOv = hasOverride(field.key);
                  const saveKey = `${lang}:${field.key}`;
                  const isSaving = !!saving[saveKey];

                  return (
                    <div key={field.key} className="px-5 py-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <label className="text-white/60 text-xs font-medium">{field.label}</label>
                          <span className="text-white/20 text-[10px] font-mono">{field.key}</span>
                          {hasOv && !modified ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/20 font-medium">custom</span>
                          ) : !hasOv && !modified ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/30 border border-white/10 font-medium">default</span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">unsaved</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {modified && (
                            <button
                              onClick={() => handleReset(field.key)}
                              className="p-1 text-white/30 hover:text-white/60 transition-colors"
                              title="Reset changes"
                            >
                              <RotateCcw size={12} />
                            </button>
                          )}
                          <button
                            onClick={() => handleSave(field.key, activeSection)}
                            disabled={isSaving || !modified}
                            className="px-3 py-1 rounded-lg text-xs font-medium bg-[#C9A84C] text-black hover:bg-[#d4b05a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            {isSaving ? "…" : "Save"}
                          </button>
                        </div>
                      </div>

                      {field.multiline ? (
                        <textarea
                          value={value}
                          onChange={(e) => handleEdit(field.key, e.target.value)}
                          rows={3}
                          className={`w-full bg-white/[0.04] border rounded-xl px-3 py-2.5 text-white placeholder:text-white/20 text-sm focus:outline-none resize-none transition-colors ${
                            modified
                              ? "border-blue-500/40 focus:border-blue-500/60"
                              : "border-white/10 focus:border-[#C9A84C]/60"
                          }`}
                          dir={lang === "ar" ? "rtl" : "ltr"}
                        />
                      ) : (
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => handleEdit(field.key, e.target.value)}
                          className={`w-full bg-white/[0.04] border rounded-xl px-3 py-2.5 text-white placeholder:text-white/20 text-sm focus:outline-none transition-colors ${
                            modified
                              ? "border-blue-500/40 focus:border-blue-500/60"
                              : "border-white/10 focus:border-[#C9A84C]/60"
                          }`}
                          dir={lang === "ar" ? "rtl" : "ltr"}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
