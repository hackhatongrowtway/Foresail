/**
 * components/RiskGauge/RiskGauge.jsx
 * Animated semicircular SVG gauge for displaying Risk Score.
 * Sizes: sm (120px) | md (180px) | lg (240px)
 */
import React, { useEffect, useState } from 'react';
import RiskBadge, { getLevel } from '../RiskBadge/RiskBadge';
import './RiskGauge.css';

function RiskGauge({ score = 0, size = 'md', isEstimated = false }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  // Animate score on mount and change
  useEffect(() => {
    const start = 0;
    const end = score;
    const duration = 800;
    const startTime = performance.now();

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // cubic-bezier easing
      const ease = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(start + (end - start) * ease));
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }, [score]);

  const level = getLevel(score);
  const diameter = { sm: 120, md: 180, lg: 240 }[size];
  const strokeWidth = { sm: 10, md: 12, lg: 14 }[size];
  const fontSize    = { sm: 24, md: 36, lg: 48 }[size];

  const r  = (diameter - strokeWidth * 2) / 2;
  const cx = diameter / 2;
  const cy = diameter / 2;
  const svgHeight = diameter / 2 + strokeWidth + 4;

  // Arc = half circumference (180°)
  const arcLen = Math.PI * r;
  const filled = (animatedScore / 100) * arcLen;

  const colorMap = {
    healthy:   'var(--color-risk-healthy)',
    attention: 'var(--color-risk-attention)',
    warning:   'var(--color-risk-warning)',
    critical:  'var(--color-risk-critical)',
  };
  const arcColor = colorMap[level];

  return (
    <div className={`risk-gauge risk-gauge--${size}`} role="img" aria-label={`Risk Score: ${score} — ${level}`}>
      <svg
        width={diameter}
        height={svgHeight}
        viewBox={`0 0 ${diameter} ${svgHeight}`}
        aria-hidden="true"
      >
        {/* Background arc */}
        <path
          d={`M ${strokeWidth} ${cy} A ${r} ${r} 0 0 1 ${diameter - strokeWidth} ${cy}`}
          fill="none"
          stroke="var(--color-border-default)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Foreground arc */}
        <path
          d={`M ${strokeWidth} ${cy} A ${r} ${r} 0 0 1 ${diameter - strokeWidth} ${cy}`}
          fill="none"
          stroke={arcColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={isEstimated ? '6 4' : `${filled} ${arcLen}`}
          style={{ transition: 'stroke-dasharray 800ms cubic-bezier(0.4,0,0.2,1), stroke 400ms ease' }}
        />

        {/* Score number */}
        <text
          x={cx}
          y={cy - strokeWidth / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--color-text-primary)"
          fontSize={fontSize}
          fontWeight="600"
          fontFamily="var(--font-sans)"
          style={{ fontFeatureSettings: '"tnum"' }}
        >
          {animatedScore}
        </text>
      </svg>

      {/* Classification badge */}
      <RiskBadge level={level} size={size === 'sm' ? 'sm' : 'md'} estimated={isEstimated} />
    </div>
  );
}

export default RiskGauge;
