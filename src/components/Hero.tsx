"use client";
import { motion } from "framer-motion";
import { useLang } from "@/context/LanguageContext";
import { ArrowDown } from "lucide-react";

export default function Hero() {
  const { t, isRTL } = useLang();

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
      {/* Radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[600px] pointer-events-none">
        <div className="absolute inset-0 bg-gold/[0.05] rounded-full blur-[130px]" />
        <div className="absolute inset-24 bg-white/[0.02] rounded-full blur-[80px]" />
      </div>

      <div className={`relative z-10 max-w-4xl mx-auto flex flex-col items-center ${isRTL ? "font-arabic" : ""}`}>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-[420px] mx-auto mb-10 select-none"
        >
          <div className="absolute inset-x-8 -bottom-4 h-10 bg-white/5 rounded-full blur-2xl" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="قيمة · Qima"
            className="w-full h-auto drop-shadow-[0_0_40px_rgba(255,255,255,0.06)]"
          />
        </motion.div>

        {/* Main slogan · the hero statement */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5 }}
          className={`hero-slogan text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-snug mb-6 ${isRTL ? "font-arabic" : ""}`}
          style={{ textShadow: "0 0 60px rgba(201,168,76,0.2)" }}
        >
          {t("hero_slogan")}
        </motion.p>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.9 }}
          className="flex items-center gap-3 mb-6"
        >
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold/40" />
          <div className="w-1.5 h-1.5 rounded-full bg-gold/60" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold/40" />
        </motion.div>

        {/* Sub-tagline */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className={`text-gold/80 text-base md:text-lg font-medium mb-4 ${isRTL ? "font-arabic" : ""}`}
        >
          {t("hero_tagline")}
        </motion.p>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className={`text-white/45 text-sm md:text-base max-w-xl mx-auto leading-relaxed mb-12 ${isRTL ? "font-arabic" : ""}`}
        >
          {t("hero_sub")}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.25 }}
          className={`flex flex-col sm:flex-row items-center justify-center gap-4 ${isRTL ? "sm:flex-row-reverse font-arabic" : ""}`}
        >
          <button
            onClick={() => document.querySelector("#donate")?.scrollIntoView({ behavior: "smooth" })}
            className="group relative px-8 py-3.5 bg-gold text-black font-bold rounded-full overflow-hidden transition-all hover:shadow-[0_0_35px_rgba(201,168,76,0.5)] hover:scale-105 active:scale-95"
          >
            <span className="relative z-10">{t("hero_cta_donate")}</span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </button>
          <button
            onClick={() => document.querySelector("#about")?.scrollIntoView({ behavior: "smooth" })}
            className="px-8 py-3.5 border border-white/20 text-white/70 rounded-full hover:border-white/50 hover:text-white transition-all hover:bg-white/5"
          >
            {t("hero_cta_learn")}
          </button>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/25"
      >
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
          <ArrowDown size={18} />
        </motion.div>
      </motion.div>
    </section>
  );
}
