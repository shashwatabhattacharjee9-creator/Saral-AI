import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ArrowRight, 
  Triangle, 
  ShieldCheck, 
  HeartPulse, 
  Sparkles, 
  Volume2, 
  FileText, 
  Activity, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

interface Props {
  onLaunchApp: () => void;
}

export const LandingPage: React.FC<Props> = ({ onLaunchApp }) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    setMenuOpen(false);
  };

  return (
    <div className="bg-[#050505] text-[#fafafa] font-helvetica-neue min-h-screen selection:bg-brand-dark selection:text-white overflow-x-hidden">
      
      {/* ════════════════════════════════════════
          PALOMAR LABS SPEC NAVBAR (Fixed)
          ════════════════════════════════════════ */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-brand-cream/90 backdrop-blur-md shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="relative flex items-center h-16 md:h-20">
            {/* Desktop Left Links */}
            <div className="hidden md:flex items-center gap-8 animate-fade-down stagger-1">
              <button
                onClick={() => scrollToSection('problem-solution')}
                className="text-sm text-brand-dark tracking-wide uppercase hover:opacity-70 transition-opacity flex items-center gap-1 font-helvetica-neue"
              >
                <span>Solutions</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="text-sm text-brand-dark tracking-wide uppercase hover:opacity-70 transition-opacity font-helvetica-neue"
              >
                Plans
              </button>
              <button
                onClick={() => scrollToSection('build-story')}
                className="text-sm text-brand-dark tracking-wide uppercase hover:opacity-70 transition-opacity font-helvetica-neue"
              >
                News
              </button>
            </div>

            {/* Center Logo */}
            <div
              onClick={onLaunchApp}
              className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 animate-fade-down stagger-2 cursor-pointer select-none"
            >
              <Triangle className="w-5 h-5 text-brand-dark fill-brand-dark" />
              <span className="text-xl text-brand-dark tracking-tight font-helvetica-neue font-medium">
                SARAL AI
              </span>
            </div>

            {/* Desktop CTA (Right) */}
            <button
              onClick={onLaunchApp}
              className="hidden md:inline-flex items-center ml-auto px-5 py-2.5 bg-brand-dark text-white text-sm tracking-wide uppercase rounded-full hover:bg-brand-green transition-colors animate-fade-down stagger-3 font-helvetica-neue"
            >
              <span>Redirect to Web App</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </button>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden ml-auto z-50 w-10 h-10 flex items-center justify-center relative focus:outline-none"
              aria-label="Toggle menu"
            >
              <div className="w-6 h-5 relative">
                <span
                  className={`w-6 h-[2px] bg-brand-dark rounded transition-all duration-300 ease-[cubic-bezier(0.68,-0.6,0.32,1.6)] absolute left-0 top-[6px] ${
                    menuOpen ? 'rotate-45 translate-y-[5px]' : ''
                  }`}
                />
                <span
                  className={`w-6 h-[2px] bg-brand-dark rounded transition-all duration-300 ease-[cubic-bezier(0.68,-0.6,0.32,1.6)] absolute left-0 top-[13px] ${
                    menuOpen ? '-rotate-45' : ''
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Overlay Menu */}
      <div
        className={`fixed inset-0 bg-brand-cream z-40 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:hidden ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className={`flex flex-col items-center justify-center h-full gap-8 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] delay-100 ${
            menuOpen ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0'
          }`}
        >
          <button
            onClick={() => scrollToSection('problem-solution')}
            className="text-3xl text-brand-dark tracking-tight font-helvetica-neue"
          >
            Solutions
          </button>
          <button
            onClick={() => scrollToSection('features')}
            className="text-3xl text-brand-dark tracking-tight font-helvetica-neue"
          >
            Plans
          </button>
          <button
            onClick={() => scrollToSection('build-story')}
            className="text-3xl text-brand-dark tracking-tight font-helvetica-neue"
          >
            News
          </button>
          <button
            onClick={() => {
              setMenuOpen(false);
              onLaunchApp();
            }}
            className="mt-4 inline-flex items-center px-8 py-3.5 bg-brand-dark text-white text-lg tracking-wide rounded-full font-helvetica-neue hover:bg-brand-green transition-colors"
          >
            <span>Redirect to Web App</span>
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════
          PALOMAR LABS SPEC HERO SECTION
          ════════════════════════════════════════ */}
      <section className="relative w-full h-screen min-h-[700px] overflow-hidden bg-brand-cream font-helvetica-neue">
        
        {/* Background Video Layer */}
        <div className="absolute inset-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="w-full h-full object-cover object-bottom"
          >
            <source
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260820_010308_b1636845-4c15-4ab6-b0c9-9a29bfb0c6e3.mp4"
              type="video/mp4"
            />
          </video>
        </div>

        {/* Content Column (Sits on top of video, left-aligned) */}
        <div className="relative z-10 flex flex-col items-start max-w-7xl mx-auto pt-28 md:pt-36 px-6 lg:px-8">
          
          {/* Announcement Pill */}
          <div
            onClick={onLaunchApp}
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-dark/15 bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-colors mb-5 md:mb-6 animate-fade-up stagger-3 select-none"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span className="text-sm text-brand-dark font-medium">
              A Sarvam Campus'26 Build | Live for everyone today!
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-brand-dark" />
          </div>

          {/* Headline (with line break on sm+) */}
          <h1 className="text-left text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-brand-dark leading-[1.05] tracking-tight max-w-4xl font-helvetica-neue animate-fade-up stagger-4">
            The Next Layer of Intelligence,
            <br className="hidden sm:block" /> Prescriptions Decoded for Every Indian Voice
          </h1>

          {/* Sub-headline (Preserved text) */}
          <p className="mt-4 md:mt-5 text-base sm:text-lg md:text-xl text-brand-dark/80 font-normal leading-relaxed max-w-2xl font-helvetica-neue animate-fade-up stagger-4">
            Turning illegible cursive prescriptions and discharge summaries into structured medicine schedules, 10 Indic languages, and warm spoken audio in under 90 seconds.
          </p>

          {/* Action / CTC Button */}
          <div className="mt-6 md:mt-8 flex flex-wrap items-center gap-4 animate-fade-up stagger-5">
            <button
              onClick={onLaunchApp}
              className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-brand-dark text-white font-medium text-sm sm:text-base tracking-wide uppercase hover:bg-brand-green active:scale-95 shadow-lg transition"
            >
              <span>Redirect to Official Web App</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={() => scrollToSection('problem-solution')}
              className="inline-flex items-center justify-center px-5 py-3.5 text-sm sm:text-base font-medium text-brand-dark hover:opacity-75 transition font-helvetica-neue"
            >
              <span>Explore Architecture ↓</span>
            </button>
          </div>

          {/* Backed by / Trusted by Row */}
          <div className="w-full mt-8 md:mt-10 animate-fade-up stagger-5">
            <div className="text-left text-xs tracking-[0.25em] uppercase text-brand-dark/50 mb-4 md:mb-6 font-helvetica-neue">
              Backed by
            </div>
            <div className="flex flex-wrap items-center justify-start gap-6 md:gap-12 lg:gap-16 animate-fade-up stagger-6">
              <span className="text-lg md:text-xl lg:text-2xl text-brand-dark/80 whitespace-nowrap font-playfair">
                Meridian
              </span>
              <span className="text-lg md:text-xl lg:text-2xl text-brand-dark/80 whitespace-nowrap font-oswald uppercase">
                STELLEX
              </span>
              <span className="text-lg md:text-xl lg:text-2xl text-brand-dark/80 whitespace-nowrap font-montserrat">
                Luminar
              </span>
              <span className="text-lg md:text-xl lg:text-2xl text-brand-dark/80 whitespace-nowrap font-roboto-slab uppercase">
                OVERLAND
              </span>
              <span className="text-lg md:text-xl lg:text-2xl text-brand-dark/80 whitespace-nowrap font-raleway">
                Kinetic
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
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-9 py-4 rounded-full bg-white text-black font-bold text-base hover:bg-stone-100 hover:shadow-2xl active:scale-95 transition"
              >
                <span>Redirect to Official Web App</span>
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
              <button onClick={onLaunchApp} className="hover:text-white transition">Official Webapp</button>
              <button onClick={() => scrollToSection('problem-solution')} className="hover:text-white transition">Problem</button>
              <button onClick={() => scrollToSection('features')} className="hover:text-white transition">Features</button>
              <button onClick={() => scrollToSection('build-story')} className="hover:text-white transition">Story</button>
            </div>
          </footer>

        </div>
      </section>

      {/* Floating Mobile Redirect CTA */}
      <div className="md:hidden fixed bottom-5 left-4 right-4 z-40">
        <button
          onClick={onLaunchApp}
          className="w-full py-3.5 px-5 rounded-full bg-white text-black font-bold text-sm shadow-2xl flex items-center justify-center gap-2 border border-white/20 active:scale-95 transition"
        >
          <span>Redirect to Official Web App</span>
          <ArrowRight className="w-4 h-4 text-black" />
        </button>
      </div>

    </div>
  );
};