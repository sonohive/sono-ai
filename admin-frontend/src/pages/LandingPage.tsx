import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/landing.css';

export default function LandingPage() {
  const navigate = useNavigate();

  // Handle mock auth routing
  const handleLogin = () => {
    navigate('/chat');
  };

  return (
    <div id="sonoai-landing-app" className="sonoai-landing-app guest-mode">
      {/* ─── Header & Navigation ──────────────────────────────────────────────── */}
      <header className="sonoai-landing-header">
        <div className="sonoai-landing-container">
          <div className="sonoai-landing-brand">
            <div className="sonoai-landing-brand-mark">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 26 Q14 10 20 26 Q26 42 32 26"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>
            </div>
            <div>
              <span className="sonoai-landing-brand-name">Sono AI</span>
              <span className="sonoai-landing-brand-sub">ULTRASOUND CO-PILOT</span>
            </div>
          </div>
          
          <nav className="sonoai-landing-nav" aria-label="Main Navigation">
            <a href="#features" className="sonoai-landing-nav-link">Features</a>
            <a href="#sandbox" className="sonoai-landing-nav-link">Demo Sandbox</a>
            <a href="#modes" className="sonoai-landing-nav-link">Clinical Engines</a>
            <a href="#pricing" className="sonoai-landing-nav-link">Pricing</a>
          </nav>

          <div className="sonoai-landing-header-actions">
            <button id="sonoai-landing-theme-toggle" className="sonoai-landing-theme-toggle" aria-label="Toggle theme">
              <svg className="sonoai-landing-icon-moon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            </button>
            <button className="sonoai-landing-btn-secondary" onClick={handleLogin}>Log in</button>
            <button className="sonoai-landing-btn-primary" onClick={handleLogin}>Sign up</button>
          </div>
        </div>
      </header>

      {/* ─── Hero Section ─────────────────────────────────────────────────────── */}
      <section className="sonoai-landing-hero">
        <div className="sonoai-landing-container grid-2">
          <div className="sonoai-landing-hero-left">
            <div className="sonoai-landing-hero-badge">
              <span className="pulse-dot"></span>
              <span>B2C Clinical Research & On-the-Go Co-Pilot</span>
            </div>
            <h1 className="sonoai-landing-hero-title">
              The AI Co-Pilot for <span className="text-gradient">Ultrasound & Sonography.</span>
            </h1>
            <p className="sonoai-landing-hero-desc" style={{ fontSize: '14px', fontWeight: 300 }}>
              Exclusively tailored for ultrasound and sonography. An instant, evidence-based on-the-go reference co-pilot for sonographers, doctors, and students, trained on thousands of official guidelines from reputable sources like BMUS, AIUM, and SDMS.
            </p>
            <div className="sonoai-landing-hero-ctas">
              <button className="sonoai-landing-btn-primary large" onClick={handleLogin}>Start Free Beta Access</button>
              <a href="#sandbox" className="sonoai-landing-btn-outline large">Try Interactive Demo</a>
            </div>
            <div className="sonoai-landing-hero-meta">
              <div className="meta-item">
                <strong>94ms</strong>
                <span>Search Latency</span>
              </div>
              <div className="meta-item">
                <strong>100%</strong>
                <span>Auditable Papers</span>
              </div>
              <div className="meta-item">
                <strong>Free</strong>
                <span>Beta Release Access</span>
              </div>
            </div>
          </div>

          {/* Hero Right: Live UI Mockup */}
          <div className="sonoai-landing-hero-right">
            <div className="sonoai-mock-ui-shell">
              <div className="sonoai-mock-ui-header">
                <span className="dot red"></span>
                <span className="dot yellow"></span>
                <span className="dot green"></span>
                <span className="title">Sonohive Intelligence co-pilot_v1.1.2</span>
              </div>
              <div className="sonoai-mock-ui-body">
                <div className="sonoai-mock-sidebar">
                  <span className="mock-line short"></span>
                  <span className="mock-line active"></span>
                  <span className="mock-line"></span>
                  <span className="mock-line"></span>
                </div>
                <div className="sonoai-mock-chat">
                  <div className="mock-bubble user">
                    <p>Identify SRU nodule parameters</p>
                  </div>
                  <div className="mock-bubble assistant">
                    <div className="mock-badge teal">Guideline Mode</div>
                    <p><strong>ACR TI-RADS Nodule Assessment:</strong></p>
                    <ul>
                      <li>Composition: Solid (2 pts)</li>
                      <li>Echogenicity: Very hypoechoic (3 pts)</li>
                      <li>Margin: Lobulated (2 pts)</li>
                    </ul>
                    <p>Total: 7 pts (TR5). FNA is recommended if size ≥ 1.0 cm.</p>
                    <span className="mock-citation">[ACR 2017 TI-RADS, p.15]</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="hero-bg-glow"></div>
          </div>
        </div>
      </section>

      {/* ─── Interactive Sandbox (Demo Widget) ────────────────────────────────── */}
      <section id="sandbox" className="sonoai-landing-sandbox">
        <div className="sonoai-landing-container">
          <div className="section-header text-center">
            <span className="section-tag">Interactive Sandbox</span>
            <h2>Test the Intelligence Engine</h2>
            <p>Click on any clinical question below to watch how SonoAI performs real-time guideline checks and visual literature retrieval.</p>
          </div>

          <div className="sandbox-widget">
            {/* Sandbox Prompts Left */}
            <div className="sandbox-prompts">
              <button className="sandbox-prompt-btn active" data-index="0">
                <span className="prompt-icon">🔬</span>
                <span className="prompt-text">Gallbladder wall thickening criteria?</span>
              </button>
              <button className="sandbox-prompt-btn" data-index="1">
                <span className="prompt-icon">📚</span>
                <span className="prompt-text">FGR Doppler evaluation indices?</span>
              </button>
              <button className="sandbox-prompt-btn" data-index="2">
                <span className="prompt-icon">💡</span>
                <span className="prompt-text">Thyroid nodule FNA parameters?</span>
              </button>
            </div>

            {/* Sandbox Chat Display Right */}
            <div className="sandbox-display">
              <div className="sandbox-chat-header">
                <span className="sandbox-chat-indicator pulse-dot"></span>
                <span id="sandbox-engine-label">SonoAI: Guideline Mode</span>
              </div>
              <div className="sandbox-chat-body" id="sandbox-chat-body">
                {/* Query Balloon */}
                <div className="sandbox-balloon user" id="sandbox-user-balloon">
                  <p>What are the criteria for gallbladder wall thickening?</p>
                </div>

                {/* Response Balloon */}
                <div className="sandbox-balloon assistant" id="sandbox-assistant-balloon">
                  <p><strong>Gallbladder Wall Thickening Reference benchmarks:</strong></p>
                  <p>A normal gallbladder wall thickness is less than 3 mm. Thickening of the wall (≥ 3 mm) is a key sonographic finding which can be classified into:</p>
                  <ul>
                    <li><strong>Intrinsic Causes:</strong> Acute cholecystitis (often associated with gallstones and positive sonographic Murphy sign), adenomyomatosis, and gallbladder carcinoma.</li>
                    <li><strong>Extrinsic Causes:</strong> Hepatitis, liver cirrhosis, congestive heart failure, pancreatitis, and renal failure.</li>
                  </ul>
                  <p className="sandbox-citation">Source citation: AIUM Practice Parameter for Ultrasound of the Abdomen, Page 9.</p>
                  
                  {/* Visual scan result */}
                  <div className="sandbox-media-trigger">
                    <div className="trigger-overlay">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      <span>Click to Zoom Literature Scan</span>
                    </div>
                    <div className="trigger-placeholder-image gb-thickening"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Dual clinical engines ────────────────────── */}
      <section id="modes" className="sonoai-landing-modes">
        <div className="sonoai-landing-container">
          <div className="section-header text-center">
            <span className="section-tag">Dual-Engine Intelligence</span>
            <h2>Two Engines. Focused Ultrasound Rigor.</h2>
            <p>Search dynamically to match official sonography guidelines or probe recent academic literature.</p>
          </div>

          <div className="grid-2 gap-4">
            {/* Guideline Card (Teal) */}
            <div className="engine-card guideline-card">
              <div className="card-badge teal">Standard Core</div>
              <h3>Guideline Mode</h3>
              <p className="card-desc">Queries verified standard operating procedures, medical society guidelines, and national university ultrasound curricula.</p>
              <ul className="card-features">
                <li><span>✔</span> Standardizes reference guidelines (BMUS, SDMS, AIUM, ACR)</li>
                <li><span>✔</span> Conservative answers anchored strictly in ultrasound textbook curriculum</li>
                <li><span>✔</span> Perfect for student exams and general clinical QA protocols</li>
              </ul>
            </div>

            {/* Research Card (Purple) */}
            <div className="engine-card research-card">
              <div className="card-badge purple">Experimental & Academic</div>
              <h3>Research Mode</h3>
              <p className="card-desc">Queries raw indexed clinical papers, PubMed research releases, and peer-reviewed ultrasound journals.</p>
              <ul className="card-features">
                <li><span>✔</span> Provides emerging scientific discoveries and atypical case reports</li>
                <li><span>✔</span> Synthesizes literature findings with reference paper links</li>
                <li><span>✔</span> Designed for researchers, doctors, and literature reviewers</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Pricing Tiers Section ─────────────────────────────────────────── */}
      <section id="pricing" className="sonoai-landing-pricing">
        <div className="sonoai-landing-container">
          <div className="section-header text-center">
            <span className="section-tag">Pricing Plans</span>
            <h2>Free for Everyone. Unlocked for Beta.</h2>
            <p>Explore our individual plan tiers. Access all premium medical AI co-pilot tools at zero cost during our public release.</p>
          </div>

          <div className="grid-2 gap-4">
            {/* Free Plan */}
            <div className="pricing-card">
              <div className="pricing-header">
                <h4>Free Plan</h4>
                <div className="price">
                  <span className="currency">$</span><span className="amount">0</span><span className="period">/mo</span>
                </div>
                <p className="pricing-desc">Essential medical references and on-the-go guidelines lookup.</p>
              </div>
              <ul className="pricing-features">
                <li><span>✔</span> 10 standard Guideline Mode lookups daily</li>
                <li><span>✔</span> Basic standard ultrasound guidelines (ACR, AIUM)</li>
                <li><span>✔</span> Sub-100ms vector search speed</li>
                <li><span>✔</span> Mobile-friendly responsive UI</li>
              </ul>
              <button className="sonoai-landing-btn-secondary full-width" onClick={handleLogin}>Get Started Free</button>
            </div>

            {/* Premium Plan (Unlocked!) */}
            <div className="pricing-card premium-card featured">
              <div className="pricing-ribbon">Everything Free For Now!</div>
              <div className="pricing-header">
                <h4>Premium Plan</h4>
                <div className="price">
                  <span className="currency">$</span><span className="amount">0</span><span className="period">/mo</span>
                  <span className="price-strike">$19/mo</span>
                </div>
                <p className="pricing-desc">Unlimited research inquiries, clinical scans, and bookmark libraries.</p>
              </div>
              <ul className="pricing-features">
                <li><span>✔</span> Unlimited Research Mode literature searches</li>
                <li><span>✔</span> Unlimited Guideline Mode searches</li>
                <li><span>✔</span> Full access to clinical literature scans & lightboxes</li>
                <li><span>✔</span> Personalized saved responses & bookmark dashboard</li>
                <li><span>✔</span> Priority clinical RAG search nodes</li>
              </ul>
              <button className="sonoai-landing-btn-primary full-width" onClick={handleLogin}>Unlock Premium Free</button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Call to Action Footer ────────────────────────────────────────────── */}
      <section className="sonoai-landing-cta">
        <div className="sonoai-landing-container text-center">
          <h2 className="cta-title">Elevate Your Clinical Workflow Today.</h2>
          <p className="cta-desc">Sign up to start chatting, bookmarking responses, and researching guidelines with sub-100ms vector latency.</p>
          <div className="cta-btns">
            <button className="sonoai-landing-btn-primary large" onClick={handleLogin}>Sign Up Now</button>
            <button className="sonoai-landing-btn-outline large" onClick={handleLogin}>Log In to Account</button>
          </div>
        </div>
      </section>

    </div>
  );
}
