import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = "https://qimacharity.com";
const OG_IMAGE = `${SITE_URL}/og-image.png`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "قيمة | Qima · Egyptian Charity",
  description: "لأن للمساكين حقًا… جاءت قيمة. منظمة خيرية مصرية تجد الكادحين الصامتين وتوصل إليهم حقهم.",
  keywords: ["قيمة", "Qima", "Egyptian charity", "خيرية مصرية", "تبرع", "donate", "مساكين"],

  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "قيمة — Qima",
    title: "قيمة | لأن للمساكين حقًا… جاءت قيمة",
    description: "منظمة خيرية مصرية تجد الكادحين الصامتين وتوصل إليهم حقهم. تبرع الآن.",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "قيمة — Qima Egyptian Charity",
        type: "image/png",
      },
    ],
    locale: "ar_EG",
  },

  twitter: {
    card: "summary_large_image",
    title: "قيمة | لأن للمساكين حقًا… جاءت قيمة",
    description: "منظمة خيرية مصرية تجد الكادحين الصامتين وتوصل إليهم حقهم.",
    images: [OG_IMAGE],
  },

  icons: {
    icon: [
      { url: "/favicon-32.png",  sizes: "32x32",   type: "image/png" },
      { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
    shortcut: "/favicon-32.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" className="h-full lang-ar" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&family=Urbanist:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-black text-white antialiased overflow-x-hidden" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
