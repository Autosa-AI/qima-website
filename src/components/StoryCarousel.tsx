"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/context/LanguageContext";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Story {
  id: number;
  img: string;
  accent: string;
  ar: { title: string; location: string; tag: string; story: string };
  en: { title: string; location: string; tag: string; story: string };
}

interface ApiStory {
  _id: string;
  imageUrl: string;
  accent: string;
  order: number;
  isActive: boolean;
  ar: { title: string; location: string; tag: string; story: string };
  en: { title: string; location: string; tag: string; story: string };
}

// Hardcoded fallback data
const FALLBACK_STORIES: Story[] = [
  {
    id: 0,
    img: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=600&h=800&fit=crop",
    accent: "#4F8EF7",
    ar: { title: "أحمد · ٤٢ عامًا", location: "إمبابة، الجيزة", tag: "عامل مصنع", story: "يعمل اثنتي عشرة ساعة يومياً في مصنع نسيج. راتبه لا يكفي الإيجار والمأكل معاً. ثلاثة أطفال ينتظرون عودته. لم يطلب مساعدة في حياته — فريق قيمة الميداني وجده أولاً." },
    en: { title: "Ahmed · Age 42", location: "Imbaba, Giza", tag: "Factory Worker", story: "Twelve hours a day in a textile factory. His wages can't cover both rent and food. Three children wait for him to come home. He never once asked for help — Qima's field team found him first." },
  },
  {
    id: 1,
    img: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=800&fit=crop",
    accent: "#C9A84C",
    ar: { title: "أم خالد · ٣٨ عامًا", location: "منشية ناصر، القاهرة", tag: "خياطة منزلية", story: "تخيط من الفجر حتى منتصف الليل. يأتيها العمل متقطعاً وأجره لا يكفي. زوجها فقد وظيفته وهي تُعيل الأسرة وحدها بصمت تام." },
    en: { title: "Um Khaled · Age 38", location: "Manshiet Nasser, Cairo", tag: "Home Seamstress", story: "She sews from dawn to midnight. Work trickles in but never enough. Her husband lost his job; she supports the whole family alone, in complete silence." },
  },
  {
    id: 2,
    img: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&h=800&fit=crop",
    accent: "#34D399",
    ar: { title: "حسن · ٥٥ عامًا", location: "بولاق، القاهرة", tag: "بائع متجول", story: "يدفع عربية الخضار منذ الخامسة صباحاً. في أيام المطر لا يبيع شيئاً ولا يأكل هو وأسرته. كرامته تمنعه من السؤال — قيمة رأته قبل أن ييأس." },
    en: { title: "Hassan · Age 55", location: "Boulaq, Cairo", tag: "Street Vendor", story: "He pushes his vegetable cart from 5am. On rainy days nothing sells and his family goes hungry. His dignity stops him from asking — Qima saw him before he gave up." },
  },
  {
    id: 3,
    img: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600&h=800&fit=crop",
    accent: "#A78BFA",
    ar: { title: "أم يوسف · ٤٥ عامًا", location: "المطرية، القاهرة", tag: "عاملة نظافة", story: "تنظف مدرسة حكومية بأجر لا يتجاوز ألف جنيه. أطفالها في نفس المدرسة التي تنظفها. تأخذ ما تبقى من طعام الأطفال لأطفالها في السر." },
    en: { title: "Um Youssef · Age 45", location: "El Matareya, Cairo", tag: "School Cleaner", story: "She cleans a public school for under 1,000 EGP a month. Her own children study there. She secretly takes the leftover food home for them." },
  },
  {
    id: 4,
    img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=800&fit=crop",
    accent: "#F97316",
    ar: { title: "محمد · ٣٣ عامًا", location: "شبرا الخيمة، القليوبية", tag: "عامل يومية", story: "يقف كل صباح عند ناصية الشارع ينتظر من يأخذه للعمل. في الأيام التي لا يجد فيها عملاً لا يدخل بيته حتى لا يرى وجه أطفاله خالي الوفاض." },
    en: { title: "Mohamed · Age 33", location: "Shubra El Khema, Qalyubia", tag: "Day Labourer", story: "Every morning he stands at the street corner waiting to be hired. On days with no work, he can't bring himself to go home and face his children empty-handed." },
  },
];

