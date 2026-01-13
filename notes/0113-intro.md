---
title: "Parallel & Distributed: intro"
description: "Intruductory lecture notes."
keywords:
  - "parallel & distributed"
  - "lecture notes"
  - "computer science"
  - "cs 451"
  - "illinois tech"
meta:
  byline: Andrew Chang-DeWitt
  published: "2026-01-13T00:00-06:00"
---

## why parallel & distrubted matter?

not much of a motivation is needed these days given modern computing's reliance on networking multiple devices together.

examples mentioned:

- conways game of life
- llm development/running
  - typically run on GPUs using 1000s of cores, meaning workloads need split into parallel computations in order to leverage full capabilities
- cryptography (for the same reason as llms)
