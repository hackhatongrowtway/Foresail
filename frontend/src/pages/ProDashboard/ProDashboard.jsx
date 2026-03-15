/**
 * pages/ProDashboard/ProDashboard.jsx
 *
 * Main dashboard for authenticated Pro users.
 * Displays: KPI stats, projects grid, recent risk alerts.
 * All API calls are isolated in services/.
 */
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar    from '../../components/Sidebar/Sidebar';
import Topbar     from '../../components/Topbar/Topbar';
import StatsCard  from '../../components/StatsCard/StatsCard';
import ProjectCard from '../../components/ProjectCard/ProjectCard';
import AlertCard  from '../../components/AlertCard/AlertCard';
import RiskGauge  from '../../components/RiskGauge/RiskGauge';
import EmptyState from '../../components/EmptyState/EmptyState';
import { fetchProjects } from '../../services/projectsService';
import { fetchRecentAlerts } from '../../services/riskService';
import './ProDashboard.css';

// ─── Derived stats ────────────────────────────────────────────────────────────
function deriveStats(projects) {
  const total     = projects.length;
  const analyzed  = projects.filter(p => p.lastAnalysis).length;
  const critical  = projects.filter(p => p.riskScore > 80).length;
  const atRisk    = projects.filter(p => p.riskScore > 60).length;
  const avgScore  = total ? Math.round(projects.reduce((s, p) => s + p.riskScore, 0) / total) : 0;
  return { total, analyzed, critical, atRisk, avgScore };
}

