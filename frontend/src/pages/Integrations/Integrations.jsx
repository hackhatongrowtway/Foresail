/**
 * pages/Integrations/Integrations.jsx
 * S1-03 — Painel de conexões GitHub e Jira com status, teste e revogação.
 */
import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Topbar  from '../../components/Topbar/Topbar';
import './Integrations.css';

const MOCK_INTEGRATIONS = [
  {
    id: 'gh-1', type: 'github', label: 'GitHub',
    account: 'acme-corp', status: 'active',
    connectedAt: '10/03/2025', repos: 12,
  },
  {
    id: 'jr-1', type: 'jira', label: 'Jira',
    account: 'cloud.acme.atlassian.net', status: 'active',
    connectedAt: '10/03/2025', projects: 7,
  },
];

const GitHubLogo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z"/>
  </svg>
);

const JiraLogo = () => (
  <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
    <path d="M16.483 5.6 9.6 16l6.883 10.4L23.366 16 16.483 5.6Z" fill="#2684FF"/>
    <path d="M9.6 16 5 22.4h7.133L16 16H9.6Z" fill="#0052CC"/>
    <path d="M23.366 16H16.96l3.867 6.4H27.97L23.366 16Z" fill="#0052CC"/>
  </svg>
);

function IntegrationCard({ integration, onRevoke }) {
  const [revoking, setRevoking] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function handleRevoke() {
    setRevoking(true);
    setTimeout(() => {
      onRevoke(integration.id);
    }, 1200);
  }

  return (
    <div className={`int-card${revoking ? ' int-card--revoking' : ''}`}>
      <div className="int-card__logo int-card__logo--github" style={integration.type === 'jira' ? { background: '#0052CC' } : {}}>
        {integration.type === 'github' ? <GitHubLogo /> : <JiraLogo />}
      </div>
      <div className="int-card__body">
        <div className="int-card__top">
          <div>
            <h3 className="int-card__name">{integration.label}</h3>
            <p className="int-card__account">{integration.account}</p>
          </div>
          <span className={`int-card__status int-card__status--${integration.status}`}>
            <span className="int-card__status-dot" />
            {integration.status === 'active' ? 'Ativo' : 'Revogado'}
          </span>
        </div>
        <div className="int-card__meta">
          <span>Conectado em {integration.connectedAt}</span>
          {integration.repos   && <span>·</span>}
          {integration.repos   && <span>{integration.repos} repositórios</span>}
          {integration.projects && <span>·</span>}
          {integration.projects && <span>{integration.projects} projetos</span>}
        </div>
        {!showConfirm ? (
          <div className="int-card__actions">
            <button className="btn-ghost-sm" onClick={() => setShowConfirm(true)}>
              <svg width="13" height="13" fill="none"><path d="M9 3H5a2 2 0 0 0-2 2v8l3-2 2 2 2-2 3 2V5a2 2 0 0 0-2-2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
              Revogar acesso
            </button>
          </div>
        ) : (
          <div className="int-card__confirm">
            <span className="int-card__confirm-text">Confirmar revogação?</span>
            <button className="btn-danger-sm" disabled={revoking} onClick={handleRevoke}>
              {revoking ? 'Revogando...' : 'Sim, revogar'}
            </button>
            <button className="btn-ghost-sm" onClick={() => setShowConfirm(false)}>Cancelar</button>
          </div>
        )}
      </div>
    </div>
  );
}

function JiraForm({ onConnect }) {
  const [url,    setUrl]    = useState('');
  const [email,  setEmail]  = useState('');
  const [token,  setToken]  = useState('');
  const [status, setStatus] = useState(null); // null | 'loading' | 'success' | 'error'

  function handleTest(e) {
    e.preventDefault();
    if (!url || !email || !token) return;
    setStatus('loading');
    setTimeout(() => {
      setStatus(url.includes('atlassian') ? 'success' : 'error');
    }, 1500);
  }

  function handleConnect() {
    onConnect({ url, email });
  }

  return (
    <form className="jira-form" onSubmit={handleTest}>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">URL do Jira <span className="required">*</span></label>
          <input
            className="form-input" type="url"
            placeholder="https://sua-empresa.atlassian.net"
            value={url} onChange={e => { setUrl(e.target.value); setStatus(null); }}
          />
        </div>
        <div className="form-group">
          <label className="form-label">E-mail <span className="required">*</span></label>
          <input
            className="form-input" type="email"
            placeholder="seu@email.com"
            value={email} onChange={e => { setEmail(e.target.value); setStatus(null); }}
          />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">API Token <span className="required">*</span></label>
        <input
          className="form-input" type="password"
          placeholder="••••••••••••••••"
          value={token} onChange={e => { setToken(e.target.value); setStatus(null); }}
        />
        <span className="form-hint">
          Gere em{' '}
          <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noopener noreferrer">
            id.atlassian.com
          </a>
        </span>
      </div>

      {status === 'success' && (
        <div className="form-feedback form-feedback--success">
          <svg width="14" height="14" fill="none"><path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Conexão validada com sucesso! Projetos disponíveis para seleção.
        </div>
      )}
      {status === 'error' && (
        <div className="form-feedback form-feedback--error">
          <svg width="14" height="14" fill="none"><path d="M7 4v4M7 10h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/></svg>
          Não foi possível conectar. Verifique a URL e o token.
        </div>
      )}

      <div className="form-actions">
        <button className="btn-secondary" type="submit" disabled={status === 'loading' || !url || !email || !token}>
          {status === 'loading' ? (
            <><svg className="btn-spin" width="13" height="13" viewBox="0 0 13 13"><circle cx="6.5" cy="6.5" r="4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="18" strokeDashoffset="13"/></svg> Testando...</>
          ) : 'Testar conexão'}
        </button>
        {status === 'success' && (
          <button className="btn-primary" type="button" onClick={handleConnect}>
            Salvar integração →
          </button>
        )}
      </div>
    </form>
  );
}

