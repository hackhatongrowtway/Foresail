/**
 * pages/Settings/Settings.jsx
 * S5-01 — Configuração de pesos, presets e limiares por projeto.
 */
import React, { useState, useCallback } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Topbar  from '../../components/Topbar/Topbar';
import './Settings.css';

const TABS = [
  { id: 'weights',  label: 'Pesos & Scoring' },
  { id: 'presets',  label: 'Presets'          },
  { id: 'thresholds', label: 'Limiares'       },
  { id: 'notifications', label: 'Notificações'},
];

const SIGNALS = [
  { key: 'pr_review_gap',        label: 'PRs sem revisão',      icon: '🔀', description: 'PRs aguardando review por mais de 48h'  },
  { key: 'stale_issues_ratio',   label: 'Issues paradas',       icon: '🐛', description: 'Issues sem atualização há mais de 7 dias' },
  { key: 'commit_velocity_drop', label: 'Queda de commits',     icon: '📉', description: 'Redução no volume de commits vs. semana passada' },
  { key: 'sprint_velocity',      label: 'Velocidade de sprint', icon: '⚡', description: 'Taxa de entrega de pontos por sprint'    },
  { key: 'urgency_language',     label: 'Linguagem de urgência',icon: '⚠️', description: 'Frequência de termos críticos em comentários' },
];

const DEFAULT_WEIGHTS = {
  pr_review_gap: 30,
  stale_issues_ratio: 20,
  commit_velocity_drop: 25,
  sprint_velocity: 15,
  urgency_language: 10,
};

const MOCK_PRESETS = [
  { id: 'p1', name: 'Conservador', type: 'conservador', weights: { pr_review_gap: 20, stale_issues_ratio: 30, commit_velocity_drop: 20, sprint_velocity: 15, urgency_language: 15 } },
  { id: 'p2', name: 'Agressivo',   type: 'agressivo',   weights: { pr_review_gap: 35, stale_issues_ratio: 15, commit_velocity_drop: 30, sprint_velocity: 10, urgency_language: 10 } },
];

const MOCK_PROJECTS = [
  { id: '1', name: 'API Gateway — Produção'   },
  { id: '2', name: 'Auth Service — Produção'  },
  { id: '3', name: 'Mobile App — Homologação' },
];

function RangeSlider({ value, onChange, label, description, icon, disabled }) {
  const pct = value;
  const color = pct >= 30 ? 'var(--color-brand-primary)' : 'var(--color-border-strong)';

  return (
    <div className={`slider-row${disabled ? ' slider-row--disabled' : ''}`}>
      <div className="slider-row__info">
        <div className="slider-row__label-row">
          <span className="slider-row__icon">{icon}</span>
          <span className="slider-row__label">{label}</span>
          <span className="slider-row__value" style={{ color: pct > 0 ? color : 'var(--color-text-tertiary)' }}>
            {value}%
          </span>
        </div>
        <p className="slider-row__desc">{description}</p>
      </div>
      <div className="slider-row__control">
        <span className="slider-row__tick">0</span>
        <div className="slider-track-wrap">
          <div
            className="slider-fill"
            style={{ width: `${pct}%`, background: color }}
          />
          <input
            type="range" min="0" max="60" step="1"
            value={value}
            onChange={e => onChange(parseInt(e.target.value, 10))}
            disabled={disabled}
            className="slider-input"
            aria-label={label}
          />
        </div>
        <span className="slider-row__tick">60</span>
      </div>
    </div>
  );
}

