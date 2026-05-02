"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useLang } from "@/context/LanguageContext";

const navKeys = ["nav_about", "nav_mission", "nav_projects", "nav_impact", "nav_donate", "nav_contact"];
const navHrefs = ["#about", "#mission", "#projects", "#impact", "#donate", "#contact"];

export default function Navigation() {
  const { lang, setLang, t, isRTL } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (href: string) => {
    setMenuOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-black/80 backdrop-blur-md border-b border-white/5"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="قيمة · Qima"
              className="h-9 w-auto opacity-90 group-hover:opacity-100 transition-opacity"
            />
          </button>

          {/* Desktop nav */}
          <div className={`hidden md:flex items-center gap-8 ${isRTL ? "flex-row-reverse" : ""}`}>
            {navKeys.map((key, i) => (
              <button
                key={key}
                onClick={() => scrollTo(navHrefs[i])}
                className={`text-white/70 hover:text-white text-sm transition-colors relative group ${isRTL ? "font-arabic" : ""}`}
              >
                {t(key)}
                <span className="absolute -bottom-0.5 left-0 right-0 h-px bg-gold scale-x-0 group-hover:scale-x-100 transition-transform origin-center" />
              </button>
            ))}
          </div>

          {/* Lang toggle + mobile menu */}
          <div className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
            <button
              onClick={() => setLang(lang === "ar" ? "en" : "ar")}
              className="text-xs border border-white/20 text-white/70 hover:border-gold/60 hover:text-gold px-3 py-1.5 rounded-full transition-all"
            >
              {lang === "ar" ? "EN" : "عربي"}
            </button>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden text-white/70 hover:text-white transition-colors"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-black/95 backdrop-blur-lg flex flex-col items-center justify-center gap-8"
          >
            {navKeys.map((key, i) => (
              <button
                key={key}
                onClick={() => scrollTo(navHrefs[i])}
                className={`text-white/80 hover:text-white text-2xl font-light transition-colors ${isRTL ? "font-arabic" : ""}`}
              >
                {t(key)}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
