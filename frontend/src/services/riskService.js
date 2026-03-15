/**
 * services/riskService.js
 * API calls for risk scores, alerts and scoring engine.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

function authHeaders() {
  const token = localStorage.getItem('foresail_token');
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

/**
 * Fetch the latest risk score + alerts for a project.
 * @param {string} projectId
 * @returns {Promise<{ score: number, classification: string, is_estimated: boolean, alerts: Array }>}
 */
export async function fetchRiskScore(projectId) {
  const res = await fetch(`${BASE_URL}/scoring/${projectId}/history?limit=1`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Erro ao buscar score.' }));
    throw new Error(error.detail ?? `HTTP ${res.status}`);
  }

  return res.json();
}

/**
 * Trigger a new scoring run for a project.
 * @param {string} projectId
 * @returns {Promise<Object>} new RiskScore object
 */
export async function runScoring(projectId) {
  const res = await fetch(`${BASE_URL}/scoring/${projectId}/run`, {
    method: 'POST',
    headers: authHeaders(),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Erro ao executar análise.' }));
    throw new Error(error.detail ?? `HTTP ${res.status}`);
  }

  return res.json();
}

/**
 * Fetch all recent alerts across all projects (for dashboard feed).
 * @returns {Promise<Array>}
 */
export async function fetchRecentAlerts() {
  const res = await fetch(`${BASE_URL}/risks/recent`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Erro ao buscar alertas.' }));
    throw new Error(error.detail ?? `HTTP ${res.status}`);
  }

  return res.json();
}
