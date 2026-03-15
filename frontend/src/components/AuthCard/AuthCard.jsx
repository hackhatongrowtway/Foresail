/**
 * components/AuthCard/AuthCard.jsx
 * Shared card shell used by both Login and Register pages.
 * Renders the brand logo, title/subtitle, and wraps children.
 */
import React from 'react';
import './AuthCard.css';

const BrandMark = () => (
  <svg width="28" height="32" viewBox="0 0 28 32" fill="none" className="brand-mark">
    <rect x="0" y="0" width="28" height="9" rx="4.5" fill="#1B4DFF"/>
    <rect x="0" y="12" width="20" height="9" rx="4.5" fill="#1B4DFF"/>
    <circle cx="6" cy="26" r="6" fill="#00E5A0"/>
  </svg>
);

function AuthCard({ title, subtitle, footer, children }) {
  return (
    <div className="auth-card">
      <div className="auth-card__brand">
        <BrandMark />
        <span className="auth-card__brand-name">foresail</span>
      </div>
      <div className="auth-card__header">
        <h1 className="auth-card__title">{title}</h1>
        <p className="auth-card__sub">{subtitle}</p>
      </div>
      {children}
      {footer && <p className="auth-card__foot">{footer}</p>}
    </div>
  );
}

export default AuthCard;
