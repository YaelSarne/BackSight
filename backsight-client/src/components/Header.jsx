import React from 'react';
import '../styles/Header.css';

function Header({ content, onLaunch }) {
  return (
    <header className="hero-section">
      <div className="hero-bg-orb hero-bg-orb-1" />
      <div className="hero-bg-orb hero-bg-orb-2" />

      <div className="hero-grid">
        <div className="hero-copy">
          <div className="hero-badge">Computer Vision Prototype</div>

          <h1 className="main-logo">
            {content.hero.title} <span className="neon-text">{content.hero.suffix}</span>
          </h1>

          <p className="subtitle">{content.hero.subtitle}</p>

          <p className="hero-description">
            {content.hero.description}
          </p>

          <div className="hero-mini-stats">
            <div className="mini-stat">
              <span className="mini-stat-value">Presence Tracking</span>
              <span className="mini-stat-label">Monitors nearby stay time</span>
            </div>

            <div className="mini-stat">
              <span className="mini-stat-value">Reappearance Logic</span>
              <span className="mini-stat-label">Detects repeated return patterns</span>
            </div>

            <div className="mini-stat">
              <span className="mini-stat-value">Threshold Alerts</span>
              <span className="mini-stat-label">Escalates by duration rules</span>
            </div>
          </div>

          <div className="hero-actions">
            <button className="hero-launch-btn" onClick={onLaunch}>
              Launch Live Demo
            </button>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-visual-card">
            <div className="hero-visual-header">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>

            <div className="hero-radar">
              <div className="radar-ring ring-1" />
              <div className="radar-ring ring-2" />
              <div className="radar-ring ring-3" />
              <div className="radar-sweep" />
              <div className="radar-point point-1" />
              <div className="radar-point point-2" />
            </div>

            <div className="hero-visual-footer">
              <div className="signal-row">
                <span className="signal-label">Nearby Presence</span>
                <span className="signal-value ok">Monitored</span>
              </div>
              <div className="signal-row">
                <span className="signal-label">Reappearance Pattern</span>
                <span className="signal-value warn">Evaluated</span>
              </div>
              <div className="signal-row">
                <span className="signal-label">Alert Thresholds</span>
                <span className="signal-value">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;