/**
 * components/StatsCard/StatsCard.jsx
 * Metric card for KPI display (total projects, risks, etc.)
 */
import React from 'react';
import './StatsCard.css';

function StatsCard({ label, value, delta, deltaDir = 'neutral', icon, loading = false }) {
  if (loading) {
    return (
      <div className="stats-card stats-card--loading" aria-busy="true">
        <div className="stats-card__skeleton stats-card__skeleton--label" />
        <div className="stats-card__skeleton stats-card__skeleton--value" />
        <div className="stats-card__skeleton stats-card__skeleton--delta" />
      </div>
    );
  }

  return (
    <div className="stats-card" role="region" aria-label={label}>
      <div className="stats-card__header">
        <span className="stats-card__label">{label}</span>
        {icon && <span className="stats-card__icon" aria-hidden="true">{icon}</span>}
      </div>
      <div className="stats-card__value">{value}</div>
      {delta && (
        <div className={`stats-card__delta stats-card__delta--${deltaDir}`} aria-label={`Variação: ${delta}`}>
          <span className="stats-card__delta-arrow" aria-hidden="true">
            {deltaDir === 'positive' ? '↑' : deltaDir === 'negative' ? '↓' : '→'}
          </span>
          {delta}
        </div>
      )}
    </div>
  );
}

export default StatsCard;
