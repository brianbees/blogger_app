# Branch Synchronization Guide

## Problem
When GitHub shows "This branch is X commits ahead of and Y commits behind main", it means:
- Your branch has X new commits that aren't in main yet
- Main has Y commits that your branch doesn't have (diverged)

## Solution

### Step 1: Fetch the latest changes from main
```bash
git fetch origin main
```

### Step 2: Merge main into your current branch
```bash
git merge origin/main
```

This will:
- Keep all your commits (the X ahead commits)
- Bring in the commits from main (the Y behind commits)
- Create a merge commit if there are no conflicts

### Step 3: Push the updated branch
```bash
git push origin your-branch-name
```

## Alternative: Rebase instead of Merge

If you prefer a linear history:
```bash
git rebase origin/main
```

Then force push (if needed):
```bash
git push --force-with-lease origin your-branch-name
```

## Current Status
This branch is currently 5 commits ahead of main and 0 commits behind.
All changes are synchronized.
