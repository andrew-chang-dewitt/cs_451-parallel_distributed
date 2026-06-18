# CS 451: Parallel & Distributed Computing
## Practice Exam

**Total: 91 marks**

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

---

## Question 11 — Software Compartmentalization (4 marks)

**11a.** (1 mark) Define **privilege separation** (privsep) as a software
security technique. What problem does it solve?

> Answer:

**11b.** (2 marks) The **compartment model** defines three key structures.
Complete the table with a one-sentence definition of each:

| Structure | Definition |
|-----------|-----------|
| Segment | |
| Compartment | |
| Domain | |

**11c.** (1 mark) Tick **all** statements that correctly describe a
`libcompart` inter-compartment function call:

- ☐ A) Arguments must be serialized before the call
- ☐ B) The compartments can run on different privilege levels (different UIDs)
- ☐ C) The caller uses a function pointer registered with `compart_register_fn`
- ☐ D) All compartments must execute on the same physical machine

---

## Question 12 — Multithreading: Private vs. Shared Variables (5 marks)

Consider the following pthreads program:

```c
#include <pthread.h>
#include <stdio.h>

volatile int shared_count = 0;
const int LIMIT = 100;

void *worker(void *arg) {
    int tid = *((int *)arg);
    int local = 0;
    for (int i = 0; i < LIMIT; i++) {
        local++;
        shared_count++;
    }
    return NULL;
}

int main() {
    int id1 = 1, id2 = 2;
    pthread_t t1, t2;
    pthread_create(&t1, NULL, worker, &id1);
    pthread_create(&t2, NULL, worker, &id2);
    pthread_join(t1, NULL);
    pthread_join(t2, NULL);
    printf("shared_count = %d\n", shared_count);
    return 0;
}
```

**12a.** (4 marks) Tick the box indicating whether each definition is
**private** to a thread or **shared** among threads:

| Definition | Is Private? | Is Shared? |
|------------|:-----------:|:----------:|
| `shared_count` (global) | ☐ | ☐ |
| `LIMIT` (global const) | ☐ | ☐ |
| `tid` (local in `worker`) | ☐ | ☐ |
| `local` (local in `worker`) | ☐ | ☐ |
| `arg` (parameter to `worker`) | ☐ | ☐ |
| `id1` (local in `main`) | ☐ | ☐ |
| `t1` (local in `main`) | ☐ | ☐ |
| `i` (loop variable in `worker`) | ☐ | ☐ |

**12b.** (1 mark) Will `shared_count` always equal `200` after both threads
complete? If not, why not?

> Answer:

---

## Question 13 — Sockets & Distributed IPC (3 marks)

**13a.** (1 mark) Give a one-sentence definition for each term:

- **socket**:
- **port**:

> Answer:

**13b.** (2 marks) The following steps describe a TCP socket connection
lifecycle but are **out of order**. Write the numbers 1–5 in the "Order"
column to indicate the correct sequence (1 = first):

| Step (out of order) | Order (1–5) |
|---------------------|:-----------:|
| Client calls `close()` on the connection | |
| Server reads EOF from client and closes the connection | |
| Server starts listening at its socket address and port | |
| Client calls `connect` to the server | |
| Server calls `accept` to complete the client connection | |

---

## Question 14 — OpenMP: Observability & Thread Identity (4 marks)

**14a.** (1 mark) What OpenMP function returns the **total number of threads**
in the current parallel region?

> Answer:

**14b.** (1 mark) What OpenMP function returns the **ID of the calling thread**
within its team (numbered 0, 1, 2, …)?

> Answer:

**14c.** (1 mark) What environment variable can be set before running an OpenMP
program to control the **default number of threads**?

> Answer:

**14d.** (1 mark) Fill in the two blanks so the following program prints each
thread's ID and the total thread count:

```c
#include "omp.h"
#include "stdio.h"

int main() {
#pragma omp parallel
  printf("Hello from thread %d of %d\n",
         ___________________,
         ___________________);
  return 0;
}
```

> Blank 1 (thread ID):

> Blank 2 (total threads):

---

## Question 15 — MPI Collective Operations (4 marks)

**15a.** (2 marks) Match each collective MPI operation to its description by
writing the corresponding letter in the blank:

| Operation | Letter |
|-----------|:------:|
| `MPI_Bcast` | |
| `MPI_Scatter` | |
| `MPI_Gather` | |
| `MPI_Reduce` | |

**A.** All processes send a portion of data to one root process, which
assembles the pieces.  
**B.** One root process distributes different portions of an array to all
processes.  
**C.** One root process sends the **same** data to every other process.  
**D.** Each process contributes data; a reduction (e.g., sum, max) is applied
and the result is delivered to one root process.

