---
name: GitHub connector upload filter
description: GitHub API uploads can hit upstream blocks, and API access does not authenticate normal Git pushes.
---

The GitHub connector may return an upstream Cloudflare 403 for specific HTML payloads and `.github/workflows` writes, including through Contents, Git blobs, Git trees, Octokit, and alternate Base64 formatting.

**Why:** A public repository upload encountered this behavior while ordinary text, CSS, images, and other project files uploaded successfully.

**How to apply:** Audit the remote tree after connector uploads, report any blocked paths explicitly, and do not silently replace blocked files with transformed content.

GitHub (App) API access can read and write a repository without providing credentials to the workspace's `git` CLI. For ongoing Git pushes, connect the repository through Replit's Git pane; an API-only connector is not a substitute.

**Why:** A successful API upload did not create a Git remote or enable authenticated `git push` from the workspace.

**How to apply:** Use the Git pane's repository connection for repeatable push/pull. Confirm the local and remote histories before syncing, especially when the remote was initialized through API commits.