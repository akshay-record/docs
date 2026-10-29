# Record White Collar API docs

Mintlify pages for the Record White Collar API (`/api/v1/partner/white-collar` in `unified-playground-backend`; code in `src/white-collar/partner-api`). It is a separate API from the Blue Collar API (`../blue-collar-api`): its own base path, scopes (`wc_*`), objects and webhooks. Not to be confused with `../whitecollar`, which documents the older assessment API.

## Layout

| Path | Contents |
|---|---|
| `index.mdx`, `quickstart.mdx`, `authentication.mdx` | Get started |
| `guides/` | Workflows, job mandates and questions, campaigns, results and analytics, webhooks and events |
| `reference/` | Requests and responses, errors, limits, statuses |
| `api-reference/openapi.json` | Generated. Do not edit by hand |
| `scripts/` | Builds `openapi.json` from the backend's spec |

The Try it signing script is shared with the Blue Collar API: `../blue-collar-api/playground-signing.js` is loaded on every page and signs requests to the API host (`api-bc.userecord.io`) whatever the path. Do not copy it here.

## Update the API reference

The backend generates its OpenAPI spec from the routes it enforces. When the White Collar API changes, rebuild from a running backend:

```bash
node scripts/build-openapi.mjs --from http://localhost:8080/api/v1/partner/white-collar/openapi.json --host https://api-bc.userecord.io
```

`--local` points Try it at `http://localhost:8080` (do not commit that build). `scripts/openapi-overrides.json` holds each endpoint's title, description and specific errors. A new endpoint without an override is kept as generated and reported: add it to the overrides file and to the navigation in `../docs.json`. The guides are written by hand, so update them too when an endpoint's fields or errors change.

Check links with `npx mint broken-links`.
