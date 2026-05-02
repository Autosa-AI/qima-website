"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useLang } from "@/context/LanguageContext";
import { ArrowUpRight, BookOpen, Briefcase, Brain, Leaf } from "lucide-react";

const projects = [
  {
    titleKey: "proj1_title",
    descKey: "proj1_desc",
    tagKey: "proj1_tag",
    icon: BookOpen,
    accent: "#4F8EF7",
    number: "٠١",
  },
  {
    titleKey: "proj2_title",
    descKey: "proj2_desc",
    tagKey: "proj2_tag",
    icon: Briefcase,
    accent: "#C9A84C",
    number: "٠٢",
  },
  {
    titleKey: "proj3_title",
    descKey: "proj3_desc",
    tagKey: "proj3_tag",
    icon: Brain,
    accent: "#A78BFA",
    number: "٠٣",
  },
  {
    titleKey: "proj4_title",
    descKey: "proj4_desc",
    tagKey: "proj4_tag",
    icon: Leaf,
    accent: "#34D399",
    number: "٠٤",
  },
];

export default function Projects() {
  const { t, isRTL } = useLang();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="projects" ref={ref} className="relative py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className={`mb-20 ${isRTL ? "text-right font-arabic" : "text-left"}`}
        >
          <div className={`badge-label inline-flex items-center gap-2 text-gold/70 text-xs tracking-widest uppercase mb-4 border border-gold/20 px-3 py-1.5 rounded-full ${isRTL ? "flex-row-reverse" : ""}`}>
            <span className="w-1 h-1 rounded-full bg-gold" />
            {t("projects_badge")}
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white">
            {t("projects_title")}
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {projects.map(({ titleKey, descKey, tagKey, icon: Icon, accent, number }, i) => (
            <motion.div
              key={titleKey}
              initial={{ opacity: 0, y: 50 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.12 }}
              className="group relative rounded-3xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] p-7 transition-all duration-500 hover:border-white/10 overflow-hidden cursor-pointer"
            >
              {/* Number watermark */}
              <div
                className="absolute -top-2 -right-2 text-[5rem] font-bold leading-none opacity-[0.04] select-none"
                style={{ color: accent }}
              >
                {number}
              </div>

              {/* Glow line on hover */}
              <div
                className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `linear-gradient(90deg, transparent, ${accent}60, transparent)` }}
              />

              <div className={`flex items-start gap-5 ${isRTL ? "flex-row-reverse" : ""}`}>
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: `${accent}15`, border: `1px solid ${accent}30` }}
                >
                  <Icon size={22} style={{ color: accent }} />
                </div>

                <div className={`flex-1 ${isRTL ? "text-right font-arabic" : ""}`}>
                  <div
                    className="text-xs font-medium mb-2 px-2 py-0.5 rounded-full inline-block"
                    style={{ color: accent, background: `${accent}15`, border: `1px solid ${accent}30` }}
                  >
                    {t(tagKey)}
                  </div>
                  <h3 className="card-heading text-white font-semibold text-lg mb-2">{t(titleKey)}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{t(descKey)}</p>

                  <button
                    className={`mt-5 flex items-center gap-1.5 text-xs font-medium transition-colors ${isRTL ? "flex-row-reverse mr-auto" : ""}`}
                    style={{ color: accent }}
                  >
                    <span>{t("learn_more")}</span>
                    <ArrowUpRight size={14} className={`group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform ${isRTL ? "rotate-180" : ""}`} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
