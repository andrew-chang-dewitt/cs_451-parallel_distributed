---
title: "Parallel & Distributed: low-level programming"
description: "Reading notes on Chapter 6: Low-level programming. Covers the x86-64 ISA review, reading & writing assembly, the System V AMD64 ABI calling conventions, intrinsics, and architecture-provided synchronization primitives."
keywords:
  - "x86"
  - "assembly"
  - "isa"
  - "intrinsics"
  - "gdb"
  - "low-level programming"
  - "parallel & distributed"
  - "reading notes"
  - "computer science"
  - "cs 451"
  - "illinois tech"
meta:
  byline: Andrew Chang-DeWitt
  published: "2026-03-12T00:00-06:00"
  updated: "2026-05-04T00:00-06:00"
---

> [!NOTE]
>
> reading notes on chapter 6 of the course textbook by Nik Sultana (© 2025,
> licensed CC BY-NC-SA 4.0). code samples largely unchanged from source material.

## agenda

- x86-64 ISA review
- assembly code & tooling (gcc, objdump, gdb)
- system v amd64 abi & calling conventions
- intrinsics & the rdtsc example
- synchronization primitives: CMPXCHG

## x86-64 ISA

_**def**_&mdash;an _Instruction Set Architecture_ (ISA) comprises the
instructions & resources that a processor exposes to the programmer. the
x86-64 ISA is a "complex" architecture: individual instructions can carry
out several (seemingly independent) tasks, e.g. obtaining data from memory,
computing on it, or conditionally copying memory. machine codes in x86 range
between 1 & 15 bytes (simpler architectures have shorter, fixed-width codes).

the basic mental model: compute on a single item of data at a time on each
processing core. computing involves moving data between memory & registers &
performing calculations on register contents.

### system v amd64 abi

the _System V AMD64 ABI_ defines the _calling conventions_ for x86-64—i.e.,
how registers are to be used when passing parameters to procedure calls &
receiving results.

also important: memory layout of programs—stack frames, heap memory, etc.—&
the ISA's status flags.

another concept that shows up here: _**RIP-relative addressing**_—an
addressing mode where addresses are computed relative to the instruction
pointer (RIP), which comes up when going from assembly source to linked
compiled code.

> [!ASIDE]
>
> ## tooling workflow
>
> the workflow for assembly programming revolves around inspecting `-S` output,
> modifying it, & compiling. key tools:
>
> - `gcc -S` / `gcc -S -masm=intel` (AT&T syntax is default; intel syntax opt-in)
> - `objdump -t` (symbols) & `-D` (disassembly)
> - `nm` (symbol listing)
> - `gdb` for stepping through source & assembly
>
> ### gdb commands to know
>
> ```no-linenums
> set args
> run
> break / clear
> continue
> next
> step / stepi
> disassembly
> info
> registers
> backtrace
> frame
> up / down
> print/[d,a,s] x/[d,l,s]
> layout / focus (tui)
> ```
>
> the most important command is `help <command>`.

## key code examples

### summing integers → assembly

```c
// Summing two integers
int
summation_int (int x, int y)
{
  return (x + y);
}

// Summing two integers and returning a long
long
summation_int_to_long (int x, int y)
{
  return ((long)(x + y));
}

// Summing two longs
long
summation_long (long x, long y)
{
  return (x + y);
}
```

compiles to:

