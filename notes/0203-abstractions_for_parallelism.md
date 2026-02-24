---
title: "Parallel & Distributed: abstractions for parallelism"
description: "A discussion (& definition) of some important abstractions for implementing parallel systems. Covers ideas such as concurrent/parallel/distributed systems, sync/async execution, etc.."
keywords:
  - "abstractions"
  - "jargon"
  - "system design"
  - "parallel & distributed"
  - "lecture notes"
  - "computer science"
  - "cs 451"
  - "illinois tech"
meta:
  byline: Andrew Chang-DeWitt
  published: "2026-02-03T10:00-06:00"
  updated: "2026-02-23T10:00-06:00"
---

## agenda

- concurrent vs. parallel vs. distrubted
- sync vs. async
- state management (ipc)
  - shared memory
  - message passing

## concurrent vs. parallel vs. distrubted

> [!TODO]

## sync vs. async

_def: **synchronous**_&mdash;work is done in order w/ no interruptions; when
needing a response from something else, a synchronous task must wait. by
comparison, an _def: **asynchronous**_ task is one that can be interrupted when
waiting, allowing for other workers to use resources while this task waits for
what it needs. while async can greatly speed up work that requires a lot of
waiting (i.e. io-bound work), it can also lead to blocking/deadlocks/race
conditions if not managed carefully.

one concept that can help manage race conditions/deadlocks is to define some
portions of a job as a _**critical section**_, marking it as uninterruptable by
other work, to guarantee that it will finish that portion of work & ideally
give guarantees about the state it operates on before & after the critical
section (i.e. making this portion into an _**atomic**_ operation).

## state management (ipc)

in decoupled (concurrent/parallel/distributed) programming, there's two main
ways of sharing state between separate parts (workers) in a program/system:

1. shared memory
2. message passing

called _**interprocess communication** (ipc)_ both allow for separate
nodes/processes/threads in a system to share state & communicate across
compartment boundaries.

### shared memory

a (sometimes) simpler method, when two+ workers have access to the same segment
of memory, allowing them to read/update the same state. this _can_ be very
fast, but requires careful coordination to avoid race conditions.

this is historically only possible in concurrent & parallel systems, as
parallel systems are on separate machines w/ separate memory hardware. however,
this isn't entirely true.

a simple example of the blurriness of shared memory over separate systems can
be found in everyday machines w/ PCIe. the way that PCIe connects hardware
peripherals within a single computer (e.g. cpu to gpu) allows those peripherals
to share memory despite being separate systems. this sharing of memory is
called _**direct memory access (DMA)**_.

a networked equivalent relevant to distributed computing is _**remote direct
memory access (RDMA)**_&mdash;a means of sharing memory resources over a
network, providing the illusion (abstraction) that all the memory nodes across
a system of networked devices are just one big pool (e.g. providing
memory&mdash;or cache&mdash;_**coherence**_).

### message passing
