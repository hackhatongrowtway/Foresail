/**
 * pages/IngestionPanel/IngestionPanel.jsx
 * S2-05 — Painel de ingestão com logs, status e reprocessamento.
 */
import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Topbar  from '../../components/Topbar/Topbar';
import './IngestionPanel.css';

const MOCK_RUNS = [
  { id: 'r1', project: 'API Gateway — Produção',    source: 'all',    status: 'success', startedAt: '14/03 14:30', duration: '48s',  events: 1240, errors: 0  },
  { id: 'r2', project: 'Auth Service — Produção',   source: 'github', status: 'success', startedAt: '14/03 11:15', duration: '31s',  events: 642,  errors: 0  },
  { id: 'r3', project: 'Mobile App — Homologação',  source: 'jira',   status: 'error',   startedAt: '14/03 09:00', duration: '12s',  events: 0,    errors: 3  },
  { id: 'r4', project: 'Payments Core — Dev',       source: 'all',    status: 'running', startedAt: '14/03 08:45', duration: '…',    events: 388,  errors: 0  },
  { id: 'r5', project: 'Notification Service',      source: 'github', status: 'success', startedAt: '13/03 22:10', duration: '27s',  events: 201,  errors: 0  },
  { id: 'r6', project: 'Analytics Pipeline — Dev',  source: 'all',    status: 'error',   startedAt: '13/03 20:55', duration: '8s',   events: 0,    errors: 1  },
];

const MOCK_LOGS = {
  r3: [
    { time: '09:00:12', level: 'INFO',  msg: 'Iniciando ingestão Jira para MOB' },
    { time: '09:00:13', level: 'INFO',  msg: 'Conectando em cloud.acme.atlassian.net' },
    { time: '09:00:15', level: 'ERROR', msg: 'HTTP 401 Unauthorized — token expirado ou inválido' },
    { time: '09:00:15', level: 'ERROR', msg: 'Tentativa 2/3: aguardando 2s...' },
    { time: '09:00:18', level: 'ERROR', msg: 'HTTP 401 Unauthorized — tentativa 2 falhou' },
    { time: '09:00:20', level: 'ERROR', msg: 'HTTP 401 Unauthorized — tentativa 3 falhou. Abortando.' },
    { time: '09:00:20', level: 'ERROR', msg: 'InvalidCredentialsError: verifique o API token do Jira nas Integrações.' },
  ],
  r6: [
    { time: '20:55:03', level: 'INFO',  msg: 'Iniciando ingestão GitHub para acme-corp/analytics-pipeline' },
    { time: '20:55:05', level: 'INFO',  msg: 'Buscando commits desde 07/03/2025' },
    { time: '20:55:07', level: 'ERROR', msg: 'HTTP 404 — repositório não encontrado ou sem acesso' },
    { time: '20:55:07', level: 'WARN',  msg: 'Verifique se o repositório foi renomeado ou se o token tem permissão "repo".' },
  ],
};

const STATUS_CONFIG = {
  success: { label: 'Concluído',   colorClass: 'status--success', icon: '✓'  },
  error:   { label: 'Erro',        colorClass: 'status--error',   icon: '✕'  },
  running: { label: 'Em progresso',colorClass: 'status--running', icon: null  },
};

const SOURCE_LABELS = { all: 'GitHub + Jira', github: 'GitHub', jira: 'Jira' };

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.success;
  return (
    <span className={`run-status ${cfg.colorClass}`}>
      {status === 'running' ? (
        <svg className="status-spin" width="10" height="10" viewBox="0 0 10 10">
          <circle cx="5" cy="5" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="14" strokeDashoffset="10"/>
        </svg>
      ) : (
        <span className="status-icon">{cfg.icon}</span>
      )}
      {cfg.label}
    </span>
  );
}