```asm
    .file   "1.c"
    .text
    .globl  summation_int
    .type   summation_int, @function
summation_int:
.LFB0:
    .cfi_startproc
    endbr64
    leal    (%rdi,%rsi), %eax
    ret
    .cfi_endproc
.LFE0:
    .size   summation_int, .-summation_int
    .globl  summation_int_to_long
    .type   summation_int_to_long, @function
summation_int_to_long:
.LFB1:
    .cfi_startproc
    endbr64
    addl    %esi, %edi
    movslq  %edi, %rax
    ret
    .cfi_endproc
.LFE1:
    .size   summation_int_to_long, .-summation_int_to_long
    .globl  summation_long
    .type   summation_long, @function
summation_long:
.LFB2:
    .cfi_startproc
    endbr64
    leaq    (%rdi,%rsi), %rax
    ret
    .cfi_endproc
.LFE2:
    .size   summation_long, .-summation_long
    .ident  "GCC: (Ubuntu 9.4.0-1ubuntu1~20.04.2) 9.4.0"
    .section    .note.GNU-stack,"",@progbits
    .section    .note.gnu.property,"a"
    .align  8
    .long   1f - 0f
    .long   4f - 1f
    .long   5
0:
    .string "GNU"

1:
    .align 8
    .long   0xc0000002
    .long   3f - 2f

2:
    .long   0x3

3:
    .align 8

4:
```

### hello world → assembly

```c
#include <stdio.h>
int main () {
  printf("Hello, world\n");
  return 0;
}
```

generates assembly w/ `.rodata` section for the string literal, a `leaq`
loading its RIP-relative address into `%rdi`, then a `call puts@PLT`.

```asm
    .file   "2.c"
    .text
.Ltext0:
    .section    .rodata
.LCO:
    .string "Hello, world"
    .text
    .globl  main
    .type   main, @function
main:
.LFB0:
    .file   1 "2.c"
    .loc    1 5 1
    .cfi_startproc
    endbr64
    pushq   %rbp
    .cfi_def_cfa_offset 16
    .cfi_offset 6, -16
    movq    %rsp, %rbp
    .cfi_def_cfa_register   6
    .loc    1 6 3
    leaq    .LCO(%rip), %rdi
    call    puts@PLT
    .loc    1 7 10
    movl    $0, %eax
    .loc    1 8 1
    popq    %rbp
    .cfi_def_cfa    7, 8
    ret
    .cfi_endproc
.LFE0:
    .size   main, .-main

```

> [!ASIDE]
>
> the generated assembly contains a lot of metadata (`.file`, `.size`,
> `.section .note.GNU-stack`, etc.) in addition to the actual code.
> understanding where that metadata comes from & what it does is a useful
> exercise.

## intrinsics

_**def**_&mdash;an _intrinsic_ is a compiler built-in that maps to one or
more assembly instructions. using intrinsics lets the compiler handle register
& stack allocation while still giving access to specific hardware instructions.

> [!ASIDE]
>
> intrinsics will be v important in coming section on vector computing.

example: measuring overhead using the RDTSC instruction via the `__rdtsc()`
intrinsic:

```c
#include "omp.h"
#include "x86intrin.h"
#include "stdlib.h"
#include "stdio.h"

#define COUNT 10000

int
main ()
{
  unsigned long start, end;

  start = __rdtsc();
  for (int i = 0; i < COUNT; i++)
    omp_get_wtime();
  end = __rdtsc();

  printf("Function took %lu cycles\n", ((end - start) / COUNT));
}
```

> [!TODO]
>
> exercise: rewrite the above to use inline assembly instead of intrinsics.
> understanding the difference (& when each is preferable) would be useful
> followup study.

## synchronization primitives: CMPXCHG

architecture-provided synchronization primitives allow building
language-level concurrency abstractions (e.g. mutexes, pthreads, OpenMP).

_**def**_&mdash;_CMPXCHG_ (compare-and-exchange) is an x86 instruction that
atomically compares the value in a register w/ a memory location & exchanges
them if equal. was introduced on single-core targets to improve multi-tasking
support; requires the `LOCK` prefix in parallel (multi-core) settings. [see
more @ felixcloutier.com](https://www.felixcloutier.com/x86/cmpxchg)

> [!NOTE]
>
> these architecture-provided primitives underpin the higher-level
> abstractions (like those in pthreads & OpenMP) that we use throughout
> the course.

## exploring the ISA further

- browse the instruction set for interesting instructions—e.g., `RDSEED`
- use _Agner Fog's instruction tables_ to find approximate cycle counts for
  any given instruction (see https://www.agner.org/optimize/instruction_tables.pdf)
- see also Abel et al.'s work at https://uops.info/
