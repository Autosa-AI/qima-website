"use client";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { useLang } from "@/context/LanguageContext";
import { Shield, CalendarDays, HeartHandshake, Users, ArrowUpRight, ChevronLeft } from "lucide-react";
import { trackEvent } from "@/hooks/useAnalytics";

interface ApiCategory {
  _id: string; slug: string;
  ar: { label: string }; en: { label: string };
  cases: { number: string }[];
}

const CAT_META: Record<string, { icon: React.ReactNode; accent: string }> = {
  monthly: { icon: <CalendarDays  size={16} />, accent: "#4F8EF7" },
  gaza:    { icon: <HeartHandshake size={16} />, accent: "#34D399" },
  orphans: { icon: <Users          size={16} />, accent: "#A78BFA" },
};

const AMOUNTS = [
  { key: "50",     ar: "٥٠ جنيه",  en: "EGP 50"  },
  { key: "200",    ar: "٢٠٠ جنيه", en: "EGP 200" },
  { key: "500",    ar: "٥٠٠ جنيه", en: "EGP 500" },
  { key: "custom", ar: "مبلغ آخر", en: "Custom"   },
];

const FALLBACK_CATS: ApiCategory[] = [
  { _id: "1", slug: "monthly",  ar: { label: "شهريات"       }, en: { label: "Monthly Support"  }, cases: [] },
  { _id: "2", slug: "gaza",     ar: { label: "أسر غزة"      }, en: { label: "Gaza Families"    }, cases: [] },
  { _id: "3", slug: "orphans",  ar: { label: "أيتام وأرامل" }, en: { label: "Orphans & Widows" }, cases: [] },
];

