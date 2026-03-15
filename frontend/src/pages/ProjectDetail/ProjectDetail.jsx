/**
 * pages/ProjectDetail/ProjectDetail.jsx
 * S4-03 — Visão detalhada de um projeto com timeline, sinais, alertas e evidências.
 */
import React, { useState, useEffect, useRef } from 'react';
import Sidebar   from '../../components/Sidebar/Sidebar';
import Topbar    from '../../components/Topbar/Topbar';
import RiskGauge from '../../components/RiskGauge/RiskGauge';
import RiskBadge, { getLevel } from '../../components/RiskBadge/RiskBadge';
import AlertCard from '../../components/AlertCard/AlertCard';
import './ProjectDetail.css';

// ─── Mock data ───────────────────────────────────────────────────────────────
const MOCK_PROJECT = {
  id: '1',
  name: 'API Gateway — Produção',
  env: 'prod',
  repo: 'acme-corp/api-gateway',
  branch: 'main',
  jira: 'API',
  riskScore: 87,
  trend: 'up',
  isEstimated: false,
  lastAnalysis: '2 min atrás',
  alertCount: 3,
  description: 'Gateway principal de produção. Gerencia autenticação e roteamento para todos os microserviços.',
};

const MOCK_HISTORY = [
  { date: '06/03', score: 42 },
  { date: '07/03', score: 38 },
  { date: '08/03', score: 55 },
  { date: '09/03', score: 61 },
  { date: '10/03', score: 58 },
  { date: '11/03', score: 74 },
  { date: '12/03', score: 70 },
  { date: '13/03', score: 79 },
  { date: '14/03', score: 87 },
];

const MOCK_SIGNALS = [
  { key: 'pr_review_gap',        label: 'PRs sem revisão',       icon: '🔀', value: '12 PRs', detail: 'Aguardando há +72h', pct: 82, colorVar: '--color-risk-critical'  },
  { key: 'urgency_language',     label: 'Linguagem de urgência',  icon: '⚠️', value: 'Alta',   detail: '2× acima do normal', pct: 72, colorVar: '--color-risk-warning'   },
  { key: 'commit_velocity_drop', label: 'Queda de commits',       icon: '📉', value: '-40%',  detail: 'vs. semana passada', pct: 68, colorVar: '--color-risk-warning'   },
  { key: 'stale_issues_ratio',   label: 'Issues paradas',         icon: '🐛', value: '7 issues', detail: 'Sem atualização +7d', pct: 55, colorVar: '--color-risk-attention'},
  { key: 'sprint_velocity',      label: 'Velocidade de sprint',   icon: '⚡', value: '6.2 pts', detail: 'Meta: 10 pts',       pct: 40, colorVar: '--color-risk-attention'},
  { key: 'test_coverage',        label: 'Cobertura de testes',    icon: '✅', value: '72%',   detail: 'Acima do mínimo',    pct: 28, colorVar: '--color-risk-healthy'  },
];

const MOCK_ALERTS = [
  {
    severity: 'critical',
    title: '12 PRs sem revisão há mais de 72h',
    probability: 91,
    description: 'O repositório acumulou 12 pull requests sem nenhum reviewer atribuído. O tempo médio de espera ultrapassou 3 dias, indicando gargalo crítico no processo de code review que pode atrasar entregas e aumentar débito técnico.',
    evidence: [
      { type: 'pr',     id: '#341', url: '#', excerpt: 'feat: rate limiting middleware' },
      { type: 'pr',     id: '#338', url: '#', excerpt: 'fix: jwt expiry race condition'  },
      { type: 'commit', id: 'a1b2c3d', url: '#', excerpt: 'Merge branch hotfix/auth-bypass' },
    ],
    timestamp: '14/03/2025 às 14:32',
  },
  {
    severity: 'warning',
    title: 'Queda de 40% na velocidade de sprint',
    probability: 74,
    description: 'O time perdeu significativa capacidade de entrega nas últimas 2 sprints. Issues abertas aumentaram 3× enquanto fechamentos caíram. Possível débito técnico acumulado ou bloqueio externo.',
    evidence: [
      { type: 'issue', id: 'API-412', url: '#', excerpt: 'Sprint 23 — 8 issues em carryover' },
      { type: 'issue', id: 'API-409', url: '#', excerpt: 'Blocked: depends on auth refactor'  },
    ],
    timestamp: '14/03/2025 às 11:15',
  },
  {
    severity: 'info',
    title: 'Padrão de linguagem de urgência detectado',
    probability: 58,
    description: 'Comentários em issues e PRs apresentam termos como "urgente", "produção quebrada" e "hotfix" com frequência 2× acima do normal nas últimas 48h.',
    evidence: [
      { type: 'issue', id: 'API-417', url: '#', excerpt: '"urgente: login falhando em prod"' },
      { type: 'pr',    id: '#344',   url: '#', excerpt: 'hotfix: null pointer on checkout'   },
    ],
    timestamp: '14/03/2025 às 09:47',
  },
];

