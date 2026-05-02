"use client";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { useLang } from "@/context/LanguageContext";
import { Shield, ChevronDown, Search, Check, X } from "lucide-react";

interface Case {
  number: string;
  ar: { name: string; brief: string; story: string; need: string };
  en: { name: string; brief: string; story: string; need: string };
}

interface Category {
  id: string;
  ar: { label: string; icon: string };
  en: { label: string; icon: string };
  cases: Case[];
}

interface ApiCategory {
  _id: string;
  slug: string;
  icon: string;
  ar: { label: string };
  en: { label: string };
  cases: Array<{
    _id: string;
    number: string;
    ar: { name: string; brief: string; story: string; need: string };
    en: { name: string; brief: string; story: string; need: string };
  }>;
}

// Hardcoded fallback data (kept intact)
const FALLBACK_CATEGORIES: Category[] = [
  {
    id: "monthly",
    ar: { label: "شهريات", icon: "📋" },
    en: { label: "Monthly Support", icon: "📋" },
    cases: [
      { number: "001", ar: { name: "أحمد عبد الرحمن", brief: "عامل مصنع · ٣ أطفال", need: "٤٠٠ جنيه / شهر", story: "أحمد يعمل في مصنع نسيج بأجر يومي غير منتظم. زوجته مريضة وتحتاج دواءً شهرياً. أطفاله الثلاثة في المرحلة الابتدائية. راتبه في أفضل الأشهر لا يكفي الإيجار والمأكل معاً. يصمت على ضائقته ولا يُخبر أحداً." }, en: { name: "Ahmed Abdel Rahman", brief: "Factory worker · 3 children", need: "EGP 400 / month", story: "Ahmed works in a textile factory on irregular daily wages. His wife is ill and needs monthly medication. His three children are in primary school. Even in his best months his income barely covers rent and food. He suffers in silence and tells no one." } },
      { number: "002", ar: { name: "أم عادل سيد", brief: "أرملة · ٤ أطفال", need: "٦٠٠ جنيه / شهر", story: "فقدت زوجها قبل عامين في حادث عمل. لا تعليم لها يؤهلها لوظيفة. تبيع الخضار أمام البيت. أصغر أطفالها في الثالثة من عمره. تخشى أن يضطر أكبر أبنائها لترك المدرسة ليعمل." }, en: { name: "Um Adel Sayed", brief: "Widow · 4 children", need: "EGP 600 / month", story: "She lost her husband two years ago in a work accident. She has no qualifications. She sells vegetables outside her home for little profit. Her youngest is three. She fears her eldest son will have to drop out of school and work." } },
      { number: "003", ar: { name: "خالد إبراهيم", brief: "مريض بالسكري · عاجز جزئياً", need: "٥٠٠ جنيه / شهر", story: "تشخّص خالد بمرض السكري قبل ثلاث سنوات. الإرهاق يمنعه من إكمال يوم عمل كامل. يعمل نصف يوم فقط في ورشة نجارة. زوجته تعمل خادمة لتعويض الفارق. يحتاج إبرة الأنسولين يومياً ولا يستطيع شراءها بانتظام." }, en: { name: "Khaled Ibrahim", brief: "Diabetic · partially unable to work", need: "EGP 500 / month", story: "Khaled was diagnosed with diabetes three years ago. Fatigue prevents him from completing a full workday. He works half-days at a carpentry workshop. His wife works as a housemaid to compensate. He needs daily insulin but can't afford it consistently." } },
    ],
  },
  {
    id: "gaza",
    ar: { label: "أسر غزة", icon: "🕊️" },
    en: { label: "Gaza Families", icon: "🕊️" },
    cases: [
      { number: "004", ar: { name: "عائلة أبو طه", brief: "نازحون · ٦ أفراد", need: "٨٠٠ جنيه / شهر", story: "نزحت العائلة من شمال غزة وتعيش في شقة مستأجرة بالقاهرة. الأب مهندس لكنه لا يملك إقامة تمكنه من العمل رسمياً. الأم تعتني بأربعة أطفال وتحاول تعليمهم في البيت. مدخراتهم شارفت على النفاد." }, en: { name: "Abu Taha Family", brief: "Displaced · 6 members", need: "EGP 800 / month", story: "The family fled northern Gaza and rents a flat in Cairo. The father is an engineer but has no residency to work formally. The mother cares for four children and tries to teach them at home. Their savings are nearly exhausted." } },
      { number: "005", ar: { name: "أم سعيد الحلبي", brief: "أرملة غزاوية · ٥ أطفال", need: "٧٠٠ جنيه / شهر", story: "فقدت زوجها في القصف. وصلت مصر مع أطفالها الخمسة بملابس السفر فقط. أكبرهم ١٤ عاماً وأصغرهم رضيع. تعيش في غرفة واحدة مع جارة تستضيفها بلا مقابل." }, en: { name: "Um Saeed Al-Halabi", brief: "Gazan widow · 5 children", need: "EGP 700 / month", story: "She lost her husband in the bombing. She arrived in Egypt with her five children in travel clothes only. Her eldest is 14 and youngest is an infant. She shares one room with a neighbour who hosts her for free." } },
      { number: "006", ar: { name: "عائلة الشرفاوي", brief: "بيتهم دُمّر · ٤ أفراد", need: "٩٠٠ جنيه / شهر", story: "دُمّر بيتهم بالكامل. الأب كان معلماً. في مصر يعمل حارس عمارة لقاء سكن صغير. الزوجة تعاني من صدمة نفسية. الطفلان يرفضان النوم وحدهما. العائلة لا تطلب ولا تشتكي." }, en: { name: "Al-Sharfawi Family", brief: "Home destroyed · 4 members", need: "EGP 900 / month", story: "Their home was completely destroyed. The father was a teacher. In Egypt he works as a building guard for a tiny flat. The mother suffers severe trauma. Both children refuse to sleep alone. The family asks for nothing and complains to no one." } },
    ],
  },
  {
    id: "orphans",
    ar: { label: "أيتام وأرامل", icon: "🤲" },
    en: { label: "Orphans & Widows", icon: "🤲" },
    cases: [
      { number: "007", ar: { name: "أحمد · يتيم", brief: "١٢ عامًا · كفيل وحيد لأمه", need: "٣٥٠ جنيه / شهر", story: "فقد أحمد والده وهو في التاسعة. أمه مريضة بالكلى ولا تستطيع العمل. يبيع بعد المدرسة علكة وعصائر في الشارع. حلمه أن يصبح طبيباً. قيمة تتكفل بمصاريفه الدراسية وجزء من المعيشة." }, en: { name: "Ahmed · Orphan", brief: "Age 12 · sole support for his mother", need: "EGP 350 / month", story: "Ahmed lost his father at age nine. His mother has kidney disease and cannot work. After school he sells gum and juice on the street. His dream is to become a doctor. Qima covers his school costs and part of living expenses." } },
      { number: "008", ar: { name: "أم أيمن طاهر", brief: "أرملة · ٣ أطفال صغار", need: "٦٥٠ جنيه / شهر", story: "توفي زوجها فجأة بجلطة قبل ثمانية أشهر. لم يترك شيئاً. أطفالها الثلاثة بين سنتين وسبع سنوات. تعمل في تنظيف بيوت ٤ أيام في الأسبوع. تترك الأطفال عند جارة عجوز وتخرج للعمل." }, en: { name: "Um Ayman Taher", brief: "Widow · 3 young children", need: "EGP 650 / month", story: "Her husband died suddenly of a stroke eight months ago. He left nothing behind. Her three children are between two and seven years old. She cleans homes four days a week, leaving the children with an elderly neighbour." } },
      { number: "009", ar: { name: "فاطمة · يتيمة", brief: "٨ سنوات · تعيش مع جدتها", need: "٤٠٠ جنيه / شهر", story: "فقدت فاطمة أباها وأمها في حادث سير. جدتها وحيدة وتعيلها من معاش زهيد. لا تستطيع الجدة شراء الزي المدرسي والكتب. فاطمة تذهب للمدرسة بزي ممزق وتصمت حين يسألها المعلمون." }, en: { name: "Fatma · Orphan", brief: "Age 8 · lives with her grandmother", need: "EGP 400 / month", story: "Fatma lost both parents in a traffic accident. Her elderly grandmother supports her on a meagre pension. She can't afford Fatma's school uniform or books. Fatma goes to school in torn clothes and stays silent when teachers ask." } },
    ],
  },
];

