/**
 * components/RiskBadge/RiskBadge.jsx
 * Visual badge for risk classification level.
 * Supports: healthy | attention | warning | critical | estimated
 */
import React from 'react';
import './RiskBadge.css';

const RISK_MAP = {
  healthy:   { label: 'Saudável',  cssClass: 'healthy'   },
  attention: { label: 'Atenção',   cssClass: 'attention'  },
  warning:   { label: 'Em Risco',  cssClass: 'warning'   },
  critical:  { label: 'Crítico',   cssClass: 'critical'  },
};

export function getLevel(score) {
  if (score < 30)  return 'healthy';
  if (score <= 60) return 'attention';
  if (score <= 80) return 'warning';
  return 'critical';
}

function RiskBadge({ level, size = 'md', estimated = false }) {
  const config = RISK_MAP[level] ?? RISK_MAP.attention;

  return (
    <span className={`risk-badge risk-badge--${config.cssClass} risk-badge--${size}`} aria-label={`Risco: ${config.label}`}>
      <span className="risk-badge__dot" aria-hidden="true" />
      {config.label}
      {estimated && (
        <span className="risk-badge__estimated" aria-label="Score estimado" title="Score calculado com dados parciais">⚠</span>
      )}
    </span>
  );
}

export default RiskBadge;
