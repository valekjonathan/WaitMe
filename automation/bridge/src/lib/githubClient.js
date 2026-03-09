/**
 * Cliente para GitHub API.
 * Obtiene contenido de archivos del repo (docs/, devcontext/).
 */
import { info, warn } from './logger.js';

const GITHUB_API = 'https://api.github.com';

export async function fetchFileContent(owner, repo, path, token) {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`;
  const headers = {
    Accept: 'application/vnd.github.raw',
    'User-Agent': 'waitme-automation-bridge',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      if (res.status === 404) return null;
      warn('fetchFileContent', path, res.status, res.statusText);
      return null;
    }
    return await res.text();
  } catch (err) {
    warn('fetchFileContent error', path, err?.message);
    return null;
  }
}

export async function getFileMetadata(owner, repo, path, token) {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`;
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'waitme-automation-bridge',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    const json = await res.json();
    return { size: json.size, sha: json.sha };
  } catch {
    return null;
  }
}

export async function getLatestCommit(owner, repo, branch, token) {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/commits/${branch || 'main'}?per_page=1`;
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'waitme-automation-bridge',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    const [commit] = await res.json();
    return commit
      ? {
          sha: commit.sha?.slice(0, 7),
          message: commit.commit?.message?.split('\n')[0],
          author: commit.commit?.author?.name,
          date: commit.commit?.author?.date,
        }
      : null;
  } catch (err) {
    warn('getLatestCommit error', err?.message);
    return null;
  }
}
