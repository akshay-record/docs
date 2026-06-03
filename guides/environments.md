---
title: "Environments"
description: "Test (sandbox) and Production environments — differences and isolation guarantees."
---

The Test environment (sandbox) is a fully isolated replica of Production. Verifications, users, vault records, and webhook events created in Test never affect Production data.

| Property | Test (Sandbox) | Production |
|---|---|---|
| Base URL | `api-test.yourplatform.io/v1` | `api.yourplatform.io/v1` |
| Vault link | `vault-test.yourplatform.io` | `vault.yourplatform.io` |
| API key prefix | `svp_test_` | `svp_live_` |
| User IDs | Isolated test namespace | Real production namespace |
| Verification IDs | Isolated test namespace | Real production namespace |
| Email delivery | Intercepted — no real emails sent | Live delivery |
| Webhooks | Test endpoint required | Production endpoint |
| Mobile app | Test vault link | Production vault link |

<Check>
  The Test environment is your sandbox. All edge case validation, skill bundling logic, and endorsement flows behave identically to Production.
</Check>