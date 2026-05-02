"use client";
import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { useLang } from "@/context/LanguageContext";
import { Mail, Send } from "lucide-react";

const InstagramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const FacebookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.632L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
  </svg>
);

export default function Contact() {
  const { t, isRTL } = useLang();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <section id="contact" ref={ref} className="relative py-32 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className={`text-center mb-16 ${isRTL ? "font-arabic" : ""}`}
        >
          <div className="badge-label inline-flex items-center gap-2 text-gold/70 text-xs tracking-widest uppercase mb-4 border border-gold/20 px-3 py-1.5 rounded-full">
            <span className="w-1 h-1 rounded-full bg-gold" />
            {t("contact_badge")}
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-3">{t("contact_title")}</h2>
          <p className={`text-gold/70 text-lg ${isRTL ? "font-arabic" : ""}`}>{t("contact_sub")}</p>
        </motion.div>

        <div className={`grid md:grid-cols-2 gap-10 ${isRTL ? "md:flex md:flex-row-reverse" : ""}`}>
          {/* Form */}
          <motion.form
            initial={{ opacity: 0, x: isRTL ? 40 : -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <input
              type="text"
              placeholder={t("contact_name")}
              required
              className={`w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/40 transition-colors ${isRTL ? "text-right font-arabic" : ""}`}
            />
            <input
              type="email"
              placeholder={t("contact_email")}
              required
              className={`w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/40 transition-colors ${isRTL ? "text-right font-arabic" : ""}`}
            />
            <textarea
              rows={5}
              placeholder={t("contact_message")}
              required
              className={`w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/40 transition-colors resize-none ${isRTL ? "text-right font-arabic" : ""}`}
            />

            <button
              type="submit"
              className={`group flex items-center gap-3 w-full justify-center px-6 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white hover:border-gold/40 hover:bg-gold/5 transition-all ${isRTL ? "flex-row-reverse font-arabic" : ""}`}
            >
              <span>{t("contact_send")}</span>
              <Send size={16} className={`group-hover:translate-x-1 transition-transform ${isRTL ? "rotate-180 group-hover:-translate-x-1" : ""}`} />
            </button>

            {sent && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`text-center text-gold/80 text-sm ${isRTL ? "font-arabic" : ""}`}
              >
                {isRTL ? "شكراً! سنتواصل معك قريباً." : "Thanks! We'll be in touch soon."}
              </motion.p>
            )}
          </motion.form>

          {/* Social links */}
          <motion.div
            initial={{ opacity: 0, x: isRTL ? -40 : 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className={`flex flex-col justify-center ${isRTL ? "items-end text-right font-arabic" : "items-start"}`}
          >
            <p className="text-white/40 text-sm mb-8">{t("contact_or")}</p>

            <div className="space-y-4 w-full">
              {([
                { icon: <Mail size={16} />, label: "qima@example.org", href: "mailto:qima@example.org", color: "#C9A84C" },
                { icon: <InstagramIcon />, label: "@qima.egypt", href: "#", color: "#E1306C" },
                { icon: <FacebookIcon />, label: "Qima Egypt", href: "#", color: "#1877F2" },
                { icon: <XIcon />, label: "@QimaEgypt", href: "#", color: "#888" },
              ]).map(({ icon, label, href, color }) => (
                <a
                  key={label}
                  href={href}
                  className={`flex items-center gap-4 group p-3 rounded-xl border border-white/[0.05] hover:border-white/10 hover:bg-white/[0.03] transition-all ${isRTL ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                    style={{ background: `${color}20`, border: `1px solid ${color}40`, color }}
                  >
                    {icon}
                  </div>
                  <span className="text-white/60 group-hover:text-white/90 text-sm transition-colors">
                    {label}
                  </span>
                </a>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
