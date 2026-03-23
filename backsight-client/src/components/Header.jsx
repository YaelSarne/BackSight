import React from 'react';
// Display the main header of the app, including the title and a neon suffix.

function Header({ content }) {
  return (
    <header className="hero-section">
      <h1 className="main-logo">
        {content.hero.title} <span className="neon-text">{content.hero.suffix}</span>
      </h1>
    </header>
  );
}

export default Header;