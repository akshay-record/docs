---
title: "Skills"
description: "List available skills and understand how skills are matched to source data."
---

## List available skills

`GET /skills`

Returns the master list of skills from the platform database. Skills are matched against source data passed from your job board.

## Skills-source matching

When you pass source details (experience, project, or certificate fields including title, description, and dates), the platform automatically matches relevant skills from the database to those fields. You do not need to precompute skill matches.