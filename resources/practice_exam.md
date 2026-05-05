# CS 451: Parallel & Distributed Computing
## Practice Exam

**Total: 54 marks**

> This practice exam covers material from the full course. ~70% of questions
> draw from OpenMP, Low-Level Programming, MPI, CUDA, and SystemVerilog.
> The remaining ~30% draw from introductory topics including speedup models,
> IPC/abstractions, data races, and software compartmentalization.

---

## Question 1 — Speedup Models (3 marks)

Amdahl's Law and Gustafson's Law are two models for reasoning about parallel
speedup.

**1a.** (1 mark) State the key mathematical distinction between the two models:
what does each model hold constant as cores are added?

> Answer:

**1b.** (1 mark) Using Amdahl's model, if the serial fraction of a program is
σ = 0.25, what is the **theoretical maximum speedup** achievable, regardless
of how many cores are used? Show your reasoning.

> Answer:

**1c.** (1 mark) Which model predicts **linear** scaling as cores are added?

> Answer:

---

## Question 2 — Inter-Process Communication (4 marks)

**2a.** (1 mark) What does the abbreviation **IPC** stand for, and in what
context is it used in parallel and distributed programming?

> Answer:

**2b.** (1 mark) Give **one advantage** of shared memory IPC over message
passing.

> Answer:

**2c.** (1 mark) Give **one advantage** of message passing IPC over shared
memory.

> Answer:

**2d.** (1 mark) What technology enables memory sharing between a CPU and a GPU
over a PCIe bus within a single computer?

> Answer:

---

## Question 3 — Data Races & Synchronization Primitives (3 marks)

**3a.** (1 mark) Define a **data race**.

> Answer:

**3b.** (1 mark) The `volatile` keyword in C is sometimes used in multi-threaded
programs to force loads/stores to go directly to memory. Does `volatile` prevent
data races? Explain briefly why or why not.

> Answer:

**3c.** (1 mark) Name the x86-64 instruction that provides an **atomic**
compare-and-exchange operation and is used as the foundation for higher-level
concurrency primitives (e.g., mutexes, OpenMP).

> Answer:

---

## Question 4 — Low-Level Programming & the x86-64 ISA (6 marks)

Consider the following C function and its x86-64 AT&T-syntax assembly output
(generated with `gcc -S`):

```c
long summation_long(long x, long y)
{
  return (x + y);
}
```

```asm
summation_long:
    endbr64
    leaq    (%rdi,%rsi), %rax
    ret
```

**4a.** (1 mark) According to the **System V AMD64 ABI**, in which register is
the **first** integer/pointer argument passed?

> Answer:

**4b.** (1 mark) In which register is the **return value** placed?

> Answer:

**4c.** (1 mark) Describe in plain English what the `leaq (%rdi,%rsi), %rax`
instruction does.

> Answer:

**4d.** (1 mark) What is the purpose of the `endbr64` instruction that the
compiler inserts?

> Answer:

**4e.** (1 mark) What `gcc -S` flag would you add to emit **Intel syntax**
instead of AT&T syntax?

> Answer:

**4f.** (1 mark) Name the GDB command used to step through **one assembly
instruction at a time** (rather than by source line).

> Answer:

---

## Question 5 — OpenMP (6 marks)

**5a.** (1 mark) Write the `#pragma` directive you would add immediately before
the following loop to parallelize it with OpenMP:

```c
for (int i = 0; i < N; i++) {
    out[i] = compute(in[i]);
}
```

> Answer:

**5b.** (1 mark) By default (with no explicit thread-count setting), how many
threads does `#pragma omp parallel` spawn on a given machine?

> Answer:

**5c.** (1 mark) What **compiler flag** is required to compile a C file that
uses OpenMP?

> Answer:

**5d.** (2 marks) Describe the **fork-join** execution pattern as it applies
to OpenMP. Your answer should explain what happens at the start and end of a
parallel region.

> Answer:

**5e.** (1 mark) The following code is intended to count elements but contains
a **data race**. Rewrite the `#pragma` line to fix it using a built-in OpenMP
mechanism:

```c
int count = 0;
#pragma omp parallel for
for (int i = 0; i < N; i++) {
    if (data[i] > 0) count++;
}
```

> Corrected `#pragma` line:

---

## Question 6 — MPI (9 marks)

Consider the following MPI program:

```c
#include "mpi.h"
#include "stdio.h"

int main(int argc, char **argv)
{
  MPI_Init(&argc, &argv);

  int rank, size;
  MPI_Comm_rank(MPI_COMM_WORLD, &rank);
  MPI_Comm_size(MPI_COMM_WORLD, &size);

  if (0 == rank % 2) {
    int data = rank * 10;
    MPI_Send(&data, 1, MPI_INT, rank + 1, 0, MPI_COMM_WORLD);
  } else {
    int result = -1;
    MPI_Status status;
    MPI_Recv(&result, 1, MPI_INT,
             MPI_ANY_SOURCE, MPI_ANY_TAG, MPI_COMM_WORLD, &status);
    printf("Rank %d received %d\n", rank, result);
  }

  MPI_Finalize();
  return 0;
}
```

The program is run as: `mpiexec -n 4 ./a.out`

**6a.** (5 marks) Complete the following table. Tick the appropriate boxes and
fill in the remaining fields:

