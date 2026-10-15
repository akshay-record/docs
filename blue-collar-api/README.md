# Record Blue Collar API docs

Mintlify site for the Record Blue Collar API (`/api/v1/partner` in `unified-playground-backend`).

## Run locally

```bash
npx mint dev
```

Opens on http://localhost:3000. Check links with `npx mint broken-links`.

## Layout

| Path | Contents |
|---|---|
| `index.mdx`, `quickstart.mdx`, `authentication.mdx` | Get started |
| `guides/` | Workflows, job mandates, skills, lookups, campaigns, results, webhooks, analytics. Each page ends with every endpoint of its step: fields, example, response and errors |
| `reference/` | Requests and responses, errors, limits, statuses |
| `api-reference/openapi.json` | Generated. Do not edit by hand |
| `scripts/` | Builds `openapi.json` from the backend's spec |

## Update the API reference

The backend generates its OpenAPI spec from the routes it enforces. When the Blue Collar API changes, rebuild from a running backend:

```bash
node scripts/build-openapi.mjs --from http://localhost:8080/api/v1/partner/openapi.json --host https://api-bc.userecord.io
```

The endpoint sections in `guides/` are written by hand, so update them too when an endpoint's fields or errors change.

`--host` is the public address shown in the docs. The script applies `scripts/openapi-overrides.json` (short titles, descriptions and the errors specific to each endpoint) and adds code samples. A new endpoint without an override is kept as generated and reported. Add it to the overrides file and to the navigation in `docs.json`.

## Before publishing

The docs use `https://api-bc.userecord.io` as the API host. If it changes, update it in the `*.mdx` files and rebuild `openapi.json` with `--host`.
