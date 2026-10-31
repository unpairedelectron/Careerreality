---
name: GitHub connector upload filter
description: The connected GitHub REST proxy can Cloudflare-block certain HTML and workflow writes even when authentication and ordinary file uploads work.
---

The GitHub connector may return an upstream Cloudflare 403 for specific HTML payloads and `.github/workflows` writes, including through Contents, Git blobs, Git trees, Octokit, and alternate Base64 formatting.

**Why:** A public repository upload encountered this behavior while ordinary text, CSS, images, and other project files uploaded successfully.

**How to apply:** Audit the remote tree after connector uploads, report any blocked paths explicitly, and do not silently replace blocked files with transformed content.