// Builds api-reference/openapi.json from the backend's own spec.
//
// The backend generates its OpenAPI document from the routes it enforces, so the
// schemas here never drift from the server. This script only makes it read well in
// Mintlify: short titles and descriptions, the errors specific to each endpoint, and
// code samples that use the signing helper from the Authentication page.
//
//   node scripts/build-openapi.mjs                                   (backend on localhost:8080)
//   node scripts/build-openapi.mjs --from https://HOST/api/v1/partner/openapi.json
//   node scripts/build-openapi.mjs --from ./openapi.raw.json --host https://api.example.com
//
// Zero dependencies (Node 18+).

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};

const BASE_PATH = "/api/v1/partner";
const from = arg("from", `http://localhost:8080${BASE_PATH}/openapi.json`);
// --local: build the docs against a backend on this machine (http://localhost:8080) so Try it hits it, not production.
// Run it again without --local to go back to the production host. Do not commit the local build.
const LOCAL_HOST = "http://localhost:8080";
const host = (process.argv.includes("--local") ? LOCAL_HOST : arg("host", "https://api-bc.userecord.io")).replace(/\/$/, "");

const load = async (source) => {
  if (/^https?:\/\//.test(source)) {
    const res = await fetch(source);
    if (!res.ok) throw new Error(`${source} answered ${res.status}`);
    return res.json();
  }
  return JSON.parse(await readFile(path.resolve(source), "utf8"));
};

const spec = await load(from);
const overrides = JSON.parse(await readFile(path.join(root, "scripts/openapi-overrides.json"), "utf8"));

/* ── Code samples ─────────────────────────────────────────────────────────── */

const pyLiteral = (value, indent = 0) => {
  const pad = "    ".repeat(indent + 1);
  const end = "    ".repeat(indent);
  if (value === null) return "None";
  if (value === true) return "True";
  if (value === false) return "False";
  if (Array.isArray(value)) {
    if (!value.length) return "[]";
    return `[\n${value.map((v) => pad + pyLiteral(v, indent + 1)).join(",\n")}\n${end}]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value);
    if (!entries.length) return "{}";
    return `{\n${entries.map(([k, v]) => `${pad}${JSON.stringify(k)}: ${pyLiteral(v, indent + 1)}`).join(",\n")}\n${end}}`;
  }
  return JSON.stringify(value);
};

const codeSamples = (method, route, op) => {
  const params = op.parameters ?? [];
  let url = BASE_PATH + route;
  for (const p of params.filter((p) => p.in === "path")) {
    if (p.example !== undefined) url = url.replace(`{${p.name}}`, encodeURIComponent(String(p.example)));
  }
  const query = params
    .filter((p) => p.in === "query" && p.example !== undefined && p.example !== "")
    .map((p) => `${p.name}=${encodeURIComponent(String(p.example))}`)
    .join("&");
  if (query) url += `?${query}`;

  const body = op.requestBody?.content?.["application/json"]?.example;
  const M = method.toUpperCase();
  const json = body === undefined ? null : JSON.stringify(body, null, 2);

  return [
    {
      lang: "bash",
      label: "cURL",
      source: `pcall ${M} "${url}"${json ? ` '${json.replace(/'/g, "'\\''")}'` : ""}`,
    },
    {
      lang: "javascript",
      label: "JavaScript",
      source: `const res = await call("${M}", "${url}"${json ? `, ${json}` : ""});\nconst { data } = await res.json();`,
    },
    {
      lang: "python",
      label: "Python",
      source: `res = call("${M}", "${url}"${body === undefined ? "" : `, ${pyLiteral(body)}`})\ndata = res.json()["data"]`,
    },
  ];
};

/* ── Operations ───────────────────────────────────────────────────────────── */

const scopesOf = (description) => description?.match(/\*\*Scopes:\*\* (.*?)\. \*\*Limit/)?.[1] ?? null;

const fillFieldNotes = (schema, notes) => {
  const props = schema?.properties;
  if (!props || !notes) return;
  for (const [names, note] of Object.entries(notes)) {
    for (const name of names.split(",").map((n) => n.trim())) {
      if (props[name] && !props[name].description) props[name].description = note;
    }
  }
};

let missing = 0;
for (const [route, methods] of Object.entries(spec.paths)) {
  for (const [method, op] of Object.entries(methods)) {
    const o = overrides[op.operationId];
    if (!o) {
      missing++;
      console.warn(`no override for ${op.operationId} (${method.toUpperCase()} ${route}): kept as generated`);
      continue;
    }

    // Idempotency-Key is always optional in the reference, even where the backend requires it.
    const idem = op.parameters?.find((p) => p.name === "Idempotency-Key");
    if (idem) {
      idem.required = false;
      idem.description = `${(idem.description ?? "").replace(/^Required\./, "Optional.")} Leave empty in Try it: a new one is made for every call.`.trim();
    }
    const meta = [
      `**Scope:** ${scopesOf(op.description) ?? "see Authentication"}`,
      idem && "**Idempotency-Key:** optional",
    ]
      .filter(Boolean)
      .join(" · ");

    op.summary = o.title;
    op.description = [
      o.description,
      meta,
      o.danger && "> **This contacts real candidates.** Build against a TEST key first.",
    ]
      .filter(Boolean)
      .join("\n\n");

    // x-on-behalf-of is optional on every call; it is explained once, in Authentication.
    op.parameters = (op.parameters ?? []).filter((p) => p.name !== "x-on-behalf-of");

    fillFieldNotes(op.requestBody?.content?.["application/json"]?.schema, o.fields);

    // Keep the success answer and the errors this endpoint can return beyond the common ones (see Errors).
    const success = Object.fromEntries(Object.entries(op.responses).filter(([status]) => status.startsWith("2")));
    const specific = {};
    for (const [status, code, when] of o.errors ?? []) {
      const entry = (specific[status] ??= {
        description: "",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      });
      entry.description += `${entry.description ? " " : ""}\`${code}\`: ${when}`;
    }
    op.responses = { ...success, ...specific };

    op["x-codeSamples"] = codeSamples(method, route, op);
  }
}

