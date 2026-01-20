---
title: "Parallel & Distributed: getting started w/ FABRIC testbed"
description: "."
keywords:
  - "fabric"
  - "parallel & distributed"
  - "lecture notes"
  - "computer science"
  - "cs 451"
  - "illinois tech"
meta:
  byline: Andrew Chang-DeWitt
  published: "2026-01-15T10:00-06:00"
  updated: "2026-01-19T22:00-06:00"
---

## agenda

- what is FABRIC?
- jargon

## what is FABRIC?

a _testbed_, like ARPANET, for research & governmental purposes used to
play with the ideas of networking & distributed computing.

in this course, we'll use it as a platform assignments/projects for
hands on demonstrations of working on distributed systems. additionally
it gives some uniformity, easing learning.

### what is _not_ FABRIC

a physical h/w platform that must be maintained/operated by all
researchers using it (although there _is_ h/w that is operated by
professionals mostly).

### what can you do with FABRIC?

- ex 1: patchwork
  - a tool for making observations on the state of FABRIC
  - visualizations, analysis, etc.
- ex 2: crinkle
  - debugging tools for dist. sys.
  - ui
- large-scale experiments
  - trigger primative generation (TPG)
  - clusters, tracks, etc.

## jargon

- _**site**_&mdash;aka _node_; a location in the network, containing racks of
  servers, or as they're called in FABRIC...
- ..._**worker**_&mdash; a single server, containing physical
- _**resource**s_&mdash;various distributed h/w elements available, including
  ram, cpu, storage, etc.
- _**slice**_&mdash;the key unit of assignment; a set of resources across FABRIC
- _**sliver**_&mdash;a portion of a slice w/out dedicated access to resources,
  e.g. a VM (incidentally, a VM is called a _**node**_ in FABRIC lingo)