| Rank | Sends? | Receives? | Value sent (if any) | Expected `printf` output (if any) |
|------|--------|-----------|---------------------|-----------------------------------|
| 0    | ☐ Yes  ☐ No | ☐ Yes  ☐ No | | |
| 1    | ☐ Yes  ☐ No | ☐ Yes  ☐ No | | |
| 2    | ☐ Yes  ☐ No | ☐ Yes  ☐ No | | |
| 3    | ☐ Yes  ☐ No | ☐ Yes  ☐ No | | |

**6b.** (2 marks) What would happen if the same program were run with
`mpiexec -n 3`? Explain.

> Answer:

**6c.** (1 mark) What does `MPI_ANY_SOURCE` mean as an argument to `MPI_Recv`?

> Answer:

**6d.** (1 mark) What does `MPI_COMM_WORLD` refer to?

> Answer:

---

## Question 7 — SIMD / Vector Processing (4 marks)

**7a.** (1 mark) What does **SIMD** stand for?

> Answer:

**7b.** (1 mark) What is a **lane** in the context of a vector register?

> Answer:

**7c.** (1 mark) How many single-precision floating-point values fit into a
`__m256` register?

> Answer:

**7d.** (1 mark) The intrinsic call below performs element-wise addition. How
many floating-point additions are performed by a **single** call to
`_mm256_add_ps`?

```c
__m256 sum = _mm256_add_ps(x, y);
```

> Answer:

---

## Question 8 — CUDA Code Analysis (9 marks)

Consider the following CUDA program:

```c
#include <stdio.h>

__global__ void kernel(int *a)
{
  int idx = blockIdx.x * blockDim.x + threadIdx.x;
  a[idx] = threadIdx.x;
}

int main(void)
{
  int arr_size = 32;
  int *arr;
  cudaMallocManaged(&arr, sizeof(int) * arr_size);
  for (int i = 0; i < arr_size; i++) arr[i] = -1;

  kernel<<<2, 16>>>(arr);
  cudaDeviceSynchronize();

  cudaFree(arr);
  return 0;
}
```

**8a.** (1 mark) How many **total threads** are launched by `kernel<<<2, 16>>>`?

> Answer:

**8b.** (4 marks) Complete the following table for the first four threads
(block 0, threads 0–3):

| `blockIdx.x` | `threadIdx.x` | `idx` (computed) | Value stored in `a[idx]` |
|:------------:|:-------------:|:----------------:|:------------------------:|
| 0            | 0             |                  |                          |
| 0            | 1             |                  |                          |
| 0            | 2             |                  |                          |
| 0            | 3             |                  |                          |

**8c.** (2 marks) Is there a **data race** in this kernel when launched as
`<<<2, 16>>>`? Explain why or why not.

> Answer:

**8d.** (1 mark) What does `cudaDeviceSynchronize()` do?

> Answer:

**8e.** (1 mark) What function annotation is used to declare a CUDA kernel
(callable from the host, runs on the device)?

> Answer:

---

## Question 9 — CUDA Architecture (4 marks)

**9a.** (1 mark) What is a **warp** in CUDA GPU architecture?

> Answer:

**9b.** (1 mark) What does **SIMT** stand for, and how is it analogous to SIMD?

> Answer:

**9c.** (1 mark) Order the following CUDA memory types from **fastest** to
**slowest** access:

- Block-local / shared memory
- Device-level / global memory
- Thread-local memory

> Fastest → Slowest:

**9d.** (1 mark) Which of the following is the correct formula for computing a
thread's unique 1-D global index in CUDA? Tick one:

- ☐ A) `threadIdx.x + blockIdx.x`
- ☐ B) `blockIdx.x * blockDim.x + threadIdx.x`
- ☐ C) `threadIdx.x * gridDim.x + blockIdx.x`
- ☐ D) `blockDim.x + threadIdx.x * blockIdx.x`

---

## Question 10 — SystemVerilog (6 marks)

**10a.** (2 marks) Explain the difference between **blocking** (`=`) and
**non-blocking** (`<=`) assignment in SystemVerilog `always` blocks. Include
which type is conventionally used for sequential (clocked) logic.

> Answer:

**10b.** (2 marks) Fill in the three blanks to complete the following
SystemVerilog counter module so that it increments `count` on every positive
clock edge and resets to `0` when `reset` is high:

```systemverilog
module Counter (
  input  logic clk,
  input  logic reset,
  output reg [2:0] count
);
  always @(_____________)
  begin
    if (reset) count _____________;
    else       count _____________;
  end
endmodule
```

> Blank 1 (sensitivity list):
>
> Blank 2 (reset assignment):
>
> Blank 3 (increment assignment):

**10c.** (2 marks) The `wire` datatype in SystemVerilog ranges over `{0, 1, Z,
X}`, while `bit` ranges only over `{0, 1}`. For each value below, tick whether
it is valid for `wire` but **NOT** for `bit`:

| Value | Valid for `wire` but NOT `bit`? |
|:-----:|:-------------------------------:|
| `0`   | ☐ Yes  ☐ No                     |
| `1`   | ☐ Yes  ☐ No                     |
| `Z`   | ☐ Yes  ☐ No                     |
| `X`   | ☐ Yes  ☐ No                     |
