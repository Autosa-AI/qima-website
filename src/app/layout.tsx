import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "قيمة | Qima · Egyptian Charity",
  description: "Qima (قيمة) is an Egyptian charity organization building real value through education, empowerment, and hope.",
  keywords: ["قيمة", "Qima", "Egyptian charity", "خيرية مصرية", "تبرع", "donate"],
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
