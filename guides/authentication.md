---
title: "Authentication"
description: "How to authenticate API requests using your API key."
---

Every API request must include your API key in the request header. Separate key pairs exist for Test and Production environments.

```http
Authorization: Bearer <your_api_key>
Content-Type: application/json
```

<CardGroup cols={2}>
  <Card title="Test API key format">
    `svp_test_xxxxxxxxxxxx`
  </Card>
  <Card title="Production API key format">
    `svp_live_xxxxxxxxxxxx`
  </Card>
  <Card title="Test secret key format">
    `svp_test_sk_xxxxxxxxxxxx`
  </Card>
  <Card title="Production secret key format">
    `svp_live_sk_xxxxxxxxxxxx`
  </Card>
</CardGroup>

<Warning>
  Never expose your secret key on the client side. Use it only in server-to-server calls for signature validation and webhook verification.
</Warning>