---
title: "Parallel & Distributed: vector processing"
description: "Reading notes on Chapter 7: Vector processing. Covers packed values in vector registers, SIMD lanes, x86 vector extensions (MMX/SSE/AVX), intrinsics for vector programming, & key code examples."
keywords:
  - "simd"
  - "vector processing"
  - "avx"
  - "sse"
  - "intrinsics"
  - "x86"
  - "c-lang"
  - "parallel & distributed"
  - "reading notes"
  - "computer science"
  - "cs 451"
  - "illinois tech"
meta:
  byline: Andrew Chang-DeWitt
  published: "2026-03-26T00:00-06:00"
  updated: "2026-05-04T00:00-06:00"
---

> [!NOTE]
>
> reading notes on chapter 7 of the course textbook by Nik Sultana (© 2025,
> licensed CC BY-NC-SA 4.0). code samples largely unchanged from source material.

## agenda

- scalar vs. packed values & vector registers
- x86 vector extensions (MMX, SSE, AVX, AVX-512)
- intrinsics for vector programming
- key examples: add4floats, add8floats, calc2
- auto-vectorization vs. manual vectorization

## key concepts

_**def: scalar value**_&mdash;a single data item computed on one processing
core at a time. the typical model from basic low-level programming.

_**def: packed value**_&mdash;a register value encoding an array/vector of
multiple data values. each sub-value lives in its own _lane_.

_**def: lane**_&mdash;a subdivision of a vector register holding a single
data item. all lanes in a register are assumed to hold the same type (e.g.
all signed ints, or all single-precision floats).

example: a 128-bit XMM register can be split into either:

- 2 lanes of 64-bit values, or
- 4 lanes of 32-bit values

> [!IMPORTANT]
>
> _register segments_ (al, ah, ax, eax, rax) & _lanes_ are related but
> different concepts. segments let you locate a single value within a
> general-purpose register; instructions for segments assume the register
> holds just that one value. vector instructions, by contrast, are grouped
> into families that simultaneously process all lanes of a register.

```no-linenums
  general-purpose register segments (scalar value)
+---------------------------+-------------+-------------+
|                           |             |     ax      |
|           rax             |     eax     +------+------+
|                           |             |  ah  |  al  |
+---------------------------+-------------+------+------+
64                          32            16            0
                       width (bits)

64            48            32            16            0
+-------------+-------------+-------------+-------------+
|    x_3      |   x_2       |   x_1       |   x_0       |
+-------------+-------------+-------------+-------------+
+-------------+-------------+-------------+-------------+
|    y_3      |   y_2       |   y_1       |   y_0       |
+-------------+-------------+-------------+-------------+
  vector register lanes (packed)
    - shown here:
        MMX e.g. 16-bit lane width
    - other registers w/ larger lane widths exist:
        XMM e.g. 128-bit
        YMM e.g. 256-bit
        ZMM e.g. 512-bit

  above shows 2 vector registers, `x` & `y`
    - a built-in vector op, `f(...)`, may take both as
      input & give their result as
+-------------+-------------+-------------+-------------+
| f(x_3,y_3)  | f(x_2,y_2)  | f(x_1,y_1)  | f(x_0,y_0)  |
+-------------+-------------+-------------+-------------+
```

notes:

- MM, XMM & YMM are segments within ZMM
- any x86-64 processor must also support SSE2
- AVX-512 provides 512-bit ZMM registers
- we assume AVX2 support, giving 16 256-bit registers (`ymm0`–`ymm15`)

> [!ASIDE]
>
> MMX initially only supported packed integers. SSE introduced floating-point
> packed operations.

## intrinsics for vectors

rather than writing inline assembly by hand, _intrinsics_ can be used to
access vector instructions. the compiler handles register & stack allocation,
& an intrinsic may map to multiple instructions.

### key types (AVX/AVX2)

- `__m128`&mdash;128-bit, single-precision floats (4 lanes)
- `__m256`&mdash;256-bit, single-precision floats (8 lanes)
- `__m256i`&mdash;256-bit, integers (any precision)
- `__m256d`&mdash;256-bit, double-precision floats (4 lanes)

## key code examples

### add 4 floats: plain vs. SSE intrinsics

