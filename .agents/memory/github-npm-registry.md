---
name: GitHub npm registry
description: Why GitHub Actions must normalize Replit package-firewall URLs before npm installs.
---

GitHub-hosted runners cannot resolve `package-firewall.replit.local` URLs recorded in npm lockfiles generated inside Replit. Android CI must normalize those resolved URLs to `https://registry.npmjs.org/` before running `npm ci`.

**Why:** npm initially masked the DNS failure behind an internal “Exit handler never called” error and an incorrect successful exit, leaving build tools partially installed.

**How to apply:** Keep the public-registry normalization and build-tool verification steps in GitHub workflows that install dependencies from this project’s lockfile.