function LogsPanel({ runId, onClose }) {
  const logs = MOCK_LOGS[runId] || [];
  const [reprocessing, setReprocessing] = useState(false);
  const [done, setDone] = useState(false);

  function handleReprocess() {
    setReprocessing(true);
    setTimeout(() => { setReprocessing(false); setDone(true); }, 2000);
  }

  return (
    <div className="logs-panel">
      <div className="logs-panel__header">
        <h3 className="logs-panel__title">Logs da ingestão</h3>
        <div className="logs-panel__actions">
          {MOCK_RUNS.find(r => r.id === runId)?.status === 'error' && !done && (
            <button
              className="btn-primary btn-sm"
              onClick={handleReprocess}
              disabled={reprocessing}
            >
              {reprocessing
                ? <><svg className="btn-spin" width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="16" strokeDashoffset="12"/></svg> Reprocessando...</>
                : '↺ Reprocessar'}
            </button>
          )}
          {done && <span className="reprocess-ok">✓ Reprocessado com sucesso</span>}
          <button className="btn-icon-close" onClick={onClose} aria-label="Fechar logs">
            <svg width="14" height="14" fill="none"><line x1="2" y1="2" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="12" y1="2" x2="2" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>
      </div>
      <div className="logs-panel__body">
        {logs.length === 0 ? (
          <p className="logs-empty">Nenhum log disponível para este run.</p>
        ) : (
          logs.map((l, i) => (
            <div key={i} className={`log-line log-line--${l.level.toLowerCase()}`}>
              <span className="log-time">{l.time}</span>
              <span className="log-level">{l.level}</span>
              <span className="log-msg">{l.msg}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function IngestionPanel({ user, theme, onToggleTheme, onNavigate, onLogout }) {
  const [runs, setRuns] = useState(MOCK_RUNS);
  const [activeLog, setActiveLog] = useState(null);
  const [sourceFilter, setSourceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = runs.filter(r => {
    if (sourceFilter !== 'all' && r.source !== sourceFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    return true;
  });

  function handleDownloadCSV(runId) {
    const run = runs.find(r => r.id === runId);
    const logs = MOCK_LOGS[runId] || [];
    const csv = ['tempo,nível,mensagem', ...logs.map(l => `${l.time},${l.level},"${l.msg}"`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `foresail-ingestion-${runId}.csv`;
    a.click();
  }

  return (
    <div className="ingestion-shell" data-theme={theme}>
      <Sidebar activePage="ingestion" onNavigate={onNavigate} user={user} />

      <div className="ingestion-main">
        <Topbar
          title="Ingestão"
          subtitle="Histórico de coletas e reprocessamento"
          theme={theme} onToggleTheme={onToggleTheme}
          user={user} onLogout={onLogout}
        />

        <div className="ingestion-content">

          {/* Filters */}
          <div className="ingestion-filters">
            <div className="filter-group">
              <label className="filter-label">Fonte</label>
              <div className="filter-chips">
                {[['all','Todos'],['github','GitHub'],['jira','Jira']].map(([v,l]) => (
                  <button
                    key={v}
                    className={`f-chip${sourceFilter === v ? ' f-chip--active' : ''}`}
                    onClick={() => setSourceFilter(v)}
                  >{l}</button>
                ))}
              </div>
            </div>
            <div className="filter-group">
              <label className="filter-label">Status</label>
              <div className="filter-chips">
                {[['all','Todos'],['success','Concluídos'],['error','Com erro'],['running','Em andamento']].map(([v,l]) => (
                  <button
                    key={v}
                    className={`f-chip${statusFilter === v ? ' f-chip--active' : ''}`}
                    onClick={() => setStatusFilter(v)}
                  >{l}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="ingestion-layout">
            {/* Table */}
            <div className="ingestion-table-card">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Projeto</th>
                      <th>Fonte</th>
                      <th>Status</th>
                      <th>Início</th>
                      <th>Duração</th>
                      <th>Eventos</th>
                      <th>Erros</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={8} className="table-empty">Nenhuma ingestão encontrada.</td></tr>
                    ) : filtered.map(run => (
                      <tr
                        key={run.id}
                        className={activeLog === run.id ? 'tr-active' : ''}
                        onClick={() => setActiveLog(activeLog === run.id ? null : run.id)}
                      >
                        <td className="td-project">
                          <span className="run-project-name">{run.project}</span>
                        </td>
                        <td>
                          <span className="source-tag">{SOURCE_LABELS[run.source]}</span>
                        </td>
                        <td><StatusBadge status={run.status} /></td>
                        <td className="td-meta">{run.startedAt}</td>
                        <td className="td-meta">{run.duration}</td>
                        <td className="td-num">{run.events > 0 ? run.events.toLocaleString('pt-BR') : '—'}</td>
                        <td className={`td-num${run.errors > 0 ? ' td-errors' : ''}`}>{run.errors > 0 ? run.errors : '—'}</td>
                        <td className="td-actions" onClick={e => e.stopPropagation()}>
                          <div className="run-actions">
                            {run.errors > 0 && MOCK_LOGS[run.id] && (
                              <button
                                className="btn-icon"
                                title="Baixar CSV de erros"
                                onClick={() => handleDownloadCSV(run.id)}
                              >
                                <svg width="13" height="13" fill="none"><path d="M6.5 2v7M4 7l2.5 2.5L9 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 11h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                              </button>
                            )}
                            <button
                              className="btn-icon"
                              title="Ver logs"
                              onClick={() => setActiveLog(activeLog === run.id ? null : run.id)}
                            >
                              <svg width="13" height="13" fill="none"><rect x="1.5" y="2" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><line x1="4" y1="5" x2="9" y2="5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><line x1="4" y1="7.5" x2="7" y2="7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="table-footer">
                <span className="table-count">{filtered.length} de {runs.length} ingestões</span>
              </div>
            </div>

            {/* Logs panel */}
            {activeLog && (
              <LogsPanel
                runId={activeLog}
                onClose={() => setActiveLog(null)}
              />
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default IngestionPanel;
