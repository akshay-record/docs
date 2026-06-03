---
title: Source Configuration
description: "How to configure and pass project, experience, and certificate source details from your client app to the platform."
---

## What is a source?

A **source** is the work context a skill is verified against. Every verification must be tied to a source — it tells the platform and the endorser *where* the skill was applied. Skills without a source cannot be verified.

SVP supports three source types:

| Type | Value | Use when |
|---|---|---|
| Project | `project` | A specific project the user worked on |
| Experience | `experience` | A job role or employment period |
| Certificate | `certificate` | A formal certification or course completion |

---

## Full source object
```json
{
  "source": {
    "type": "project",
    "id": "your_internal_source_id",
    "title": "Payment Gateway Integration",
    "description": "Led backend development using Python and Django...",
    "organization": "Acme Corp",
    "startDate": "2023-01-01",
    "endDate": "2023-12-31",
    "current": false,
    "metadata": {
      "jobBoardId": "jb_proj_001",
      "department": "Engineering"
    }
  }
}
```

### Field reference

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | string | **Required** | `project`, `experience`, or `certificate` |
| `id` | string | **Required** | Your internal ID for this source — must be stable and unique |
| `title` | string | **Required** | Title of the project, role, or certificate |
| `description` | string | Recommended | Richer text yields better skill matching. Include tools, responsibilities, outcomes |
| `organization` | string | Recommended | Company, institution, or client name |
| `startDate` | string | Recommended | ISO 8601 date: `YYYY-MM-DD` |
| `endDate` | string | Conditional | Omit if source is ongoing — set `current: true` instead |
| `current` | boolean | Optional | `true` if the user is still in this role or project |
| `metadata` | object | Optional | Any extra key-value fields from your job board — stored as-is, returned in vault |

<Note>
  The `id` field is **your** identifier from your job board or database. SVP uses it to enforce skill uniqueness per source and to correlate verifications across API calls. Always use a stable ID — not a label that could change or repeat.
</Note>

---

## Project configuration

Use for discrete pieces of work — client projects, internal builds, open source contributions.
```json
{
  "source": {
    "type": "project",
    "id": "proj_payment_001",
    "title": "Payment Gateway Integration",
    "description": "Led the backend architecture for integrating Razorpay's payment API. Built REST endpoints in Django, managed PostgreSQL schema migrations, containerized services with Docker, and wrote integration test suites.",
    "organization": "Acme Corp",
    "startDate": "2023-01-01",
    "endDate": "2023-12-31",
    "current": false,
    "metadata": {
      "client": "RetailCo",
      "teamSize": 5
    }
  }
}
```

**Guidance:**
- `title` should be the project name — not a generic label like "Backend Project"
- `description` is shown verbatim to the endorser in the endorsement email — the more accurate it is, the better the endorser can verify
- For ongoing projects set `current: true` and omit `endDate`
- `id` must be unique per project — if the same user has two projects, each must have a distinct `id`

---

## Experience configuration

Use for employment roles — full-time, part-time, contract, or freelance positions.
```json
{
  "source": {
    "type": "experience",
    "id": "exp_acme_backend_2022",
    "title": "Senior Backend Engineer",
    "description": "Responsible for the payments microservice and internal tooling. Stack: Python, Django REST Framework, PostgreSQL, Docker, AWS Lambda. Led a team of 4 engineers. Conducted code reviews and defined API contracts for cross-team integrations.",
    "organization": "Acme Corp",
    "startDate": "2022-06-01",
    "endDate": null,
    "current": true,
    "metadata": {
      "employmentType": "full_time",
      "location": "Bengaluru, India"
    }
  }
}
```

**Guidance:**
- `title` should be the exact job title as it appears on the resume or job board
- `current: true` with `endDate: null` means the user is still in this role — do not pass an `endDate` for active roles
- `description` should reflect the scope of the role — technologies used, team size, responsibilities. This is what the endorser reads when deciding whether to approve
- `organization` is the employer name

---

## Certificate configuration

Use for formal certifications, course completions, and accredited qualifications.
```json
{
  "source": {
    "type": "certificate",
    "id": "cert_aws_saa_001",
    "title": "AWS Certified Solutions Architect – Associate",
    "description": "Validates expertise in designing distributed systems on AWS. Covers EC2, S3, RDS, Lambda, VPC, IAM, and CloudFormation. Issued by Amazon Web Services.",
    "organization": "Amazon Web Services",
    "startDate": "2023-09-15",
    "endDate": "2026-09-15",
    "current": false,
    "metadata": {
      "credentialId": "AWS-SAA-C03-XXXXXX",
      "credentialUrl": "https://credly.com/badges/xxxxxx"
    }
  }
}
```

**Guidance:**
- `startDate` is the issue date; `endDate` is the expiry date. For non-expiring certificates omit `endDate`
- Include `metadata.credentialId` and `metadata.credentialUrl` — these strengthen trust during endorsement review
- `description` should describe what the certificate validates, not just repeat its name

---

## Mapping from your job board

Your job board already has structured data for projects, experience, and certificates. Normalize your fields to SVP's source schema before calling the API.
```javascript
// Your job board's data shape
const jobBoardProject = {
  id: 'jb_proj_789',
  name: 'Payment Gateway Integration',
  summary: 'Razorpay backend integration using Python',
  company: 'Acme Corp',
  startMonth: '2023-01',
  endMonth: '2023-12',
};

// Map to SVP source schema
function mapProjectToSource(p) {
  return {
    type: 'project',
    id: p.id,
    title: p.name,
    description: p.summary,
    organization: p.company,
    startDate: `${p.startMonth}-01`,
    endDate: p.endMonth ? `${p.endMonth}-01` : null,
    current: !p.endMonth,
    metadata: { jobBoardId: p.id },
  };
}
```

---

## Source ID uniqueness rules

SVP uses `source.id` to enforce two rules:

1. **Max 10 unique skills per source** — all verifications sharing the same `source.id` count toward the same skill pool
2. **Verification deduplication** — same `skill + source.id + endorsementType` is blocked as a duplicate
```javascript
// Correct — stable IDs from your database
"id": "proj_001"
"id": "exp_acme_2022"
"id": "cert_aws_saa"

// Incorrect — labels that can duplicate or change
"id": "python project"
"id": "my job at acme"
```

---

## How description quality affects skill matching

When you pass a source to `POST /verifications`, the platform reads `title` and `description` together to infer the most relevant skills. Richer descriptions yield better automatic matches.
```json
// Minimal — low match accuracy
{
  "title": "Backend Project",
  "description": "Worked on backend stuff."
}

// Rich — high match accuracy
{
  "title": "Payment Gateway Integration",
  "description": "Led backend development using Python and Django. Designed REST APIs consumed by a React frontend. Managed PostgreSQL schema, wrote Docker Compose configs, and integrated with Razorpay for payment processing."
}
```

<Warning>
  Description quality directly affects which skills are suggested to the user in the popup and shown to the endorser in the email. Always pass the most complete description available from your job board.
</Warning>