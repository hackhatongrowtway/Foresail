/**
 * components/ProjectCard/ProjectCard.jsx
 * Card representing a single project with risk score, trend and actions.
 */
import React from 'react';
import RiskBadge, { getLevel } from '../RiskBadge/RiskBadge';
import './ProjectCard.css';

const IconGitHub = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z"/>
  </svg>
);

const IconTrendUp    = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><polyline points="1,10 5,6 8,8 13,3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><polyline points="9,3 13,3 13,7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IconTrendDown  = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><polyline points="1,4 5,8 8,6 13,11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><polyline points="9,11 13,11 13,7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IconTrendFlat  = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><line x1="2" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
const IconArrowRight = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>;

function TrendIcon({ trend }) {
  if (trend === 'up')   return <span className="project-card__trend project-card__trend--up"><IconTrendUp /></span>;
  if (trend === 'down') return <span className="project-card__trend project-card__trend--down"><IconTrendDown /></span>;
  return <span className="project-card__trend project-card__trend--stable"><IconTrendFlat /></span>;
}

function ProjectCard({ project, onOpen, loading = false }) {
  if (loading) {
    return (
      <div className="project-card project-card--loading" aria-busy="true">
        <div className="project-card__skeleton project-card__skeleton--title" />
        <div className="project-card__skeleton project-card__skeleton--badge" />
        <div className="project-card__skeleton project-card__skeleton--meta" />
      </div>
    );
  }

  const level = getLevel(project.riskScore);

  return (
    <div
      className="project-card"
      onClick={() => onOpen?.(project)}
      role="button"
      tabIndex={0}
      aria-label={`Abrir projeto ${project.name}`}
      onKeyDown={e => e.key === 'Enter' && onOpen?.(project)}
    >
      {/* Header */}
      <div className="project-card__header">
        <div className="project-card__name-row">
          <span className="project-card__repo-icon" aria-hidden="true"><IconGitHub /></span>
          <h3 className="project-card__name">{project.name}</h3>
        </div>
        <TrendIcon trend={project.trend} />
      </div>

      {/* Score row */}
      <div className="project-card__score-row">
        <span className="project-card__score" style={{ color: `var(--color-risk-${level})` }}>
          {project.riskScore}
        </span>
        <RiskBadge level={level} size="sm" estimated={project.isEstimated} />
      </div>

      {/* Meta */}
      <div className="project-card__meta">
        <span className="project-card__meta-item">
          Última análise: {project.lastAnalysis}
        </span>
        {project.alertCount > 0 && (
          <span className="project-card__alert-count">
            {project.alertCount} alerta{project.alertCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* CTA */}
      <div className="project-card__footer">
        <button className="project-card__btn" tabIndex={-1} aria-hidden="true">
          Ver detalhes <IconArrowRight />
        </button>
      </div>
    </div>
  );
}

export default ProjectCard;
