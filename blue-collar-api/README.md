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
| `playground-signing.js` | Makes **Try it** work with only a key id and a secret (see below). Mintlify loads it on every page, but it only touches requests to the API host |
| `scripts/` | Builds `openapi.json` from the backend's spec |

## Update the API reference

The backend generates its OpenAPI spec from the routes it enforces. When the Blue Collar API changes, rebuild from a running backend:

```bash
node scripts/build-openapi.mjs --from http://localhost:8080/api/v1/partner/openapi.json --host https://api-bc.userecord.io
```

The endpoint sections in `guides/` are written by hand, so update them too when an endpoint's fields or errors change.

`--host` is the public address shown in the docs. The script applies `scripts/openapi-overrides.json` (short titles, descriptions and the errors specific to each endpoint) and adds code samples. A new endpoint without an override is kept as generated and reported. Add it to the overrides file and to the navigation in `docs.json`.

## How Try it works

The API checks `x-api-key`, `x-timestamp` and `x-signature` (a signature of the exact request, made with the secret). A form cannot ask readers to calculate a signature, so `build-openapi.mjs` shows two auth fields instead: `x-api-key` (key id) and `x-secret-key` (secret). `x-secret-key` is not a real header.

`playground-signing.js` wraps `XMLHttpRequest` (what the Mintlify playground uses) and `fetch` in the reader's browser, for requests to the hosts in `API_HOSTS` only. For a request that carries `x-secret-key` it adds `x-timestamp` and `x-signature`, adds an `Idempotency-Key` to writes, and **removes the secret** before sending. The secret goes nowhere except the reader's browser, where Mintlify keeps what is typed in local storage so it need not be retyped.

The playground labels each auth field with its header name. The same script shows them as **API key** and **Secret key** on screen (only the text changes, not the header names the request uses). It does this only on pages that have the secret-key field.

Two things must stay true for it to work:

- `docs.json` has `api.playground.proxy: false`, so the browser calls the API directly (a proxy would need the secret).
- The Blue Collar API allows browser calls from the docs site (CORS on `/api/v1/partner`, with the `x-api-key`, `x-timestamp`, `x-signature`, `Idempotency-Key` and `x-on-behalf-of` headers allowed).

## Try it against a local backend

By default Try it calls production (`https://api-bc.userecord.io`). To test against a backend running on `http://localhost:8080`:

```bash
node scripts/build-openapi.mjs --local     # Try it now calls http://localhost:8080
npx mint dev                               # open http://localhost:3000, use a TEST key
node scripts/build-openapi.mjs             # back to production, before you commit
```

`--local` only changes the server URL in `api-reference/openapi.json`. Do not commit that file built with `--local`. The backend must allow the docs origin in its CORS list (`http://localhost:3000` is already in it).

## Before publishing

The docs use `https://api-bc.userecord.io` as the API host. If it changes, update it in the `*.mdx` files and rebuild `openapi.json` with `--host`.
