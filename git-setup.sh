#!/bin/bash

# Git Setup Script for VPBank SmartScan Project
# Created: July 1, 2025
# Description: Initialize Git repository and push to GitHub

echo "🚀 Git Setup Script for VPBank SmartScan Project"
echo "=================================================="

# Variables
REPO_URL="https://github.com/quangdn-ght/vpbank-smartscan.git"
COMMIT_MESSAGE="Initial commit: PDF to JPEG converter and image processing tools"

# Function to check if command was successful
check_status() {
    if [ $? -eq 0 ]; then
        echo "✅ $1 completed successfully"
    else
        echo "❌ $1 failed"
        exit 1
    fi
}

# Step 1: Initialize Git repository
echo "📁 Step 1: Initializing Git repository..."
git init
check_status "Git initialization"

# Step 2: Add all files to staging area
echo "📦 Step 2: Adding all files to staging area..."
git add .
check_status "Adding files to staging"

# Step 3: Create initial commit
echo "💾 Step 3: Creating initial commit..."
git commit -m "$COMMIT_MESSAGE"
check_status "Initial commit"

# Step 4: Add remote origin
echo "🔗 Step 4: Adding remote repository..."
git remote add origin "$REPO_URL"
check_status "Adding remote origin"

# Step 5: Push to GitHub
echo "⬆️ Step 5: Pushing to GitHub repository..."
git push -u origin master
check_status "Pushing to GitHub"

echo ""
echo "🎉 Repository setup completed successfully!"
echo "📍 Repository URL: $REPO_URL"
echo "🌟 Your project is now live on GitHub!"

# Display repository status
echo ""
echo "📊 Current Git Status:"
git status --short

echo ""
echo "📝 Recent Commits:"
git log --oneline -5

echo ""
echo "🔄 Available Git Commands for Future Use:"
echo "  git status          - Check repository status"
echo "  git add <file>      - Stage specific files"
echo "  git add .           - Stage all changes"
echo "  git commit -m 'msg' - Commit staged changes"
echo "  git push            - Push commits to GitHub"
echo "  git pull            - Pull latest changes from GitHub"
echo "  git branch          - List branches"
echo "  git checkout -b     - Create new branch"
echo "  git log             - View commit history"
