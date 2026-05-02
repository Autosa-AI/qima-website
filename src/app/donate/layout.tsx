"use client";
import { LanguageProvider } from "@/context/LanguageContext";

export default function DonateLayout({ children }: { children: React.ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}
