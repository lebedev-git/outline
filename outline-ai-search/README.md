# Outline AI Search

Production source for the `outline-ai-search` service used by the `outline-server` Portainer stack.

The preferred production image is built by GitHub Actions and published to:

```text
ghcr.io/lebedev-git/outline-ai-search
```

## Build

Manual fallback build from the workspace root:

```powershell
.\scripts\build-outline-ai-search.ps1 -Tag outline-ai-search:2026-05-15
```

The script builds the image on the remote Docker endpoint through Portainer. For normal production releases, use the GitHub Actions workflow in `.github/workflows/build-outline-ai-search.yml`.

## Runtime

The service expects these environment variables from compose:

- `DATABASE_URL`
- `OLLAMA_URL`
- `QDRANT_URL`
- `OUTLINE_URL`
- `AI_DATA_DIR`
- `OUTLINE_FILES_DIR`
- `EMBED_MODEL`
- `CHAT_MODEL`
- `AUTO_INDEX_INTERVAL_SECONDS`
- `FAST_INDEX_INTERVAL_SECONDS`

Default HTTP port: `8010`.
