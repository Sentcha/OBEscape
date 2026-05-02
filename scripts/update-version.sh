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

# Patch index.html script tags with the new commit hash.
# Step 1 — strip any existing ?v=... so the substitution is idempotent.
sed -i 's/\.js?v=[^"]*/\.js/g' "$(dirname "$0")/../index.html"
# Step 2 — append ?v=COMMIT to every .js src attribute.
sed -i "s/\.js\">/\.js?v=${COMMIT}\">/g" "$(dirname "$0")/../index.html"

echo "index.html cache-busted: ?v=${COMMIT}"
