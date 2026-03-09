/**
 * Lector de contexto del repo WaitMe.
 * Lee docs/ y devcontext/ desde GitHub API y construye objeto JSON estructurado.
 */
import { fetchFileContent, getFileMetadata, getLatestCommit } from './githubClient.js';
import { info } from './logger.js';

const DOC_FILES = [
  'docs/CURSOR_LAST_RESPONSE.md',
  'docs/DEV_STATUS.md',
  'docs/AUTH_STATUS.md',
  'docs/IOS_RUNTIME_STATUS.md',
  'docs/HOME_STATUS.md',
  'docs/MAP_STATUS.md',
  'docs/LIVE_CONTEXT_SUMMARY.md',
];

const DEVCONTEXT_FILES = [
  'devcontext/waitme-live-context.zip',
  'devcontext/latest-simulator.png',
  'devcontext/latest-simulator-after-login.png',
  'devcontext/latest-auth-log.txt',
  'devcontext/latest-runtime-log.txt',
  'devcontext/latest-ios-refresh-log.txt',
  'devcontext/project-tree.txt',
];

function extractSection(content, title) {
  if (!content) return null;
  const lines = content.split('\n');
  const result = [];
  let capturing = false;
  for (const line of lines) {
    if (line.startsWith('## ') && line.includes(title)) {
      capturing = true;
      continue;
    }
    if (capturing && line.startsWith('## ')) break;
    if (capturing) result.push(line);
  }
  return result.length ? result.join('\n').trim() : null;
}

function parseDocForStatus(content, docName) {
  if (!content) return { found: false };
  const firstLines = content.split('\n').slice(0, 30).join('\n');
  return {
    found: true,
    preview: firstLines.slice(0, 500),
  };
}

export async function readContext(owner, repo, branch = 'main', token) {
  info('readContext', owner, repo, branch);

  const docsStatus = {};
  for (const path of DOC_FILES) {
    const content = await fetchFileContent(owner, repo, path, token);
    const name = path.replace('docs/', '').replace('.md', '');
    docsStatus[name] = parseDocForStatus(content, name);
  }

  const authStatus = docsStatus.AUTH_STATUS?.preview || null;
  const iosStatus = docsStatus.IOS_RUNTIME_STATUS?.preview || null;
  const homeStatus = docsStatus.HOME_STATUS?.preview || null;
  const mapStatus = docsStatus.MAP_STATUS?.preview || null;

  const artifactPaths = [];
  for (const path of DEVCONTEXT_FILES) {
    const meta = await getFileMetadata(owner, repo, path, token);
    artifactPaths.push({
      path,
      exists: meta !== null,
      size: meta?.size ?? 0,
    });
  }

  const lastCommit = await getLatestCommit(owner, repo, branch, token);

  const lastUpdated =
    docsStatus.DEV_STATUS?.preview?.match(/\*\*Última actualización:\*\* ([^\n]+)/)?.[1] ||
    lastCommit?.date ||
    null;

  return {
    repo: `${owner}/${repo}`,
    branch,
    last_commit: lastCommit,
    docs_status: docsStatus,
    auth_status: authStatus,
    ios_status: iosStatus,
    home_status: homeStatus,
    map_status: mapStatus,
    artifact_paths: artifactPaths,
    last_updated: lastUpdated,
    fetched_at: new Date().toISOString(),
  };
}
