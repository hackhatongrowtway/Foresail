/**
 * services/projectsService.js
 * API calls for projects resource — GET /api/v1/projects
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

/**
 * Returns Authorization header if JWT token is in localStorage.
 */
function authHeaders() {
  const token = localStorage.getItem('foresail_token');
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

/**
 * Fetch all projects for the authenticated org, sorted by risk_score DESC.
 * @returns {Promise<Array>} list of project objects
 */
export async function fetchProjects() {
  const res = await fetch(`${BASE_URL}/projects`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Erro ao buscar projetos.' }));
    throw new Error(error.detail ?? `HTTP ${res.status}`);
  }

  return res.json();
}

/**
 * Fetch a single project with timeline, signals and top 3 alerts.
 * @param {string} projectId
 * @returns {Promise<Object>}
 */
export async function fetchProject(projectId) {
  const res = await fetch(`${BASE_URL}/projects/${projectId}`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Projeto não encontrado.' }));
    throw new Error(error.detail ?? `HTTP ${res.status}`);
  }

  return res.json();
}

/**
 * Create a new project.
 * @param {{ name: string, github_repo: string, jira_project_key?: string }} payload
 * @returns {Promise<Object>} created project
 */
export async function createProject(payload) {
  const res = await fetch(`${BASE_URL}/projects`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Erro ao criar projeto.' }));
    throw new Error(error.detail ?? `HTTP ${res.status}`);
  }

  return res.json();
}
