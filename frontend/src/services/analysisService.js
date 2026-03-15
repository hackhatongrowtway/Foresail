/**
 * services/analysisService.js
 * API calls for ingestion runs and analysis history.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

function authHeaders() {
  const token = localStorage.getItem('foresail_token');
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

/**
 * Fetch ingestion runs for a project.
 * @param {string} projectId
 * @returns {Promise<Array>}
 */
export async function fetchIngestionRuns(projectId) {
  const res = await fetch(`${BASE_URL}/ingestion/${projectId}/runs`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Erro ao buscar ingestões.' }));
    throw new Error(error.detail ?? `HTTP ${res.status}`);
  }

  return res.json();
}

/**
 * Trigger a new ingestion run.
 * @param {string} projectId
 * @param {{ source: 'github'|'jira'|'all', since?: string, until?: string }} options
 * @returns {Promise<{ run_id: string }>}
 */
export async function triggerIngestion(projectId, options = { source: 'all' }) {
  const res = await fetch(`${BASE_URL}/ingestion/${projectId}/run`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(options),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Erro ao iniciar ingestão.' }));
    throw new Error(error.detail ?? `HTTP ${res.status}`);
  }

  return res.json();
}