const amounts = [
  { key: "50",     ar: "٥٠ جنيه",  en: "EGP 50"  },
  { key: "200",    ar: "٢٠٠ جنيه", en: "EGP 200" },
  { key: "500",    ar: "٥٠٠ جنيه", en: "EGP 500" },
  { key: "custom", ar: "مبلغ آخر", en: "Custom"   },
];

function buildCaseIndex(cats: Category[]): Record<string, { cat: Category; c: Case }> {
  const idx: Record<string, { cat: Category; c: Case }> = {};
  cats.forEach(cat => cat.cases.forEach(c => { idx[c.number] = { cat, c }; }));
  return idx;
}

export default function Donate() {
  const { t, isRTL } = useLang();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);
  const [loadingCats, setLoadingCats] = useState(true);

  const [activeCat, setActiveCat] = useState("monthly");
  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const [selectedAmount, setSelectedAmount] = useState("200");
  const [customAmountValue, setCustomAmountValue] = useState("");
  const [caseInput, setCaseInput] = useState("");
  const [selectedCase, setSelectedCase] = useState<{ cat: Category; c: Case } | null>(null);
  const [selectedCatInBox, setSelectedCatInBox] = useState<string | null>(null);
  const [inputError, setInputError] = useState(false);

  const WHATSAPP_NUMBER = "201039091390";

  function buildWhatsAppUrl(): string {
    // Resolve amount label
    const amountLabel = (() => {
      if (selectedAmount === "custom") {
        return customAmountValue
          ? `${customAmountValue} ${isRTL ? "جنيه" : "EGP"}`
          : isRTL ? "مبلغ غير محدد" : "Amount not specified";
      }
      const match = amounts.find(a => a.key === selectedAmount);
      return match ? (isRTL ? match.ar : match.en) : selectedAmount;
    })();

    // Resolve destination (case / category / urgent)
    const destinationLabel = (() => {
      if (selectedCase) {
        const name = isRTL ? selectedCase.c.ar.name : selectedCase.c.en.name;
        const cat  = isRTL ? selectedCase.cat.ar.label : selectedCase.cat.en.label;
        return `#${selectedCase.c.number} - ${name} (${cat})`;
      }
      if (selectedCatInBox) {
        const cat = categories.find(c => c.id === selectedCatInBox);
        return cat ? (isRTL ? cat.ar.label : cat.en.label) : selectedCatInBox;
      }
      return isRTL ? "الأولوية الأشد إلحاحًا" : "Most urgent priority";
    })();

    const message = isRTL
      ? `السلام عليكم فريق قيمة 🤝\n\nأريد التبرع بالتفاصيل التالية:\n\n💰 المبلغ: ${amountLabel}\n📋 الحالة / التصنيف: ${destinationLabel}\n\nأرجو التواصل معي لإتمام التبرع. شكراً جزيلاً 🙏`
      : `Hello Qima team 🤝\n\nI'd like to donate with the following details:\n\n💰 Amount: ${amountLabel}\n📋 Case / Category: ${destinationLabel}\n\nPlease get in touch to complete the donation. Thank you 🙏`;

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }

  // Fetch categories from API, merge with fallback
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const mapped: Category[] = (data.data as ApiCategory[]).map((cat) => ({
            id: cat.slug,
            ar: { label: cat.ar.label, icon: cat.icon },
            en: { label: cat.en.label, icon: cat.icon },
            cases: cat.cases.map((c) => ({
              number: c.number,
              ar: c.ar,
              en: c.en,
            })),
          }));
          setCategories(mapped);
          if (mapped.length > 0) setActiveCat(mapped[0].id);
        }
      })
      .catch(() => {
        // Keep fallback
      })
      .finally(() => setLoadingCats(false));
  }, []);

  const caseIndex = buildCaseIndex(categories);
  const category = categories.find(c => c.id === activeCat) ?? categories[0];

  const handleCaseInput = (val: string) => {
    setCaseInput(val);
    setInputError(false);
    if (val.trim() === "") { setSelectedCase(null); setSelectedCatInBox(null); return; }
    const padded = val.trim().padStart(3, "0");
    const found = caseIndex[padded];
    if (found) {
      setSelectedCase(found);
      setSelectedCatInBox(found.cat.id);
      setActiveCat(found.cat.id);
      setExpandedCase(null);
    } else {
      setSelectedCase(null);
      if (val.length >= 3) setInputError(true);
    }
  };

  return (
    <section id="donate" ref={ref} className="relative py-32 px-6">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gold/[0.04] rounded-full blur-[140px]" />
      </div>

      <div className="max-w-5xl mx-auto relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className={`text-center mb-14 ${isRTL ? "font-arabic" : ""}`}
        >
          <div className="badge-label inline-flex items-center gap-2 text-gold/70 text-xs tracking-widest uppercase mb-4 border border-gold/20 px-3 py-1.5 rounded-full">
            <span className="w-1 h-1 rounded-full bg-gold" />
            {t("donate_badge")}
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-3">{t("donate_title")}</h2>
          <p className={`text-white/45 max-w-xl mx-auto text-sm leading-relaxed ${isRTL ? "font-arabic" : ""}`}>{t("donate_desc")}</p>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">

          {/* ── Cases panel ── */}
          <motion.div
            initial={{ opacity: 0, x: isRTL ? 40 : -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            {/* Category tabs */}
            {loadingCats ? (
              <div className="flex gap-2 mb-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-10 w-28 rounded-full bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className={`flex gap-2 mb-6 flex-wrap ${isRTL ? "flex-row-reverse font-arabic" : ""}`}>
                {categories.map(cat => {
                  const active = cat.id === activeCat;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => { setActiveCat(cat.id); setExpandedCase(null); }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-300 ${
                        active
                          ? "bg-gold text-black border-gold shadow-[0_0_20px_rgba(201,168,76,0.25)]"
                          : "border-white/10 text-white/55 hover:border-white/25 hover:text-white bg-white/[0.02]"
                      }`}
                    >
                      <span>{cat.ar.icon}</span>
                      <span>{isRTL ? cat.ar.label : cat.en.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Cases */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCat}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                {loadingCats ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-16 rounded-2xl bg-white/[0.02] border border-white/[0.06] animate-pulse" />
                  ))
                ) : (
                  category?.cases.map((c, i) => {
                    const content = isRTL ? c.ar : c.en;
                    const isExpanded = expandedCase === c.number;
                    const isSelected = selectedCase?.c.number === c.number;
                    return (
                      <motion.div
                        key={c.number}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
                          isSelected ? "border-gold/40 bg-gold/[0.04]" : "border-white/[0.06] bg-white/[0.02] hover:border-white/10"
                        }`}
                      >
                        <div className={`flex items-center gap-3 p-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                          {/* Number */}
                          <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-mono text-xs font-bold ${
                            isSelected ? "bg-gold text-black" : "bg-white/5 text-white/35"
                          }`}>
                            {c.number}
                          </div>
                          {/* Info */}
                          <div className={`flex-1 min-w-0 ${isRTL ? "text-right font-arabic" : "text-left"}`}>
                            <p className="text-white font-semibold text-sm leading-tight">{content.name}</p>
                            <p className="text-white/40 text-xs mt-0.5">{content.brief}</p>
                          </div>
                          {/* Need */}
                          <span className={`flex-shrink-0 text-gold/70 text-xs font-medium ${isRTL ? "font-arabic" : ""}`}>{content.need}</span>
                          {/* Select */}
                          <button
                            onClick={() => { setCaseInput(c.number); setSelectedCase({ cat: category, c }); setInputError(false); }}
                            className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                              isSelected ? "bg-gold text-black" : "bg-white/5 text-white/30 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            {isSelected ? <Check size={12} /> : <span className="text-xs leading-none">+</span>}
                          </button>
                          {/* Expand */}
                          <button
                            onClick={() => setExpandedCase(isExpanded ? null : c.number)}
                            className={`flex-shrink-0 flex items-center gap-1 text-white/30 hover:text-white/60 transition-colors ${isRTL ? "flex-row-reverse font-arabic" : ""}`}
                          >
                            <span className="text-[10px] tracking-wide">{isRTL ? "القصة" : "Story"}</span>
                            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.25 }}>
                              <ChevronDown size={14} />
                            </motion.div>
                          </button>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <p className={`px-4 pb-4 pt-2 text-white/55 text-sm leading-relaxed border-t border-white/[0.05] ${isRTL ? "text-right font-arabic" : "text-left"}`}>
                                {content.story}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* ── Donation box ── */}
          <motion.div
            initial={{ opacity: 0, x: isRTL ? -40 : 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:sticky lg:top-24"
          >
            <div className="relative rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
              <div className={`relative z-10 ${isRTL ? "font-arabic" : ""}`}>

                {/* Case selector */}
                <p className={`text-white/40 text-xs mb-2 ${isRTL ? "text-right" : "text-left"}`}>
                  {isRTL ? "رقم الحالة (اختياري)" : "Case number (optional)"}
                </p>
                <div className="relative mb-1">
                  <div className={`absolute top-1/2 -translate-y-1/2 text-white/25 ${isRTL ? "right-3" : "left-3"}`}>
                    <Search size={13} />
                  </div>
                  <input
                    type="text"
                    value={caseInput}
                    onChange={e => handleCaseInput(e.target.value)}
                    placeholder={isRTL ? "مثال: 003" : "e.g. 003"}
                    maxLength={3}
                    className={`w-full bg-white/[0.04] border rounded-xl py-2.5 text-white placeholder:text-white/20 focus:outline-none transition-colors text-sm font-mono ${
                      isRTL ? "pr-8 pl-8 text-right" : "pl-8 pr-8 text-left"
                    } ${inputError ? "border-red-500/40" : selectedCase ? "border-gold/40" : "border-white/10 focus:border-white/20"}`}
                  />
                  {caseInput && (
                    <button onClick={() => { setCaseInput(""); setSelectedCase(null); setSelectedCatInBox(null); setInputError(false); }}
                      className={`absolute top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 ${isRTL ? "left-3" : "right-3"}`}>
                      <X size={13} />
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {selectedCase && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className={`flex items-center gap-1.5 mb-4 text-gold/75 text-xs ${isRTL ? "flex-row-reverse" : ""}`}>
                      <Check size={10} />
                      <span>{isRTL ? selectedCase.c.ar.name : selectedCase.c.en.name}</span>
                      <span className="text-white/20">·</span>
                      <span className="text-white/35">{isRTL ? selectedCase.cat.ar.label : selectedCase.cat.en.label}</span>
                    </motion.div>
                  )}
                  {inputError && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className={`mb-4 text-red-400/65 text-xs ${isRTL ? "text-right" : "text-left"}`}>
                      {isRTL ? "رقم الحالة غير موجود" : "Case number not found"}
                    </motion.p>
                  )}
                  {!selectedCase && !inputError && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-4">
                      <p className={`text-white/30 text-xs mb-2 ${isRTL ? "text-right font-arabic" : "text-left"}`}>
                        {isRTL ? "أو اختر تصنيفًا عامًا" : "Or select a category"}
                      </p>
                      <div className={`flex gap-2 flex-wrap ${isRTL ? "flex-row-reverse" : ""}`}>
                        {categories.map(cat => {
                          const active = selectedCatInBox === cat.id;
                          return (
                            <button
                              key={cat.id}
                              onClick={() => setSelectedCatInBox(active ? null : cat.id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                                active
                                  ? "bg-gold/15 border-gold/50 text-gold"
                                  : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/70"
                              } ${isRTL ? "flex-row-reverse font-arabic" : ""}`}
                            >
                              <span>{cat.ar.icon}</span>
                              <span>{isRTL ? cat.ar.label : cat.en.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      <AnimatePresence>
                        {!selectedCatInBox && (
                          <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            transition={{ duration: 0.3 }}
                            className={`flex items-start gap-2 mt-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] ${isRTL ? "flex-row-reverse font-arabic text-right" : "text-left"}`}
                          >
                            <span className="text-base leading-none mt-0.5 flex-shrink-0">⚡</span>
                            <p className="text-white/35 text-xs leading-relaxed">
                              {isRTL
                                ? "إذا لم تختر حالة أو تصنيفًا، سيذهب تبرعك تلقائياً إلى الحالة الأشد إلحاحًا لدينا في وقت التبرع."
                                : "If you don't select a case or category, your donation will automatically go to our most urgent priority at the time of giving."}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="h-px bg-white/[0.06] mb-4" />

                {/* Amounts */}
                <p className={`text-white/40 text-xs mb-3 ${isRTL ? "text-right" : "text-left"}`}>
                  {isRTL ? "المبلغ" : "Amount"}
                </p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {amounts.map(a => {
                    const active = selectedAmount === a.key;
                    return (
                      <button key={a.key} onClick={() => setSelectedAmount(a.key)}
                        className={`rounded-xl border py-2.5 text-sm font-semibold transition-all duration-200 ${
                          active ? "border-gold bg-gold/10 text-gold shadow-[0_0_14px_rgba(201,168,76,0.18)]"
                               : "border-white/8 text-white/45 hover:border-white/15 hover:text-white/75 bg-white/[0.02]"
                        }`}>
                        {isRTL ? a.ar : a.en}
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {selectedAmount === "custom" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-4 overflow-hidden">
                      <input
                        type="number"
                        min="1"
                        value={customAmountValue}
                        onChange={e => setCustomAmountValue(e.target.value)}
                        placeholder={isRTL ? "أدخل المبلغ (جنيه)" : "Enter amount (EGP)"}
                        className={`w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/20 focus:outline-none focus:border-gold/40 text-sm ${isRTL ? "text-right font-arabic" : "text-left"}`}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* CTA — opens WhatsApp with pre-filled message */}
                <a
                  href={buildWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-gold text-black font-bold rounded-2xl overflow-hidden transition-all hover:shadow-[0_0_28px_rgba(201,168,76,0.4)] hover:scale-[1.02] active:scale-[0.98] text-sm"
                >
                  {/* WhatsApp icon */}
                  <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0 relative z-10" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span className="relative z-10">{t("donate_cta")}</span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </a>

                <div className={`flex items-center justify-center gap-1.5 mt-3 text-white/20 text-xs ${isRTL ? "flex-row-reverse" : ""}`}>
                  <Shield size={10} />
                  <span className={isRTL ? "font-arabic" : ""}>{t("donate_secure")}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
