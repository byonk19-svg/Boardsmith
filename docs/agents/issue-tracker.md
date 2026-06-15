# Issue Tracker: GitHub

Issues and PRDs for this repo live as GitHub issues. Use the `gh` CLI for issue operations when a skill needs to publish or fetch tracker work.

## Repository

Infer the repository from `git remote -v`. The current remote is `https://github.com/byonk19-svg/Boardsmith.git`.

## Conventions

- Create an issue: `gh issue create --title "..." --body "..."`
- Read an issue: `gh issue view <number> --comments`
- List issues: `gh issue list --state open --json number,title,body,labels,comments`
- Comment on an issue: `gh issue comment <number> --body "..."`
- Apply labels: `gh issue edit <number> --add-label "..."`
- Remove labels: `gh issue edit <number> --remove-label "..."`
- Close an issue: `gh issue close <number> --comment "..."`

## Publishing Rule

When a skill says to publish to the issue tracker, create a GitHub issue from inside this clone so `gh` uses the repo remote automatically.