function Integrations({ user, theme, onToggleTheme, onNavigate, onLogout }) {
  const [integrations, setIntegrations] = useState(MOCK_INTEGRATIONS);
  const [showJiraForm, setShowJiraForm] = useState(false);
  const [toast, setToast] = useState(null);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function handleRevoke(id) {
    setIntegrations(prev => prev.filter(i => i.id !== id));
    showToast('Integração revogada com sucesso.');
  }

  function handleGitHubConnect() {
    showToast('Redirecionando para autorização GitHub...', 'info');
    // TODO: window.location.href = '/api/v1/auth/github'
  }

  function handleJiraConnect({ url, email }) {
    const newInt = {
      id: 'jr-' + Date.now(), type: 'jira', label: 'Jira',
      account: new URL(url).hostname, status: 'active',
      connectedAt: new Date().toLocaleDateString('pt-BR'), projects: 0,
    };
    setIntegrations(prev => [...prev, newInt]);
    setShowJiraForm(false);
    showToast('Jira conectado com sucesso!');
  }

  const hasGitHub = integrations.some(i => i.type === 'github');
  const hasJira   = integrations.some(i => i.type === 'jira');

  return (
    <div className="int-shell" data-theme={theme}>
      <Sidebar activePage="integrations" onNavigate={onNavigate} user={user} />

      <div className="int-main">
        <Topbar
          title="Integrações"
          subtitle="Gerencie as conexões com GitHub e Jira"
          theme={theme} onToggleTheme={onToggleTheme}
          user={user} onLogout={onLogout}
        />

        <div className="int-content">

          {/* Active */}
          {integrations.length > 0 && (
            <section className="int-section">
              <h2 className="int-section__title">Integrações ativas</h2>
              <div className="int-cards">
                {integrations.map(i => (
                  <IntegrationCard key={i.id} integration={i} onRevoke={handleRevoke} />
                ))}
              </div>
            </section>
          )}

          {/* Connect new */}
          <section className="int-section">
            <h2 className="int-section__title">Conectar nova integração</h2>
            <div className="int-connect-grid">

              {/* GitHub */}
              <div className="connect-card">
                <div className="connect-card__header">
                  <div className="connect-card__logo">
                    <GitHubLogo />
                  </div>
                  <div>
                    <h3 className="connect-card__name">GitHub</h3>
                    <p className="connect-card__desc">Acesse repositórios e pull requests via OAuth</p>
                  </div>
                  {hasGitHub && <span className="connect-card__badge connect-card__badge--connected">Conectado</span>}
                </div>
                <ul className="connect-card__features">
                  <li>Commits, PRs e branches</li>
                  <li>Autenticação segura via OAuth 2.0</li>
                  <li>Acesso a repositórios públicos e privados</li>
                </ul>
                <button
                  className="btn-primary connect-card__btn"
                  onClick={handleGitHubConnect}
                  disabled={hasGitHub}
                >
                  {hasGitHub ? '✓ Já conectado' : (
                    <>
                      <GitHubLogo />
                      Conectar com GitHub
                    </>
                  )}
                </button>
              </div>

              {/* Jira */}
              <div className="connect-card">
                <div className="connect-card__header">
                  <div className="connect-card__logo connect-card__logo--jira">
                    <JiraLogo />
                  </div>
                  <div>
                    <h3 className="connect-card__name">Jira</h3>
                    <p className="connect-card__desc">Vincule issues, tickets e sprints aos projetos</p>
                  </div>
                  {hasJira && <span className="connect-card__badge connect-card__badge--connected">Conectado</span>}
                </div>
                <ul className="connect-card__features">
                  <li>Issues, status e comentários</li>
                  <li>Velocidade de sprint e carryover</li>
                  <li>Jira Cloud e Jira Server</li>
                </ul>
                {!showJiraForm ? (
                  <button
                    className="btn-primary connect-card__btn connect-card__btn--jira"
                    onClick={() => setShowJiraForm(true)}
                    disabled={hasJira}
                  >
                    {hasJira ? '✓ Já conectado' : 'Configurar Jira'}
                  </button>
                ) : (
                  <JiraForm onConnect={handleJiraConnect} />
                )}
              </div>

            </div>
          </section>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`int-toast int-toast--${toast.type}`}>
          {toast.type === 'success' && '✓ '}
          {toast.type === 'info'    && 'ℹ '}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

export default Integrations;