// Create a workflow: send the whole definition. The API fills a default for anything left out, but the form should ask for
// the fields that define the workflow, so they are shown as required (external_id stays optional, status keeps its default).
const workflowBody = spec.paths["/workflows"]?.post?.requestBody?.content?.["application/json"]?.schema;
if (workflowBody) {
  workflowBody.required = ["name", "default_methods", "delivery", "schedule"];
  workflowBody.properties.delivery.required = ["whatsapp", "voice_call", "sms_backup"];
  workflowBody.properties.schedule.required = ["start_time", "end_time", "days", "timezone", "max_retries", "retry_after_hours"];
}

// A list of enum values never repeats an item (the API refuses a repeat), so say so in the schema.
const markUnique = (node) => {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) return node.forEach(markUnique);
  if (node.type === "array" && node.items?.enum) node.uniqueItems = true;
  Object.values(node).forEach(markUnique);
};
for (const methods of Object.values(spec.paths)) {
  for (const op of Object.values(methods)) markUnique(op.requestBody);
}

// Tags name the URL segment of each endpoint page; match them to the sidebar groups.
const TAG_NAMES = { Helpers: "Lookups" };
for (const methods of Object.values(spec.paths)) {
  for (const op of Object.values(methods)) op.tags = (op.tags ?? []).map((t) => TAG_NAMES[t] ?? t);
}
spec.tags = (spec.tags ?? []).map((t) => ({ ...t, name: TAG_NAMES[t.name] ?? t.name }));

// Response schemas show no "required" badges: drop their required lists (not a property named "required").
const stripRequired = (node, inProperties = false) => {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) return node.forEach((n) => stripRequired(n));
  if (!inProperties && Array.isArray(node.required)) delete node.required;
  for (const [key, value] of Object.entries(node)) stripRequired(value, key === "properties" && !inProperties);
};
for (const methods of Object.values(spec.paths)) {
  for (const op of Object.values(methods)) stripRequired(op.responses);
}
stripRequired(spec.components.schemas.Error);

// Try it: the reader gives only the key id and the secret. On the wire Record wants x-api-key, x-timestamp and
// x-signature, and the secret itself is never sent. `playground-signing.js` (loaded on every docs page) reads the
// `x-secret-key` field, makes the timestamp and signature, and removes the secret before the request leaves the browser.
delete spec.components.securitySchemes.Timestamp;
delete spec.components.securitySchemes.Signature;
spec.components.securitySchemes.ApiKey = {
  type: "apiKey",
  in: "header",
  name: "x-api-key",
  description: "Your key id, `VFN_TEST_…` or `VFN_LIVE_…`. Sent on every request.",
};
spec.components.securitySchemes.SecretKey = {
  type: "apiKey",
  in: "header",
  name: "x-secret-key",
  description:
    "Your secret, `VFN_SK_…`. **Not a real header, and never sent to the API.** It is only a form field for Try it, which uses it to sign your request in your browser. " +
    "In your own code you sign each request with the secret and send `x-api-key`, `x-timestamp` and `x-signature` (see Authentication).",
};
for (const methods of Object.values(spec.paths)) {
  for (const op of Object.values(methods)) {
    op.security = [{ ApiKey: [], SecretKey: [] }];
    // The site shows no playground by default (docs.json); switch it on for this API's endpoints only.
    op["x-mint"] = { ...(op["x-mint"] ?? {}), metadata: { ...(op["x-mint"]?.metadata ?? {}), playground: "interactive" } };
  }
}

spec.info = {
  title: "Record Blue Collar API",
  version: spec.info?.version ?? "1.0.0",
  description:
    "Run Record candidate verification from your own system. You need two things: your **key id** and your **secret**. Everything else is generated. See Authentication for how.",
};
spec.servers = [{ url: `${host}${BASE_PATH}`, description: "Blue Collar API" }];

const out = path.join(root, "api-reference/openapi.json");
await writeFile(out, `${JSON.stringify(spec, null, 2)}\n`);
console.log(`Wrote ${path.relative(root, out)} (${Object.values(spec.paths).reduce((n, m) => n + Object.keys(m).length, 0)} operations${missing ? `, ${missing} without overrides` : ""})`);
