"use client";
import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { useLang } from "@/context/LanguageContext";
import { Shield, CalendarDays, HeartHandshake, Users, ArrowUpRight } from "lucide-react";
import { trackEvent } from "@/hooks/useAnalytics";

interface ApiCategory {
  _id: string; slug: string; icon: string;
  ar: { label: string }; en: { label: string };
  cases: { _id: string; number: string; isUrgent: boolean; ar: { name: string }; en: { name: string } }[];
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  monthly:  <CalendarDays  size={20} />,
  gaza:     <HeartHandshake size={20} />,
  orphans:  <Users          size={20} />,
};

const CATEGORY_ACCENTS: Record<string, string> = {
  monthly: "#4F8EF7",
  gaza:    "#34D399",
  orphans: "#A78BFA",
};

const AMOUNTS = [
  { key: "50",     ar: "٥٠ جنيه",  en: "EGP 50"  },
  { key: "200",    ar: "٢٠٠ جنيه", en: "EGP 200" },
  { key: "500",    ar: "٥٠٠ جنيه", en: "EGP 500" },
  { key: "custom", ar: "مبلغ آخر", en: "Custom"   },
];

export default function Donate() {
  const { t, isRTL } = useLang();
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [selectedAmount, setSelectedAmount] = useState("200");

  useEffect(() => {
    fetch("/api/categories")
      .then(r => r.json())
      .then(d => { if (d.success) setCategories(d.data ?? []); })
      .catch(() => {});
  }, []);

  function buildWhatsAppUrl() {
    const amountLabel = AMOUNTS.find(a => a.key === selectedAmount)?.[isRTL ? "ar" : "en"] ?? selectedAmount;
    const msg = isRTL
      ? `السلام عليكم فريق قيمة،\n\nأريد التبرع بمبلغ: ${amountLabel}\n\nارجو التواصل لإتمام التبرع. شكراً`
      : `Hello Qima team,\n\nI'd like to donate ${amountLabel}.\n\nPlease get in touch. Thank you`;
    return `https://wa.me/201039091390?text=${encodeURIComponent(msg)}`;
  }

  return (
    <section id="donate" ref={ref} className="relative py-32 px-6">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gold/[0.04] rounded-full blur-[140px]" />
      </div>

      <div className="max-w-5xl mx-auto relative">

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className={`text-center mb-14 ${isRTL ? "font-arabic" : ""}`}
        >
          <div className="badge-label inline-flex items-center gap-2 text-gold/70 text-xs tracking-widest uppercase mb-4 border border-gold/20 px-3 py-1.5 rounded-full">
            <span className="w-1 h-1 rounded-full bg-gold" />
            {t("donate_badge")}
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-3">{t("donate_title")}</h2>
          <p className={`text-white/45 max-w-xl mx-auto text-sm leading-relaxed ${isRTL ? "font-arabic" : ""}`}>{t("donate_desc")}</p>
        </motion.div>

        <div className={`grid lg:grid-cols-[1fr_340px] gap-8 items-start ${isRTL ? "lg:flex lg:flex-row-reverse" : ""}`}>

          {/* ── Left: Category cards ── */}
          <motion.div initial={{ opacity: 0, x: isRTL ? 40 : -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.8, delay: 0.1 }}>

            <p className={`text-white/30 text-xs mb-4 ${isRTL ? "text-right font-arabic" : "text-left"}`}>
              {isRTL ? "اختر تصنيفًا للتبرع أو تصفح الحالات" : "Choose a category or browse all cases"}
            </p>

            <div className="space-y-3">
              {(categories.length > 0 ? categories : [
                { _id: "1", slug: "monthly",  ar: { label: "شهريات"      }, en: { label: "Monthly Support"  }, icon: "", cases: [] },
                { _id: "2", slug: "gaza",     ar: { label: "أسر غزة"     }, en: { label: "Gaza Families"    }, icon: "", cases: [] },
                { _id: "3", slug: "orphans",  ar: { label: "أيتام وأرامل"}, en: { label: "Orphans & Widows" }, icon: "", cases: [] },
              ]).map((cat, i) => {
                const accent  = CATEGORY_ACCENTS[cat.slug] ?? "#C9A84C";
                const icon    = CATEGORY_ICONS[cat.slug];
                const label   = isRTL ? cat.ar.label : cat.en.label;
                const preview = cat.cases.slice(0, 3).map(c => isRTL ? c.ar.name : c.en.name);
                const count   = cat.cases.length;

                return (
                  <motion.a
                    key={cat._id}
                    href={`/donate?cat=${cat.slug}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    onClick={() => trackEvent("category_click", { categoryId: cat.slug, categoryLabel: label })}
                    className={`group flex items-center gap-5 p-5 rounded-2xl border transition-all duration-300 cursor-pointer
                      border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/15
                      hover:shadow-[0_0_24px_rgba(0,0,0,0.4)] ${isRTL ? "flex-row-reverse font-arabic" : ""}`}
                    style={{ "--ac": accent } as React.CSSProperties}
                  >
                    {/* Icon circle */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110"
                      style={{ background: `${accent}18`, border: `1px solid ${accent}35`, color: accent }}>
                      {icon}
                    </div>

                    {/* Text */}
                    <div className={`flex-1 min-w-0 ${isRTL ? "text-right" : "text-left"}`}>
                      <div className={`flex items-center gap-2 mb-1 ${isRTL ? "flex-row-reverse" : ""}`}>
                        <span className="text-white font-bold text-base">{label}</span>
                        {count > 0 && (
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                            style={{ background: `${accent}18`, color: accent }}>
                            {count} {isRTL ? "حالة" : "cases"}
                          </span>
                        )}
                      </div>
                      {preview.length > 0 && (
                        <p className="text-white/35 text-xs truncate">
                          {preview.join("  ·  ")}
                        </p>
                      )}
                    </div>

                    {/* Arrow */}
                    <ArrowUpRight size={16} className={`flex-shrink-0 text-white/20 group-hover:text-white/60 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${isRTL ? "rotate-[270deg]" : ""}`} />
                  </motion.a>
                );
              })}
            </div>

            {/* Browse all link */}
            <motion.a
              href="/donate"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.6 }}
              className={`group flex items-center gap-2 mt-5 text-white/30 hover:text-gold text-sm transition-colors w-fit ${isRTL ? "flex-row-reverse font-arabic mr-auto" : "ml-auto"}`}
            >
              <span>{isRTL ? "تصفح جميع الحالات بالتفصيل" : "Browse all cases in detail"}</span>
              <ArrowUpRight size={14} className={`group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform ${isRTL ? "rotate-[270deg]" : ""}`} />
            </motion.a>
          </motion.div>

          {/* ── Right: Quick donate box ── */}
          <motion.div initial={{ opacity: 0, x: isRTL ? -40 : 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:sticky lg:top-24">

            <div className="relative rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
              <div className={`relative z-10 ${isRTL ? "font-arabic" : ""}`}>

                <p className={`text-white font-bold mb-1 ${isRTL ? "text-right" : "text-left"}`}>
                  {isRTL ? "تبرع سريع" : "Quick donate"}
                </p>
                <p className={`text-white/35 text-xs mb-5 ${isRTL ? "text-right" : "text-left"}`}>
                  {isRTL ? "اختر مبلغًا وأرسله مباشرة عبر واتساب" : "Pick an amount and send via WhatsApp"}
                </p>

                {/* Amount grid */}
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {AMOUNTS.map(a => {
                    const active = selectedAmount === a.key;
                    return (
                      <button key={a.key} onClick={() => setSelectedAmount(a.key)}
                        className={`rounded-xl border py-3 text-sm font-semibold transition-all duration-200 ${
                          active ? "border-gold bg-gold/10 text-gold shadow-[0_0_14px_rgba(201,168,76,0.18)]"
                               : "border-white/8 text-white/45 hover:border-white/15 hover:text-white/75 bg-white/[0.02]"
                        }`}>
                        {isRTL ? a.ar : a.en}
                      </button>
                    );
                  })}
                </div>

                <a href={buildWhatsAppUrl()} target="_blank" rel="noopener noreferrer"
                  onClick={() => trackEvent("donate_intent", { amount: selectedAmount })}
                  className="group relative flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-gold text-black font-bold rounded-2xl overflow-hidden transition-all hover:shadow-[0_0_28px_rgba(201,168,76,0.4)] hover:scale-[1.02] active:scale-[0.98] text-sm">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0 relative z-10" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span className="relative z-10">{t("donate_cta")}</span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </a>

                <div className={`flex items-center justify-center gap-1.5 mt-3 text-white/20 text-xs ${isRTL ? "flex-row-reverse" : ""}`}>
                  <Shield size={10} />
                  <span>{t("donate_secure")}</span>
                </div>

                <div className="mt-5 pt-4 border-t border-white/[0.06]">
                  <a href="/donate" className={`flex items-center gap-2 text-white/30 hover:text-gold text-xs transition-colors group ${isRTL ? "flex-row-reverse font-arabic justify-end" : ""}`}>
                    <span>{isRTL ? "تصفح الحالات واختر حالة بعينها" : "Browse cases & pick a specific one"}</span>
                    <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
