"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Lang = "ar" | "en";

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const translations: Record<Lang, Record<string, string>> = {
  ar: {
    nav_about: "من نحن",
    nav_mission: "رسالتنا",
    nav_projects: "مشاريعنا",
    nav_impact: "أثرنا",
    nav_donate: "تبرع",
    nav_contact: "تواصل",

    hero_slogan: "لأن للمساكين حقًا … جاءت قيمة",
    hero_tagline: "يعملون ولا يسألون · نحن من يبحث عنهم",
    hero_sub: "المسكين في قيمة ليس من يمد يده · بل من يطويها على جرحه ويمشي. نحن نجده قبل أن يضطر إلى طلب المساعدة.",
    hero_cta_donate: "تبرع الآن",
    hero_cta_learn: "اعرف أكثر",

    about_badge: "المسكين الذي نقصده",
    about_title: "يعمل بيديه … ولا يملك ما يكفيه",
    about_p1: "المسكين في قيمة إنسان كادح · يخرج كل صباح ويعمل بجد، لكن ما يجنيه لا يكفي أن يعيش بكرامة. ليس كسولًا، ليس محتالًا، ليس متسولًا. بل هو من يصمت على ألمه خجلًا من أن يُرى محتاجًا.",
    about_p2: "هؤلاء لا تجدهم في الطوابير ولا يطرقون الأبواب. تجدهم في المصانع والأسواق والشوارع · يعملون بأجر لا يكفي، ويُسدّون الأفواه بصمت.",
    about_p3: "قيمة وُجدت لأجلهم تحديدًا. نحن من يذهب إليهم · لأنهم لن يأتوا إلينا. ولن نسمح لكرامتهم أن تكون ثمنًا للمساعدة.",

    mission_badge: "رسالتنا وقيمنا",
    mission_title: "ستة مبادئ تقودنا إليهم",
    val_dignity: "الكرامة خط أحمر",
    val_dignity_desc: "من يعمل ويصمت يستحق أن يُساعد دون أن يُذَل. لا استجداء، لا طوابير، لا عيون تترقب · المساعدة تصله في بيته بكل احترام.",
    val_impact: "نذهب إليهم",
    val_impact_desc: "لا ننتظر من يطرق بابنا. فرقنا الميدانية تبحث عن الأسر الكادحة التي تحتاج دون أن تعرف كيف تطلب أو تخشى أن تُحكَم عليها.",
    val_transparency: "كل جنيه يُحاسَب",
    val_transparency_desc: "المتبرع يثق بنا بماله، والمسكين يثق بنا بكرامته. لذلك نُفصح عن كل جنيه وكيف أُنفق · دون استثناء.",
    val_community: "نفهم قبل أن نُعطي",
    val_community_desc: "كل أسرة قصة مختلفة. نجلس معهم، نسمع، ونفهم الاحتياج الحقيقي قبل أن نقدم أي شيء · لأن الحل الخاطئ أسوأ من لا شيء.",
    val_innovation: "نصل إلى من لا يُرى",
    val_innovation_desc: "أصعب جزء في عملنا هو إيجاد من يحتاج ويصمت. نبتكر طرقًا مجتمعية وميدانية للوصول إلى المساكين قبل أن تتفاقم أوضاعهم.",
    val_hope: "الكادح يستحق غدًا أفضل",
    val_hope_desc: "هدفنا ليس أن يعتمد المسكين علينا · بل أن نوفر له ما يحتاجه الآن حتى يستطيع هو أن يبني غده بيديه.",

    projects_badge: "مشاريعنا",
    projects_title: "أربع طرق للوصول إليهم",
    proj1_title: "فرق ميدانية · نذهب إليهم",
    proj1_desc: "متطوعون مدربون يجوبون الأحياء الشعبية للعثور على الأسر الكادحة التي تحتاج ولا تسأل. نطرق نحن الباب، لا هم.",
    proj1_tag: "بحث ميداني",
    proj2_title: "سلة الكادح · دعم شهري صامت",
    proj2_desc: "دعم غذائي وعيني شهري يصل للأسرة في بيتها · بلا طوابير، بلا استمارات مُهينة. مؤونة تكفي ولا تُذكّر صاحبها بعجزه.",
    proj2_tag: "دعم أسري",
    proj3_title: "مدرسة الصامتين · تعليم أبناء الكادحين",
    proj3_desc: "دروس مجانية وأدوات دراسية لأبناء الأسر العاملة التي لا تستطيع تحمّل تكاليف التعليم. لأن فقر الأب لا يجب أن يرث ابنه.",
    proj3_tag: "تعليم",
    proj4_title: "طوارئ الكرامة · إنقاذ فوري",
    proj4_desc: "تدخل سريع للأسر على حافة الانهيار · إيجار متأخر، فاتورة طبية، انقطاع مفاجئ. نمسك بهم قبل أن يسقطوا ويُضطروا للسؤال.",
    proj4_tag: "إغاثة طارئة",
    learn_more: "اعرف أكثر",

    impact_badge: "أثرنا",
    impact_title: "كل رقم إنسان وجدناه قبل أن ييأس",
    impact_families: "أسرة كادحة وصلنا إليها",
    impact_volunteers: "متطوع ميداني",
    impact_projects: "تدخل ناجح",
    impact_governorates: "محافظة نصلها",

    donate_badge: "أدِّ حق المسكين",
    donate_title: "تبرعك يصل إليه · هو لن يطلب",
    donate_desc: "المسكين الذي نخدمه يعمل ويصمت. تبرعك لا يصل عبر طلبه · يصل لأنك أنت اخترت أن تبحث عنه. كل جنيه يُنفق بشفافية تامة.",
    donate_50: "٥٠ جنيه",
    donate_50_desc: "تُكمل مؤونة أسرة عاملة أسبوعًا كاملًا",
    donate_200: "٢٠٠ جنيه",
    donate_200_desc: "تضمن استمرار طفل الكادح في مدرسته فصلًا دراسيًا",
    donate_500: "٥٠٠ جنيه",
    donate_500_desc: "تُنقذ أسرة من الإخلاء وتحفظ كرامتها",
    donate_custom: "مبلغ آخر",
    donate_cta: "أوصِل الحق لصاحبه",
    donate_secure: "الدفع آمن ومشفر",

    contact_badge: "تواصل معنا",
    contact_title: "تعرف أسرة كادحة تحتاج مساعدة؟",
    contact_sub: "أخبرنا عنها · نحن نذهب إليها.",
    contact_name: "اسمك",
    contact_email: "بريدك الإلكتروني",
    contact_message: "أخبرنا عن الحالة أو أي استفسار",
    contact_send: "أرسل",
    contact_or: "أو تواصل معنا مباشرةً",

    footer_desc: "لأن للمساكين حقًا … جاءت قيمة. نجد الكادحين الصامتين ونوصل إليهم حقهم.",
    footer_rights: "جميع الحقوق محفوظة",
    footer_quick: "روابط سريعة",
    footer_follow: "تابعنا",
  },
  en: {
    nav_about: "About",
    nav_mission: "Mission",
    nav_projects: "Projects",
    nav_impact: "Impact",
    nav_donate: "Donate",
    nav_contact: "Contact",

    hero_slogan: "Because the working poor have a right … Qima was born",
    hero_tagline: "They work in silence · we find them",
    hero_sub: "The people Qima serves are not asking for help. They work hard, earn little, and stay silent out of dignity. We seek them out before they ever have to ask.",
    hero_cta_donate: "Donate Now",
    hero_cta_learn: "Learn More",

    about_badge: "Who we mean by 'the poor'",
    about_title: "Works with his hands. Can't make ends meet.",
    about_p1: "The people Qima serves are not beggars. They are people who leave home every morning, work hard, and return with just enough · or not enough · to keep a family alive. They are silent because their dignity means everything to them.",
    about_p2: "You won't find them in aid queues or charity lines. You'll find them in factories, markets, and streets · working long hours for wages that fall short, feeding families with a silence that hides the struggle.",
    about_p3: "Qima exists for them specifically. We go to them · because they will not come to us. And we will never make their dignity the price of our help.",

    mission_badge: "Mission & Values",
    mission_title: "Six principles that lead us to them",
    val_dignity: "Dignity Is Non-Negotiable",
    val_dignity_desc: "Those who work and stay silent deserve help that doesn't humiliate. No queues, no pleading, no watching eyes · support reaches them at home, with full respect.",
    val_impact: "We Go to Them",
    val_impact_desc: "We don't wait for people to knock on our door. Our field teams actively search for working families in need · people who need help but don't know how to ask or are afraid to be judged.",
    val_transparency: "Every Pound Is Accounted For",
    val_transparency_desc: "Donors trust us with their money. The poor trust us with their dignity. That's why we account for every pound spent · without exception.",
    val_community: "We Understand Before We Give",
    val_community_desc: "Every family has a different story. We sit with them, listen, and understand the real need before offering anything · because the wrong solution is worse than nothing.",
    val_innovation: "Reaching Those No One Sees",
    val_innovation_desc: "The hardest part of our work is finding those who need help and say nothing. We develop community and field methods to reach the silent poor before their situation deteriorates.",
    val_hope: "The Hard Worker Deserves a Better Tomorrow",
    val_hope_desc: "Our goal is not for people to depend on us · it's to give them what they need right now, so they can build their own tomorrow with their own hands.",

    projects_badge: "Our Projects",
    projects_title: "Four ways to reach them",
    proj1_title: "Field Teams · We Come to Them",
    proj1_desc: "Trained volunteers comb through working-class neighbourhoods to find struggling families who need help but won't ask for it. We knock on the door · not them.",
    proj1_tag: "Field Outreach",
    proj2_title: "The Worker's Basket · Silent Monthly Support",
    proj2_desc: "Monthly food and essential supplies delivered to families at home · no queues, no humiliating forms. Provisions that are enough without reminding anyone of their need.",
    proj2_tag: "Family Support",
    proj3_title: "School for the Silent · Education for Workers' Children",
    proj3_desc: "Free tutoring and school supplies for children of working families who can't afford education costs. A father's poverty must not become his child's inheritance.",
    proj3_tag: "Education",
    proj4_title: "Dignity Emergency · Rapid Response",
    proj4_desc: "Immediate intervention for families on the edge · overdue rent, a medical bill, a sudden crisis. We catch them before they fall and are forced to ask.",
    proj4_tag: "Emergency Relief",
    learn_more: "Learn More",

    impact_badge: "Our Impact",
    impact_title: "Every number is a person we found before they lost hope",
    impact_families: "Working families reached",
    impact_volunteers: "Field volunteers",
    impact_projects: "Successful interventions",
    impact_governorates: "Governorates we cover",

    donate_badge: "Deliver their right",
    donate_title: "Your donation reaches them · they won't ask",
    donate_desc: "The people we serve work and stay silent. Your donation doesn't reach them through their request · it reaches them because you chose to seek them out. Every pound is fully transparent.",
    donate_50: "EGP 50",
    donate_50_desc: "Completes a working family's groceries for a week",
    donate_200: "EGP 200",
    donate_200_desc: "Keeps a worker's child in school for a full term",
    donate_500: "EGP 500",
    donate_500_desc: "Saves a family from eviction and preserves their dignity",
    donate_custom: "Custom Amount",
    donate_cta: "Deliver the right to its owner",
    donate_secure: "Payments are secure and encrypted",

    contact_badge: "Contact Us",
    contact_title: "Know a working family that needs help?",
    contact_sub: "Tell us about them · we go to them.",
    contact_name: "Your name",
    contact_email: "Your email",
    contact_message: "Tell us about the case or your enquiry",
    contact_send: "Send",
    contact_or: "Or reach us directly via",

    footer_desc: "Because the working poor have a right … Qima was born. We find the silent workers and deliver what is theirs.",
    footer_rights: "All rights reserved",
    footer_quick: "Quick Links",
    footer_follow: "Follow Us",
  },
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("ar");

  useEffect(() => {
    document.documentElement.classList.toggle("lang-en", lang === "en");
    document.documentElement.classList.toggle("lang-ar", lang === "ar");
  }, [lang]);

  const switchLang = (l: Lang) => setLang(l);

  const t = (key: string) => translations[lang][key] ?? key;
  return (
    <LanguageContext.Provider value={{ lang, setLang: switchLang, t, isRTL: lang === "ar" }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}
