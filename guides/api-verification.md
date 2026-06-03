---
title: "Verification"
description: "Create and retrieve skill verification sessions via the API."
---

## Create a verification session

<ParamField body="POST" name="/verifications" />

Creates a verification record for a user. Pass source details from your job board along with skill data.

```json
{
  "userId": "usr_xxxxx",
  "email": "arjun@acme.com",
  "name": "Arjun Mehta",
  "source": {
    "type": "project",              // project | experience | certificate
    "id": "proj_001",
    "title": "Payment Gateway Integration",
    "description": "Led backend for razorpay integration",
    "startDate": "2023-01-01",
    "endDate": "2023-12-31"
  },
  "skills": ["Python", "Django", "REST API", "SQL", "Docker"],
  "method": "human_endorsement",    // human_endorsement | assessment
  "endorsementType": "reporting_manager"
}
```

## Endorsement types

`reporting_manager` · `tech_lead` · `client` · `founder_cxo` · `peer`

## Get verification status

`GET /verifications/:verificationId`

## List verifications for a user

`GET /users/:userId/verifications`

Returns all verified skills, sources, touchpoints, and proof status for the given user.