"use client";
import { useLang } from "@/context/LanguageContext";

const navKeys = ["nav_about", "nav_mission", "nav_projects", "nav_impact", "nav_donate", "nav_contact"];
const navHrefs = ["#about", "#mission", "#projects", "#impact", "#donate", "#contact"];

const InstagramIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const FacebookIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const XIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.632L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
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
                { Icon: InstagramIcon, href: "#", color: "#E1306C" },
                { Icon: FacebookIcon, href: "#", color: "#1877F2" },
                { Icon: XIcon, href: "#", color: "#888" },
              ] as const).map(({ Icon, href, color }, i) => (
                <a
                  key={i}
                  href={href}
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
