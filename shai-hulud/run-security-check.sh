#!/bin/bash

# Save your .mjs script as check-infected-packages.mjs in the same directory as this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHECK_SCRIPT="$SCRIPT_DIR/check-infected-packages.mjs"

# Find all directories in current directory that contain .git
REPOS=($(find . -maxdepth 2 -name ".git" -type d -exec dirname {} \;))

echo "🔍 Running security check across ${#REPOS[@]} repositories..."
echo "=================================================="

for repo in "${REPOS[@]}"; do
    echo -e "\n📁 Checking repository: $repo"
    echo "----------------------------------------"
    cd "$repo" || continue

    # Check if lock files exist
    if [[ -f "yarn.lock" || -f "package-lock.json" || -f "aws/package-lock.json" ]]; then
        node "$CHECK_SCRIPT"
    else
        echo "⚠️  No lock files found - skipping"
    fi

    # Go back to the script directory
    cd "$SCRIPT_DIR" || exit
done

echo -e "\n✅ Security check completed!"
