---
title: "Parallel & Distributed: Message-Passing Interface (MPI)"
description: "Reading notes on Chapter 8: Message-Passing Interface (MPI). Covers the SPMD paradigm, distributed memory, MPI's API (Init, Finalize, Send, Recv, collective ops), & worked examples building up from hello-world to send/receive pipelines."
keywords:
  - "mpi"
  - "message passing"
  - "distributed memory"
  - "spmd"
  - "supercomputing"
  - "c-lang"
  - "parallel & distributed"
  - "reading notes"
  - "computer science"
  - "cs 451"
  - "illinois tech"
meta:
  byline: Andrew Chang-DeWitt
  published: "2026-04-07T00:00-06:00"
  updated: "2026-05-04T00:00-06:00"
---

> [!NOTE]
>
> reading notes on chapter 8 of the course textbook by Nik Sultana (© 2026,
> licensed CC BY-NC-SA 4.0). code samples largely unchanged from source material.

## agenda

- what is MPI & why it matters
- SPMD paradigm
- key API: MPI_Init, MPI_Finalize, Comm_size, Comm_rank
- point-to-point messaging: MPI_Send & MPI_Recv
- collective operations
- examples: size/rank, send/receive, send/recv loop
- hwloc & platform portability

## what is MPI?

_**def: MPI (Message-Passing Interface)**_&mdash;the state-of-the-art API for
programming supercomputers & clusters. standardized by the research community
over several decades; provides a portable API for computing on
_distributed-memory_ systems (clusters, supercomputers), abstracting the
underlying network transport (TCP, InfiniBand, Omni-Path, etc.).

in contrast to OpenMP/PThreads (shared memory), MPI distributes memory across
nodes—processes cannot directly read each other's memory.

_**def: SPMD (Single Program, Multiple Data)**_&mdash;a single program binary
is distributed across a distributed-memory infrastructure. each instance
behaves differently based on the data it's given & the communicator/rank it
is assigned.

_**def: rank**_&mdash;a unique integer identifier for a process within the
set of running MPI processes. used to differentiate behavior & address
messages to specific processes.

_**def: communicator**_&mdash;a communication domain grouping a set of MPI
processes. `MPI_COMM_WORLD` refers to the entire set of running processes.
processes can also be structured into topologies to restrict communication
paths.

## implementations

two open-source implementations of the MPI standard:

- **MPICH** — https://www.mpich.org/
- **Open MPI** — the `mpiexec` we use in this course

vendor-specific: Microsoft, Intel, Cray/HPE, IBM, etc. any standards-compliant
implementation should work w/ what we learn in this course.

## key tooling

- `mpicc` — not a compiler itself; a wrapper that invokes the C compiler w/
  MPI include paths & libraries added
- `mpiexec -n <N>` — run N instances of a program
- `mpiexec -f hosts` — run instances on hosts listed in a hosts file
- `lstopo` / `hwloc` — portable hardware locality tool; shows NUMA node
  structure, cache sizes, co-processors, etc.

### hwloc example output

```no-linenums
Machine (31GB total)
  NUMANode L#0 P#0 (31GB)
    L3 (16MB)
      L2 (512KB)
        L1d (64KB) + L1i (64KB)    (x3 cores)
```

fig 8.1 from the text shows cpu cache hierarchy; fig 8.2 shows gpu resources
also discoverable via lstopo.

## core API

```c
// initialize MPI context (must be first MPI call)
int MPI_Init(int *argc, char ***argv);

// get total number of processes in communicator
int MPI_Comm_size(MPI_Comm comm, int *size);

// get this process's rank within communicator
int MPI_Comm_rank(MPI_Comm comm, int *rank);

// finalize MPI context (must be last MPI call)
int MPI_Finalize(void);
```

### send & receive

```c
// send `count` items of `datatype` to `dest` process
int MPI_Send(void *buf, int count, MPI_Datatype datatype,
             int dest, int tag, MPI_Comm comm);

// receive into `buf` from `source` (or MPI_ANY_SOURCE)
int MPI_Recv(void *buf, int count, MPI_Datatype datatype,
             int source, int tag, MPI_Comm comm, MPI_Status *status);
```

example `MPI_Datatype` values: `MPI_CHAR`, `MPI_SHORT`, `MPI_INT`,
`MPI_UNSIGNED`, `MPI_FLOAT`, etc.

key notes on send/recv:

- data transfer is **strictly typed**: receiver must expect the same type
  as sender
