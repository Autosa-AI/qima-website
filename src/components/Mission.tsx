"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useLang } from "@/context/LanguageContext";
import { Heart, Target, Eye, Users, Lightbulb, Star } from "lucide-react";

const values = [
  { key: "val_dignity", descKey: "val_dignity_desc", icon: Heart, color: "from-rose-500/20 to-rose-500/5", border: "border-rose-500/20", glow: "rgba(244,63,94,0.15)" },
  { key: "val_impact", descKey: "val_impact_desc", icon: Target, color: "from-gold/20 to-gold/5", border: "border-gold/20", glow: "rgba(201,168,76,0.15)" },
  { key: "val_transparency", descKey: "val_transparency_desc", icon: Eye, color: "from-sky-500/20 to-sky-500/5", border: "border-sky-500/20", glow: "rgba(14,165,233,0.15)" },
  { key: "val_community", descKey: "val_community_desc", icon: Users, color: "from-emerald-500/20 to-emerald-500/5", border: "border-emerald-500/20", glow: "rgba(16,185,129,0.15)" },
  { key: "val_innovation", descKey: "val_innovation_desc", icon: Lightbulb, color: "from-violet-500/20 to-violet-500/5", border: "border-violet-500/20", glow: "rgba(139,92,246,0.15)" },
  { key: "val_hope", descKey: "val_hope_desc", icon: Star, color: "from-amber-400/20 to-amber-400/5", border: "border-amber-400/20", glow: "rgba(251,191,36,0.15)" },
];

export default function Mission() {
  const { t, isRTL } = useLang();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="mission" ref={ref} className="relative py-32 px-6">
      {/* Section glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gold/[0.02] to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className={`text-center mb-20 ${isRTL ? "font-arabic" : ""}`}
        >
          <div className="badge-label inline-flex items-center gap-2 text-gold/70 text-xs tracking-widest uppercase mb-4 border border-gold/20 px-3 py-1.5 rounded-full">
            <span className="w-1 h-1 rounded-full bg-gold" />
            {t("mission_badge")}
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white">
            {t("mission_title")}
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {values.map(({ key, descKey, icon: Icon, color, border, glow }, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className={`group relative rounded-2xl border ${border} bg-gradient-to-b ${color} p-6 hover:scale-[1.02] transition-transform duration-300 cursor-default overflow-hidden`}
              style={{ boxShadow: `0 0 40px ${glow}` }}
            >
              {/* BG glow on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `radial-gradient(circle at 50% 0%, ${glow}, transparent 70%)` }} />

              <div className="relative z-10">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-b ${color} border ${border} flex items-center justify-center mb-4`}>
                  <Icon size={18} className="text-white/70" />
                </div>

                <h3 className={`card-heading text-white font-semibold text-lg mb-2 ${isRTL ? "font-arabic text-right" : ""}`}>
                  {t(key)}
                </h3>
                <p className={`text-white/50 text-sm leading-relaxed ${isRTL ? "font-arabic text-right" : ""}`}>
                  {t(descKey)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