```c
// gcc example.c -c -S -mavx2
#include <immintrin.h>

// plain version: scalar loop
void
add4floats_plain (float x[4], float y[4], float out[4])
{
  // out[] = x[] + y[]
  // for each i (where 0 <= i < 4): out[i] = x[i] + y[i]
  for (int i = 0; i < 4; i++) {
    out[i] = x[i] + y[i];   // scalar: one addition per iteration
  }
}

// SSE intrinsics version: load 4 floats into 128-bit regs, add all 4 at once, store
void
add4floats(float in1[4], float in2[4], float out[4])
{
  __m128 x   = _mm_loadu_ps(in1);   // load 4 floats from in1 → 128-bit XMM register (unaligned)
  __m128 y   = _mm_loadu_ps(in2);   // load 4 floats from in2 → 128-bit XMM register (unaligned)
  __m128 sum = _mm_add_ps(x, y);    // add all 4 lanes simultaneously (packed single-precision)
  _mm_storeu_ps(out, sum);           // store 4-lane result back to memory (unaligned)
}
```

### add 8 floats: AVX intrinsics (256-bit)

```c
void
add8floats(float in1[8], float in2[8], float out[8])
{
  __m256 x   = _mm256_loadu_ps(in1);   // load 8 floats from in1 → 256-bit YMM register (unaligned)
  __m256 y   = _mm256_loadu_ps(in2);   // load 8 floats from in2 → 256-bit YMM register (unaligned)
  __m256 sum = _mm256_add_ps(x, y);    // add all 8 lanes simultaneously
  _mm256_storeu_ps(out, sum);           // store 8-lane result back to memory (unaligned)
}
```

### accumulation w/ AVX (calc2)

a slightly more complex example&mdash;shifting from adding two arrays
element-wise to accumulating (summing) a single array. a scalar version
(`calculate`) with an 8-way manually unrolled inner loop comes first, followed
by `calculate_vec` which accumulates across two arrays. `calc2` is the
AVX-intrinsics version of the same idea: it keeps a running total in a 256-bit
vector register so that 8 additions happen in parallel per loop iteration, then
collapses the 8-lane result into a scalar total at the end.

```c
#include "stdio.h"
#include "immintrin.h"
#include "x86intrin.h"

void
calc2 (int SIZE, float data[])
{
  __m256 totalMM;
  float total = 0.0f;

  // initialize all 8 lanes of the accumulator to 0.0
  totalMM = _mm256_set_ps(0.0f, 0.0f, 0.0f, 0.0f,
                          0.0f, 0.0f, 0.0f, 0.0f);

  for (int i = 0; i < SIZE; i+=8) {
    // pack 8 consecutive floats from data[] into a 256-bit register
    __m256 step = _mm256_set_ps(data[i+0], data[i+1],
                                data[i+2], data[i+3],
                                data[i+4], data[i+5],
                                data[i+6], data[i+7]);
    // add all 8 lanes of step to the corresponding lanes of totalMM (8 adds at once)
    totalMM = _mm256_add_ps(step, totalMM);
  }

  float buf[8];
  _mm256_store_ps(buf, totalMM);   // store the 8-lane vector result to a scalar buffer (aligned)
  // collapse the 8-lane sum into a single scalar total
  total = buf[0] + buf[1] + buf[2] + buf[3]
        + buf[4] + buf[5] + buf[6] + buf[7];
}
```

the `_mm256_store_ps` call (aligned) writes the 8-lane result back to an
8-float buffer, then the final scalar sum collapses all 8 lanes.

### measuring performance across approaches

the chapter includes a benchmark comparing three approaches over the same
floating-point data:

1. naive scalar loop (`total += data[i]`)
2. manually unrolled loop (8 additions per iteration)
3. AVX intrinsics accumulation (`calc2` above)

measured w/ `__rdtsc()` to count CPU cycles. output:

```no-linenums
1: Total=<val> Time taken=<N> cycles
2: Total=<val> Time taken=<N> cycles
3: Total=<val> Time taken=<N> cycles
```

## compile flags

```sh
# compile w/ AVX2 support & emit assembly
gcc test.c -mavx2 -S -o test.s

# add optimization (enables auto-vectorization)
gcc test.c -mavx2 -O3 -mtune=haswell -S -o test.s

# additional flags to investigate
gcc test.c -mavx512bw -mtune=haswell -O3 -ftree-vectorize -S
```

## auto-vectorization vs. manual vectorization

_**auto-vectorization**_&mdash;the compiler can automatically convert scalar
code to use vector instructions. controlled via optimization flags like `-O3`
& `-ftree-vectorize`.

_**manual vectorization**_&mdash;programmer explicitly specifies the vector
registers & instructions using intrinsics (or inline assembly). more control,
but more effort.

> [!NOTE]
>
> to use gdb w/ vector code: `nexti` through the code, use `info reg all`
> or `tui reg vector` to see vector registers. `layout asm` & `layout reg`
> are also useful.

> [!TODO]
>
> the chapter references a SIMD example from analyzing an LLM inference
> function (`_ZL6matmulPfS_Ptii._omp_fn.0` in `yalm/build/asm/src/infer.s`).
> working through that example end-to-end would be worthwhile followup.
