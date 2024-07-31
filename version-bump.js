const { execSync } = require('child_process');

const getChangedLines = () => {
  try {
    const diffOutput = execSync('git diff HEAD~1 HEAD --shortstat').toString();
    const matches = diffOutput.match(/(\d+) insertions?\(\+\), (\d+) deletions?\(\-\)/);
    if (!matches) return 0;

    const insertions = parseInt(matches[1], 10);
    const deletions = parseInt(matches[2], 10);

    return insertions + deletions;
  } catch (error) {
    console.error('Error getting changed lines:', error.message);
    return 0;
  }
};

const bumpVersion = () => {
  const changedLines = getChangedLines();
  let newVersion;

  if (changedLines <= 10) {
    newVersion = 'patch';
  } else if (changedLines <= 60) {
    newVersion = 'minor';
  } else {
    newVersion = 'major';
  }

  return newVersion;
};

const versionType = bumpVersion();
const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();

if (currentBranch === 'develop') {
  execSync(`lerna version prerelease --preid alpha --force-publish --yes --no-push`);
} else if (currentBranch === 'master') {
  execSync(`lerna version ${versionType} --force-publish --yes --no-push`);
}

// Use the personal GitHub token to push changes
const repoUrl = `https://${process.env.GITHUB_TOKEN}@github.com/${process.env.GITHUB_REPOSITORY}.git`;
execSync(`git push ${repoUrl} --follow-tags`);
execSync('lerna publish from-package --yes');