const ENV_MAP = {
  prod:   { label: 'Produção',      icon: '🚀' },
  homol:  { label: 'Homologação',   icon: '🧪' },
  dev:    { label: 'Dev / QA',      icon: '🔧' },
  custom: { label: 'Personalizado', icon: '⚙️' },
};

// ─── Mini timeline chart (SVG) ───────────────────────────────────────────────
function TimelineChart({ data }) {
  const W = 100, H = 60;
  const scores = data.map(d => d.score);
  const min = Math.min(...scores) - 5;
  const max = Math.max(...scores) + 5;
  const xStep = W / (data.length - 1);

  const toY  = s => H - ((s - min) / (max - min)) * H;
  const pts  = data.map((d, i) => `${i * xStep},${toY(d.score)}`).join(' ');
  const area = `0,${H} ` + pts + ` ${(data.length - 1) * xStep},${H}`;

  const lastScore = scores[scores.length - 1];
  const level = getLevel(lastScore);
  const colorMap = {
    healthy:   '#22C55E',
    attention: '#EAB308',
    warning:   '#F97316',
    critical:  '#EF4444',
  };
  const color = colorMap[level] || '#0040ff';

  return (
    <div className="timeline-chart">
      <svg
        width="100%" viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ overflow: 'visible' }}
      >
        {/* Bands */}
        <rect x="0" y={toY(80)} width={W} height={toY(60) - toY(80)} fill="rgba(239,68,68,0.06)" />
        <rect x="0" y={toY(60)} width={W} height={toY(30) - toY(60)} fill="rgba(249,115,22,0.06)" />
        <rect x="0" y={toY(30)} width={W} height={H - toY(30)}        fill="rgba(34,197,94,0.06)" />
        {/* Area */}
        <polygon points={area} fill={color} fillOpacity="0.08" />
        {/* Line */}
        <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Last dot */}
        <circle
          cx={(data.length - 1) * xStep}
          cy={toY(lastScore)}
          r="3"
          fill={color}
        />
      </svg>
      <div className="timeline-labels">
        {data.map((d, i) => (
          <span key={i} className="timeline-label">{d.date}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Signal card ─────────────────────────────────────────────────────────────
function SignalCard({ signal }) {
  return (
    <div className="signal-card">
      <div className="signal-card__header">
        <span className="signal-card__icon">{signal.icon}</span>
        <span className="signal-card__name">{signal.label}</span>
      </div>
      <div
        className="signal-card__value"
        style={{ color: `var(${signal.colorVar})` }}
      >
        {signal.value}
      </div>
      <div className="signal-card__detail">{signal.detail}</div>
      <div className="signal-card__bar-wrap">
        <div
          className="signal-card__bar"
          style={{
            width: `${signal.pct}%`,
            background: `var(${signal.colorVar})`,
          }}
        />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
function ProjectDetail({ user, theme, onToggleTheme, onNavigate, onLogout, projectId }) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      await new Promise(r => setTimeout(r, 600)); // TODO: replace with fetchProject(projectId)
      if (!cancelled) {
        setProject(MOCK_PROJECT);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [projectId]);

  function handleAnalyze() {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
    }, 2200);
  }

  const env = project ? (ENV_MAP[project.env] || ENV_MAP.custom) : null;

  return (
    <div className="proj-detail-shell" data-theme={theme}>
      <Sidebar activePage="projects" onNavigate={onNavigate} user={user} />

      <div className="proj-detail-main">
        <Topbar
          title={project?.name ?? '—'}
          theme={theme}
          onToggleTheme={onToggleTheme}
          user={user}
          onLogout={onLogout}
          notificationCount={project?.alertCount ?? 0}
          breadcrumb={{ label: 'Projetos', onClick: () => onNavigate?.('projects') }}
        />

        {loading ? (
          <div className="proj-detail-loading">
            <div className="proj-detail-loading__spinner" />
          </div>
        ) : (
          <div className="proj-detail-content">

            {/* ── Header ── */}
            <div className="proj-detail-header">
              <div className="proj-detail-header__left">
                <div className="proj-detail-env-icon">{env.icon}</div>
                <div>
                  <h1 className="proj-detail-title">{project.name}</h1>
                  <p className="proj-detail-subtitle">
                    <span className={`env-tag env-tag--${project.env}`}>{env.label}</span>
                    <span className="proj-detail-repo">{project.repo}</span>
                    <span className="proj-detail-sep">·</span>
                    <span className="proj-detail-branch">branch {project.branch}</span>
                    {project.jira && (
                      <>
                        <span className="proj-detail-sep">·</span>
                        <span className="proj-detail-jira">Jira: {project.jira}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="proj-detail-header__actions">
                <button
                  className="btn-outline"
                  onClick={() => onNavigate?.('projects')}
                >
                  ← Voltar
                </button>
                <button
                  className={`btn-analyze${analyzing ? ' btn-analyze--loading' : ''}`}
                  onClick={handleAnalyze}
                  disabled={analyzing}
                >
                  {analyzing ? (
                    <>
                      <svg className="btn-spinner" width="13" height="13" viewBox="0 0 13 13">
                        <circle cx="6.5" cy="6.5" r="4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="18" strokeDashoffset="13" />
                      </svg>
                      Analisando...
                    </>
                  ) : (
                    <>
                      <svg width="13" height="13" fill="none">
                        <path d="M2 6.5h9M8 3l3 3.5L8 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Analisar agora
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* ── KPI row ── */}
            <div className="proj-detail-kpi">
              {/* Gauge */}
              <div className="kpi-gauge-card">
                <span className="kpi-gauge-label">Risk Score</span>
                <RiskGauge
                  score={project.riskScore}
                  size="md"
                  isEstimated={project.isEstimated}
                />
                <span className="kpi-gauge-since">Última análise: {project.lastAnalysis}</span>
              </div>

              {/* Metrics */}
              <div className="kpi-metrics">
                <div className="kpi-metric">
                  <span className="kpi-metric__label">Tendência</span>
                  <span
                    className="kpi-metric__value"
                    style={{
                      color: project.trend === 'up'
                        ? 'var(--color-risk-critical)'
                        : project.trend === 'down'
                        ? 'var(--color-risk-healthy)'
                        : 'var(--color-text-tertiary)',
                    }}
                  >
                    {project.trend === 'up' ? '↑ Piorando' : project.trend === 'down' ? '↓ Melhorando' : '→ Estável'}
                  </span>
                  <span className="kpi-metric__sub">vs. análise anterior</span>
                </div>
                <div className="kpi-metric">
                  <span className="kpi-metric__label">Alertas ativos</span>
                  <span
                    className="kpi-metric__value"
                    style={{ color: project.alertCount > 0 ? 'var(--color-status-warning)' : 'var(--color-status-success)' }}
                  >
                    {project.alertCount}
                  </span>
                  <span className="kpi-metric__sub">gerados pela IA</span>
                </div>
                <div className="kpi-metric kpi-metric--chart">
                  <span className="kpi-metric__label">Histórico (9 dias)</span>
                  <TimelineChart data={MOCK_HISTORY} />
                </div>
              </div>
            </div>

            {/* ── Signals ── */}
            <section className="proj-detail-section">
              <h2 className="proj-detail-section__title">Sinais detectados</h2>
              <div className="signals-grid">
                {MOCK_SIGNALS.map(s => (
                  <SignalCard key={s.key} signal={s} />
                ))}
              </div>
            </section>

            {/* ── Alerts ── */}
            <section className="proj-detail-section">
              <h2 className="proj-detail-section__title">
                Top 3 Alertas
                <span className="section-count">{MOCK_ALERTS.length}</span>
              </h2>
              <div className="alerts-list">
                {MOCK_ALERTS.map((alert, i) => (
                  <AlertCard
                    key={i}
                    severity={alert.severity}
                    title={alert.title}
                    probability={alert.probability}
                    description={alert.description}
                    evidence={alert.evidence}
                    timestamp={alert.timestamp}
                  />
                ))}
              </div>
            </section>

          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectDetail;
