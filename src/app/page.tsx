"use client";
import { LanguageProvider } from "@/context/LanguageContext";
import StarField from "@/components/StarField";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Mission from "@/components/Mission";
import Projects from "@/components/Projects";
import Donate from "@/components/Donate";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <LanguageProvider>
      <div className="relative min-h-screen bg-black">
        <StarField />
        <div className="relative z-10">
          <Navigation />
          <main>
            <Hero />
            <About />
            <Mission />
            <Projects />
            {/* <Impact /> */}
            <Donate />
            <Contact />
          </main>
          <Footer />
        </div>
      </div>
    </LanguageProvider>
  );
}
