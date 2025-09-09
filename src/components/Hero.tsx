import React, { useState, useEffect } from "react";

// Desktop and mobile image arrays
const images = [ "/assets/Hero1.png", "/assets/Hero2.png", "/assets/Hero3.png", "/assets/Hero4.png", "/assets/Hero5.png", ];

const desktopImages = [
"/assets/Hero1.png", 
"/assets/Hero2.png", 
"/assets/Hero3.png", 
"/assets/Hero4.png", 
"/assets/Hero5.png", 
];

const mobileImages = [
  "/assets/HeroMob1.png",
  "/assets/HeroMob2.png",
  "/assets/HeroMob3.png",
  "/assets/HeroMob4.png",
  "/assets/HeroMob5.png",
];

type HeroProps = {
  onGetStarted: () => void;
};

export default function Hero({ onGetStarted }: HeroProps) {
  const [current, setCurrent] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Detect viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const images = isMobile ? mobileImages : desktopImages;

  // Carousel interval
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {images.map((img, idx) => (
        <img
          key={idx}
          src={img}
          alt={`Slide ${idx + 1}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            idx === current ? "opacity-100 z-20" : "opacity-0 z-10"
          }`}
        />
      ))}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 z-20" />

      {/* Desktop Layout */}
      <div className="relative z-30 hidden md:flex flex-col items-center justify-center h-full text-center px-4 text-white">
        <h1 className="text-3xl sm:text-4xl md:text-7xl font-extrabold mb-4">
          SolarCore
        </h1>
        <h2 className="text-md sm:text-xl md:text-5xl font-extrabold mb-4">
          Powering Tomorrow, Today.
        </h2>
        <div className="max-w-md sm:max-w-lg md:max-w-2xl">
          <p className="text-sm sm:text-base md:text-2xl leading-relaxed mb-12">
            Seamlessly control your energy, security, and comfort with our intuitive 
            smart home system. Experience a smarter, safer, and more sustainable living.
          </p>

        </div>
        <button
          onClick={onGetStarted}
          className="app-text bg-[#0B111F] text-white px-20 py-3 rounded-lg hover:bg-[#0B111F] transition md:text-lg"
        >
          Begin Your Smart Journey
        </button>
      </div>

      {/* Mobile Layout */}
      <div className="relative z-30 flex flex-col items-center justify-center h-full text-center px-6 text-white md:hidden">
        <h1 className="text-5xl font-extrabold mb-2">SolarCore</h1>
        <h2 className="app-text text-3xl font-bold mb-4">
          Powering Tomorrow,<br />Today.
        </h2>
        <p className="text-2x1 leading-relaxed mb-1">
          Seamlessly control your energy, <br />
          security, and comfort with our intuitive <br />
          smart home system.Experience
        </p>
        <p className="text-2x1 leading-relaxed mb-5">
          a smaller, safer, and more sustainable<br /> Living.
        </p>
        <button
          onClick={onGetStarted}
          className="app-text bg-[#0B111F] text-white px-20 py-3 rounded-lg hover:bg-[#0B111F] transition"
        >
          Begin Your Smart Journey
        </button>
      </div>
    </section>
  );
}
