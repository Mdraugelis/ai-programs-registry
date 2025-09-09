#!/bin/bash

# GitHub Branch Protection Setup Script
# Run this script to configure branch protection rules for the main branch

set -e

echo "🔒 Setting up branch protection for main branch..."

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed. Please install it first:"
    echo "   https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI. Please run 'gh auth login' first."
    exit 1
fi

# Get repository info
REPO=$(gh repo view --json owner,name -q '.owner.login + "/" + .name')
echo "📂 Repository: $REPO"

# Set branch protection rules
echo "🛡️  Configuring branch protection rules..."

gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "/repos/$REPO/branches/main/protection" \
  --input - <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["test (3.11)", "test (3.12)", "security-scan", "build-validation"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "require_last_push_approval": false
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true
}
EOF

echo "✅ Branch protection rules configured successfully!"

echo "
📋 Main branch protection rules now enforce:
  ✅ Pull requests are required
  ✅ At least 1 approving review required
  ✅ Stale reviews are dismissed when new commits are pushed
  ✅ Status checks must pass: CI tests (Python 3.11 & 3.12), security scan, build validation
  ✅ Conversations must be resolved before merging
  ✅ Force pushes are blocked
  ✅ Branch deletion is blocked
  
🔒 Direct commits to main branch are now blocked - all changes must go through pull requests!
"

# Optional: Set up additional rules for better workflow
echo "🔧 Setting up additional repository settings..."

# Enable vulnerability alerts
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  "/repos/$REPO/vulnerability-alerts" || echo "⚠️  Could not enable vulnerability alerts (may already be enabled)"

# Enable automated security fixes
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  "/repos/$REPO/automated-security-fixes" || echo "⚠️  Could not enable automated security fixes (may already be enabled)"

echo "
🎉 Repository protection setup complete!
   
🚀 Next steps:
1. All future changes should be made on feature branches
2. Create pull requests to merge into main
3. Ensure all CI checks pass before merging
4. Get at least 1 approving review before merging

📚 Workflow example:
   git checkout -b feature/my-new-feature
   git commit -am 'Add new feature'
   git push origin feature/my-new-feature
   gh pr create --title 'Add new feature' --body 'Description of changes'
"