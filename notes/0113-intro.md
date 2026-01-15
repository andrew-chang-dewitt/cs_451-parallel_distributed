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
  published: "2026-01-13T10:00-06:00"
  updated: "2026-01-15T09:00-06:00"
---

> [!NOTE]
>
> for my purposes, I'll be collecting all course materials (including
> these notes) at a single git repository, made available on GitHub at
> [https://github.com/andrew-chang-dewitt/cs_451-parallel_distributed](https://github.com/andrew-chang-dewitt/cs_451-parallel_distributed).

## why parallel & distrubted matter?

not much of a motivation is needed these days given modern computing's reliance
on networking multiple devices together.

examples mentioned:

- conways game of life
- llm development/running
  - typically run on GPUs using 1000s of cores, meaning workloads need split
    into parallel computations in order to leverage full capabilities
- cryptography (for the same reason as llms)

## what is it?

an analogy from the prof:

imagine you have a single wheelbarrow & a pile of stuff to move that will take
many loads. you can get it all done w/ one wheelbarrow, but it will take some
set amount of time. how can you do it faster?

option 1: get a motorized wheelbarrow. it can now go faster w/ less effort,
shortening your time. if you get one that lets you move 5x as fast, then you
may be able to get it done 5x faster.

option 2: get a wheelbarrow that's 5x bigger. same theoretical speedup.

option 3: get 5 wheelbarrows & people to push them all.

what's the difference between these three option?

well, option 1 has an upper limit because if you start going to fast then
everything falls out &/or the wheelbarrow becomes too hard to control. option
2 will be extremely hard to push, so it might actually be slower. option 3 lets
you speed up almost the entire 5x amount, assuming you can coordinate each
wheelbarrow's loading, unloading, & traveling so as to not get in one another's
way or attempt to duplicate eachother's work.

this example shows how parallel computing might speed things up, but it can
also show how a system can become more resilient (if one wheelbarrow breaks,
there's still 4 more working while you fix the 5th) & be more scalable (you can
add or remove wheelbarrows depending on the size of the pile of stuff to move &
your priority for the job).

## what makes it hard?

parallism & distributed computing comes w/ lots of challenges around race
conditions, partial failures, & more. there are some tools that programmers can
use to assist in managing these difficulties (e.g. synchronization w/ atomic
primitives or locks, SIMD, message passing/shared memory); however, they are
not simple concepts themselves & come with a learning curve.

## how do we measure the benefits?

historically, we assumed parallelism introduced too many complexities that
begat too many slowdowns (see challenges above) to find it very
useful&mdash;especially when viewed in context of the common model of task
speedup granted via paralellism of the time: Amdahl's model:

$$
\begin{gather}
\textit{time as a function of num. steps required} \nonumber \\
T: \mathbb{N}_1 \longrightarrow \mathbb{N} \nonumber \\
\nonumber \\
\textit{using $T$ to compute speed-up ratio} \nonumber \\
\frac{T(1)}{T(N)} \nonumber \\
\textit{which compares time to complete program w/ 1 core vs. $N$ cores} \nonumber \\
\textit{and non-parallel portion of program given as $\sigma$} \nonumber \\
\sigma \in \real, \text{ s.t. } 0 \leq \sigma \leq 1 \nonumber \\
\nonumber \\
\textit{all of which gives us the speedup gained} \nonumber \\
\textit{by using $N$ cores in terms of T(1) as} \nonumber \\
T(N) = \sigma T(1) + \frac{(1 - \sigma)T(1)}{N}
\end{gather}
$$

because this function $T(N)$ has a term w/ a denominator of $N$, the gains
granted by increasing the nubmer of cores, $N$, have a hard upper limit.
however, an alternative model, proposed by Gustafson 20 years later, takes a
different approach. instead of calculating speedup factor in terms of T(1), it
asks how much more time a program would take to complete with only 1 core
compared to $N$ cores:

$$
\begin{gather}
\textit{time as a function of num. steps required} \nonumber \\
T(1) = \sigma + (1 - \sigma)T(N)
\end{gather}
$$

this model shows a linear increase in speed as cores are added.