// ─── Empty state SVG icons ────────────────────────────────────────────────────
const IconFolder = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4l2 2h9A1.5 1.5 0 0 1 21 9.5v9A1.5 1.5 0 0 1 19.5 20h-15A1.5 1.5 0 0 1 3 18.5v-11Z" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const IconShield = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M12 3L4 6v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V6L12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─── Filter chip component ────────────────────────────────────────────────────
function FilterChip({ label, active, onClick }) {
  return (
    <button
      className={`dashboard__filter-chip${active ? ' dashboard__filter-chip--active' : ''}`}
      onClick={onClick}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ title, count, action }) {
  return (
    <div className="dashboard__section-header">
      <div className="dashboard__section-title-row">
        <h2 className="dashboard__section-title">{title}</h2>
        {count != null && <span className="dashboard__section-count">{count}</span>}
      </div>
      {action && (
        <button className="dashboard__section-action" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
function ProDashboard({ user, theme, onToggleTheme, onNavigate, onLogout }) {
  const [activePage,   setActivePage]   = useState('dashboard');
  const [projects,     setProjects]     = useState([]);
  const [alerts,       setAlerts]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  // Load data
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [projs, recentAlerts] = await Promise.allSettled([
          fetchProjects(),
          fetchRecentAlerts(),
        ]);

        if (!cancelled) {
          setProjects(projs.status === 'fulfilled' ? projs.value : []);
          setAlerts(recentAlerts.status === 'fulfilled' ? recentAlerts.value : []);

          if (projs.status === 'rejected') {
            setError(projs.reason?.message ?? 'Erro ao carregar projetos.');
          }
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // Filter projects
  const FILTERS = [
    { id: 'all',       label: 'Todos'     },
    { id: 'critical',  label: 'Crítico'   },
    { id: 'warning',   label: 'Em Risco'  },
    { id: 'attention', label: 'Atenção'   },
    { id: 'healthy',   label: 'Saudável'  },
  ];

  const filteredProjects = useCallback(() => {
    if (activeFilter === 'all') return projects;
    return projects.filter(p => {
      const score = p.riskScore;
      if (activeFilter === 'critical')  return score > 80;
      if (activeFilter === 'warning')   return score > 60 && score <= 80;
      if (activeFilter === 'attention') return score > 30 && score <= 60;
      if (activeFilter === 'healthy')   return score <= 30;
      return true;
    });
  }, [projects, activeFilter])();

  const stats = deriveStats(projects);

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const firstName = user?.name?.split(' ')[0] ?? 'usuário';

  return (
    <div className="dashboard-shell" data-theme={theme}>
      <Sidebar
        activePage={activePage}
        onNavigate={(page) => { setActivePage(page); onNavigate?.(page); }}
        user={user}
      />

      <div className="dashboard-main">
        <Topbar
          title="Dashboard"
          subtitle={`${greeting}, ${firstName}`}
          theme={theme}
          onToggleTheme={onToggleTheme}
          user={user}
          onLogout={onLogout}
          notificationCount={alerts.filter(a => a.severity === 'critical').length}
        />

        <div className="dashboard-content">

          {/* ── Error banner ── */}
          {error && (
            <div className="dashboard__error-banner" role="alert">
              <span>⚠ {error}</span>
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}

          {/* ── 1. OVERVIEW — KPI Stats ── */}
          <section className="dashboard__section" aria-labelledby="section-overview">
            <div className="dashboard__stats-grid">
              <StatsCard
                label="Total de Projetos"
                value={loading ? '—' : stats.total}
                delta={loading ? null : 'vs mês anterior'}
                deltaDir="neutral"
                loading={loading}
                icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="4" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M4 4V3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1" stroke="currentColor" strokeWidth="1.3"/></svg>}
              />
              <StatsCard
                label="Analisados"
                value={loading ? '—' : stats.analyzed}
                delta={loading ? null : `${stats.total ? Math.round(stats.analyzed / stats.total * 100) : 0}% do total`}
                deltaDir="neutral"
                loading={loading}
                icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><polyline points="2,12 5,7 9,10 14,4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>}
              />
              <StatsCard
                label="Riscos Críticos"
                value={loading ? '—' : stats.critical}
                delta={loading ? null : stats.critical > 0 ? 'requer atenção' : 'nenhum crítico'}
                deltaDir={loading ? 'neutral' : stats.critical > 0 ? 'negative' : 'positive'}
                loading={loading}
                icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2L14 13H2L8 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><line x1="8" y1="7" x2="8" y2="9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="8" cy="11" r="0.6" fill="currentColor"/></svg>}
              />
              <StatsCard
                label="Score Médio"
                value={loading ? '—' : stats.avgScore}
                delta={loading ? null : stats.avgScore < 30 ? 'portfólio saudável' : stats.avgScore < 60 ? 'atenção necessária' : 'risco elevado'}
                deltaDir={loading ? 'neutral' : stats.avgScore < 30 ? 'positive' : stats.avgScore < 60 ? 'neutral' : 'negative'}
                loading={loading}
                icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3"/><path d="M8 2.5v2M8 11.5v2M2.5 8h2M11.5 8h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>}
              />
            </div>
          </section>

          {/* ── 2. PROJECTS ── */}
          <section className="dashboard__section" aria-labelledby="section-projects">
            <SectionHeader
              title="Projetos"
              count={loading ? null : filteredProjects.length}
              action={{ label: '+ Novo projeto', onClick: () => window.location.href = '/auth_flow.html' }}
            />

            {/* Filter chips */}
            <div className="dashboard__filters" role="group" aria-label="Filtrar por nível de risco">
              {FILTERS.map(f => (
                <FilterChip
                  key={f.id}
                  label={f.label}
                  active={activeFilter === f.id}
                  onClick={() => setActiveFilter(f.id)}
                />
              ))}
            </div>

            {/* Grid */}
            {loading ? (
              <div className="dashboard__projects-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProjectCard key={i} loading />
                ))}
              </div>
            ) : filteredProjects.length === 0 ? (
              <EmptyState
                icon={<IconFolder />}
                title="Nenhum projeto encontrado"
                description={activeFilter === 'all'
                  ? 'Conecte um repositório GitHub para começar a monitorar.'
                  : `Nenhum projeto com classificação "${FILTERS.find(f => f.id === activeFilter)?.label}".`}
                action={activeFilter === 'all' ? { label: '+ Adicionar projeto', onClick: () => window.location.href = '/auth_flow.html' } : null}
              />
            ) : (
              <div className="dashboard__projects-grid">
                {filteredProjects.map((project, i) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onOpen={() => onNavigate?.('project-detail', project)}
                    style={{ animationDelay: `${i * 50}ms` }}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── 3. RISK ALERTS + GAUGE SPOTLIGHT ── */}
          <section className="dashboard__section" aria-labelledby="section-alerts">
            <SectionHeader title="Alertas Recentes" count={loading ? null : alerts.length} />

            <div className="dashboard__alerts-layout">
              {/* Alert list */}
              <div className="dashboard__alerts-list">
                {loading ? (
                  <div className="dashboard__alerts-skeleton">
                    {[1,2,3].map(i => <div key={i} className="dashboard__alert-skeleton" />)}
                  </div>
                ) : alerts.length === 0 ? (
                  <EmptyState
                    icon={<IconShield />}
                    title="Nenhum alerta ativo"
                    description="Seus projetos estão dentro dos parâmetros normais. Continue monitorando!"
                  />
                ) : (
                  alerts.map(alert => (
                    <AlertCard
                      key={alert.id}
                      severity={alert.severity}
                      title={alert.title}
                      probability={alert.probability}
                      description={alert.description}
                      evidence={alert.evidence}
                      timestamp={alert.timestamp}
                    />
                  ))
                )}
              </div>

              {/* Gauge spotlight — most critical project */}
              {!loading && projects.length > 0 && (
                <div className="dashboard__gauge-spotlight">
                  <span className="dashboard__gauge-label">Maior Risco</span>
                  <RiskGauge
                    score={projects.sort((a, b) => b.riskScore - a.riskScore)[0].riskScore}
                    size="md"
                    isEstimated={projects[0]?.isEstimated}
                  />
                  <span className="dashboard__gauge-project">
                    {projects.sort((a, b) => b.riskScore - a.riskScore)[0].name}
                  </span>
                  <button
                    className="dashboard__gauge-btn"
                    onClick={() => onNavigate?.('project-detail', projects[0])}
                  >
                    Ver análise completa
                  </button>
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

export default ProDashboard;
