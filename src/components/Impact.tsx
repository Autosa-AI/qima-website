"use client";
import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { useLang } from "@/context/LanguageContext";
import StoryCarousel from "@/components/StoryCarousel";

interface CounterProps {
  to: number;
  suffix?: string;
  inView: boolean;
}

function Counter({ to, suffix = "+", inView, isRTL }: CounterProps & { isRTL: boolean }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 2000;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(eased * to));
      if (progress < 1) requestAnimationFrame(tick);
      else setDisplay(to);
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [inView, to]);

  return <>{display.toLocaleString(isRTL ? "ar-EG" : "en-US")}{suffix}</>;
}

const stats = [
  { valueKey: "impact_families", value: 1200, suffix: "+" },
  { valueKey: "impact_volunteers", value: 350, suffix: "+" },
  { valueKey: "impact_projects", value: 48, suffix: "" },
  { valueKey: "impact_governorates", value: 12, suffix: "" },
];

export default function Impact() {
  const { t, isRTL } = useLang();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="impact" ref={ref} className="relative py-32 px-6">
      {/* Background glow band */}
      <div className="absolute inset-y-0 left-0 right-0 bg-gradient-to-r from-gold/[0.03] via-gold/[0.06] to-gold/[0.03] pointer-events-none" />

      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className={`text-center mb-20 ${isRTL ? "font-arabic" : ""}`}
        >
          <div className="badge-label inline-flex items-center gap-2 text-gold/70 text-xs tracking-widest uppercase mb-4 border border-gold/20 px-3 py-1.5 rounded-full">
            <span className="w-1 h-1 rounded-full bg-gold animate-pulse" />
            {t("impact_badge")}
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white">
            {t("impact_title")}
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map(({ valueKey, value, suffix }, i) => (
            <motion.div
              key={valueKey}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="relative rounded-2xl border border-gold/15 bg-gold/[0.03] p-6 text-center group hover:border-gold/30 transition-colors duration-300"
            >
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: "radial-gradient(circle at 50% 0%, rgba(201,168,76,0.08), transparent 70%)" }} />

              <div className="relative z-10">
                <div className="text-4xl md:text-5xl font-bold text-gold mb-2 tabular-nums">
                  <Counter to={value} suffix={suffix} inView={inView} isRTL={isRTL} />
                </div>
                <div className={`text-white/50 text-sm ${isRTL ? "font-arabic" : ""}`}>
                  {t(valueKey)}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <StoryCarousel />
      </div>
    </section>
  );
}
