import React from 'react';
import '../styles/LandingPage.css';

function LandingPage({ content, onLaunch }) {
  const problem = content.sections.find(section => section.id === 'problem');
  const features = content.sections.find(section => section.id === 'features');
  const limitations = content.sections.find(section => section.id === 'limitations');
  const future = content.sections.find(section => section.id === 'future');

  const landing = content.landingPage || {};

  return (
    <div className="landing-container animate-fade-in">
      <section className="story-section story-section-intro">
        <div className="section-kicker">{landing.ideaKicker}</div>
        <div className="section-shell">
          <div className="story-copy">
            <h2 className="section-title">{problem?.title}</h2>
            <p className="story-text">{problem?.text}</p>
          </div>

          <div className="story-side-card highlight-card">
            <h3>{landing.designGoal?.title}</h3>
            <p>{landing.designGoal?.text}</p>
          </div>
        </div>
      </section>

      <section className="story-section">
        <div className="section-kicker">{landing.whatItDoesKicker}</div>
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
        <div className="section-kicker">{landing.howItWorksKicker}</div>
        <div className="section-shell stacked">
          <div className="story-copy centered-copy">
            <h2 className="section-title">{landing.technicalDeepDive?.title}</h2>
            <p className="story-text narrow">{landing.technicalDeepDive?.text}</p>
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
        <div className="section-kicker">{landing.realityCheckKicker}</div>
        <div className="section-shell">
          <div className="story-copy">
            <h2 className="section-title">{limitations?.title}</h2>
            <p className="story-text">{limitations?.text}</p>
          </div>

          <div className="story-side-card danger-card">
            <h3>{landing.prototypeConstraints?.title}</h3>
            <ul className="feature-list clean-list">
              {landing.prototypeConstraints?.bullets?.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="story-section">
        <div className="section-kicker">{landing.whatComesNextKicker}</div>
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
          <div className="section-kicker">{landing.livePrototype?.kicker}</div>
          <h2>{landing.livePrototype?.title}</h2>
          <p>{landing.livePrototype?.text}</p>
        </div>

        <div className="launch-area">
          <button className="launch-btn" onClick={onLaunch}>
            {landing.livePrototype?.buttonText}
          </button>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;