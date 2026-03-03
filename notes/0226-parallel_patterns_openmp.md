---
title: "Parallel & Distributed: parallelization via abstractions"
description: "Digging into patterns of parallel programming & abstractions that generalize these patterns. Explores OpenMP, a C/C++ abstraction using the fork-join pattern."
keywords:
  - "TODO"
  - "parallel & distributed"
  - "lecture notes"
  - "computer science"
  - "cs 451"
  - "illinois tech"
meta:
  byline: Andrew Chang-DeWitt
  published: "2026-02-26T10:00-06:00"
  updated: "2026-03-02T10:00-06:00"
---

## agenda

- TODO

## TODO

parallel computing w/ openmp, a c preprocessor pragma for parallelizing parts
of a program:

```c
#pragma omp parallel for private(i)
for (i=0;i<d;i++) {
  float val = 0.0f;
  for (int j = 0;j<n;j++) {
    val += half_to_float(w[i*n+j]) * x[j];
  }
  xout[i] = val;
}
```

taking a step back, examine our count example from before. it's using the
**fork-join**; a pattern for using threads to parallelize a program. the openmp
pragma above actually uses the same pattern to parallelize the for loop.

```c
#include <stdio.h>

volatile int count = 0;
const int max = 10000;

void worker() {
  for (int i = 0;i<max;i++) {
    count++;
  }
}

int main() {
  pthread_t t1, t2;

  pthread_create(&t1, NULL, worker, NULL);
  pthread_create(&t2, NULL, worker, NULL);
  pthread_join(t1, NULL);
  pthread_join(t2, NULL);

  // we want this to be 2 * max (assuming no data races)!
  // spoiler: there are data races, look at mutexes to solve,
  //          or rework w/ associativity
  printf("count is %d", count);
}
```

we can build something very similar to this example using openmp, abstracting
the spawning & joining of threads w/ a quick pragma:

```c
#include "omp.h"

// globals & `worker` same as before...

int main() {
#pragma omp parallel
  worker();

  // we want this to be 2 * max (assuming we also solved data races)!
  printf("count is %d", count);
}
```

some observations to note: before, we were able see clearly how many threads
are created&mdash;now w/ openmp pragma, however, we don't know many things,
including how many threads are spawned. see a simple hello world, for example:

```c
#include "omp.h"

int main() {
#pragma omp parallel
  printf("Hello world!");
}
```

how many times will this print? well, that depends on how many cores are
available. on my system, it looks like it was 12:

```
andrew@topo: ~/college/cs_451-parallel_distributed
$ gcc -fopenmp notes/examples/omp_hello.c

andrew@topo: ~/college/cs_451-parallel_distributed
$ ./a.out
Hello world!
Hello world!
Hello world!
Hello world!
Hello world!
Hello world!
Hello world!
Hello world!
Hello world!
Hello world!
Hello world!
Hello world!

andrew@topo: ~/college/cs_451-parallel_distributed
$ lscpu | grep Core
Core(s) per socket:                   12
```

> [!TODO]
>
> - touch on nondeterminism of pragma
> - show how above reimpl of count actually doesn't work, introduce solution w/ `for` arg to pragma & data race solution
> - get into some observability w/ omp's ability to see num threads & current thread id, + measure time for perf
