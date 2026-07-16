"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import anime from "animejs";

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    // 1. Animated Background Orbs
    const orbs = document.querySelectorAll(".bg-orb");
    orbs.forEach((orb, i) => {
      anime({
        targets: orb,
        translateX: () => anime.random(-300, 300),
        translateY: () => anime.random(-300, 300),
        scale: () => anime.random(1, 1.5),
        easing: "easeInOutQuad",
        duration: () => anime.random(8000, 15000),
        direction: "alternate",
        loop: true,
        delay: i * 200,
      });
    });

    // 2. Floating Stars/Particles Background
    const starsContainer = document.getElementById("stars-container");
    if (starsContainer) {
      starsContainer.innerHTML = '';
      const numStars = 100;
      for (let i = 0; i < numStars; i++) {
        const star = document.createElement("div");
        star.classList.add("star");
        
        const size = Math.random() * 2 + 1; // 1px to 3px
        const x = Math.random() * 100; // vw
        const y = Math.random() * 100; // vh
        
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.left = `${x}vw`;
        star.style.top = `${y}vh`;
        star.style.position = "absolute";
        star.style.backgroundColor = isLightMode ? "#1FA391" : "white";
        star.style.borderRadius = "50%";
        star.style.opacity = (Math.random() * 0.5 + 0.1).toString();
        
        starsContainer.appendChild(star);
      }

      anime({
        targets: ".star",
        translateY: () => anime.random(-50, 50),
        translateX: () => anime.random(-20, 20),
        opacity: [
          { value: () => anime.random(0.1, 0.3), duration: () => anime.random(1000, 2000) },
          { value: () => anime.random(0.6, 1), duration: () => anime.random(1000, 2000) }
        ],
        scale: [
          { value: () => anime.random(0.8, 1), duration: () => anime.random(1000, 2000) },
          { value: () => anime.random(1, 1.5), duration: () => anime.random(1000, 2000) }
        ],
        easing: "easeInOutSine",
        direction: "alternate",
        loop: true,
        delay: () => anime.random(0, 2000)
      });
    }

    // 3. Hero Text Animation
    anime.timeline({ loop: false })
      .add({
        targets: ".hero-badge",
        translateY: [20, 0],
        opacity: [0, 1],
        easing: "easeOutExpo",
        duration: 1200,
      })
      .add({
        targets: ".hero-title .word",
        translateY: [30, 0],
        opacity: [0, 1],
        easing: "easeOutElastic(1, 0.8)",
        duration: 1200,
        delay: anime.stagger(100),
      }, "-=800")
      .add({
        targets: ".hero-subtitle",
        opacity: [0, 1],
        translateY: [20, 0],
        easing: "easeOutExpo",
        duration: 1200,
      }, "-=800")
      .add({
        targets: ".hero-btn",
        opacity: [0, 1],
        scale: [0.95, 1],
        easing: "easeOutElastic(1, 0.8)",
        duration: 1000,
        delay: anime.stagger(150),
      }, "-=1000");

    // 4. GSAP Scroll Animations for Features
    const cards = gsap.utils.toArray(".feature-card") as HTMLElement[];
    cards.forEach((card, i) => {
      gsap.fromTo(
        card,
        { y: 50, opacity: 0, rotateX: 5 },
        {
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
          y: 0,
          opacity: 1,
          rotateX: 0,
          duration: 0.6,
          delay: (i % 3) * 0.1,
          ease: "power3.out",
        }
      );

      // Card 3D tilt effect using AnimeJS
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const mouseX = e.clientX - centerX;
        const mouseY = e.clientY - centerY;
        
        const rotateX = (mouseY / (rect.height / 2)) * -10;
        const rotateY = (mouseX / (rect.width / 2)) * 10;
        
        anime({
          targets: card,
          rotateX: rotateX,
          rotateY: rotateY,
          translateY: -5,
          scale: 1.01,
          boxShadow: isLightMode ? "0 20px 40px -10px rgba(31, 163, 145, 0.15)" : "0 20px 40px -10px rgba(31, 163, 145, 0.2)",
          duration: 100,
          easing: "linear"
        });
      });

      card.addEventListener("mouseenter", () => {
        anime({
          targets: card.querySelector(".feature-icon"),
          rotate: 180,
          scale: 1.05,
          duration: 600,
          easing: "easeOutElastic(1, 0.8)"
        });
      });
      card.addEventListener("mouseleave", () => {
        anime({
          targets: card,
          rotateX: 0,
          rotateY: 0,
          translateY: 0,
          scale: 1,
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
          duration: 400,
          easing: "easeOutCirc"
        });
        anime({
          targets: card.querySelector(".feature-icon"),
          rotate: 0,
          scale: 1,
          duration: 500,
          easing: "easeOutCirc"
        });
      });
    });

  }, [isLightMode]); // Re-run effect when theme changes to redraw stars with correct color

  return (
    <div ref={containerRef} className={`min-h-screen ${isLightMode ? "bg-[#FAFAF8] text-[#14171F]" : "bg-[#030712] text-white"} transition-colors duration-500 overflow-hidden selection:bg-[#1FA391] selection:text-white relative font-sans`}>
      
      {/* --- ANIMATED BACKGROUND ORBS & STARS --- */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className={`bg-orb absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-[#1FA391] ${isLightMode ? "opacity-[0.25]" : "opacity-[0.12]"} blur-[100px]`} />
        <div className={`bg-orb absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-[#00f2fe] ${isLightMode ? "opacity-[0.15]" : "opacity-[0.08]"} blur-[120px]`} />
        <div className={`absolute inset-0 ${isLightMode ? "bg-white/60" : "bg-[#030712]/50"} backdrop-blur-[30px] transition-colors duration-500`} />
        
        <div id="stars-container" className="absolute inset-0" />
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 ${isLightMode ? "bg-white/40 border-[#E5E4DE]" : "bg-[#030712]/30 border-white/5"} backdrop-blur-lg border-b transition-colors duration-500`}>
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1FA391] to-[#00f2fe] flex items-center justify-center shadow-[0_0_15px_rgba(31,163,145,0.3)]">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <span className="font-bold text-lg tracking-tight" style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}>ChatbotBuilder</span>
          </div>
          <div className="flex items-center gap-5">
            <button
              onClick={() => setIsLightMode(!isLightMode)}
              className={`w-9 h-9 flex items-center justify-center rounded-full ${isLightMode ? "bg-black/5 hover:bg-black/10" : "bg-white/10 hover:bg-white/20"} transition-colors`}
              aria-label="Toggle Theme"
            >
              {isLightMode ? (
                <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              ) : (
                <svg className="w-4 h-4 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              )}
            </button>
            <Link href="/login" className={`text-sm font-medium ${isLightMode ? "text-[#6d7a76] hover:text-[#14171F]" : "text-gray-400 hover:text-white"} transition-colors`}>Log In</Link>
            <Link href="/register" className={`text-sm font-semibold px-4 py-1.5 ${isLightMode ? "bg-black/5 hover:bg-black/10 border-black/5 text-[#14171F]" : "bg-white/10 hover:bg-white/20 border-white/10 text-white"} border backdrop-blur-md rounded-lg transition-all`}>
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative z-10 pt-40 pb-20 px-6 max-w-4xl mx-auto text-center flex flex-col items-center justify-center min-h-[85vh]">
        <div className={`hero-badge opacity-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${isLightMode ? "bg-black/5 border-black/10" : "bg-white/5 border-white/10"} border backdrop-blur-md mb-6`}>
          <span className="flex h-1.5 w-1.5 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isLightMode ? "bg-[#1FA391]" : "bg-[#00f2fe]"} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isLightMode ? "bg-[#1FA391]" : "bg-[#00f2fe]"}`}></span>
          </span>
          <span className={`text-[10px] font-bold tracking-widest ${isLightMode ? "text-[#6d7a76]" : "text-gray-300"} uppercase`}>Next-Gen AI Platform</span>
        </div>

        <h1 className={`hero-title text-4xl md:text-6xl font-bold tracking-tight mb-5 leading-[1.1] ${isLightMode ? "text-[#14171F]" : "text-white"}`} style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}>
          <span className="word inline-block opacity-0">Build</span>{" "}
          <span className="word inline-block opacity-0">an</span>{" "}
          <span className="word inline-block opacity-0">AI</span>{" "}
          <span className="word inline-block opacity-0 text-transparent bg-clip-text bg-gradient-to-r from-[#1FA391] to-[#00f2fe]">Assistant</span><br />
          <span className="word inline-block opacity-0">that</span>{" "}
          <span className="word inline-block opacity-0">feels</span>{" "}
          <span className={`word inline-block opacity-0 italic font-light ${isLightMode ? "text-[#6d7a76]" : "text-gray-400"}`}>alive.</span>
        </h1>
        
        <p className={`hero-subtitle opacity-0 text-base md:text-lg ${isLightMode ? "text-[#6d7a76]" : "text-gray-400"} max-w-2xl mx-auto mb-10 leading-relaxed font-light`}>
          Upload your knowledge base. Customize the personality. Deploy instantly.
          Transform your website engagement with autonomous AI agents.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <Link href="/register" className="hero-btn opacity-0 w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-[#1FA391] to-[#128a79] hover:from-[#198f7e] hover:to-[#0f7a6a] text-white font-semibold rounded-xl transition-all shadow-[0_0_30px_rgba(31,163,145,0.3)] text-sm border border-[#1FA391]/50">
            Start Building Free
          </Link>
          <Link href="#features" className={`hero-btn opacity-0 w-full sm:w-auto px-7 py-3 ${isLightMode ? "bg-black/5 border-black/10 hover:bg-black/10 text-[#14171F]" : "bg-white/5 border-white/10 hover:bg-white/10 text-white"} border backdrop-blur-md font-semibold rounded-xl transition-all text-sm`}>
            Explore Features
          </Link>
        </div>
      </header>

      {/* Premium Features Section */}
      <section id="features" className={`relative z-10 py-24 px-6 border-t ${isLightMode ? "border-[#E5E4DE]" : "border-white/5"} transition-colors duration-500`}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isLightMode ? "text-[#14171F]" : "text-white"}`} style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}>Unleash the Power of AI</h2>
            <p className={`${isLightMode ? "text-[#6d7a76]" : "text-gray-400"} text-base max-w-xl mx-auto font-light`}>Everything you need to create, train, and deploy enterprise-grade chatbots seamlessly.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" style={{ perspective: "1000px" }}>
            {/* Feature 1 */}
            <div className={`feature-card opacity-0 ${isLightMode ? "bg-white/40 border-[#E5E4DE]" : "bg-white/5 border-white/10"} border p-7 rounded-2xl backdrop-blur-md relative overflow-hidden group transition-colors duration-500`} style={{ transformStyle: "preserve-3d" }}>
              <div className={`absolute top-0 right-0 w-24 h-24 bg-[#1FA391] rounded-full blur-[60px] ${isLightMode ? "opacity-20 group-hover:opacity-40" : "opacity-10 group-hover:opacity-30"} transition-opacity`} />
              <div className="feature-icon w-10 h-10 rounded-xl bg-gradient-to-br from-[#1FA391]/20 to-[#00f2fe]/20 border border-[#1FA391]/30 flex items-center justify-center mb-5">
                <svg className={`w-5 h-5 ${isLightMode ? "text-[#167A6D]" : "text-[#00f2fe]"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <h3 className={`text-lg font-bold mb-2 ${isLightMode ? "text-[#14171F]" : "text-gray-100"}`}>Instant Knowledge</h3>
              <p className={`text-sm ${isLightMode ? "text-[#6d7a76]" : "text-gray-400"} leading-relaxed font-light`}>Drag and drop your PDFs and text files. Our AI instantly learns your business logic.</p>
            </div>

            {/* Feature 2 */}
            <div className={`feature-card opacity-0 ${isLightMode ? "bg-white/40 border-[#E5E4DE]" : "bg-white/5 border-white/10"} border p-7 rounded-2xl backdrop-blur-md relative overflow-hidden group transition-colors duration-500`} style={{ transformStyle: "preserve-3d" }}>
              <div className={`absolute top-0 right-0 w-24 h-24 bg-[#1FA391] rounded-full blur-[60px] ${isLightMode ? "opacity-20 group-hover:opacity-40" : "opacity-10 group-hover:opacity-30"} transition-opacity`} />
              <div className="feature-icon w-10 h-10 rounded-xl bg-gradient-to-br from-[#1FA391]/20 to-[#00f2fe]/20 border border-[#1FA391]/30 flex items-center justify-center mb-5">
                <svg className={`w-5 h-5 ${isLightMode ? "text-[#167A6D]" : "text-[#00f2fe]"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <h3 className={`text-lg font-bold mb-2 ${isLightMode ? "text-[#14171F]" : "text-gray-100"}`}>Identity Editor</h3>
              <p className={`text-sm ${isLightMode ? "text-[#6d7a76]" : "text-gray-400"} leading-relaxed font-light`}>Upload avatars and tweak accent colors so the assistant matches your brand precisely.</p>
            </div>

            {/* Feature 3 */}
            <div className={`feature-card opacity-0 ${isLightMode ? "bg-white/40 border-[#E5E4DE]" : "bg-white/5 border-white/10"} border p-7 rounded-2xl backdrop-blur-md relative overflow-hidden group transition-colors duration-500`} style={{ transformStyle: "preserve-3d" }}>
              <div className={`absolute top-0 right-0 w-24 h-24 bg-[#1FA391] rounded-full blur-[60px] ${isLightMode ? "opacity-20 group-hover:opacity-40" : "opacity-10 group-hover:opacity-30"} transition-opacity`} />
              <div className="feature-icon w-10 h-10 rounded-xl bg-gradient-to-br from-[#1FA391]/20 to-[#00f2fe]/20 border border-[#1FA391]/30 flex items-center justify-center mb-5">
                <svg className={`w-5 h-5 ${isLightMode ? "text-[#167A6D]" : "text-[#00f2fe]"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className={`text-lg font-bold mb-2 ${isLightMode ? "text-[#14171F]" : "text-gray-100"}`}>One-Line Script</h3>
              <p className={`text-sm ${isLightMode ? "text-[#6d7a76]" : "text-gray-400"} leading-relaxed font-light`}>Copy our lightweight JS snippet and embed your assistant on any webpage instantly.</p>
            </div>

            {/* Feature 4 */}
            <div className={`feature-card opacity-0 ${isLightMode ? "bg-white/40 border-[#E5E4DE]" : "bg-white/5 border-white/10"} border p-7 rounded-2xl backdrop-blur-md relative overflow-hidden group transition-colors duration-500`} style={{ transformStyle: "preserve-3d" }}>
              <div className={`absolute top-0 right-0 w-24 h-24 bg-[#1FA391] rounded-full blur-[60px] ${isLightMode ? "opacity-20 group-hover:opacity-40" : "opacity-10 group-hover:opacity-30"} transition-opacity`} />
              <div className="feature-icon w-10 h-10 rounded-xl bg-gradient-to-br from-[#1FA391]/20 to-[#00f2fe]/20 border border-[#1FA391]/30 flex items-center justify-center mb-5">
                <svg className={`w-5 h-5 ${isLightMode ? "text-[#167A6D]" : "text-[#00f2fe]"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className={`text-lg font-bold mb-2 ${isLightMode ? "text-[#14171F]" : "text-gray-100"}`}>Analytics Panel</h3>
              <p className={`text-sm ${isLightMode ? "text-[#6d7a76]" : "text-gray-400"} leading-relaxed font-light`}>Monitor active sessions, total interactions, and leads generated in real-time.</p>
            </div>

            {/* Feature 5 */}
            <div className={`feature-card opacity-0 ${isLightMode ? "bg-white/40 border-[#E5E4DE]" : "bg-white/5 border-white/10"} border p-7 rounded-2xl backdrop-blur-md relative overflow-hidden group transition-colors duration-500`} style={{ transformStyle: "preserve-3d" }}>
              <div className={`absolute top-0 right-0 w-24 h-24 bg-[#1FA391] rounded-full blur-[60px] ${isLightMode ? "opacity-20 group-hover:opacity-40" : "opacity-10 group-hover:opacity-30"} transition-opacity`} />
              <div className="feature-icon w-10 h-10 rounded-xl bg-gradient-to-br from-[#1FA391]/20 to-[#00f2fe]/20 border border-[#1FA391]/30 flex items-center justify-center mb-5">
                <svg className={`w-5 h-5 ${isLightMode ? "text-[#167A6D]" : "text-[#00f2fe]"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <h3 className={`text-lg font-bold mb-2 ${isLightMode ? "text-[#14171F]" : "text-gray-100"}`}>Chat History</h3>
              <p className={`text-sm ${isLightMode ? "text-[#6d7a76]" : "text-gray-400"} leading-relaxed font-light`}>Audit past conversations to identify knowledge gaps and refine your bot's behavior.</p>
            </div>

            {/* Feature 6 */}
            <div className={`feature-card opacity-0 ${isLightMode ? "bg-white/40 border-[#E5E4DE]" : "bg-white/5 border-white/10"} border p-7 rounded-2xl backdrop-blur-md relative overflow-hidden group transition-colors duration-500`} style={{ transformStyle: "preserve-3d" }}>
              <div className={`absolute top-0 right-0 w-24 h-24 bg-[#1FA391] rounded-full blur-[60px] ${isLightMode ? "opacity-20 group-hover:opacity-40" : "opacity-10 group-hover:opacity-30"} transition-opacity`} />
              <div className="feature-icon w-10 h-10 rounded-xl bg-gradient-to-br from-[#1FA391]/20 to-[#00f2fe]/20 border border-[#1FA391]/30 flex items-center justify-center mb-5">
                <svg className={`w-5 h-5 ${isLightMode ? "text-[#167A6D]" : "text-[#00f2fe]"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className={`text-lg font-bold mb-2 ${isLightMode ? "text-[#14171F]" : "text-gray-100"}`}>Bank-Grade Security</h3>
              <p className={`text-sm ${isLightMode ? "text-[#6d7a76]" : "text-gray-400"} leading-relaxed font-light`}>Your knowledge base and customer interactions are fully encrypted and isolated.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`relative z-10 py-28 px-6 border-t ${isLightMode ? "border-[#E5E4DE]" : "border-white/5"} overflow-hidden transition-colors duration-500`}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`w-[600px] h-[300px] bg-gradient-to-r from-[#1FA391] to-[#00f2fe] ${isLightMode ? "opacity-20" : "opacity-10"} blur-[120px] rounded-full`} />
        </div>
        
        <div className={`max-w-3xl mx-auto text-center relative z-10 ${isLightMode ? "bg-white/60 border-[#E5E4DE]" : "bg-white/5 border-white/10"} border p-12 rounded-3xl backdrop-blur-md transition-colors duration-500`}>
          <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isLightMode ? "text-[#14171F]" : "text-white"}`} style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}>The future of support is autonomous.</h2>
          <p className={`${isLightMode ? "text-[#6d7a76]" : "text-gray-400"} text-base mb-8 max-w-xl mx-auto font-light`}>Join forward-thinking businesses using ChatbotBuilder to engage visitors 24/7 without overhead.</p>
          <Link href="/register" className={`inline-block px-8 py-3.5 ${isLightMode ? "bg-[#14171F] text-white hover:bg-gray-800" : "bg-white text-[#030712] hover:bg-gray-200"} hover:scale-105 transition-all font-bold rounded-xl text-sm shadow-[0_0_30px_rgba(0,0,0,0.1)]`}>
            Create Your First Agent
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={`relative z-10 py-8 text-center text-[#6d7a76] border-t ${isLightMode ? "border-[#E5E4DE]" : "border-white/5"} transition-colors duration-500`}>
        <p className="text-xs">© 2026 ChatbotBuilder. Engineered for the future.</p>
      </footer>
    </div>
  );
}
