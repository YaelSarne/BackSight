import React from 'react';
import '../styles/LandingPage.css';

function LandingPage({ content, onLaunch }) {
  const problem = content.sections.find(section => section.id === 'problem');
  const features = content.sections.find(section => section.id === 'features');
  const limitations = content.sections.find(section => section.id === 'limitations');
  const future = content.sections.find(section => section.id === 'future');

  return (
    <div className="landing-container animate-fade-in">
      <section className="story-section story-section-intro">
        <div className="section-kicker">The Idea</div>
        <div className="section-shell">
          <div className="story-copy">
            <h2 className="section-title">{problem?.title}</h2>
            <p className="story-text">{problem?.text}</p>
          </div>

          <div className="story-side-card highlight-card">
            <h3>Design Goal</h3>
            <p>
              Build an early prototype that can monitor nearby presence over time,
              notice repeated reappearance patterns, and surface potential discomfort
              scenarios without relying on explicit identity recognition.
            </p>
          </div>
        </div>
      </section>

      <section className="story-section">
        <div className="section-kicker">What it does</div>
        <div className="section-shell">
          <div className="story-copy">
            <h2 className="section-title">{features?.title}</h2>
            <p className="story-text">{features?.text}</p>
          </div>

          <div className="capability-grid">
            {features?.bullets?.map((bullet, i) => (
              <div key={i} className="capability-card">
                <span className="capability-index">0{i + 1}</span>
                <p>{bullet}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="story-section">
        <div className="section-kicker">How it works</div>
        <div className="section-shell stacked">
          <div className="story-copy centered-copy">
            <h2 className="section-title">Technical Deep Dive</h2>
            <p className="story-text narrow">
              The prototype combines lightweight real-time tracking with re-identification logic,
              aiming for practical responsiveness on mobile-friendly hardware rather than heavy infrastructure.
            </p>
          </div>

          <div className="timeline-grid">
            {content.tech_specs.map((spec, index) => (
              <div key={spec.id} className="timeline-card">
                <div className="timeline-top">
                  <span className="timeline-number">0{index + 1}</span>
                  <h3>{spec.title}</h3>
                </div>
                <p>{spec.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="story-section">
        <div className="section-kicker">Reality check</div>
        <div className="section-shell">
          <div className="story-copy">
            <h2 className="section-title">{limitations?.title}</h2>
            <p className="story-text">{limitations?.text}</p>
          </div>

          <div className="story-side-card danger-card">
            <h3>Prototype Constraints</h3>
            <ul className="feature-list clean-list">
              <li>Phone placement is not ideal for always-on monitoring</li>
              <li>Color-based Re-ID is lightweight but imperfect</li>
              <li>Lighting, occlusion, and similar clothing reduce confidence</li>
              <li>This is a proof-of-concept, not a finished safety system</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="story-section">
        <div className="section-kicker">What comes next</div>
        <div className="section-shell">
          <div className="story-copy">
            <h2 className="section-title">{future?.title}</h2>
            <p className="story-text">{future?.text}</p>
          </div>

          <div className="future-grid">
            {future?.bullets?.map((bullet, i) => (
              <div key={i} className="future-pill">
                <span>→</span>
                <p>{bullet}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-panel">
        <div className="cta-copy">
          <div className="section-kicker">Live Prototype</div>
          <h2>Explore the monitoring flow in action</h2>
          <p>
            The current demo lets you test the interaction flow, system thresholds,
            and live camera monitoring experience directly in the browser.
          </p>
        </div>

        <div className="launch-area">
          <button className="launch-btn" onClick={onLaunch}>
            Launch Live Demo
          </button>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;