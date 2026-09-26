import React, { useState } from 'react';
import { ArrowRight, ShieldCheck, HeartPulse, Sparkles, Volume2, Globe, Shield, Activity, FileText, CheckCircle2, ChevronRight, AlertTriangle } from 'lucide-react';

interface Props {
  onLaunchApp: () => void;
}

export const LandingPage: React.FC<Props> = ({ onLaunchApp }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="bg-[#050505] text-[#fafafa] font-['Manrope',system-ui,sans-serif] min-h-screen selection:bg-white selection:text-black overflow-x-hidden">
      
      {/* ════════════════════════════════════════
          HERO STAGE (Dark Cinematic Stage + Video)
          ════════════════════════════════════════ */}
      <section className="relative w-full min-h-screen flex flex-col justify-between overflow-hidden bg-[#050505]">
        
        {/* CloudFront Video Plate */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <video
            className="absolute left-1/2 top-0 w-[1492px] max-w-none h-[1054px] -translate-x-1/2 object-cover opacity-85"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
          >
            <source
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260808_112712_da9d53df-6d27-4b12-bdf6-aa9dc2622bdf.mp4"
              type="video/mp4"
            />
          </video>
          
          {/* Dual Fade Overlays (Bottom Fade + Side Letterbox) */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                linear-gradient(to bottom,
                  rgba(5,5,5,0) 70%,
                  rgba(5,5,5,0.45) 80%,
                  rgba(5,5,5,0.85) 90%,
                  #050505 100%),
                linear-gradient(to right,
                  #050505 0%,
                  transparent 18%,
                  transparent 82%,
                  #050505 100%)
              `
            }}
          />
        </div>

        {/* Topbar / Navigation */}
        <header className="relative z-20 w-full max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          {/* Brand Mark (S-like lightning geometric) */}
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={onLaunchApp}>
            <div className="w-8 h-12 flex items-center justify-center">
              <svg viewBox="0 0 31.5 48.5" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-11">
                <defs>
                  <linearGradient id="brandGrad" x1="8" y1="0" x2="34.1" y2="28.9" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#9e9e9e"/>
                    <stop offset="0.28" stopColor="#a6a6a6"/>
                    <stop offset="0.34" stopColor="#a3a3a3"/>
                    <stop offset="0.40" stopColor="#3a3a3a"/>
                    <stop offset="0.55" stopColor="#414141"/>
                    <stop offset="0.60" stopColor="#7a7a7a"/>
                    <stop offset="0.68" stopColor="#8e8e8e"/>
                    <stop offset="0.80" stopColor="#a9a9a9"/>
                    <stop offset="0.95" stopColor="#c4c4c4"/>
                    <stop offset="1" stopColor="#cccccc"/>
                  </linearGradient>
                </defs>
                <path d="M21.5 0 L21.5 19.5 L31.5 19.5 L31.5 29 L10 48.5 L10 28.5 L0.5 28.5 L0.5 18.5 Z" fill="url(#brandGrad)"/>
                <rect x="0.5" y="18.5" width="9" height="10" fill="#fdfdfd"/>
                <rect x="22" y="19.5" width="9.5" height="9.5" fill="#fdfdfd"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-white text-base leading-none">SARAL AI</span>
              <span className="text-[10px] text-[#a7a6a6] tracking-widest uppercase font-medium">सरल • Indic Voice</span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#b6b5b5]">
            <button onClick={() => scrollToSection('problem-solution')} className="hover:text-white transition">
              Problem &amp; Solution
            </button>
            <button onClick={() => scrollToSection('features')} className="hover:text-white transition">
              Core Features
            </button>
            <button onClick={() => scrollToSection('build-story')} className="hover:text-white transition">
              The Build Story
            </button>
            <button onClick={() => scrollToSection('final-cta')} className="hover:text-white transition">
              Launch Demo
            </button>
          </nav>

          {/* Header Action Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={onLaunchApp}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-white text-[#050505] font-semibold text-sm hover:opacity-90 active:scale-95 transition shadow-sm"
            >
              <span>Launch Webapp</span>
            </button>
          </div>
        </header>

        {/* Hero Central Content */}
        <main className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-20 sm:pt-20 flex flex-col justify-center flex-grow">
          <div className="max-w-3xl">
            
            {/* Visual Badge: A Sarvam Campus'26 Build */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.07] border border-white/15 backdrop-blur-md mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-200">
                A Sarvam Campus'26 Build
              </span>
              <span className="text-white/40 text-xs">|</span>
              <span className="text-xs text-stone-400">Sovereign Indic AI</span>
            </div>

            {/* H1 Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-light tracking-tight text-white leading-[1.1] mb-6">
              <span className="block font-normal">The Next Layer</span>
              <span className="block font-light text-stone-300">of Intelligence.</span>
            </h1>

            {/* H2 Sub-headline */}
            <p className="text-lg sm:text-xl text-[#a7a6a6] font-normal leading-relaxed mb-10 max-w-2xl">
              Turning illegible cursive prescriptions and discharge summaries into structured medicine schedules, 10 Indic languages, and warm spoken audio in under 90 seconds.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={onLaunchApp}
                className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-white text-[#050505] font-bold text-base hover:bg-stone-100 hover:shadow-lg active:scale-95 transition"
              >
                <span>Launch Saral AI</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </button>

              <button
                onClick={() => scrollToSection('problem-solution')}
                className="inline-flex items-center justify-center px-6 py-3.5 text-base font-medium text-white/90 hover:text-white hover:underline transition"
              >
                <span>Explore Architecture ↓</span>
              </button>
            </div>

            {/* Instant Demo Trust Indicator */}
            <div className="mt-8 flex items-center gap-3 text-xs text-[#a7a6a6]">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Zero-Friction Access • No Login Required • 100% DPDP Act 2023 Compliant</span>
            </div>

          </div>
        </main>

        {/* Bottom Partner Strip & Model Badges */}
        <div className="relative z-10 w-full border-t border-white/10 bg-black/40 backdrop-blur-md py-5">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-xs text-[#8b8a8a] uppercase tracking-wider font-semibold">
              Powered by Sarvam AI Sovereign Models:
            </div>
            <div className="flex flex-wrap items-center gap-6 sm:gap-8 text-xs text-stone-400">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Gemma-4 Vision OCR
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                Sarvam-Translate:v1 (10 Languages)
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                Bulbul:v2 Indic Speech Synthesis
              </span>
            </div>
          </div>
        </div>

      </section>


      {/* ════════════════════════════════════════
          [PROBLEM & SOLUTION] SECTION
          ════════════════════════════════════════ */}
      <section id="problem-solution" className="py-24 px-6 border-b border-white/10 bg-[#080808]">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3">
              [PROBLEM &amp; SOLUTION]
            </p>
            <h2 className="text-3xl sm:text-4xl font-light text-white tracking-tight">
              The Healthcare Literacy Divide in India
            </h2>
            <p className="text-[#a7a6a6] text-base sm:text-lg mt-3 font-normal">
              Over 1.4 billion people rely on medical prescriptions, yet more than 80% struggle to decipher doctor handwriting, Latin dosage codes, and complex discharge notes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Problem Card */}
            <div className="p-8 rounded-2xl bg-white/[0.03] border border-rose-500/20 relative overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-6">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                The Critical User Pain Point
              </h3>
              <ul className="space-y-3.5 text-sm text-[#a7a6a6]">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span><strong>Illegible Handwriting:</strong> Rapid cursive script leads to dangerous dosage confusion and pharmacy misunderstandings.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span><strong>Latin Medical Jargon:</strong> Abbreviations like <em>OD, BD, TDS, SOS, PC</em> leave patients guessing when to take critical medicines.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span><strong>The Language Chasm:</strong> Prescriptions printed in English fail elderly parents and non-native speakers across rural and semi-urban India.</span>
                </li>
              </ul>
            </div>

            {/* Solution Card */}
            <div className="p-8 rounded-2xl bg-white/[0.03] border border-emerald-500/20 relative overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                How SARAL AI Resolves It
              </h3>
              <ul className="space-y-3.5 text-sm text-[#a7a6a6]">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Vision AI Extraction:</strong> Gemma-4 vision parses doctor handwriting, isolating exact medication names, strengths, and timing.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>True Indic Translation:</strong> Sarvam-Translate converts technical terminology into simple, culturally natural language across 10 Indic tongues.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Natural Spoken Audio:</strong> Bulbul v2 generates clear, human-toned Indic audio explanations for elders who prefer listening over reading.</span>
                </li>
              </ul>
            </div>

          </div>

        </div>
      </section>


      {/* ════════════════════════════════════════
          [CORE FEATURES] SECTION
          ════════════════════════════════════════ */}
      <section id="features" className="py-24 px-6 border-b border-white/10 bg-[#050505]">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3">
              [CORE FEATURES]
            </p>
            <h2 className="text-3xl sm:text-4xl font-light text-white tracking-tight">
              Architected for Clinical Precision &amp; Family Accessibility
            </h2>
            <p className="text-[#a7a6a6] text-base sm:text-lg mt-3 font-normal">
              Four core technological breakthroughs combined into one frictionless experience.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center text-white mb-5">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Clinical Vision Handwriting Engine
                </h3>
                <p className="text-xs text-[#a7a6a6] leading-relaxed">
                  Trained on diverse Indian prescription formats and messy doctor handwriting, extracting medicines, potencies, schedules, and duration with boundary-calibrated confidence scoring.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 text-[11px] text-emerald-400 font-semibold">
                Gemma-4 Multimodal Vision
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center text-white mb-5">
                  <Volume2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  10 Indic Languages + Natural Voice
                </h3>
                <p className="text-xs text-[#a7a6a6] leading-relaxed">
                  Seamless translation into Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi, and Odia. Synthesizes warm, paced audio playback with speed controls.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 text-[11px] text-emerald-400 font-semibold">
                Bulbul:v2 + Sarvam-Translate
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center text-white mb-5">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Real-Time Safety &amp; Interaction Guard
                </h3>
                <p className="text-xs text-[#a7a6a6] leading-relaxed">
                  Automated clinical safety rules detect hazardous drug interaction pairs (e.g. Aspirin + Ibuprofen), missing durations, and high-risk keywords with mandatory user acknowledgment.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 text-[11px] text-emerald-400 font-semibold">
                PRD AC8 Interaction Verifier
              </div>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center text-white mb-5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  DPDP Act 2023 Digital Privacy
                </h3>
                <p className="text-xs text-[#a7a6a6] leading-relaxed">
                  India's Digital Personal Data Protection Act compliance built into the core: purpose-limited consent, 30-day source photo purge, 7-day share links, and instant Right-to-Erasure.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 text-[11px] text-emerald-400 font-semibold">
                Privacy by Architectural Design
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* ════════════════════════════════════════
          [THE BUILD STORY] SECTION
          ════════════════════════════════════════ */}
      <section id="build-story" className="py-24 px-6 border-b border-white/10 bg-[#080808]">
        <div className="max-w-4xl mx-auto">
          
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3">
              [THE BUILD STORY]
            </p>
            <h2 className="text-3xl sm:text-4xl font-light text-white tracking-tight">
              A Sarvam Campus'26 Build
            </h2>
            <p className="text-sm text-[#a7a6a6] mt-2">
              Rapid Sovereign AI Innovation for Indian Public Health
            </p>
          </div>

          <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 sm:p-12 relative overflow-hidden">
            <div className="space-y-6 text-base text-stone-300 leading-relaxed font-light">
              <p>
                During the <strong>Sarvam Campus'26</strong> hackathon challenge, we set out with a relentless objective: solve one of the most widespread yet overlooked daily challenges in Indian family life — understanding what the doctor actually wrote.
              </p>
              <p>
                In Indian households, caring for aging parents often means squinting at illegible prescription slips, deciphering doctor shorthand, and trying to explain complex medication regimens in languages our elders understand. Generic global AI models fail miserably on Indian clinical handwriting and struggle to speak natural, regional Indic dialects.
              </p>
              <p>
                Leveraging the sovereign AI stack provided by Sarvam AI — from high-accuracy vision inference to 10-language Indic translation and humanized speech generation with Bulbul v2 — we architected SARAL AI in a sprint of rapid prototyping and rigorous engineering.
              </p>
              <p className="text-emerald-400 font-medium">
                The result is SARAL AI: an empathetic, high-velocity healthcare companion built by Indian developers, for Indian families.
              </p>
            </div>

            <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-white">10</div>
                <div className="text-xs text-[#a7a6a6] mt-1">Indic Languages</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-white">&lt; 75s</div>
                <div className="text-xs text-[#a7a6a6] mt-1">P99 Latency</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-white">9/9</div>
                <div className="text-xs text-[#a7a6a6] mt-1">AC Tests Passed</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-white">100%</div>
                <div className="text-xs text-[#a7a6a6] mt-1">DPDP Compliant</div>
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* ════════════════════════════════════════
          [FINAL CTA & FOOTER] SECTION
          ════════════════════════════════════════ */}
      <section id="final-cta" className="py-24 px-6 bg-gradient-to-b from-[#080808] to-[#050505]">
        <div className="max-w-4xl mx-auto text-center">
          
          <div className="p-8 sm:p-14 rounded-3xl bg-white/[0.03] border border-white/15 backdrop-blur-xl relative overflow-hidden">
            
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 mb-6">
              <HeartPulse className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-white">Instant Live Access</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-light text-white tracking-tight mb-4">
              Experience Intelligent Healthcare Translation Today
            </h2>
            
            <p className="text-[#a7a6a6] text-base sm:text-lg max-w-xl mx-auto mb-8 font-normal">
              Scan sample prescriptions, explore multi-profile family care, and hear voice explanations in your mother tongue with one click.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={onLaunchApp}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-white text-black font-bold text-base hover:bg-stone-100 hover:shadow-xl active:scale-95 transition"
              >
                <span>Launch Saral AI Webapp</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </button>
            </div>

            <p className="text-xs text-[#8b8a8a] mt-6">
              No account creation or credit card required • Public Hackathon Evaluation Mode
            </p>

          </div>

          {/* Footer */}
          <footer className="mt-20 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-[#8b8a8a] gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">SARAL AI</span>
              <span>— A Sarvam Campus'26 Build</span>
            </div>
            <div>
              DPDP Act 2023 Compliant • Non-Diagnostic Medical AI Information Tool
            </div>
            <div className="flex items-center gap-4 text-stone-400">
              <button onClick={onLaunchApp} className="hover:text-white transition">Webapp</button>
              <button onClick={() => scrollToSection('problem-solution')} className="hover:text-white transition">Problem</button>
              <button onClick={() => scrollToSection('features')} className="hover:text-white transition">Features</button>
              <button onClick={() => scrollToSection('build-story')} className="hover:text-white transition">Story</button>
            </div>
          </footer>

        </div>
      </section>

    </div>
  );
};