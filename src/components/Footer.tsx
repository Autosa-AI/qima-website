"use client";
import { useLang } from "@/context/LanguageContext";

const navKeys = ["nav_about", "nav_mission", "nav_projects", "nav_impact", "nav_donate", "nav_contact"];
const navHrefs = ["#about", "#mission", "#projects", "#impact", "#donate", "#contact"];

const InstagramIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const YoutubeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const LinkedinIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

export default function Footer() {
  const { t, isRTL } = useLang();

  const scrollTo = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="relative border-t border-white/[0.05] pt-16 pb-8 px-6">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

      <div className="max-w-6xl mx-auto">
        <div className={`grid md:grid-cols-3 gap-10 mb-12 ${isRTL ? "text-right" : "text-left"}`}>
          {/* Brand */}
          <div>
            <div className="flex items-center mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="قيمة" className="h-8 w-auto opacity-90" />
            </div>
            <p className={`text-white/40 text-sm leading-relaxed ${isRTL ? "font-arabic" : ""}`}>
              {t("footer_desc")}
            </p>
          </div>

          {/* Quick links */}
          <div className={isRTL ? "font-arabic" : ""}>
            <h4 className="text-white/60 text-xs tracking-widest uppercase mb-4">{t("footer_quick")}</h4>
            <div className="space-y-2">
              {navKeys.slice(0, 6).map((key, i) => (
                <button
                  key={key}
                  onClick={() => scrollTo(navHrefs[i])}
                  className="block text-white/40 hover:text-white/80 text-sm transition-colors"
                >
                  {t(key)}
                </button>
              ))}
            </div>
          </div>

          {/* Social */}
          <div className={isRTL ? "font-arabic" : ""}>
            <h4 className="text-white/60 text-xs tracking-widest uppercase mb-4">{t("footer_follow")}</h4>
            <div className="flex gap-3">
              {([
                { Icon: InstagramIcon, href: "https://www.instagram.com/qima.egypt/", color: "#E1306C" },
                { Icon: YoutubeIcon,   href: "https://www.youtube.com/@qima-egypt",   color: "#FF0000" },
                { Icon: LinkedinIcon,  href: "https://www.linkedin.com/company/qima-egypt", color: "#0A66C2" },
              ] as const).map(({ Icon, href, color }, i) => (
                <a
                  key={i}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center hover:border-white/20 hover:scale-110 transition-all"
                  style={{ background: `${color}15`, color }}
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className={`border-t border-white/[0.05] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-white/25 text-xs ${isRTL ? "sm:flex-row-reverse font-arabic" : ""}`}>
          <span>
            {isRTL ? `قيمة © ${new Date().getFullYear()} · ${t("footer_rights")}` : `© ${new Date().getFullYear()} Qima · ${t("footer_rights")}`}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-gold/30">قيمة</span>
            <span className="text-white/10">·</span>
            <span>{isRTL ? "خيرية مصرية مرخصة" : "Licensed Egyptian Charity"}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