function WeightsTab() {
  const [projectId, setProjectId] = useState('1');
  const [weights,   setWeights]   = useState({ ...DEFAULT_WEIGHTS });
  const [saved,     setSaved]     = useState(false);
  const [saveLabel, setSaveLabel] = useState('');
  const [showSaveAs, setShowSaveAs] = useState(false);
  const [presetName, setPresetName] = useState('');

  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  const valid = total === 100;

  function handleChange(key, val) {
    setSaved(false);
    setWeights(prev => ({ ...prev, [key]: val }));
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="tab-content">
      <div className="weights-header">
        <div className="form-group" style={{ maxWidth: 280 }}>
          <label className="form-label-sm">Projeto</label>
          <select className="form-select" value={projectId} onChange={e => setProjectId(e.target.value)}>
            {MOCK_PROJECTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className={`total-pill total-pill--${valid ? 'valid' : 'invalid'}`}>
          Total: <strong>{total}%</strong>
          {!valid && <span className="total-hint"> (deve ser 100%)</span>}
        </div>
      </div>

      <div className="sliders-list">
        {SIGNALS.map(s => (
          <RangeSlider
            key={s.key}
            value={weights[s.key]}
            onChange={v => handleChange(s.key, v)}
            label={s.label}
            description={s.description}
            icon={s.icon}
          />
        ))}
      </div>

      <div className="weights-actions">
        <button className="btn-ghost" onClick={() => setShowSaveAs(true)}>
          Salvar como preset
        </button>
        <button className="btn-primary" onClick={handleSave} disabled={!valid}>
          {saved ? '✓ Salvo!' : 'Aplicar pesos'}
        </button>
      </div>

      {showSaveAs && (
        <div className="save-as-panel">
          <input
            className="form-input-sm"
            placeholder="Nome do preset (ex: Sprint agressivo)"
            value={presetName}
            onChange={e => setPresetName(e.target.value)}
          />
          <button
            className="btn-primary"
            disabled={!presetName.trim()}
            onClick={() => { setShowSaveAs(false); setPresetName(''); }}
          >
            Salvar
          </button>
          <button className="btn-ghost" onClick={() => setShowSaveAs(false)}>Cancelar</button>
        </div>
      )}
    </div>
  );
}

function PresetsTab() {
  const [presets, setPresets] = useState(MOCK_PRESETS);
  const [applied, setApplied] = useState(null);

  function applyPreset(id) {
    setApplied(id);
    setTimeout(() => setApplied(null), 2000);
  }

  function removePreset(id) {
    setPresets(prev => prev.filter(p => p.id !== id));
  }

  const typeLabel = { conservador: 'Conservador', agressivo: 'Agressivo', custom: 'Personalizado' };

  return (
    <div className="tab-content">
      {presets.length === 0 ? (
        <div className="empty-presets">
          <span style={{ fontSize: 32 }}>📋</span>
          <p>Nenhum preset salvo. Configure pesos na aba "Pesos & Scoring" e salve como preset.</p>
        </div>
      ) : (
        <div className="presets-list">
          {presets.map(p => (
            <div className="preset-card" key={p.id}>
              <div className="preset-card__header">
                <span className="preset-card__name">{p.name}</span>
                <span className={`preset-type-tag preset-type-tag--${p.type}`}>{typeLabel[p.type] || p.type}</span>
              </div>
              <div className="preset-card__bars">
                {SIGNALS.map(s => (
                  <div className="preset-bar-row" key={s.key}>
                    <span className="preset-bar-label">{s.icon} {s.label}</span>
                    <div className="preset-bar-track">
                      <div className="preset-bar-fill" style={{ width: `${(p.weights[s.key] / 60) * 100}%` }} />
                    </div>
                    <span className="preset-bar-value">{p.weights[s.key]}%</span>
                  </div>
                ))}
              </div>
              <div className="preset-card__actions">
                <button
                  className="btn-primary btn-sm"
                  onClick={() => applyPreset(p.id)}
                >
                  {applied === p.id ? '✓ Aplicado!' : 'Aplicar'}
                </button>
                <button className="btn-ghost btn-sm" onClick={() => removePreset(p.id)}>
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ThresholdsTab() {
  const [thresholds, setThresholds] = useState({ high: 80, medium: 60, low: 30 });
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="tab-content">
      <p className="tab-description">
        Defina os limiares de Risk Score que disparam notificações automáticas.
        O sistema alertará quando um projeto cruzar cada nível.
      </p>
      <div className="thresholds-list">
        {[
          { key: 'high',   label: 'Crítico',  color: 'var(--color-risk-critical)',  desc: 'Notificação urgente — ação imediata necessária' },
          { key: 'medium', label: 'Em Risco', color: 'var(--color-risk-warning)',   desc: 'Alerta de atenção — monitorar de perto' },
          { key: 'low',    label: 'Atenção',  color: 'var(--color-risk-attention)', desc: 'Notificação informativa' },
        ].map(t => (
          <div className="threshold-row" key={t.key}>
            <div className="threshold-row__info">
              <span className="threshold-dot" style={{ background: t.color }} />
              <div>
                <span className="threshold-label">{t.label}</span>
                <span className="threshold-desc">{t.desc}</span>
              </div>
            </div>
            <div className="threshold-input-wrap">
              <span className="threshold-prefix">Score ≥</span>
              <input
                type="number" min="0" max="100" step="1"
                className="threshold-input"
                value={thresholds[t.key]}
                onChange={e => setThresholds(prev => ({ ...prev, [t.key]: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) }))}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="weights-actions">
        <button className="btn-primary" onClick={handleSave}>
          {saved ? '✓ Salvo!' : 'Salvar limiares'}
        </button>
      </div>
    </div>
  );
}

function NotificationsTab() {
  const [slack, setSlack]     = useState(false);
  const [webhook, setWebhook] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  function testWebhook() {
    setTesting(true);
    setTimeout(() => {
      setTesting(false);
      setTestResult(webhook.includes('hooks.slack') ? 'success' : 'error');
      setTimeout(() => setTestResult(null), 3000);
    }, 1500);
  }

  return (
    <div className="tab-content">
      <div className="notif-section">
        <div className="notif-toggle-row">
          <div>
            <h3 className="notif-title">Notificações na interface</h3>
            <p className="notif-desc">Alertas exibidos no feed do dashboard quando score ultrapassa um limiar.</p>
          </div>
          <div className="toggle-track toggle-track--on">
            <span className="toggle-thumb" />
          </div>
        </div>
      </div>
      <div className="notif-section">
        <div className="notif-toggle-row">
          <div>
            <h3 className="notif-title">Slack</h3>
            <p className="notif-desc">Envie alertas para um canal do Slack via webhook.</p>
          </div>
          <button
            className={`toggle-track${slack ? ' toggle-track--on' : ''}`}
            onClick={() => setSlack(v => !v)}
            role="switch" aria-checked={slack}
          >
            <span className="toggle-thumb" />
          </button>
        </div>
        {slack && (
          <div className="notif-webhook">
            <div className="form-group">
              <label className="form-label-sm">URL do Webhook</label>
              <div className="webhook-row">
                <input
                  className="form-input"
                  type="url"
                  placeholder="https://hooks.slack.com/services/..."
                  value={webhook}
                  onChange={e => { setWebhook(e.target.value); setTestResult(null); }}
                />
                <button
                  className="btn-secondary"
                  onClick={testWebhook}
                  disabled={!webhook || testing}
                >
                  {testing ? 'Testando...' : 'Testar'}
                </button>
              </div>
              {testResult === 'success' && <div className="form-feedback form-feedback--success" style={{ marginTop: 8 }}>✓ Mensagem de teste enviada com sucesso.</div>}
              {testResult === 'error'   && <div className="form-feedback form-feedback--error"   style={{ marginTop: 8 }}>✕ Falha ao enviar. Verifique a URL do webhook.</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Settings({ user, theme, onToggleTheme, onNavigate, onLogout }) {
  const [activeTab, setActiveTab] = useState('weights');

  const tabContent = {
    weights:       <WeightsTab />,
    presets:       <PresetsTab />,
    thresholds:    <ThresholdsTab />,
    notifications: <NotificationsTab />,
  };

  return (
    <div className="settings-shell" data-theme={theme}>
      <Sidebar activePage="settings" onNavigate={onNavigate} user={user} />
      <div className="settings-main">
        <Topbar
          title="Configurações"
          subtitle="Pesos, presets, limiares e notificações"
          theme={theme} onToggleTheme={onToggleTheme}
          user={user} onLogout={onLogout}
        />
        <div className="settings-content">
          <div className="settings-tabs">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`settings-tab${activeTab === t.id ? ' settings-tab--active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="settings-panel">
            {tabContent[activeTab]}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
