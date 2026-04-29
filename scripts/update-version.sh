#!/bin/sh
# Rewrites version.js with the current branch, commit hash, and date.
# Run this before committing, or wire it into a git pre-commit hook.
BRANCH=$(git branch --show-current)
COMMIT=$(git rev-parse --short HEAD)
DATE=$(git log -1 --format="%ci" | cut -c1-10)

cat > "$(dirname "$0")/../version.js" << EOF
// Build info — updated automatically on each commit.
const VERSION = {
  branch: '$BRANCH',
  commit: '$COMMIT',
  date:   '$DATE',
};
EOF

echo "version.js updated: $BRANCH@$COMMIT ($DATE)"
