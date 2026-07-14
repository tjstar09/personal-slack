/**
 * GITHUB URL DETECTION & ACTION LINK BUILDER — Personal Slack v1.0
 *
 * =====================================================================
 * PURPOSE
 * =====================================================================
 * Parses GitHub repository URLs from message text and generates a
 * structured set of action links organized by purpose: formats, work,
 * tracking, and API.
 *
 * This powers the GitHub action panels that appear below messages
 * containing GitHub repo links.
 *
 * =====================================================================
 * URL FORMAT SUPPORTED
 * =====================================================================
 * We handle the three canonical GitHub URL formats:
 *
 *   1. HTTPS web:      https://github.com/owner/repo
 *   2. SSH clone:      git@github.com:owner/repo
 *   3. SSH URL:        ssh://git@github.com/owner/repo
 *
 * Each is normalized to owner/repo pair for URL generation.
 * Dots, .git suffix, query params, and fragments are stripped.
 *
 * WHY THREE FORMATS:
 *   Users paste from different contexts — README files (HTTPS),
 *   terminal (SSH), migration docs (SSH URL). Catching all three
 *   maximizes link detection without requiring users to normalize.
 *
 * =====================================================================
 * ACTION LINK ORGANIZATION
 * =====================================================================
 * Links are grouped to match real GitHub workflow:
 *   formats — How to get the code (web, clone HTTPS, clone SSH, ZIP)
 *   work     — CI and automation (Actions, new workflow, runners)
 *   tracking — Issues, PRs, commits, releases, insights
 *   api      — REST API endpoints for automation scripts
 *
 * Each group is rendered as a labeled row of buttons in GitHubRepoPanel.
 */

export interface GitHubRepoInfo {
  owner: string;
  repo: string;
  repoName: string; // "owner/repo" — used as display label and URL path
}

export interface GitHubActionLink {
  group: 'formats' | 'work' | 'tracking' | 'api';
  label: string;
  url: string;
  displayUrl?: string; // For SSH clone where we show the scp-style URL
}

/**
 * Strip .git suffix and fragment/query from a repo string for normalization.
 */
const cleanRepo = (repo: string) => repo.replace(/\.git$/i, '').replace(/[?#].*$/, '');

/**
 * Validate owner/repo pairs against GitHub's naming rules.
 * Returns undefined if invalid (prevents generating broken URLs).
 */
const normalizeRepo = (owner?: string, repo?: string): GitHubRepoInfo | undefined => {
  if (!owner || !repo) return undefined;
  const cleanOwner = owner.trim();
  const cleanRepoName = cleanRepo(repo.trim());
  // GitHub allows: letters, numbers, hyphens, underscores, dots
  if (!/^[a-zA-Z0-9_.-]+$/.test(cleanOwner) || !/^[a-zA-Z0-9_.-]+$/.test(cleanRepoName)) return undefined;

  return {
    owner: cleanOwner,
    repo: cleanRepoName,
    repoName: `${cleanOwner}/${cleanRepoName}`,
  };
};

/**
 * Try to parse a single GitHub repo URL/string into structured info.
 * Tests against the three known formats (HTTPS, SSH, SSH URL).
 */
export const parseGitHubRepo = (value: string) => {
  const trimmed = value.trim();
  const webMatch = trimmed.match(/(?:https?:\/\/)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)(?:\.git)?/i);
  if (webMatch) return normalizeRepo(webMatch[1], webMatch[2]);

  const sshMatch = trimmed.match(/git@github\.com:([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)(?:\.git)?/i);
  if (sshMatch) return normalizeRepo(sshMatch[1], sshMatch[2]);

  const sshUrlMatch = trimmed.match(/ssh:\/\/git@github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)(?:\.git)?/i);
  if (sshUrlMatch) return normalizeRepo(sshUrlMatch[1], sshUrlMatch[2]);

  return undefined;
};

/**
 * Scan a text for all GitHub repository URLs.
 * Matches from message bodies — runs on every message render.
 * Deduplicates by lowercase repo name so the same repo (in different
 * URL forms) only shows once.
 */
export const findGitHubRepos = (text: string) => {
  const candidates = [
    ...text.matchAll(/(?:https?:\/\/)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(?:\.git)?/gi),
    ...text.matchAll(/git@github\.com:[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(?:\.git)?/gi),
    ...text.matchAll(/ssh:\/\/git@github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(?:\.git)?/gi),
  ];
  const repos = candidates
    .map((match) => parseGitHubRepo(match[0]))
    .filter((repo): repo is GitHubRepoInfo => Boolean(repo));
  // Deduplicate by lowercase repoName
  const unique = new Map(repos.map((repo) => [repo.repoName.toLowerCase(), repo]));
  return [...unique.values()];
};

/**
 * Generate the full set of action URLs for a given repo.
 * Organized by functional group for the UI panel.
 *
 * WHY THESE SPECIFIC LINKS:
 *   Each was chosen based on real GitHub workflow patterns:
 *
 * formats — Most common first-click actions
 *   Web: canonical page
 *   Clone HTTPS: for git clone in terminals
 *   Clone SSH: for SSH-authenticated users (shows scp-style URL)
 *   ZIP: quick download without git
 *
 * work — GitHub Actions workflows
 *   Actions: main workflow runs page
 *   New Workflow: create a new workflow file
 *   Runners: self-hosted runner configuration
 *
 * tracking — Code exploration and collaboration
 *   Issues, PRs, Compare, Commits, Releases, Insights
 *
 * api — REST API endpoints for automation
 *   Repo, Issues, Pulls, Releases endpoints
 *   Webhooks: repo settings → hooks (for webhook configuration)
 */
export const getGitHubActionLinks = ({ repoName }: GitHubRepoInfo): GitHubActionLink[] => {
  const repoPath = repoName;
  return [
    {
      group: 'formats',
      label: 'Web',
      url: `https://github.com/${repoPath}`,
    },
    {
      group: 'formats',
      label: 'Clone HTTPS',
      url: `https://github.com/${repoPath}.git`,
    },
    {
      group: 'formats',
      label: 'Clone SSH',
      url: `ssh://git@github.com/${repoPath}.git`,
      displayUrl: `git@github.com:${repoPath}.git`,
    },
    {
      group: 'formats',
      label: 'ZIP',
      url: `https://github.com/${repoPath}/archive/refs/heads/main.zip`,
    },
    {
      group: 'work',
      label: 'Actions',
      url: `https://github.com/${repoPath}/actions`,
    },
    {
      group: 'work',
      label: 'New Workflow',
      url: `https://github.com/${repoPath}/actions/new`,
    },
    {
      group: 'work',
      label: 'Runners',
      url: `https://github.com/${repoPath}/settings/actions/runners`,
    },
    {
      group: 'tracking',
      label: 'Issues',
      url: `https://github.com/${repoPath}/issues`,
    },
    {
      group: 'tracking',
      label: 'New Issue',
      url: `https://github.com/${repoPath}/issues/new`,
    },
    {
      group: 'tracking',
      label: 'Pull Requests',
      url: `https://github.com/${repoPath}/pulls`,
    },
    {
      group: 'tracking',
      label: 'Compare',
      url: `https://github.com/${repoPath}/compare`,
    },
    {
      group: 'tracking',
      label: 'Commits',
      url: `https://github.com/${repoPath}/commits`,
    },
    {
      group: 'tracking',
      label: 'Releases',
      url: `https://github.com/${repoPath}/releases`,
    },
    {
      group: 'tracking',
      label: 'Insights',
      url: `https://github.com/${repoPath}/pulse`,
    },
    {
      group: 'api',
      label: 'API Repo',
      url: `https://api.github.com/repos/${repoPath}`,
    },
    {
      group: 'api',
      label: 'API Issues',
      url: `https://api.github.com/repos/${repoPath}/issues`,
    },
    {
      group: 'api',
      label: 'API Pulls',
      url: `https://api.github.com/repos/${repoPath}/pulls`,
    },
    {
      group: 'api',
      label: 'API Releases',
      url: `https://api.github.com/repos/${repoPath}/releases`,
    },
    {
      group: 'api',
      label: 'Webhooks',
      url: `https://github.com/${repoPath}/settings/hooks`,
    },
  ];
};