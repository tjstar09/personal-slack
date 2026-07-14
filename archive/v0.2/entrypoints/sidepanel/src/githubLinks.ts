export interface GitHubRepoInfo {
  owner: string;
  repo: string;
  repoName: string;
}

export interface GitHubActionLink {
  group: 'formats' | 'work' | 'tracking' | 'api';
  label: string;
  url: string;
  displayUrl?: string;
}

const cleanRepo = (repo: string) => repo.replace(/\.git$/i, '').replace(/[?#].*$/, '');

const normalizeRepo = (owner?: string, repo?: string): GitHubRepoInfo | undefined => {
  if (!owner || !repo) return undefined;
  const cleanOwner = owner.trim();
  const cleanRepoName = cleanRepo(repo.trim());
  if (!/^[a-zA-Z0-9_.-]+$/.test(cleanOwner) || !/^[a-zA-Z0-9_.-]+$/.test(cleanRepoName)) return undefined;

  return {
    owner: cleanOwner,
    repo: cleanRepoName,
    repoName: `${cleanOwner}/${cleanRepoName}`,
  };
};

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

export const findGitHubRepos = (text: string) => {
  const candidates = [
    ...text.matchAll(/(?:https?:\/\/)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(?:\.git)?/gi),
    ...text.matchAll(/git@github\.com:[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(?:\.git)?/gi),
    ...text.matchAll(/ssh:\/\/git@github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(?:\.git)?/gi),
  ];
  const repos = candidates
    .map((match) => parseGitHubRepo(match[0]))
    .filter((repo): repo is GitHubRepoInfo => Boolean(repo));
  const unique = new Map(repos.map((repo) => [repo.repoName.toLowerCase(), repo]));
  return [...unique.values()];
};

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
