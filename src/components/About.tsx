"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useLang } from "@/context/LanguageContext";

export default function About() {
  const { t, isRTL } = useLang();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="about" ref={ref} className="relative py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <div className={`grid md:grid-cols-2 gap-16 items-center ${isRTL ? "md:flex md:flex-row-reverse" : ""}`}>

          {/* Visual side */}
          <motion.div
            initial={{ opacity: 0, x: isRTL ? 60 : -60 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="relative flex flex-col items-center gap-5"
          >
            {/* Decorative box with logo */}
            <div className="relative w-full aspect-square max-w-sm mx-auto rounded-3xl border border-white/5 bg-white/[0.02] overflow-hidden flex items-center justify-center">
              <div className="absolute inset-4 rounded-2xl border border-gold/10 bg-gold/[0.02]" />
              {/* Logo PNG instead of ق */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="قيمة"
                className="relative z-10 w-3/4 h-auto opacity-20 select-none"
              />
              {/* Corner glows */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full blur-2xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl" />
            </div>

            {/* Stat chips — below the box, never overlapping text */}
            <div className="flex gap-4 w-full max-w-sm justify-center">
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-center"
              >
                <div className="text-gold font-bold text-xl">١٢٠٠+</div>
                <div className={`text-white/50 text-xs mt-0.5 ${isRTL ? "font-arabic" : ""}`}>{t("impact_families")}</div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 0.5 }}
                className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-center"
              >
                <div className="text-gold font-bold text-xl">٢٠٢٠</div>
                <div className={`text-white/50 text-xs mt-0.5 ${isRTL ? "font-arabic" : ""}`}>
                  {isRTL ? "سنة التأسيس" : "Founded"}
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Text side */}
          <motion.div
            initial={{ opacity: 0, x: isRTL ? -60 : 60 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.15 }}
            className={isRTL ? "text-right font-arabic" : "text-left"}
          >
            <div className="badge-label inline-flex items-center gap-2 text-gold/70 text-xs tracking-widest uppercase mb-4 border border-gold/20 px-3 py-1.5 rounded-full">
              <span className="w-1 h-1 rounded-full bg-gold" />
              {t("about_badge")}
            </div>

            <h2 className={`text-3xl md:text-4xl font-bold text-white mb-8 leading-snug ${isRTL ? "font-arabic" : ""}`}>
              {t("about_title")}
            </h2>

            <div className={`space-y-5 text-white/60 text-base ${isRTL ? "font-arabic leading-loose" : "leading-relaxed"}`}>
              <p>{t("about_p1")}</p>
              <p>{t("about_p2")}</p>
              <p>{t("about_p3")}</p>
            </div>

            <div className="mt-10 flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-gold/30 to-transparent" />
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="2" fill="#C9A84C" fillOpacity="0.6" />
                <line x1="8" y1="0" x2="8" y2="4" stroke="#C9A84C" strokeOpacity="0.3" strokeWidth="1" />
                <line x1="8" y1="12" x2="8" y2="16" stroke="#C9A84C" strokeOpacity="0.3" strokeWidth="1" />
                <line x1="0" y1="8" x2="4" y2="8" stroke="#C9A84C" strokeOpacity="0.3" strokeWidth="1" />
                <line x1="12" y1="8" x2="16" y2="8" stroke="#C9A84C" strokeOpacity="0.3" strokeWidth="1" />
              </svg>
              <div className="h-px flex-1 bg-gradient-to-l from-gold/30 to-transparent" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