**15b.** (1 mark) Name the variant of `MPI_Reduce` that delivers the reduction
result to **all** processes instead of just one root:

> Answer:

**15c.** (1 mark) What `mpiexec` flag specifies the **number of MPI processes**
to launch?

> Answer:

---

## Question 16 — SIMD Intrinsics: Code Analysis (4 marks)

Consider the following function:

```c
#include <immintrin.h>

void add4floats(float in1[4], float in2[4], float out[4])
{
  __m128 x   = _mm_loadu_ps(in1);
  __m128 y   = _mm_loadu_ps(in2);
  __m128 sum = _mm_add_ps(x, y);
  _mm_storeu_ps(out, sum);
}
```

**16a.** (1 mark) What is the width (in bits) of the `__m128` type?

> Answer:

**16b.** (2 marks) Complete the table describing what each intrinsic call does:

| Call | What it does |
|------|-------------|
| `_mm_loadu_ps(in1)` | |
| `_mm_add_ps(x, y)` | |
| `_mm_storeu_ps(out, sum)` | |

*(2 marks: 1 mark for any two correct; 2 marks for all three correct)*

**16c.** (1 mark) The `_u` in `_mm_loadu_ps` / `_mm_storeu_ps` stands for
**unaligned**. Which version — aligned (`_mm_load_ps`) or unaligned
(`_mm_loadu_ps`) — is the safer choice when the array address may not be
aligned to the register width?

> Answer:

---

## Question 17 — CUDA: Memory Management (4 marks)

**17a.** (1 mark) What is the key difference between `cudaMalloc` and
`cudaMallocManaged`?

> Answer:

**17b.** (2 marks) The standard CUDA host/device workflow has six steps. Fill
in the two blanks:

1. Host allocates memory on device (`cudaMalloc`)
2. Host copies data host → device (`cudaMemcpy … cudaMemcpyHostToDevice`)
3. ____________________________________________
4. Host waits for device to finish (`cudaDeviceSynchronize()`)
5. ____________________________________________
6. Host frees device memory (`cudaFree`)

> Step 3:

> Step 5:

**17c.** (1 mark) What is the **maximum number of threads per block** on a
typical NVIDIA GPU (as given in the course notes)?

> Answer:

---

## Question 18 — SystemVerilog: Combinational Logic & Modules (3 marks)

**18a.** (1 mark) In SystemVerilog, what is the functional difference between
using `assign` (continuous assignment) and an `always @*` block for
combinational logic?

> Answer:

**18b.** (1 mark) Rewrite just the `always` block of the module below so that
`result` updates **combinationally** (on any input change) instead of only on
the positive clock edge:

```systemverilog
  always @(posedge clk)
  begin
    result = a | b;
  end
```

> Rewritten `always` block:

**18c.** (1 mark) Which sensitivity list causes an `always` block to trigger on
**any change** to any signal it reads? Tick one:

- ☐ A) `always @(posedge clk)`
- ☐ B) `always @(negedge clk)`
- ☐ C) `always @*`
- ☐ D) `always @(a or b)`

---

## Question 19 — FABRIC Testbed (2 marks)

**19a.** (1 mark) What is FABRIC (in the context of this course), and what is
its primary purpose?

> Answer:

**19b.** (1 mark) Match each FABRIC term to its definition by writing the
corresponding letter in the blank:

| Term | Letter |
|------|:------:|
| **slice** | |
| **sliver** | |
| **worker** | |

**A.** A portion of a slice without dedicated resource access (e.g., a VM /
node).  
**B.** A single physical server within a FABRIC site.  
**C.** The key unit of assignment; a set of resources distributed across FABRIC.

---

## Question 20 — Low-Level Programming: Intrinsics & RDTSC (4 marks)

**20a.** (1 mark) What is a **compiler intrinsic**? How does it differ from
writing inline assembly directly?

> Answer:

**20b.** (1 mark) What does the `__rdtsc()` intrinsic measure?

> Answer:

**20c.** (1 mark) Consider the RDTSC timing loop from the course notes:

```c
start = __rdtsc();
for (int i = 0; i < COUNT; i++)
    omp_get_wtime();
end = __rdtsc();
printf("Function took %lu cycles\n", ((end - start) / COUNT));
```

Tick the **one** correct statement:

- ☐ A) `__rdtsc()` counts wall-clock seconds elapsed
- ☐ B) `__rdtsc()` reads a hardware counter incremented each CPU clock cycle
- ☐ C) `__rdtsc()` measures only time spent in kernel mode
- ☐ D) `(end - start) / COUNT` gives the **total** cycles across all iterations

**20d.** (1 mark) Which `#include` header provides the `__rdtsc()` intrinsic on
x86?

> Answer:
