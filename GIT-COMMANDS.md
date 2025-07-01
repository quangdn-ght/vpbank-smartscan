# Git CLI Commands Summary
# VPBank SmartScan Project Setup

## Initial Repository Setup
```bash
# 1. Initialize Git repository
git init

# 2. Add all files to staging area
git add .

# 3. Create initial commit
git commit -m "Initial commit: PDF to JPEG converter and image processing tools"

# 4. Add remote GitHub repository
git remote add origin https://github.com/quangdn-ght/vpbank-smartscan.git

# 5. Push to GitHub (first time)
git push -u origin master
```

## Daily Git Workflow Commands
```bash
# Check status of your repository
git status

# Add specific file
git add filename.txt

# Add all changed files
git add .

# Commit changes with message
git commit -m "Your commit message"

# Push changes to GitHub
git push

# Pull latest changes from GitHub
git pull

# View commit history
git log --oneline
```

## Branch Management
```bash
# List all branches
git branch

# Create new branch
git checkout -b feature-branch-name

# Switch to existing branch
git checkout branch-name

# Merge branch into current branch
git merge branch-name

# Delete branch
git branch -d branch-name
```

## Repository Information
- **Repository URL**: https://github.com/quangdn-ght/vpbank-smartscan.git
- **Default Branch**: master
- **Total Files Committed**: 3,158 files
- **Project Type**: PDF to JPEG converter and image processing tools

## Useful Git Aliases (Optional)
```bash
# Add these to your ~/.gitconfig or run as commands
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.unstage 'reset HEAD --'
```

## Emergency Commands
```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# See what changed in last commit
git show

# Discard changes to specific file
git checkout -- filename.txt

# Discard all local changes
git reset --hard HEAD
```