const WA_ICON = (
  <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function Donate() {
  const { t, isRTL } = useLang();
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const [categories,    setCategories]    = useState<ApiCategory[]>([]);
  const [activeCat,     setActiveCat]     = useState<string>("");   // "" = none selected
  const [selectedAmount, setSelectedAmount] = useState("200");
  const [customVal,      setCustomVal]      = useState("");
  const [totalCases,     setTotalCases]     = useState(0);

  useEffect(() => {
    fetch("/api/categories")
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data?.length) {
          setCategories(d.data);
          setTotalCases((d.data as ApiCategory[]).reduce((s: number, c: ApiCategory) => s + c.cases.length, 0));
        }
      })
      .catch(() => {});
  }, []);

  const cats       = categories.length > 0 ? categories : FALLBACK_CATS;
  const activeMeta = activeCat ? (CAT_META[activeCat] ?? { icon: null, accent: "#C9A84C" }) : null;
  const activeLabel = activeCat
    ? (cats.find(c => c.slug === activeCat)?.[isRTL ? "ar" : "en"].label ?? "")
    : "";

  function buildUrl() {
    const amountLabel = selectedAmount === "custom"
      ? (customVal ? `${customVal} ${isRTL ? "جنيه" : "EGP"}` : (isRTL ? "مبلغ غير محدد" : "Not specified"))
      : (AMOUNTS.find(a => a.key === selectedAmount)?.[isRTL ? "ar" : "en"] ?? "");
    const catLabel = activeLabel ? (isRTL ? `تصنيف: ${activeLabel}` : `Category: ${activeLabel}`) : (isRTL ? "الأولوية الأشد إلحاحًا" : "Most urgent priority");
    const msg = isRTL
      ? `السلام عليكم فريق قيمة،\n\nأريد التبرع بالتفاصيل التالية:\n- المبلغ: ${amountLabel}\n- ${catLabel}\n\nارجو التواصل لإتمام التبرع. شكراً`
      : `Hello Qima team,\n\nI'd like to donate:\n- Amount: ${amountLabel}\n- ${catLabel}\n\nPlease get in touch. Thank you`;
    return `https://wa.me/201039091390?text=${encodeURIComponent(msg)}`;
  }

  return (
    <section id="donate" ref={ref} className="relative py-32 px-6">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gold/[0.04] rounded-full blur-[140px]" />
      </div>

      <div className="max-w-xl mx-auto relative">

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className={`text-center mb-10 ${isRTL ? "font-arabic" : ""}`}
        >
          <div className="badge-label inline-flex items-center gap-2 text-gold/70 text-xs tracking-widest uppercase mb-4 border border-gold/20 px-3 py-1.5 rounded-full">
            <span className="w-1 h-1 rounded-full bg-gold" />
            {t("donate_badge")}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">{t("donate_title")}</h2>
          <p className={`text-white/45 text-sm leading-relaxed ${isRTL ? "font-arabic" : ""}`}>{t("donate_desc")}</p>
        </motion.div>

        {/* ── Quick donate box ── */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.15 }}>
          <div className="relative rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gold/[0.05] rounded-full blur-3xl pointer-events-none" />
            <div className={`relative z-10 ${isRTL ? "font-arabic" : ""}`}>

              {/* ① Category selector */}
              <p className={`text-white/40 text-xs font-medium mb-3 ${isRTL ? "text-right" : "text-left"}`}>
                {isRTL ? "١. اختر تصنيفًا (اختياري)" : "1. Choose a category (optional)"}
              </p>
              <div className={`flex gap-2 flex-wrap mb-5 ${isRTL ? "flex-row-reverse" : ""}`}>
                {cats.map(cat => {
                  const meta   = CAT_META[cat.slug];
                  const active = activeCat === cat.slug;
                  const label  = isRTL ? cat.ar.label : cat.en.label;
                  return (
                    <button
                      key={cat.slug}
                      onClick={() => {
                        setActiveCat(active ? "" : cat.slug);
                        if (!active) trackEvent("category_click", { categoryId: cat.slug, categoryLabel: label });
                      }}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${isRTL ? "flex-row-reverse" : ""}`}
                      style={active ? {
                        background: `${meta?.accent}18`,
                        borderColor: `${meta?.accent}50`,
                        color: meta?.accent,
                        boxShadow: `0 0 16px ${meta?.accent}20`,
                      } : {
                        background: "rgba(255,255,255,0.02)",
                        borderColor: "rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.45)",
                      }}
                    >
                      <span className={active ? "" : "opacity-50"}>{meta?.icon}</span>
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Active category confirmation */}
              <AnimatePresence>
                {activeCat && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className={`flex items-center gap-2 mb-4 text-xs ${isRTL ? "flex-row-reverse justify-end" : ""}`}
                      style={{ color: activeMeta?.accent }}>
                      <span className="opacity-60">✓</span>
                      <span>{isRTL ? `التصنيف المختار: ${activeLabel}` : `Selected: ${activeLabel}`}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="h-px bg-white/[0.06] mb-5" />

              {/* ② Amount */}
              <p className={`text-white/40 text-xs font-medium mb-3 ${isRTL ? "text-right" : "text-left"}`}>
                {isRTL ? "٢. اختر المبلغ" : "2. Choose an amount"}
              </p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {AMOUNTS.map(a => {
                  const active = selectedAmount === a.key;
                  return (
                    <button key={a.key} onClick={() => setSelectedAmount(a.key)}
                      className={`rounded-xl border py-2.5 text-sm font-semibold transition-all duration-200 ${
                        active
                          ? "border-gold bg-gold/10 text-gold shadow-[0_0_14px_rgba(201,168,76,0.18)]"
                          : "border-white/8 text-white/45 hover:border-white/15 hover:text-white/75 bg-white/[0.02]"
                      }`}>
                      {isRTL ? a.ar : a.en}
                    </button>
                  );
                })}
              </div>
              <AnimatePresence>
                {selectedAmount === "custom" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-3">
                    <input type="number" min="1" value={customVal} onChange={e => setCustomVal(e.target.value)}
                      placeholder={isRTL ? "أدخل المبلغ (جنيه)" : "Enter amount (EGP)"}
                      className={`w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/25 focus:outline-none focus:border-gold/40 text-sm transition-colors ${isRTL ? "text-right" : "text-left"}`} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ③ WhatsApp CTA */}
              <a href={buildUrl()} target="_blank" rel="noopener noreferrer"
                onClick={() => trackEvent("donate_intent", { amount: selectedAmount, categoryId: activeCat })}
                className="group relative flex items-center justify-center gap-2.5 w-full px-6 py-3.5 bg-gold text-black font-bold rounded-2xl overflow-hidden transition-all hover:shadow-[0_0_28px_rgba(201,168,76,0.4)] hover:scale-[1.02] active:scale-[0.98] text-sm mt-1">
                {WA_ICON}
                <span className="relative z-10">{t("donate_cta")}</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </a>

              <div className={`flex items-center justify-center gap-1.5 mt-3 text-white/20 text-xs ${isRTL ? "flex-row-reverse" : ""}`}>
                <Shield size={10} />
                <span>{t("donate_secure")}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Big "all cases" button ── */}
        <motion.a
          href="/donate"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.35 }}
          className={`group mt-4 flex items-center gap-0 w-full rounded-3xl border border-white/[0.07] bg-white/[0.015]
            hover:border-gold/25 hover:bg-gold/[0.03] transition-all duration-400
            overflow-hidden ${isRTL ? "flex-row-reverse font-arabic" : ""}`}
        >
          {/* Text side */}
          <div className={`flex-1 px-7 py-6 ${isRTL ? "text-right" : "text-left"}`}>
            <p className="text-white font-bold text-base mb-0.5 group-hover:text-gold transition-colors">
              {isRTL ? "تصفح جميع الحالات" : "Browse all cases"}
            </p>
            <p className="text-white/35 text-sm">
              {totalCases > 0
                ? (isRTL ? `${totalCases} حالة بتفاصيل كاملة وشريط التقدم` : `${totalCases} cases with full details & progress`)
                : (isRTL ? "تفاصيل كاملة وشريط التقدم لكل حالة" : "Full details & progress bar for each case")}
            </p>
          </div>

          {/* Visual: mini progress bars */}
          <div className="flex-shrink-0 px-6 flex flex-col gap-1.5 opacity-40 group-hover:opacity-80 transition-opacity">
            {[78, 45, 91, 32].map((w, i) => (
              <motion.div key={i} className="flex items-center gap-2">
                <span className="text-white/40 text-[9px] font-mono w-5">{`00${i + 1}`.slice(-3)}</span>
                <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full bg-gold"
                    initial={{ width: 0 }}
                    animate={inView ? { width: `${w}%` } : { width: 0 }}
                    transition={{ duration: 1, delay: 0.5 + i * 0.12, ease: "easeOut" }} />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Arrow */}
          <div className={`flex-shrink-0 w-14 flex items-center justify-center self-stretch border-l border-white/[0.06] group-hover:border-gold/20 transition-colors ${isRTL ? "border-l-0 border-r border-white/[0.06] group-hover:border-gold/20" : ""}`}>
            <motion.div animate={inView ? { x: [0, 4, 0] } : {}}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", delay: 1 }}>
              {isRTL
                ? <ChevronLeft size={20} className="text-white/25 group-hover:text-gold transition-colors" />
                : <ArrowUpRight size={18} className="text-white/25 group-hover:text-gold transition-colors" />}
            </motion.div>
          </div>
        </motion.a>

      </div>
    </section>
  );
}
