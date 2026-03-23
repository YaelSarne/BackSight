import React from 'react';

// The initial screen of app
// Displaying information about the product and a button to launch the live demo.

function LandingPage({ content, onLaunch }) {
  return (
    <div className="landing-container animate-fade-in">
      <section className="intro-text">
        <p>{content.hero.description}</p>
      </section>

      <div className="launch-area">
        <button className="launch-btn" onClick={onLaunch}>
          Launch Live Demo
        </button>
      </div>

      {/* Dynamic Sections from JSON */}
      <div className="info-grid">
        {content.sections.map(section => (
          <div key={section.id} className="info-card">
            <h3>{section.title}</h3>
            <p>{section.text}</p>
            {section.bullets && (
              <ul className="feature-list">
                {section.bullets.map((bullet, i) => (
                  <li key={i}>{bullet}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default LandingPage;