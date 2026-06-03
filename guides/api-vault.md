---
title: "Vault"
description: "Retrieve verified skill records from the vault by user ID."
---

## Get vault record by user ID

`GET /vault/:userId`

Returns all verified skills, sources, touchpoints, and proof metadata for display in your frontend. Use this endpoint to render skill verification badges or trust signals without requiring the user to open the popup.

```json
{
  "userId": "usr_xxxxx",
  "email": "arjun@acme.com",
  "vault": [
    {
      "sourceId": "proj_001",
      "sourceTitle": "Payment Gateway Integration",
      "skills": [
        {
          "name": "Python",
          "verifications": [
            { "type": "reporting_manager", "status": "passed", "date": "2024-03-15" },
            { "type": "tech_lead", "status": "passed", "date": "2024-04-02" }
          ]
        }
      ]
    }
  ]
}
```

<Info>
  Vault records are accessed by email (OTP-verified in the popup) or by `userId` via this API endpoint. Both Test and Production vaults are isolated — test records never appear in the production vault.
</Info>