# Record Enrichment API docs

Pages for the **Enrichment API** (`/api/v1/partner/enrichments…` in `unified-playground-backend`). It shows as two tabs in `docs.json`, **Enrichment API Guides** and **Enrichment API Reference**, the same way as the Blue Collar API. It shares the API host, keys and request signing with the Blue Collar API, so Authentication, the signing helper and Errors link to the Blue Collar pages instead of repeating them.

| Path | Contents |
|---|---|
| `index.mdx`, `quickstart.mdx`, `authentication.mdx` | Get started |
| `guides/` | Enrichments, campaigns, candidates and results, plus a Webhooks page for `enrichment.result` (which links to the Blue Collar webhooks guide for signing). Each ends with every endpoint of its step |
| `reference/` | Statuses and limits |
| `api-reference/openapi.json` | Generated. Do not edit by hand |
| `scripts/` | Builds `openapi.json` from the backend's Enrichment spec |

## Update the API reference

The backend generates the spec from the routes it enforces. When an Enrichment endpoint changes, rebuild from a running backend:

```bash
node scripts/build-openapi.mjs --from http://localhost:8080/api/v1/partner/openapi-enrichment.json --host https://api-bc.userecord.io
```

The script applies `scripts/openapi-overrides.json` (titles, descriptions, field notes and the errors specific to each endpoint) and adds code samples. A new endpoint without an override is reported: add it to the overrides file, to `GROUP_OF` in the script, and to the navigation in `docs.json`. The endpoint sections in `guides/` are written by hand, so update them too.

Try it works the same way as in the Blue Collar API (`blue-collar-api/playground-signing.js`, loaded on every page). Use `--local` to point Try it at a backend on `localhost:8080`, and rebuild without it before committing.
