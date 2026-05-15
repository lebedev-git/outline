# Deployment

## Source of Truth

The `outline-ai-search` service is now managed as source code:

1. Edit `outline-ai-search/app.py`.
2. Commit and push to GitHub.
3. GitHub Actions builds and publishes `ghcr.io/lebedev-git/outline-ai-search`.
4. Portainer uses that image in the `outline-server` stack.

## Image Tags

The workflow publishes:

- `ghcr.io/lebedev-git/outline-ai-search:latest` from `main`
- `ghcr.io/lebedev-git/outline-ai-search:sha-<commit>` for every build
- `ghcr.io/lebedev-git/outline-ai-search:outline-ai-search-<version>` for matching Git tags

For production, prefer a fixed tag such as `sha-...` or a release tag. `latest` is convenient but less strict.

## Portainer Setup

In Portainer, the `ai-search` service should use the current verified release image:

```yaml
image: ghcr.io/lebedev-git/outline-ai-search:outline-ai-search-2026-05-15-1
```

`latest` is acceptable for quick tests, but a release tag is safer for production because it will not change unexpectedly.

Alternative pinned build format:

```yaml
image: ghcr.io/lebedev-git/outline-ai-search:sha-<commit>
```

Keep:

```yaml
FAST_INDEX_INTERVAL_SECONDS: "30"
```

If the GitHub package is private, add GHCR credentials in Portainer:

- Registry: `ghcr.io`
- Username: GitHub username
- Password: GitHub personal access token with `read:packages`

If the package is public, credentials are not required.

## Manual Build Fallback

If GitHub Actions is unavailable, build directly on the Docker host through Portainer:

```powershell
.\scripts\build-outline-ai-search.ps1 -Tag outline-ai-search:YYYY-MM-DD
```

Then use that local tag in Portainer:

```yaml
image: outline-ai-search:YYYY-MM-DD
```
