---
title: "Edge Cases"
description: "Validation rules for human endorsement and assessment verification flows."
---

## Human endorsement rules

| Scenario | Allowed? | Behavior |
|---|---|---|
| Same skill + same source + same endorsement type | ❌ Blocked | System returns error: change source, type, or skill |
| Same skill + same source + different endorsement type | ✅ Allowed | Each type is a separate trust signal |
| Skill bundle with already-verified skill (same type) | ❌ Blocked | That skill must be removed from the bundle |
| Skill bundle with already-verified skill (different type) | ✅ Allowed | Cross-type bundling is valid |
| Duplicate skill in same source | ❌ Blocked | Source enforces unique skills only |
| More than 10 skills per source | ❌ Blocked | Max 10 unique skills per source |

## Assessment rules

| Scenario | Allowed? | Behavior |
|---|---|---|
| Same skill + same source, already passed | ❌ Blocked | Cannot retake a passed assessment |
| Assessment failed | ✅ Allowed | Retake available per retry policy |
| Assessment paused | ✅ Allowed | Resume or retake available |
| Resend verification | ✅ Allowed | Resend endorsement email or reassessment link |