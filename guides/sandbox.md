---
title: "Sandbox / Testing"
description: "How to use the Test environment to validate your integration before going live."
---

The Test environment is your sandbox. It mirrors Production exactly — same endpoints, same validation logic, same edge case enforcement. No real emails are sent; endorsement flows simulate delivery and approval automatically using test fixtures.

## Quick start checklist

<Steps>
  <Step title="Get your Test API key">
    Retrieve your Test API key from the dashboard.
  </Step>
  <Step title="Initialize with test mode">
    Set `mode: 'test'` when initializing the SDK.
  </Step>
  <Step title="Use the Test vault link">
    Point your app to `vault-test.yourplatform.io`.
  </Step>
  <Step title="Register a webhook">
    Point it to your local or staging server endpoint.
  </Step>
  <Step title="Create a verification">
    Confirm the webhook fires correctly.
  </Step>
  <Step title="Swap to Production keys">
    No other code changes needed — you're live.
  </Step>
</Steps>

## Test user IDs & verification IDs

User IDs and verification IDs created in the Test environment carry a `_test_` infix (e.g. `usr_test_xxxxx`, `ver_test_xxxxx`). These are fully isolated and never migrate to Production.