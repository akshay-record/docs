---
title: "Webhooks"
description: "Register webhooks to receive real-time verification events and validate payloads with HMAC-SHA256."
---

Register a webhook URL to receive real-time events when verification touchpoints are completed. This is the recommended method for persisting results in your own database.

## Register a webhook

`POST /webhooks`

```json
{
  "url": "https://your-server.com/webhooks/verify",
  "events": [
    "verification.passed",
    "verification.failed",
    "assessment.passed",
    "assessment.failed"
  ]
}
```

## Event types

| Event | Trigger |
|---|---|
| `verification.passed` | Endorser approved the skill(s) |
| `verification.failed` | Endorser declined or no response |
| `assessment.passed` | User passed the skill assessment |
| `assessment.failed` | User failed the assessment (retry available) |
| `assessment.paused` | Assessment paused mid-flow |

## Signature validation

All webhook payloads are signed with your secret key using HMAC-SHA256. Validate before processing.

```javascript
const crypto = require('crypto');

function validateWebhook(payload, signature, secretKey) {
  const computed = crypto
    .createHmac('sha256', secretKey)
    .update(JSON.stringify(payload))
    .digest('hex');
  return computed === signature;
}

// In your route handler:
const sig = req.headers['x-svp-signature'];
if (!validateWebhook(req.body, sig, 'svp_test_sk_xxx')) {
  return res.status(401).send('Invalid signature');
}
```