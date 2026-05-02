import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { hashPassword } from "@/lib/auth";
import { ObjectId } from "mongodb";
import type { Admin, DonateCategory, DonateCase, ImpactStory } from "@/lib/models";

const SEED_SECRET = process.env.SEED_SECRET || "qima-seed-local";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { name, email, password, seedSecret } = body as {
      name?: string;
      email?: string;
      password?: string;
      seedSecret?: string;
    };

    if (seedSecret !== SEED_SECRET) {
      return NextResponse.json(
        { success: false, error: "Invalid seed secret" },
        { status: 403 }
      );
    }

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { success: false, error: "name, email, and password are required" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Idempotent: only seed if no admins exist
    const adminCount = await db.collection<Admin>("admins").countDocuments();
    let adminId: ObjectId;
    let seededAdmin = false;

    if (adminCount === 0) {
      const passwordHash = await hashPassword(password);
      const now = new Date();
      const ownerDoc: Omit<Admin, "_id"> = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: "owner",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      const result = await db
        .collection<Omit<Admin, "_id">>("admins")
        .insertOne(ownerDoc);
      adminId = result.insertedId;
      seededAdmin = true;
    } else {
      const firstAdmin = await db
        .collection<Admin>("admins")
        .findOne({ role: "owner" });
      adminId = firstAdmin?._id ?? new ObjectId();
    }

    // Seed categories (idempotent by slug)
    const defaultCategories = [
      {
        slug: "monthly",
        icon: "📋",
        ar: { label: "شهريات" },
        en: { label: "Monthly Support" },
        order: 1,
      },
      {
        slug: "gaza",
        icon: "🕊️",
        ar: { label: "أسر غزة" },
        en: { label: "Gaza Families" },
        order: 2,
      },
      {
        slug: "orphans",
        icon: "🤲",
        ar: { label: "أيتام وأرامل" },
        en: { label: "Orphans & Widows" },
        order: 3,
      },
    ];

    const categoryIdMap: Record<string, ObjectId> = {};
    let seededCategories = 0;

    for (const cat of defaultCategories) {
      const existing = await db
        .collection<DonateCategory>("donate_categories")
        .findOne({ slug: cat.slug });

      if (!existing) {
        const now = new Date();
        const result = await db
          .collection<Omit<DonateCategory, "_id">>("donate_categories")
          .insertOne({
            ...cat,
            isActive: true,
            createdBy: adminId,
            createdAt: now,
            updatedAt: now,
          });
        categoryIdMap[cat.slug] = result.insertedId;
        seededCategories++;
      } else {
        categoryIdMap[cat.slug] = existing._id;
      }
    }

    // Seed cases (idempotent by number)
    const defaultCases: Array<{
      number: string;
      categorySlug: string;
      ar: { name: string; brief: string; story: string; need: string };
      en: { name: string; brief: string; story: string; need: string };
      isUrgent: boolean;
      order: number;
    }> = [
      {
        number: "001",
        categorySlug: "monthly",
        ar: { name: "أحمد عبد الرحمن", brief: "عامل مصنع · ٣ أطفال", story: "أحمد يعمل في مصنع نسيج بأجر يومي غير منتظم. زوجته مريضة وتحتاج دواءً شهرياً. أطفاله الثلاثة في المرحلة الابتدائية. راتبه في أفضل الأشهر لا يكفي الإيجار والمأكل معاً.", need: "٤٠٠ جنيه / شهر" },
        en: { name: "Ahmed Abdel Rahman", brief: "Factory worker · 3 children", story: "Ahmed works in a textile factory on irregular daily wages. His wife is ill and needs monthly medication. His three children are in primary school. Even in his best months his income barely covers rent and food.", need: "EGP 400 / month" },
        isUrgent: false,
        order: 1,
      },
      {
        number: "002",
        categorySlug: "monthly",
        ar: { name: "أم عادل سيد", brief: "أرملة · ٤ أطفال", story: "فقدت زوجها قبل عامين في حادث عمل. لا تعليم لها يؤهلها لوظيفة. تبيع الخضار أمام البيت.", need: "٦٠٠ جنيه / شهر" },
        en: { name: "Um Adel Sayed", brief: "Widow · 4 children", story: "She lost her husband two years ago in a work accident. She has no qualifications. She sells vegetables outside her home.", need: "EGP 600 / month" },
        isUrgent: false,
        order: 2,
      },
      {
        number: "003",
        categorySlug: "monthly",
        ar: { name: "خالد إبراهيم", brief: "مريض بالسكري · عاجز جزئياً", story: "تشخّص خالد بمرض السكري قبل ثلاث سنوات. الإرهاق يمنعه من إكمال يوم عمل كامل.", need: "٥٠٠ جنيه / شهر" },
        en: { name: "Khaled Ibrahim", brief: "Diabetic · partially unable to work", story: "Khaled was diagnosed with diabetes three years ago. Fatigue prevents him from completing a full workday.", need: "EGP 500 / month" },
        isUrgent: false,
        order: 3,
      },
      {
        number: "004",
        categorySlug: "gaza",
        ar: { name: "عائلة أبو طه", brief: "نازحون · ٦ أفراد", story: "نزحت العائلة من شمال غزة وتعيش في شقة مستأجرة بالقاهرة. الأب مهندس لكنه لا يملك إقامة.", need: "٨٠٠ جنيه / شهر" },
        en: { name: "Abu Taha Family", brief: "Displaced · 6 members", story: "The family fled northern Gaza and rents a flat in Cairo. The father is an engineer but has no residency to work formally.", need: "EGP 800 / month" },
        isUrgent: true,
        order: 1,
      },
      {
        number: "005",
        categorySlug: "gaza",
        ar: { name: "أم سعيد الحلبي", brief: "أرملة غزاوية · ٥ أطفال", story: "فقدت زوجها في القصف. وصلت مصر مع أطفالها الخمسة بملابس السفر فقط.", need: "٧٠٠ جنيه / شهر" },
        en: { name: "Um Saeed Al-Halabi", brief: "Gazan widow · 5 children", story: "She lost her husband in the bombing. She arrived in Egypt with her five children in travel clothes only.", need: "EGP 700 / month" },
        isUrgent: true,
        order: 2,
      },
      {
        number: "006",
        categorySlug: "gaza",
        ar: { name: "عائلة الشرفاوي", brief: "بيتهم دُمّر · ٤ أفراد", story: "دُمّر بيتهم بالكامل. الأب كان معلماً. في مصر يعمل حارس عمارة.", need: "٩٠٠ جنيه / شهر" },
        en: { name: "Al-Sharfawi Family", brief: "Home destroyed · 4 members", story: "Their home was completely destroyed. The father was a teacher. In Egypt he works as a building guard.", need: "EGP 900 / month" },
        isUrgent: false,
        order: 3,
      },
      {
        number: "007",
        categorySlug: "orphans",
        ar: { name: "أحمد · يتيم", brief: "١٢ عامًا · كفيل وحيد لأمه", story: "فقد أحمد والده وهو في التاسعة. أمه مريضة بالكلى ولا تستطيع العمل.", need: "٣٥٠ جنيه / شهر" },
        en: { name: "Ahmed · Orphan", brief: "Age 12 · sole support for his mother", story: "Ahmed lost his father at age nine. His mother has kidney disease and cannot work.", need: "EGP 350 / month" },
        isUrgent: false,
        order: 1,
      },
      {
        number: "008",
        categorySlug: "orphans",
        ar: { name: "أم أيمن طاهر", brief: "أرملة · ٣ أطفال صغار", story: "توفي زوجها فجأة بجلطة قبل ثمانية أشهر. لم يترك شيئاً.", need: "٦٥٠ جنيه / شهر" },
        en: { name: "Um Ayman Taher", brief: "Widow · 3 young children", story: "Her husband died suddenly of a stroke eight months ago. He left nothing behind.", need: "EGP 650 / month" },
        isUrgent: false,
        order: 2,
      },
      {
        number: "009",
        categorySlug: "orphans",
        ar: { name: "فاطمة · يتيمة", brief: "٨ سنوات · تعيش مع جدتها", story: "فقدت فاطمة أباها وأمها في حادث سير. جدتها وحيدة وتعيلها من معاش زهيد.", need: "٤٠٠ جنيه / شهر" },
        en: { name: "Fatma · Orphan", brief: "Age 8 · lives with her grandmother", story: "Fatma lost both parents in a traffic accident. Her elderly grandmother supports her on a meagre pension.", need: "EGP 400 / month" },
        isUrgent: false,
        order: 3,
      },
    ];

    let seededCases = 0;
    for (const c of defaultCases) {
      const existing = await db
        .collection<DonateCase>("donate_cases")
        .findOne({ number: c.number });
      if (!existing) {
        const now = new Date();
        await db.collection<Omit<DonateCase, "_id">>("donate_cases").insertOne({
          number: c.number,
          categoryId: categoryIdMap[c.categorySlug],
          ar: c.ar,
          en: c.en,
          isActive: true,
          isUrgent: c.isUrgent,
          order: c.order,
          createdBy: adminId,
          createdAt: now,
          updatedAt: now,
        });
        seededCases++;
      }
    }

    // Seed stories
    const defaultStories = [
      {
        imageUrl: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=600&h=800&fit=crop",
        accent: "#4F8EF7",
        order: 1,
        ar: { title: "أحمد · ٤٢ عامًا", location: "إمبابة، الجيزة", tag: "عامل مصنع", story: "يعمل اثنتي عشرة ساعة يومياً في مصنع نسيج. راتبه لا يكفي الإيجار والمأكل معاً. ثلاثة أطفال ينتظرون عودته. لم يطلب مساعدة في حياته — فريق قيمة الميداني وجده أولاً." },
        en: { title: "Ahmed · Age 42", location: "Imbaba, Giza", tag: "Factory Worker", story: "Twelve hours a day in a textile factory. His wages can't cover both rent and food. Three children wait for him to come home. He never once asked for help — Qima's field team found him first." },
      },
      {
        imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=800&fit=crop",
        accent: "#C9A84C",
        order: 2,
        ar: { title: "أم خالد · ٣٨ عامًا", location: "منشية ناصر، القاهرة", tag: "خياطة منزلية", story: "تخيط من الفجر حتى منتصف الليل. يأتيها العمل متقطعاً وأجره لا يكفي. زوجها فقد وظيفته وهي تُعيل الأسرة وحدها بصمت تام." },
        en: { title: "Um Khaled · Age 38", location: "Manshiet Nasser, Cairo", tag: "Home Seamstress", story: "She sews from dawn to midnight. Work trickles in but never enough. Her husband lost his job; she supports the whole family alone, in complete silence." },
      },
      {
        imageUrl: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&h=800&fit=crop",
        accent: "#34D399",
        order: 3,
        ar: { title: "حسن · ٥٥ عامًا", location: "بولاق، القاهرة", tag: "بائع متجول", story: "يدفع عربية الخضار منذ الخامسة صباحاً. في أيام المطر لا يبيع شيئاً ولا يأكل هو وأسرته." },
        en: { title: "Hassan · Age 55", location: "Boulaq, Cairo", tag: "Street Vendor", story: "He pushes his vegetable cart from 5am. On rainy days nothing sells and his family goes hungry." },
      },
      {
        imageUrl: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600&h=800&fit=crop",
        accent: "#A78BFA",
        order: 4,
        ar: { title: "أم يوسف · ٤٥ عامًا", location: "المطرية، القاهرة", tag: "عاملة نظافة", story: "تنظف مدرسة حكومية بأجر لا يتجاوز ألف جنيه. أطفالها في نفس المدرسة التي تنظفها." },
        en: { title: "Um Youssef · Age 45", location: "El Matareya, Cairo", tag: "School Cleaner", story: "She cleans a public school for under 1,000 EGP a month. Her own children study there." },
      },
      {
        imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=800&fit=crop",
        accent: "#F97316",
        order: 5,
        ar: { title: "محمد · ٣٣ عامًا", location: "شبرا الخيمة، القليوبية", tag: "عامل يومية", story: "يقف كل صباح عند ناصية الشارع ينتظر من يأخذه للعمل." },
        en: { title: "Mohamed · Age 33", location: "Shubra El Khema, Qalyubia", tag: "Day Labourer", story: "Every morning he stands at the street corner waiting to be hired." },
      },
    ];

    let seededStories = 0;
    const storiesCount = await db
      .collection<ImpactStory>("impact_stories")
      .countDocuments();

    if (storiesCount === 0) {
      for (const s of defaultStories) {
        const now = new Date();
        await db
          .collection<Omit<ImpactStory, "_id">>("impact_stories")
          .insertOne({
            ...s,
            isActive: true,
            createdBy: adminId,
            createdAt: now,
            updatedAt: now,
          });
        seededStories++;
      }
    }

    // Create indexes (idempotent)
    try {
      await db.collection("content").createIndex(
        { lang: 1, section: 1, key: 1 },
        { unique: true }
      );
    } catch {
      // Index may already exist
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          seededAdmin,
          seededCategories,
          seededCases,
          seededStories,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Seed error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