- data can be "tagged" w/ a user-defined `int` label (use `0` for simple cases)
- `MPI_ANY_SOURCE` & `MPI_ANY_TAG` wildcards allow generic receives
- `MPI_Status` output field `MPI_SOURCE` identifies actual sender
- `MPI_Get_count` retrieves the size of the received data

## key examples

### example 1: hello world w/ size

```c
#include "mpi.h"
#include "stdio.h"

int
main (int argc, char **argv)
{
  MPI_Init(&argc, &argv);

  int size;
  MPI_Comm_size(MPI_COMM_WORLD, &size);

  printf("Size is %d\n", size);

  MPI_Finalize();
}
```

```sh
$ mpicc mpi1.c
$ mpiexec -n 5 ./a.out
Size is 5
Size is 5
Size is 5
Size is 5
Size is 5
```

all 5 instances print the same size; order of output is nondeterministic.

### example 2: rank-aware behavior

```c
MPI_Comm_size(MPI_COMM_WORLD, &size);
MPI_Comm_rank(MPI_COMM_WORLD, &rank);

printf("From rank %d: Size is %d\n", rank, size);
```

output (order nondeterministic):

```no-linenums
From rank 0: Size is 5
From rank 2: Size is 5
From rank 4: Size is 5
From rank 1: Size is 5
From rank 3: Size is 5
```

can also guard behavior on rank:

```c
if (0 == rank)
  printf("From rank %d: Size is %d\n", rank, size);
```

### example 3: send & receive between even/odd ranks

```c
if (0 == rank % 2) {
  int data = 5;
  MPI_Send(&data, 1, MPI_INT, (rank + 1) % 2, 0, MPI_COMM_WORLD);
  printf("Rank %d sent %d\n", rank, data);
} else {
  int result = -1;
  MPI_Status status;
  MPI_Recv(&result, 1, MPI_INT,
           MPI_ANY_SOURCE, MPI_ANY_TAG, MPI_COMM_WORLD, &status);
  printf("Rank %d received %d\n", rank, result);
}
```

w/ `-n 2` this works fine. w/ `-n 4`, rank 3 never receives & the program
hangs (deadlock)—a good illustration of the need to carefully reason about
communication patterns.

### example 4: send/recv loop w/ sentinel

```c
if (0 == rank % 2) {
  for (int data = 5; data > 0; data--) {
    MPI_Send(&data, 1, MPI_INT, (rank + 1) % 2, 0, MPI_COMM_WORLD);
  }
} else {
  int result = -1;
  do {
    MPI_Status status;
    MPI_Recv(&result, 1, MPI_INT,
             MPI_ANY_SOURCE, MPI_ANY_TAG, MPI_COMM_WORLD, &status);
  } while (result > 0);
}
```

note the off-by-one bug: the loop sends values 5 down to 1 but the sentinel
value (0) is never sent, causing the receiver to loop forever. fixed by
sending down to (& including) 0.

### example 5: sender/receiver w/ named roles

```c
#define SENDER   0
#define RECEIVER 1

switch (rank) {
  case SENDER: {
    int data = rand() % 10;
    printf("SENDER: %d\n", data);
    MPI_Send(&data, 1, MPI_INT, RECEIVER, 0, MPI_COMM_WORLD);
    break;
  }
  case RECEIVER: {
    int data = -1;
    MPI_Status status;
    MPI_Recv(&data, 1, MPI_INT,
             MPI_ANY_SOURCE, MPI_ANY_TAG, MPI_COMM_WORLD, &status);
    printf("RECEIVER: %d from %d\n", data, status.MPI_SOURCE);
    break;
  }
  default: assert(0);
}
```

## collective communication

_**def: collective**_&mdash;a communication pattern involving more than two
processes simultaneously.

examples:

- `MPI_Bcast` — one process broadcasts to all others
- `MPI_Scatter` / `MPI_Gather` — distribute/collect data across all processes
- `MPI_Reduce` — apply a reduction (sum, max, etc.) over data spread across
  processes, sending result to one (or all, via `MPI_Allreduce`) process

## communication types

- _**point-to-point**_&mdash;one process sends data directly to another
- _**collective**_&mdash;all (or a subset of) processes in a communicator
  participate simultaneously

> [!TODO]
>
> the chapter suggests working through these exercises to solidify
> understanding:
>
> - sending a value through a pipeline of processes
> - having each process produce a random value, then finding the maximum
> - implementing dining philosophers
>
> these are good practice for reasoning about communication patterns &
> deadlock avoidance.
