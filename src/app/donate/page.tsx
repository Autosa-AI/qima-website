"use client";
import { useState, useEffect, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useLang } from "@/context/LanguageContext";
import { trackEvent } from "@/hooks/useAnalytics";
import { ChevronDown, Check, Search, X, Shield, Zap, CalendarDays, HeartHandshake, Users, ArrowUpRight } from "lucide-react";
import Link from "next/link";

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Case {
  _id: string;
  number: string;
  ar: { name: string; brief: string; story: string; need: string };
  en: { name: string; brief: string; story: string; need: string };
  isUrgent: boolean;
  isActive: boolean;
  targetAmount?: number;
  raisedAmount?: number;
  responsibleAdminName?: string;
  categoryId: string;
}
interface Category {
  _id: string; slug: string; icon: string;
  ar: { label: string }; en: { label: string };
  cases: Case[];
}

const AMOUNTS = [
  { key: "50",     ar: "٥٠ جنيه",  en: "EGP 50"  },
  { key: "200",    ar: "٢٠٠ جنيه", en: "EGP 200" },
  { key: "500",    ar: "٥٠٠ جنيه", en: "EGP 500" },
  { key: "custom", ar: "مبلغ آخر", en: "Custom"   },
];

const CAT_ICONS: Record<string, React.ReactNode> = {
  monthly: <CalendarDays  size={14} />,
  gaza:    <HeartHandshake size={14} />,
  orphans: <Users          size={14} />,
};

const ACCENT = ["#4F8EF7","#C9A84C","#34D399","#A78BFA","#F97316","#EC4899"];

function pct(raised = 0, target = 0) {
  if (!target) return 0;
  return Math.min(100, Math.round((raised / target) * 100));
}

