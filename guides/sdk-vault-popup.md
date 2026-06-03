---
title: "Vault Popup"
description: "Open the skill vault popup to let users access and manage their verified skills."
---

The popup gives your users access to their skill vault. You must pass `name` and either `email` or `phone`. If email is not pre-supplied, the popup will prompt the user to enter their email — email is required to create or access a vault session.

```javascript
sdk.openVaultPopup({
  name: 'Arjun Mehta',        // required
  email: 'arjun@acme.com',    // required (or collected in popup)
  phone: '+919876543210',      // optional fallback if email absent
  verificationId: 'ver_xxxxx', // ties popup to a specific record
  onSuccess: (session) => {
    console.log('Vault session created:', session);
  },
  onError: (err) => {
    console.error('Popup error:', err);
  },
});
```

<Warning>
  Email is the primary vault key. Verified skills are stored and retrieved by email address only. Even if phone is passed, the user will be asked for email inside the popup if it was not pre-supplied.
</Warning>

## Popup parameters

| Parameter | Type | Required | Notes |
|---|---|---|---|
| `name` | string | **Required** | Full name of the user |
| `email` | string | **Required\*** | \*Collected in popup if not pre-passed |
| `phone` | string | Optional | Allowed if email absent at call time |
| `verificationId` | string | Optional | Scopes popup to a specific verification record |
| `onSuccess` | function | Optional | Callback with session object |
| `onError` | function | Optional | Callback with error details |