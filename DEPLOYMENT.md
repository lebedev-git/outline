# Deployment

## Source of Truth

The custom Outline services are now managed as source code:

1. Edit `outline-ai-search/app.py` or files under `outline-app/`.
2. Commit and push to GitHub.
3. GitHub Actions builds and publishes GHCR images.
4. Watchtower on the Docker host pulls changed `latest` images and restarts only labeled containers.

## Image Tags

The workflow publishes:

- `ghcr.io/lebedev-git/outline-ai-search:latest` from `main`
- `ghcr.io/lebedev-git/outline-app:latest` from `main`
- `ghcr.io/lebedev-git/<image>:sha-<commit>` for every build
- `ghcr.io/lebedev-git/<image>:outline-<version>` for matching Git tags

This deployment intentionally uses `latest` because Watchtower needs a moving tag for automatic updates.

## Portainer Setup

In Portainer, the custom services should use GHCR `latest` images:

```yaml
outline:
  image: ghcr.io/lebedev-git/outline-app:latest

ai-search:
  image: ghcr.io/lebedev-git/outline-ai-search:latest
```

Both services should have the Watchtower label:

```yaml
labels:
  com.centurylinklabs.watchtower.enable: "true"
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

## Automatic Updates

The stack includes Watchtower:

```yaml
watchtower:
  image: containrrr/watchtower:latest
  command:
    - --label-enable
    - --interval
    - "300"
    - --cleanup
    - --rolling-restart
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock
```

It checks every 5 minutes. Only containers with `com.centurylinklabs.watchtower.enable=true` are updated.

## Manual Build Fallback

If GitHub Actions is unavailable, build directly on the Docker host through Portainer:

```powershell
.\scripts\build-outline-ai-search.ps1 -Tag outline-ai-search:YYYY-MM-DD
```

Then use that local tag in Portainer:

```yaml
image: outline-ai-search:YYYY-MM-DD
```