/* ─── Progress bar (animates on scroll) ─────────────────────────────────── */
function ProgressBar({ raised = 0, target = 0, accent, isRTL }: { raised?: number; target?: number; accent: string; isRTL: boolean }) {
  const ref   = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const p     = pct(raised, target);

  if (!target) return (
    <p className="text-white/30 text-xs">{isRTL ? "جمع التبرعات جارية" : "Fundraising in progress"}</p>
  );

  return (
    <div ref={ref} className="space-y-1.5">
      <div className="h-2 w-full bg-white/[0.07] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: accent }}
          initial={{ width: 0 }}
          animate={inView ? { width: `${p}%` } : { width: 0 }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-white/40 text-xs">
          {raised.toLocaleString("ar-EG")} / {target.toLocaleString("ar-EG")} جنيه
        </span>
        <span className="font-bold text-xs" style={{ color: accent }}>{p}%</span>
      </div>
    </div>
  );
}

/* ─── Case card ─────────────────────────────────────────────────────────── */
function CaseCard({
  c, accent, isRTL, isSelected, onSelect, isComplete,
}: {
  c: Case; accent: string; isRTL: boolean;
  isSelected: boolean; onSelect: (c: Case) => void; isComplete: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const content = isRTL ? c.ar : c.en;
  const ref     = useRef<HTMLDivElement>(null);
  const inView  = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      onClick={() => { if (!isComplete) onSelect(c); }}
      className={`group relative rounded-3xl border overflow-hidden transition-all duration-300 ${
        isComplete
          ? "border-emerald-500/30 bg-emerald-500/[0.03] cursor-default opacity-75"
          : isSelected
            ? "border-gold/50 bg-gold/[0.05] shadow-[0_0_30px_rgba(201,168,76,0.12)] cursor-pointer"
            : "border-white/[0.07] bg-white/[0.02] hover:border-white/15 hover:shadow-[0_0_20px_rgba(0,0,0,0.4)] cursor-pointer"
      }`}
    >
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-3xl" style={{ background: accent }} />

      <div className="p-5 pl-6">
        {/* Top row */}
        <div className={`flex items-center justify-between mb-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          <div className="flex items-center gap-2">
            <span
              className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-mono font-bold"
              style={{ background: `${accent}20`, color: accent }}
            >
              {c.number}
            </span>
            {c.isUrgent && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-400/15 text-yellow-400 border border-yellow-400/20">
                <Zap size={9} />{isRTL ? "عاجل" : "URGENT"}
              </span>
            )}
          </div>
          {isComplete ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              <Check size={9} />{isRTL ? "مكتملة" : "Funded"}
            </span>
          ) : (
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${isSelected ? "text-black" : "text-white/20"}`}
              style={isSelected ? { background: accent } : {}}>
              {isSelected ? <Check size={12} /> : <span className="text-sm leading-none">+</span>}
            </div>
          )}
        </div>

        {/* Name + brief */}
        <h3 className={`font-bold text-white text-base leading-snug mb-1 ${isRTL ? "text-right font-arabic" : "text-left"}`}>
          {content.name}
        </h3>
        <p className={`text-white/45 text-sm mb-4 ${isRTL ? "text-right font-arabic" : "text-left"}`}>
          {content.brief}
        </p>

        {/* Progress */}
        <ProgressBar raised={c.raisedAmount} target={c.targetAmount} accent={accent} isRTL={isRTL} />

        {/* Story toggle */}
        <motion.button
          onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
          className={`group relative flex items-center gap-2 mt-5 ${isRTL ? "flex-row-reverse font-arabic" : ""}`}
          whileTap={{ scale: 0.96 }}
        >
          {/* Pulsing beacon */}
          <AnimatePresence>
            {!expanded && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [1, 1.6, 1], opacity: [0.6, 1, 0.6] }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                className="flex-shrink-0 w-1.5 h-1.5 rounded-full"
                style={{ background: accent }}
              />
            )}
          </AnimatePresence>

          {/* Bouncing chevron */}
          <motion.div
            animate={expanded
              ? { rotate: 180, y: 0 }
              : { rotate: 0, y: [0, 2.5, 0] }
            }
            transition={expanded
              ? { duration: 0.3, ease: "easeInOut" }
              : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
            }
            style={{ color: expanded ? `${accent}99` : "rgba(255,255,255,0.35)" }}
          >
            <ChevronDown size={13} />
          </motion.div>

          {/* Text with shimmer */}
          <span className="relative overflow-hidden text-xs">
            <AnimatePresence mode="wait">
              <motion.span
                key={expanded ? "hide" : "read"}
                initial={{ opacity: 0, y: expanded ? -6 : 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: expanded ? 6 : -6 }}
                transition={{ duration: 0.2 }}
                className="block"
                style={{ color: expanded ? `${accent}80` : "rgba(255,255,255,0.38)" }}
              >
                {expanded
                  ? (isRTL ? "أخفِ القصة" : "Hide story")
                  : (isRTL ? "اقرأ القصة" : "Read the story")}
              </motion.span>
            </AnimatePresence>

            {/* Underline that grows on hover */}
            <motion.span
              className="absolute bottom-0 left-0 h-px"
              style={{ background: accent }}
              initial={{ scaleX: 0, originX: isRTL ? 1 : 0 }}
              whileHover={{ scaleX: 1 }}
              transition={{ duration: 0.3 }}
            />
          </span>
        </motion.button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <motion.p
                initial={{ y: 8 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className={`text-white/55 text-sm leading-relaxed mt-3 border-t pt-3 ${isRTL ? "text-right font-arabic" : "text-left"}`}
                style={{ borderColor: `${accent}20` }}
              >
                {content.story}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────────── */
export default function DonatePage() {
  const { isRTL, t, lang, setLang } = useLang();

  const [categories, setCategories]     = useState<Category[]>([]);
  const [loading, setLoading]           = useState(true);
  const [activeCat, setActiveCat]       = useState("all");
  const [page, setPage]                 = useState(1);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [selectedAmount, setSelectedAmount] = useState("200");
  const [customAmount, setCustomAmount]     = useState("");
  const [caseInput, setCaseInput]           = useState("");
  const [inputError, setInputError]         = useState(false);
  const [formCat, setFormCat]               = useState("");
  const [vodafoneCopied, setVodafoneCopied] = useState(false);

  const PER_PAGE = 4;
  const formRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    trackEvent("page_view", { page: "donate" });
    // Read ?cat= URL param to pre-select category
    const params = new URLSearchParams(window.location.search);
    const cat    = params.get("cat");
    if (cat) setActiveCat(cat);

    fetch("/api/categories", { cache: "no-store" })
      .then(r => r.json())
      .then(d => { if (d.success) setCategories(d.data ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Reset to page 1 when category changes
  useEffect(() => { setPage(1); }, [activeCat]);

  // All cases flat list
  const allCases = categories.flatMap(cat =>
    cat.cases.map(c => ({ ...c, categorySlug: cat.slug }))
  );

  const caseIndex: Record<string, Case> = {};
  allCases.forEach(c => { caseIndex[c.number] = c; });

  const filtered   = (activeCat === "all" ? allCases : (categories.find(c => c.slug === activeCat)?.cases ?? [])).filter(c => c.isActive);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function handleSelect(c: Case) {
    if (pct(c.raisedAmount, c.targetAmount) >= 100 && c.targetAmount) return;
    setSelectedCase(c);
    setCaseInput(c.number);
    setInputError(false);
    const cat = categories.find(cat => cat._id === c.categoryId);
    if (cat) setFormCat(cat.slug);
    trackEvent("case_select", { caseNumber: c.number, caseName: isRTL ? c.ar.name : c.en.name });
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function handleCaseInput(val: string) {
    setCaseInput(val);
    setInputError(false);
    if (!val.trim()) { setSelectedCase(null); return; }
    const found = caseIndex[val.trim().padStart(3, "0")];
    if (found) {
      setSelectedCase(found);
      const cat = categories.find(cat => cat._id === found.categoryId);
      if (cat) setFormCat(cat.slug);
    } else if (val.length >= 3) { setSelectedCase(null); setInputError(true); }
  }

  function buildWhatsAppUrl() {
    const amountLabel = selectedAmount === "custom"
      ? (customAmount ? `${customAmount} ${isRTL ? "جنيه" : "EGP"}` : (isRTL ? "مبلغ غير محدد" : "Not specified"))
      : (AMOUNTS.find(a => a.key === selectedAmount)?.[isRTL ? "ar" : "en"] ?? selectedAmount);

    const catLabel = formCat
      ? categories.find(c => c.slug === formCat)?.[isRTL ? "ar" : "en"].label ?? ""
      : "";

    const dest = selectedCase
      ? `#${selectedCase.number} - ${isRTL ? selectedCase.ar.name : selectedCase.en.name}`
      : catLabel
        ? (isRTL ? `تصنيف: ${catLabel}` : `Category: ${catLabel}`)
        : (isRTL ? "الأولوية الأشد إلحاحًا" : "Most urgent priority");

    const responsible = selectedCase?.responsibleAdminName
      ? (isRTL ? `\n- المسؤول: ${selectedCase.responsibleAdminName}` : `\n- Handler: ${selectedCase.responsibleAdminName}`)
      : "";

    const msg = isRTL
      ? `السلام عليكم فريق قيمة،\n\nأريد التبرع بالتفاصيل التالية:\n- المبلغ: ${amountLabel}\n- الحالة: ${dest}${responsible}\n\nارجو التواصل لإتمام التبرع. شكراً`
      : `Hello Qima team,\n\nI would like to donate:\n- Amount: ${amountLabel}\n- Case: ${dest}${responsible}\n\nPlease get in touch. Thank you`;

    return `https://wa.me/201039091390?text=${encodeURIComponent(msg)}`;
  }

  const catColor = (slug: string) => {
    const idx = categories.findIndex(c => c.slug === slug);
    return ACCENT[idx % ACCENT.length] ?? "#C9A84C";
  };

  return (
    <div className={`min-h-screen bg-black ${isRTL ? "font-arabic" : ""}`}>

      {/* ── Nav ───────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/[0.05]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="قيمة" className="h-8 w-auto opacity-90 hover:opacity-100 transition-opacity" />
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(lang === "ar" ? "en" : "ar")}
              className="text-xs border border-white/20 text-white/70 hover:border-gold/60 hover:text-gold px-3 py-1.5 rounded-full transition-all"
            >
              {lang === "ar" ? "EN" : "عربي"}
            </button>
            <Link href="/" className={`text-white/40 hover:text-white text-sm transition-colors ${isRTL ? "font-arabic" : ""}`}>
              {isRTL ? "→ العودة للرئيسية" : "← Back to home"}
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 pt-28 pb-24">

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-center mb-14 ${isRTL ? "font-arabic" : ""}`}
        >
          <p className="text-gold/70 text-xs tracking-widest uppercase mb-3">
            {isRTL ? "تبرع الآن" : "Donate Now"}
          </p>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
            {isRTL ? "اختر حالة وأوصِل الحق لصاحبه" : "Choose a case. Deliver what's theirs."}
          </h1>
          <p className="text-white/40 max-w-lg mx-auto text-sm leading-relaxed">
            {isRTL
              ? "كل حالة وراءها إنسان كادح يصمت. تبرعك يصله مباشرة عبر فريقنا الميداني."
              : "Every case is a person who works in silence. Your donation reaches them directly through our field team."}
          </p>
        </motion.div>

        {/* ── Category filter ───────────────────────────────────────────── */}
        <div className={`flex gap-2 flex-wrap justify-center mb-10 ${isRTL ? "flex-row-reverse font-arabic" : ""}`}>
          <button
            onClick={() => setActiveCat("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
              activeCat === "all"
                ? "bg-gold text-black border-gold"
                : "border-white/10 text-white/50 hover:border-white/20 hover:text-white"
            }`}
          >
            {isRTL ? "الكل" : "All"}
          </button>
          {categories.map(cat => (
            <button
              key={cat.slug}
              onClick={() => setActiveCat(cat.slug)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                activeCat === cat.slug
                  ? "text-black border-transparent"
                  : "border-white/10 text-white/50 hover:border-white/20 hover:text-white"
              }`}
              style={activeCat === cat.slug ? { background: catColor(cat.slug), borderColor: catColor(cat.slug) } : {}}
            >
              {CAT_ICONS[cat.slug] ?? null}
              <span>{isRTL ? cat.ar.label : cat.en.label}</span>
            </button>
          ))}
        </div>

        {/* ── Cases grid ────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid md:grid-cols-2 gap-5 mb-8">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-52 rounded-3xl bg-white/[0.02] border border-white/[0.05] animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeCat}-${page}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="grid md:grid-cols-2 gap-5 mb-6"
              >
                {paginated.map((c, i) => (
                  <CaseCard
                    key={c._id ?? c.number}
                    c={c}
                    accent={ACCENT[((page - 1) * PER_PAGE + i) % ACCENT.length]}
                    isRTL={isRTL}
                    isSelected={selectedCase?.number === c.number}
                    onSelect={handleSelect}
                    isComplete={pct(c.raisedAmount, c.targetAmount) >= 100 && !!c.targetAmount}
                  />
                ))}
                {paginated.length === 0 && (
                  <p className={`col-span-2 text-center text-white/20 py-12 ${isRTL ? "font-arabic" : ""}`}>
                    {isRTL ? "لا توجد حالات في هذا التصنيف" : "No cases in this category"}
                  </p>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={`flex items-center justify-center gap-2 mb-16 flex-wrap ${isRTL ? "flex-row-reverse font-arabic" : ""}`}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/25 disabled:opacity-25 transition-all"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={isRTL ? "" : "rotate-180"}>
                    <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                </button>

                <div className="flex items-center gap-1">
                  {(() => {
                    const pages = new Set<number>([1, totalPages, page]);
                    if (page > 1) pages.add(page - 1);
                    if (page < totalPages) pages.add(page + 1);
                    const sorted = Array.from(pages).sort((a, b) => a - b);
                    const items: (number | null)[] = [];
                    for (let i = 0; i < sorted.length; i++) {
                      if (i > 0 && sorted[i] - sorted[i - 1] > 1) items.push(null);
                      items.push(sorted[i]);
                    }
                    return items.map((p, i) =>
                      p === null ? (
                        <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-white/25 text-sm select-none">…</span>
                      ) : (
                        <button key={p} onClick={() => setPage(p)}
                          className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all ${
                            p === page
                              ? "bg-gold text-black"
                              : "text-white/40 hover:text-white hover:bg-white/5"
                          }`}>
                          {p}
                        </button>
                      )
                    );
                  })()}
                </div>

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/25 disabled:opacity-25 transition-all"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={isRTL ? "rotate-180" : ""}>
                    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                </button>

                <span className="text-white/25 text-xs">
                  {isRTL ? `${filtered.length} حالة` : `${filtered.length} cases`}
                </span>
              </div>
            )}
            {totalPages <= 1 && <div className="mb-16" />}
          </>
        )}

        {/* ── Trust banner ──────────────────────────────────────────────── */}
        <div className="max-w-lg mx-auto mb-6">
          <a
            href="https://wa.me/201039091390"
            target="_blank"
            rel="noopener noreferrer"
            className={`group flex items-center gap-3.5 w-full rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] hover:bg-emerald-500/[0.08] hover:border-emerald-500/35 transition-all duration-300 px-5 py-4 ${isRTL ? "flex-row-reverse font-arabic" : ""}`}
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <Shield size={15} />
            </div>
            <div className={`flex-1 min-w-0 ${isRTL ? "text-right" : "text-left"}`}>
              <p className="text-emerald-400 text-xs font-bold mb-0.5">
                {isRTL ? "جميع الحالات موثقة ومتحقق منها" : "All cases are verified & documented"}
              </p>
              <p className="text-white/35 text-xs leading-relaxed">
                {isRTL
                  ? "يسعدنا تزويدك بأي إثبات تريده - فقط اسألنا عند التواصل على واتساب"
                  : "Happy to share any proof you need - just ask when you chat with us on WhatsApp"}
              </p>
            </div>
            <div className={`flex-shrink-0 text-emerald-500/40 group-hover:text-emerald-400 transition-colors ${isRTL ? "rotate-180" : ""}`}>
              <ArrowUpRight size={14} />
            </div>
          </a>
        </div>

        {/* ── Donation form ─────────────────────────────────────────────── */}
        <div ref={formRef} className="max-w-lg mx-auto">
          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-7 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/[0.04] rounded-full blur-3xl pointer-events-none" />
            <div className={`relative z-10 ${isRTL ? "font-arabic" : ""}`}>

              <h2 className={`text-white font-bold text-lg mb-5 ${isRTL ? "text-right" : "text-left"}`}>
                {isRTL ? "أكمل تبرعك" : "Complete your donation"}
              </h2>

              {/* Category pills */}
              <p className={`text-white/40 text-xs mb-2 ${isRTL ? "text-right" : "text-left"}`}>
                {isRTL ? "التصنيف" : "Category"}
              </p>
              <div className={`flex flex-wrap gap-2 mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                {categories.map((cat, i) => {
                  const active = formCat === cat.slug;
                  const color  = ACCENT[i % ACCENT.length];
                  return (
                    <button
                      key={cat.slug}
                      onClick={() => {
                        setFormCat(active ? "" : cat.slug);
                        if (!active) { setSelectedCase(null); setCaseInput(""); setInputError(false); }
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        active ? "text-black border-transparent" : "border-white/10 text-white/45 hover:border-white/20 hover:text-white/70"
                      }`}
                      style={active ? { background: color, borderColor: color } : {}}
                    >
                      {CAT_ICONS[cat.slug] ?? null}
                      <span>{isRTL ? cat.ar.label : cat.en.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="h-px bg-white/[0.06] mb-4" />

              {/* Case input */}
              <p className={`text-white/40 text-xs mb-2 ${isRTL ? "text-right" : "text-left"}`}>
                {isRTL ? "رقم الحالة (اختياري)" : "Case number (optional)"}
              </p>
              <div className="relative mb-3">
                <div className={`absolute top-1/2 -translate-y-1/2 text-white/25 ${isRTL ? "right-3" : "left-3"}`}>
                  <Search size={13} />
                </div>
                <input
                  type="text" maxLength={3}
                  value={caseInput}
                  onChange={e => handleCaseInput(e.target.value)}
                  placeholder={isRTL ? "مثال: 003" : "e.g. 003"}
                  className={`w-full bg-white/[0.04] border rounded-xl py-2.5 text-white placeholder:text-white/20 focus:outline-none transition-colors text-sm font-mono ${
                    isRTL ? "pr-8 pl-8 text-right" : "pl-8 pr-8 text-left"
                  } ${inputError ? "border-red-500/40" : selectedCase ? "border-gold/40" : "border-white/10 focus:border-white/20"}`}
                />
                {caseInput && (
                  <button onClick={() => { setCaseInput(""); setSelectedCase(null); setInputError(false); }}
                    className={`absolute top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 ${isRTL ? "left-3" : "right-3"}`}>
                    <X size={13} />
                  </button>
                )}
              </div>

              <AnimatePresence>
                {selectedCase && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className={`flex items-center gap-1.5 mb-4 text-gold/80 text-xs ${isRTL ? "flex-row-reverse" : ""}`}>
                    <Check size={10} />
                    <span>{isRTL ? selectedCase.ar.name : selectedCase.en.name}</span>
                  </motion.div>
                )}
                {inputError && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className={`mb-4 text-red-400/65 text-xs ${isRTL ? "text-right" : "text-left"}`}>
                    {isRTL ? "رقم الحالة غير موجود" : "Case not found"}
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="h-px bg-white/[0.06] mb-4" />

              {/* Amounts */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {AMOUNTS.map(a => {
                  const active = selectedAmount === a.key;
                  return (
                    <button key={a.key} onClick={() => setSelectedAmount(a.key)}
                      className={`rounded-xl border py-2.5 text-sm font-semibold transition-all ${
                        active ? "border-gold bg-gold/10 text-gold" : "border-white/8 text-white/45 hover:border-white/15 bg-white/[0.02]"
                      }`}>
                      {isRTL ? a.ar : a.en}
                    </button>
                  );
                })}
              </div>

              <AnimatePresence>
                {selectedAmount === "custom" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-4 overflow-hidden">
                    <input type="number" min="1" value={customAmount} onChange={e => setCustomAmount(e.target.value)}
                      placeholder={isRTL ? "أدخل المبلغ (جنيه)" : "Enter amount (EGP)"}
                      className={`w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/20 focus:outline-none focus:border-gold/40 text-sm ${isRTL ? "text-right" : "text-left"}`} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* CTA buttons */}
              <div className="space-y-2">
                {/* WhatsApp — primary */}
                <a
                  href={buildWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent("donate_intent", {
                    amount: selectedAmount === "custom" ? customAmount || "custom" : selectedAmount,
                    caseNumber: selectedCase?.number ?? "",
                  })}
                  className={`group relative flex items-center justify-center gap-2.5 w-full px-6 py-4 bg-gold text-black font-bold rounded-2xl overflow-hidden transition-all hover:shadow-[0_0_30px_rgba(201,168,76,0.4)] hover:scale-[1.02] active:scale-[0.98] text-sm ${isRTL ? "flex-row-reverse font-arabic" : ""}`}
                >
                  {/* WhatsApp icon */}
                  <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0 relative z-10" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span className="relative z-10">{t("donate_cta")}</span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </a>

                {/* InstaPay + Vodafone Cash — secondary row */}
                <div className="grid grid-cols-2 gap-2">

                  {/* InstaPay */}
                  <a
                    href="https://ipn.eg/S/qima.charity/instapay/61zQnA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group relative flex flex-col items-center justify-center gap-1.5 px-3 py-3.5 rounded-2xl border border-[#6B21A8]/30 bg-[#6B21A8]/[0.07] hover:bg-[#6B21A8]/[0.14] hover:border-[#6B21A8]/50 transition-all duration-200 overflow-hidden ${isRTL ? "font-arabic" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      <img src="/logos/instapay.svg" alt="InstaPay" className="w-7 h-7 flex-shrink-0" />
                      <span className="text-[#A855F7] font-bold text-xs tracking-wide">InstaPay</span>
                    </div>
                    <span className={`text-white/40 text-[10px] leading-tight text-center ${isRTL ? "font-arabic" : ""}`}>
                      {isRTL ? "ادفع مباشرة" : "Pay directly"}
                    </span>
                    <div className="absolute inset-0 bg-[#6B21A8]/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  </a>

                  {/* Vodafone Cash */}
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText("01039091390").then(() => {
                        setVodafoneCopied(true);
                        setTimeout(() => setVodafoneCopied(false), 2500);
                      });
                    }}
                    className={`group relative flex flex-col items-center justify-center gap-1.5 px-3 py-3.5 rounded-2xl border transition-all duration-200 overflow-hidden ${
                      vodafoneCopied
                        ? "border-emerald-500/40 bg-emerald-500/[0.08]"
                        : "border-red-600/30 bg-red-600/[0.07] hover:bg-red-600/[0.14] hover:border-red-600/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <img src="/logos/vodafone-cash.svg" alt="Vodafone Cash" className="w-7 h-7 flex-shrink-0" />
                      <span className={`font-bold text-xs tracking-wide ${vodafoneCopied ? "text-emerald-400" : "text-red-400"}`}>
                        {vodafoneCopied
                          ? (isRTL ? "✓ تم النسخ" : "✓ Copied!")
                          : "Vodafone Cash"}
                      </span>
                    </div>
                    <span className={`text-white/40 text-[10px] leading-tight text-center ${isRTL ? "font-arabic" : ""}`}>
                      {vodafoneCopied
                        ? "01039091390"
                        : (isRTL ? "انسخ الرقم" : "Tap to copy number")}
                    </span>
                    {!vodafoneCopied && (
                      <div className="absolute inset-0 bg-red-600/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    )}
                  </button>

                </div>
              </div>

              <div className={`flex items-center justify-center gap-1.5 mt-3 text-white/20 text-xs ${isRTL ? "flex-row-reverse" : ""}`}>
                <Shield size={10} />
                <span>{t("donate_secure")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