const INTERVAL = 4500;

// Returns visual position data for a card at `offset` from center
function getCardProps(offset: number) {
  const abs = Math.abs(offset);
  return {
    scale: 1 - abs * 0.16,
    x: offset * 285,
    z: -abs * 80,
    rotateY: offset * -10,
    opacity: abs > 2 ? 0 : 1 - abs * 0.22,
    zIndex: 20 - abs * 5,
    blur: abs > 1 ? 2 : 0,
  };
}

function wrap(index: number, length: number) {
  return ((index % length) + length) % length;
}

function SkeletonCard() {
  return (
    <div className="absolute" style={{ width: 300, height: 420, left: "50%", top: 0, transform: "translateX(-50%)" }}>
      <div className="w-full h-full rounded-3xl bg-white/[0.04] border border-white/[0.06] animate-pulse" />
    </div>
  );
}

export default function StoryCarousel() {
  const { isRTL } = useLang();
  const [stories, setStories] = useState<Story[]>(FALLBACK_STORIES);
  const [fetchStatus, setFetchStatus] = useState<"idle" | "loading" | "done">("idle");
  const [active, setActive] = useState(0);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch from API, fall back to hardcoded on error
  useEffect(() => {
    setFetchStatus("loading");
    fetch("/api/stories")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const mapped: Story[] = (data.data as ApiStory[]).map((s, i) => ({
            id: i,
            img: s.imageUrl,
            accent: s.accent,
            ar: s.ar,
            en: s.en,
          }));
          setStories(mapped);
          setActive(0);
        }
      })
      .catch(() => {
        // Keep fallback
      })
      .finally(() => setFetchStatus("done"));
  }, []);

  const advance = useCallback((dir: 1 | -1 = 1) => {
    setActive(a => wrap(a + dir, stories.length));
    setProgress(0);
  }, [stories.length]);

  // Auto-advance
  useEffect(() => {
    if (paused) return;
    intervalRef.current = setInterval(() => advance(1), INTERVAL);
    progressRef.current = setInterval(() => {
      setProgress(p => Math.min(p + 100 / (INTERVAL / 50), 100));
    }, 50);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [paused, active, advance]);

  const handlePrev = () => { advance(isRTL ? 1 : -1); setPaused(true); };
  const handleNext = () => { advance(isRTL ? -1 : 1); setPaused(true); };

  if (fetchStatus === "loading") {
    return (
      <div className="relative w-full mt-20">
        <div className="text-center mb-12">
          <p className="text-white/30 text-sm tracking-widest uppercase">
            {isRTL ? "قصص من الميدان" : "Stories from the field"}
          </p>
        </div>
        <div className="relative flex items-center justify-center" style={{ height: 480 }}>
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full mt-20">
      {/* Section label */}
      <div className={`text-center mb-12 ${isRTL ? "font-arabic" : ""}`}>
        <p className="text-white/30 text-sm tracking-widest uppercase">
          {isRTL ? "قصص من الميدان" : "Stories from the field"}
        </p>
      </div>

      {/* Carousel stage */}
      <div
        className="relative flex items-center justify-center"
        style={{ height: 480, perspective: "1200px" }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => { setPaused(false); setHoveredId(null); }}
      >
        {stories.map((story, i) => {
          const offset = wrap(i - active + Math.floor(stories.length / 2), stories.length) - Math.floor(stories.length / 2);
          const { scale, x, z, rotateY, opacity, zIndex, blur } = getCardProps(offset);
          const isCenter = offset === 0;
          const isHovered = hoveredId === story.id;
          const content = isRTL ? story.ar : story.en;

          return (
            <motion.div
              key={story.id}
              animate={{ x, scale, rotateY, opacity, z }}
              transition={{ type: "spring", stiffness: 280, damping: 30 }}
              style={{ zIndex, position: "absolute", transformStyle: "preserve-3d", filter: blur ? `blur(${blur}px)` : "none" }}
              className="cursor-pointer"
              onClick={() => !isCenter && setActive(i)}
              onMouseEnter={() => isCenter && setHoveredId(story.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Card shell */}
              <div
                className="relative overflow-hidden rounded-3xl"
                style={{
                  width: isCenter ? 300 : 240,
                  height: isCenter ? 420 : 340,
                  transition: "width 0.5s cubic-bezier(0.32,0.72,0,1), height 0.5s cubic-bezier(0.32,0.72,0,1)",
                  boxShadow: isCenter
                    ? `0 0 0 1.5px ${story.accent}40, 0 30px 80px rgba(0,0,0,0.6), 0 0 60px ${story.accent}20`
                    : "0 10px 40px rgba(0,0,0,0.4)",
                }}
              >
                {/* ── Image layer ── */}
                <motion.div
                  className="absolute inset-0"
                  animate={{ y: isHovered ? "-102%" : "0%" }}
                  transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={story.img}
                    alt={content.title}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                  {/* Gradient overlay on image */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  {/* Bottom info on image */}
                  <div className={`absolute bottom-0 left-0 right-0 p-5 ${isRTL ? "text-right font-arabic" : "text-left"}`}>
                    <span
                      className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mb-2 tracking-wide"
                      style={{ background: `${story.accent}25`, color: story.accent, border: `1px solid ${story.accent}40` }}
                    >
                      {content.tag}
                    </span>
                    <h3 className="text-white font-bold text-base leading-tight">{content.title}</h3>
                    <p className="text-white/50 text-xs mt-0.5">{content.location}</p>
                  </div>
                </motion.div>

                {/* ── Story layer (sweeps up from below) ── */}
                <motion.div
                  className="absolute inset-0 flex flex-col justify-center p-6"
                  style={{ background: `linear-gradient(160deg, #0a0a0a 0%, #111 100%)` }}
                  animate={{ y: isHovered ? "0%" : "102%" }}
                  transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
                >
                  {/* Accent line */}
                  <div className="w-8 h-0.5 rounded-full mb-4" style={{ background: story.accent }} />

                  <span
                    className="text-[10px] font-semibold tracking-widest uppercase mb-3"
                    style={{ color: story.accent }}
                  >
                    {content.tag}
                  </span>

                  <h3 className={`text-white font-bold text-lg leading-snug mb-3 ${isRTL ? "font-arabic" : ""}`}>
                    {content.title}
                  </h3>

                  <p className={`text-white/65 text-sm leading-relaxed ${isRTL ? "font-arabic text-right" : "text-left"}`}>
                    {content.story}
                  </p>

                  <div className={`flex items-center gap-1.5 mt-5 text-white/30 text-xs ${isRTL ? "flex-row-reverse font-arabic" : ""}`}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.2"/>
                      <line x1="5" y1="2" x2="5" y2="5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      <line x1="5" y1="5" x2="7" y2="6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    {content.location}
                  </div>
                </motion.div>

                {/* Center card gold ring glow */}
                {isCenter && (
                  <motion.div
                    className="absolute inset-0 rounded-3xl pointer-events-none"
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                    style={{ boxShadow: `inset 0 0 0 1.5px ${story.accent}50` }}
                  />
                )}
              </div>

              {/* Hover hint for center */}
              {isCenter && !isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`absolute -bottom-8 left-0 right-0 text-center text-white/25 text-xs ${isRTL ? "font-arabic" : ""}`}
                >
                  {isRTL ? "مرر لقراءة القصة" : "hover to read the story"}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-center gap-6 mt-16">
        {/* Prev */}
        <button
          onClick={handlePrev}
          className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all hover:scale-110 active:scale-95"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Dots */}
        <div className="flex items-center gap-2">
          {stories.map((s, i) => (
            <button
              key={s.id}
              onClick={() => { setActive(i); setPaused(true); }}
              className="relative flex items-center justify-center"
            >
              <motion.div
                animate={{
                  width: i === active ? 24 : 6,
                  opacity: i === active ? 1 : 0.3,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="h-1.5 rounded-full"
                style={{ background: i === active ? stories[active].accent : "#fff" }}
              />
              {/* Progress fill on active dot */}
              {i === active && (
                <motion.div
                  className="absolute left-0 top-0 h-full rounded-full"
                  style={{ width: `${progress}%`, background: stories[active].accent, opacity: 0.4 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Next */}
        <button
          onClick={handleNext}
          className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all hover:scale-110 active:scale-95"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
