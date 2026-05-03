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

const YoutubeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const LinkedinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
  </svg>
);

const TikTokIcon = () => (
  <svg width="15" height="15" viewBox="0 0 448 512" fill="currentColor">
    <path d="M448 209.9a210.1 210.1 0 0 1 -122.8-39.3V349.4A162.6 162.6 0 1 1 185 188.3V278.2a74.6 74.6 0 1 0 52.2 71.2V0l88 0a121.2 121.2 0 0 0 1.9 22.2h0A122.2 122.2 0 0 0 381 102.4a121.4 121.4 0 0 0 67 20.1z"/>
  </svg>
);

export default function Contact() {
  const { t, isRTL } = useLang();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = encodeURIComponent(
      isRTL
        ? `السلام عليكم فريق قيمة،\n\nالاسم: ${name}\nالإيميل: ${email}\n\n${message}`
        : `Hello Qima team,\n\nName: ${name}\nEmail: ${email}\n\n${message}`
    );
    window.open(`https://wa.me/201039091390?text=${text}`, "_blank");
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
              value={name}
              onChange={e => setName(e.target.value)}
              className={`w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/40 transition-colors ${isRTL ? "text-right font-arabic" : ""}`}
            />
            <input
              type="email"
              placeholder={t("contact_email")}
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={`w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/40 transition-colors ${isRTL ? "text-right font-arabic" : ""}`}
            />
            <textarea
              rows={5}
              placeholder={t("contact_message")}
              required
              value={message}
              onChange={e => setMessage(e.target.value)}
              className={`w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/40 transition-colors resize-none ${isRTL ? "text-right font-arabic" : ""}`}
            />

            <button
              type="submit"
              className={`group flex items-center gap-3 w-full justify-center px-6 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white hover:border-gold/40 hover:bg-gold/5 transition-all ${isRTL ? "flex-row-reverse font-arabic" : ""}`}
            >
              <span>{t("contact_send")}</span>
              <Send size={16} className={`group-hover:translate-x-1 transition-transform ${isRTL ? "rotate-180 group-hover:-translate-x-1" : ""}`} />
            </button>

          </motion.form>

          {/* Social links */}
          <motion.div
            initial={{ opacity: 0, x: isRTL ? -40 : 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className={`flex flex-col justify-center ${isRTL ? "items-end text-right font-arabic" : "items-start"}`}
          >
            <p className="text-white/40 text-sm mb-8">{t("contact_or")}</p>

            <div className="space-y-2 w-full">
              {([
                { icon: <Mail size={14} />,    label: "qima.charity@gmail.com", href: "mailto:qima.charity@gmail.com",                            color: "#C9A84C" },
                { icon: <InstagramIcon />,     label: "@qima.egypt",            href: "https://www.instagram.com/qima.egypt/",                    color: "#E1306C" },
                { icon: <YoutubeIcon />,       label: "Qima Egypt",             href: "https://www.youtube.com/@qima-egypt",                      color: "#FF0000" },
                { icon: <FacebookIcon />,      label: "Qima",                   href: "https://www.facebook.com/profile.php?id=61588880265644",   color: "#1877F2" },
                { icon: <TikTokIcon />,        label: "@qima.charity",          href: "https://www.tiktok.com/@qima.charity",                     color: "#69C9D0" },
                { icon: <LinkedinIcon />,      label: "qima-egypt",             href: "https://www.linkedin.com/company/qima-egypt",             color: "#0A66C2" },
              ]).map(({ icon, label, href, color }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-3 group px-2.5 py-2 rounded-lg border border-white/[0.05] hover:border-white/10 hover:bg-white/[0.03] transition-all ${isRTL ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                    style={{ background: `${color}20`, border: `1px solid ${color}40`, color }}
                  >
                    {icon}
                  </div>
                  <span className="text-white/60 group-hover:text-white/90 text-xs transition-colors">
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
