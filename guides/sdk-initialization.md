---
title: "SDK Initialization"
description: "Initialize the SDK once on app load with your API key and environment mode."
---

Initialize the SDK once on app load. Pass `mode: 'test'` during development and `mode: 'production'` when you go live. The correct API key and vault endpoint are resolved automatically.

<Tabs>
  <Tab title="Test">
    ```javascript
    import VerifySDK from '@yourplatform/verify-sdk';

    const sdk = new VerifySDK({
      apiKey: 'svp_test_xxxxxxxxxxxx',
      mode: 'test',
    });
    ```
  </Tab>
  <Tab title="Production">
    ```javascript
    import VerifySDK from '@yourplatform/verify-sdk';

    const sdk = new VerifySDK({
      apiKey: 'svp_live_xxxxxxxxxxxx',
      mode: 'production',
    });
    ```
  </Tab>
</Tabs>

<Info>
  SDK mode determines which base URL, vault link, and email behavior is used. No other code changes are required between Test and Production.
</Info>