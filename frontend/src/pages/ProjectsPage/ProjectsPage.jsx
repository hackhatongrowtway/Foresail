/**
 * pages/ProjectsPage/ProjectsPage.jsx
 *
 * Tela de Projetos do usuário Pro.
 * Layout: 4 KPI cards + tabela com busca, filtros, ordenação e ações.
 * Dados da API via src/services/projectsService.js
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Sidebar    from '../../components/Sidebar/Sidebar';
import Topbar     from '../../components/Topbar/Topbar';
import EmptyState from '../../components/EmptyState/EmptyState';
import { fetchProjects } from '../../services/projectsService';
import './ProjectsPage.css';

// ─── Mock data — substitua por fetchProjects() quando a API estiver pronta ───
const MOCK_PROJECTS = [
  { id:'1', name:'api-gateway',          repo:'acme/api-gateway',          riskScore:87, trend:'up',     classification:'critical',  lastAnalysis:'2 min atrás',  alertCount:3, isEstimated:false, language:'Python',     commits:142, prs:12 },
  { id:'2', name:'auth-service',         repo:'acme/auth-service',         riskScore:72, trend:'up',     classification:'warning',   lastAnalysis:'1h atrás',     alertCount:2, isEstimated:false, language:'Python',     commits:98,  prs:5  },
  { id:'3', name:'mobile-app',           repo:'acme/mobile-app',           riskScore:65, trend:'stable', classification:'warning',   lastAnalysis:'3h atrás',     alertCount:1, isEstimated:false, language:'TypeScript', commits:210, prs:8  },
  { id:'4', name:'payments-core',        repo:'acme/payments-core',        riskScore:45, trend:'down',   classification:'attention', lastAnalysis:'6h atrás',     alertCount:0, isEstimated:false, language:'Python',     commits:67,  prs:3  },
  { id:'5', name:'notification-svc',     repo:'acme/notification-svc',     riskScore:28, trend:'down',   classification:'healthy',   lastAnalysis:'1d atrás',     alertCount:0, isEstimated:false, language:'Python',     commits:44,  prs:1  },
  { id:'6', name:'analytics-pipeline',   repo:'acme/analytics-pipeline',   riskScore:18, trend:'stable', classification:'healthy',   lastAnalysis:'2d atrás',     alertCount:0, isEstimated:false, language:'Python',     commits:33,  prs:0  },
];

// ─── Utilities ─────────────────────────────────────────────────────────────
function getLevel(score) {
  if (score < 30)  return 'healthy';
  if (score <= 60) return 'attention';
  if (score <= 80) return 'warning';
  return 'critical';
}

function getLevelLabel(level) {
  return { healthy: 'Saudável', attention: 'Atenção', warning: 'Em Risco', critical: 'Crítico' }[level];
}

function deriveStats(projects) {
  const total      = projects.length;
  const critical   = projects.filter(p => p.riskScore > 80).length;
  const atRisk     = projects.filter(p => p.riskScore > 60 && p.riskScore <= 80).length;
  const healthy    = projects.filter(p => p.riskScore <= 30).length;
  return { total, critical, atRisk, healthy };
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatCard({ label, value, delta, deltaDir, loading, color }) {
  if (loading) return (
    <div className="projects-stat-card projects-stat-card--loading">
      <div className="projects-stat-skel projects-stat-skel--label" />
      <div className="projects-stat-skel projects-stat-skel--value" />
      <div className="projects-stat-skel projects-stat-skel--delta" />
    </div>
  );
  return (
    <div className="projects-stat-card">
      <span className="projects-stat-label">{label}</span>
      <span className={`projects-stat-value${color ? ` projects-stat-value--${color}` : ''}`}>{value}</span>
      {delta && (
        <span className={`projects-stat-delta projects-stat-delta--${deltaDir}`}>
          {deltaDir === 'positive' ? '↑' : deltaDir === 'negative' ? '↓' : '→'} {delta}
        </span>
      )}
    </div>
  );
}

function RiskBadge({ level, size = 'md' }) {
  return (
    <span className={`proj-badge proj-badge--${level} proj-badge--${size}`}>
      <span className="proj-badge__dot" />
      {getLevelLabel(level)}
    </span>
  );
}

function TrendCell({ trend }) {
  const cls  = trend === 'up' ? 'trend-up' : trend === 'down' ? 'trend-down' : 'trend-stable';
  const icon = trend === 'up'
    ? <svg width="14" height="14" fill="none"><polyline points="2,11 5,6 9,9 13,3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><polyline points="9,3 13,3 13,7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    : trend === 'down'
    ? <svg width="14" height="14" fill="none"><polyline points="2,3 5,8 9,5 13,11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><polyline points="9,11 13,11 13,7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    : <svg width="14" height="14" fill="none"><line x1="3" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
  return <span className={`proj-trend proj-trend--${cls}`}>{icon}</span>;
}

function SortIcon({ field, sortField, sortDir }) {
  const active = sortField === field;
  return (
    <svg width="10" height="12" viewBox="0 0 10 12" fill="none" className={`sort-icon${active ? ' sort-icon--active' : ''}`}>
      <path d="M5 1v10M2 4l3-3 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"
        style={{ opacity: active && sortDir === 'asc' ? 1 : 0.3 }}/>
      <path d="M2 8l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"
        style={{ opacity: active && sortDir === 'desc' ? 1 : 0.3 }}/>
    </svg>
  );
}

const IconSearch = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.4"/><line x1="9.5" y1="9.5" x2="13" y2="13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
const IconPlus   = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><line x1="7" y1="2" x2="7" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="2" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
const IconFolder = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4l2 2h9A1.5 1.5 0 0 1 21 9.5v9A1.5 1.5 0 0 1 19.5 20h-15A1.5 1.5 0 0 1 3 18.5v-11Z" stroke="currentColor" strokeWidth="1.5"/></svg>;
const IconDots   = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="3" r="1" fill="currentColor"/><circle cx="7" cy="7" r="1" fill="currentColor"/><circle cx="7" cy="11" r="1" fill="currentColor"/></svg>;
const IconGitHub = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z"/></svg>;

// ─── Main component ──────────────────────────────────────────────────────────
const FILTERS = [
  { id: 'all',       label: 'Todos'    },
  { id: 'critical',  label: 'Crítico'  },
  { id: 'warning',   label: 'Em Risco' },
  { id: 'attention', label: 'Atenção'  },
  { id: 'healthy',   label: 'Saudável' },
];

const COLUMNS = [
  { id: 'name',         label: 'Projeto',           sortable: true  },
  { id: 'riskScore',    label: 'Risk Score',         sortable: true  },
  { id: 'trend',        label: 'Tendência',          sortable: false },
  { id: 'classification', label: 'Classificação',   sortable: true  },
  { id: 'lastAnalysis', label: 'Última Análise',     sortable: false },
  { id: 'actions',      label: '',                   sortable: false },
];

function ProjectsPage({ user, theme, onToggleTheme, onNavigate, onLogout }) {
  const [projects,     setProjects]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [filter,       setFilter]       = useState('all');
  const [search,       setSearch]       = useState('');
  const [sortField,    setSortField]    = useState('riskScore');
  const [sortDir,      setSortDir]      = useState('desc');
  const [openMenu,     setOpenMenu]     = useState(null);
  const [page,         setPage]         = useState(1);
  const PER_PAGE = 10;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // TODO: replace with: const data = await fetchProjects();
        await new Promise(r => setTimeout(r, 700));
        if (!cancelled) setProjects(MOCK_PROJECTS);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleSort = useCallback((field) => {
    setSortField(prev => {
      if (prev === field) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); return field; }
      setSortDir('desc');
      return field;
    });
  }, []);

  const filtered = useMemo(() => {
    let list = [...projects];
    // Filter by level
    if (filter !== 'all') {
      list = list.filter(p => {
        const lvl = getLevel(p.riskScore);
        return lvl === filter;
      });
    }
    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.repo?.toLowerCase().includes(q));
    }
    // Sort
    list.sort((a, b) => {
      let va = a[sortField], vb = b[sortField];
      if (typeof va === 'string') va = va.toLowerCase(), vb = vb?.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [projects, filter, search, sortField, sortDir]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return filtered.slice(start, start + PER_PAGE);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const stats = deriveStats(projects);

  return (
    <div className="projects-shell" data-theme={theme}>
      <Sidebar activePage="projects" onNavigate={p => onNavigate?.(p)} user={user} />

      <div className="projects-main">
        <Topbar
          title="Projetos"
          subtitle={`${projects.length} repositórios monitorados`}
          theme={theme}
          onToggleTheme={onToggleTheme}
          user={user}
          onLogout={onLogout}
          notificationCount={projects.filter(p => p.riskScore > 80).length}
        />

        <div className="projects-content">

          {/* Error */}
          {error && (
            <div className="projects-error" role="alert">
              <span>⚠ {error}</span>
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}

          {/* ── KPI Stats ── */}
          <div className="projects-stats-row">
            <StatCard label="Total Projetos" value={loading ? '—' : stats.total}    delta="+1 este mês"      deltaDir="neutral"  loading={loading} />
            <StatCard label="Críticos"        value={loading ? '—' : stats.critical} delta="+1 vs semana"     deltaDir="negative" loading={loading} color="critical" />
            <StatCard label="Em Risco"        value={loading ? '—' : stats.atRisk}   delta="-1 vs semana"     deltaDir="positive" loading={loading} color="warning"  />
            <StatCard label="Saudáveis"       value={loading ? '—' : stats.healthy}  delta="+2 vs semana"     deltaDir="positive" loading={loading} color="healthy"  />
          </div>

          {/* ── Table card ── */}
          <div className="projects-table-card">

            {/* Toolbar */}
            <div className="projects-toolbar">
              <div className="projects-filters">
                {FILTERS.map(f => (
                  <button
                    key={f.id}
                    className={`proj-filter-chip${filter === f.id ? ' proj-filter-chip--active' : ''}`}
                    onClick={() => { setFilter(f.id); setPage(1); }}
                    aria-pressed={filter === f.id}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="projects-toolbar-right">
                <div className="projects-search">
                  <span className="projects-search__icon"><IconSearch /></span>
                  <input
                    type="search"
                    className="projects-search__input"
                    placeholder="Buscar projeto..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    aria-label="Buscar projeto"
                  />
                </div>
                <button className="projects-btn-new">
                  <IconPlus /> Novo Projeto
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="projects-table-wrap" role="region" aria-label="Lista de projetos">
              <table className="projects-table">
                <thead>
                  <tr>
                    {COLUMNS.map(col => (
                      <th
                        key={col.id}
                        className={`projects-th${col.sortable ? ' projects-th--sortable' : ''}${sortField === col.id ? ' projects-th--sorted' : ''}`}
                        onClick={col.sortable ? () => handleSort(col.id) : undefined}
                        aria-sort={col.sortable && sortField === col.id ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                      >
                        {col.label}
                        {col.sortable && <SortIcon field={col.id} sortField={sortField} sortDir={sortDir} />}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="projects-tr projects-tr--skeleton">
                        {COLUMNS.map(c => (
                          <td key={c.id} className="projects-td">
                            <div className="proj-skel" style={{ width: c.id === 'name' ? '140px' : c.id === 'actions' ? '24px' : '80px' }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={COLUMNS.length} className="projects-td--empty">
                        <EmptyState
                          icon={<IconFolder />}
                          title="Nenhum projeto encontrado"
                          description={search ? `Sem resultados para "${search}".` : 'Conecte um repositório GitHub para começar.'}
                          action={!search ? { label: '+ Novo projeto', onClick: () => {} } : null}
                        />
                      </td>
                    </tr>
                  ) : (
                    paginated.map((project, i) => {
                      const level = getLevel(project.riskScore);
                      return (
                        <tr
                          key={project.id}
                          className="projects-tr"
                          style={{ animationDelay: `${i * 30}ms` }}
                          onClick={() => onNavigate?.('project-detail', project)}
                          tabIndex={0}
                          onKeyDown={e => e.key === 'Enter' && onNavigate?.('project-detail', project)}
                        >
                          {/* Project name */}
                          <td className="projects-td projects-td--name">
                            <span className="proj-repo-icon"><IconGitHub /></span>
                            <div className="proj-name-block">
                              <span className="proj-name">{project.name}</span>
                              <span className="proj-repo">{project.repo}</span>
                            </div>
                          </td>

                          {/* Risk Score */}
                          <td className="projects-td projects-td--score">
                            <span className={`proj-score proj-score--${level}`}>{project.riskScore}</span>
                          </td>

                          {/* Trend */}
                          <td className="projects-td">
                            <TrendCell trend={project.trend} />
                          </td>

                          {/* Classification */}
                          <td className="projects-td">
                            <RiskBadge level={level} />
                          </td>

                          {/* Last analysis */}
                          <td className="projects-td projects-td--analysis">
                            <span className="proj-analysis">{project.lastAnalysis}</span>
                            {project.alertCount > 0 && (
                              <span className="proj-alert-pill">{project.alertCount}</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="projects-td projects-td--actions" onClick={e => e.stopPropagation()}>
                            <div className="proj-menu-wrap">
                              <button
                                className="proj-menu-btn"
                                onClick={() => setOpenMenu(openMenu === project.id ? null : project.id)}
                                aria-label="Ações do projeto"
                                aria-expanded={openMenu === project.id}
                              >
                                <IconDots />
                              </button>
                              {openMenu === project.id && (
                                <>
                                  <div className="proj-menu-overlay" onClick={() => setOpenMenu(null)} />
                                  <div className="proj-menu-dropdown" role="menu">
                                    <button className="proj-menu-item" onClick={() => { onNavigate?.('project-detail', project); setOpenMenu(null); }}>
                                      Ver detalhes
                                    </button>
                                    <button className="proj-menu-item" onClick={() => setOpenMenu(null)}>
                                      Executar análise
                                    </button>
                                    <button className="proj-menu-item" onClick={() => setOpenMenu(null)}>
                                      Configurar pesos
                                    </button>
                                    <div className="proj-menu-divider" />
                                    <button className="proj-menu-item proj-menu-item--danger" onClick={() => setOpenMenu(null)}>
                                      Remover projeto
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && filtered.length > 0 && (
              <div className="projects-pagination">
                <span className="projects-pagination__info">
                  {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} de {filtered.length}
                </span>
                <div className="projects-pagination__controls">
                  <button
                    className="projects-pagination__btn"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    aria-label="Página anterior"
                  >
                    ← Anterior
                  </button>
                  <button
                    className="projects-pagination__btn"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    aria-label="Próxima página"
                  >
                    Próximo →
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default ProjectsPage;
