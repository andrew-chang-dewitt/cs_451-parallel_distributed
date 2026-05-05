# CS 451: Parallel & Distributed Computing
## Practice Exam — Answer Key

**Total: 54 marks**

---

## Question 1 — Speedup Models (3 marks)

**1a.** (1 mark)

Amdahl's Law holds the **problem size constant** and computes speedup as the
ratio T(1)/T(N). The serial portion σ sets a hard upper limit on speedup.
Gustafson's Law, by contrast, holds the **execution time constant** (or
equivalently, scales the problem size with the number of processors) and asks
how much longer the same work would take on one core. This gives a linearly
growing speedup.

**1b.** (1 mark)

The maximum speedup under Amdahl's Law as N → ∞ is:

```
max speedup = 1/σ = 1/0.25 = 4×
```

No matter how many cores are added, the program cannot run more than 4× faster
because 25% of it must run serially.

**1c.** (1 mark)

**Gustafson's Law** predicts linear scaling.

---

## Question 2 — Inter-Process Communication (4 marks)

**2a.** (1 mark)

**IPC** stands for **Inter-Process Communication**. In parallel and distributed
programming it refers to the mechanisms by which separate processes, threads,
or networked nodes share state and coordinate with one another.

**2b.** (1 mark)

Shared memory can be **very fast** because processes access the same memory
region directly with no serialization or data copying overhead.

*(Accept any reasonable answer, e.g.: no need to serialize/deserialize data;
lower latency for fine-grained sharing.)*

**2c.** (1 mark)

Message passing works across **distributed systems with separate physical
memory** (i.e., networked machines) where shared memory is not possible.

*(Accept any reasonable answer, e.g.: easier to reason about ownership/state;
no risk of one process corrupting another's memory; natural fit for
distributed/networked systems.)*

**2d.** (1 mark)

**DMA — Direct Memory Access**.

*(PCIe peripherals such as a GPU can use DMA to share memory with the CPU
without involving the processor for each transfer.)*

---

## Question 3 — Data Races & Synchronization Primitives (3 marks)

**3a.** (1 mark)

A **data race** occurs when two or more concurrent processes/threads attempt to
read and/or write to a shared resource (e.g., a memory location) at the same
time without synchronization, potentially producing inconsistent or incorrect
results.

**3b.** (1 mark)

**No**, `volatile` does **not** prevent data races. `volatile` tells the
compiler not to cache the variable in a register (always load/store from
memory), but the underlying read-modify-write sequence (load → increment →
store) is still three separate operations. Two threads can still interleave
those operations, causing a race condition.

**3c.** (1 mark)

**CMPXCHG** (Compare-and-Exchange). In multi-core (parallel) settings it must
be paired with the `LOCK` prefix to guarantee atomicity.

---

## Question 4 — Low-Level Programming & the x86-64 ISA (6 marks)

**4a.** (1 mark)

`%rdi`

**4b.** (1 mark)

`%rax`

**4c.** (1 mark)

`leaq (%rdi,%rsi), %rax` computes the **effective address** `%rdi + %rsi`
(i.e., adds the two argument values) and stores the result in `%rax`. Since
both arguments are already in registers, this is an efficient single-instruction
integer addition that also places the result in the return-value register.

**4d.** (1 mark)

`endbr64` is an **Intel CET (Control-flow Enforcement Technology)** marker. It
marks a valid target for indirect branches/calls, allowing the processor to
detect control-flow hijacking attempts. On CPUs that do not support CET it is a
no-op.

**4e.** (1 mark)

`-masm=intel`

(Full example: `gcc -S -masm=intel file.c`)

**4f.** (1 mark)

`stepi` (abbreviated `si`) — steps one assembly instruction at a time.

*(Contrast with `nexti` which also steps one instruction but treats function
calls as a single step.)*

---

## Question 5 — OpenMP (6 marks)

**5a.** (1 mark)

```c
#pragma omp parallel for
for (int i = 0; i < N; i++) {
    out[i] = compute(in[i]);
}
```

**5b.** (1 mark)

By default, OpenMP spawns **one thread per available CPU core** (hardware
threads visible to the OS). The exact count is determined at runtime.

**5c.** (1 mark)

`-fopenmp`

(e.g., `gcc -fopenmp file.c`)

**5d.** (2 marks)

In the **fork-join** pattern:

- **Fork**: When execution reaches a `#pragma omp parallel` directive, the
  master thread creates (forks) a **team of worker threads** that execute the
  parallel region concurrently.
- **Join**: When all worker threads have finished the parallel region, they
  **terminate and rejoin** the master thread, which then continues sequential
  execution past the parallel block.

**5e.** (1 mark)

```c
#pragma omp parallel for reduction(+:count)
```

The `reduction(+:count)` clause gives each thread a **private copy** of `count`
initialised to 0, lets them increment independently, then combines all copies
with addition into the shared `count` variable at the end—eliminating the race.

---

## Question 6 — MPI (9 marks)

**6a.** (5 marks) Completed table:

| Rank | Sends? | Receives? | Value sent | Expected `printf` output |
|------|--------|-----------|------------|--------------------------|
| 0    | ✓ Yes  | No        | `0`        | *(none)*                 |
| 1    | No     | ✓ Yes     | —          | `Rank 1 received 0`      |
| 2    | ✓ Yes  | No        | `20`       | *(none)*                 |
| 3    | No     | ✓ Yes     | —          | `Rank 3 received 20`     |

*Marking guide: 1 mark per correct row (all four fields must be correct for
the mark). Deduct ½ mark per incorrect field within a row if partial marking
is used.*

**6b.** (2 marks)

With `-n 3` there are ranks 0, 1, and 2.

- Rank 0 (even) tries to `MPI_Send` to rank 1 → succeeds (rank 1 exists).
- Rank 2 (even) tries to `MPI_Send` to `rank + 1 = 3` → **rank 3 does not
  exist**. This is an invalid destination. The behaviour is implementation
  defined but will typically result in an **MPI error** (or a **deadlock** if
  the implementation does not immediately detect the invalid rank), since no
  process will ever receive rank 2's message. Rank 1 may complete, but rank 2
  will block or error indefinitely.

**6c.** (1 mark)

`MPI_ANY_SOURCE` means the `MPI_Recv` call will accept a message from **any
sender**—it does not require the message to come from a specific rank.

**6d.** (1 mark)

`MPI_COMM_WORLD` is the default **communicator** that encompasses every process
launched by `mpiexec`. It is the global "world" group used when all processes
need to participate in communication.

---

## Question 7 — SIMD / Vector Processing (4 marks)

**7a.** (1 mark)

**Single Instruction, Multiple Data**

**7b.** (1 mark)

A **lane** is a subdivision of a vector register that holds a single data item.
All lanes in a register hold the same data type (e.g., all 32-bit floats), and
a vector instruction operates on every lane **simultaneously** in a single
instruction.

**7c.** (1 mark)

**8** single-precision floats (256 bits ÷ 32 bits per float = 8 lanes).

**7d.** (1 mark)

**8** floating-point additions — one per lane of the 256-bit YMM register.

---

## Question 8 — CUDA Code Analysis (9 marks)

**8a.** (1 mark)

`2 blocks × 16 threads/block = **32 total threads**`

**8b.** (4 marks) Completed table (1 mark per row):

| `blockIdx.x` | `threadIdx.x` | `idx` | Value in `a[idx]` |
|:------------:|:-------------:|:-----:|:-----------------:|
| 0            | 0             | 0     | 0                 |
| 0            | 1             | 1     | 1                 |
| 0            | 2             | 2     | 2                 |
| 0            | 3             | 3     | 3                 |

`idx = blockIdx.x * blockDim.x + threadIdx.x = 0 * 16 + threadIdx.x`

**8c.** (2 marks)

**No data race** in this configuration. With `<<<2, 16>>>`, the 32 threads
(indices 0–31) each compute a unique `idx` in the range `[0, 31]`, which
exactly matches `arr_size = 32`. Because every thread writes to a **distinct
array element**, no two threads access the same memory location, and therefore
there is no data race.

*(A data race would appear if, for example, `arr_size` were much smaller than
the number of threads, causing multiple threads to map to the same index.)*

**8d.** (1 mark)

`cudaDeviceSynchronize()` **blocks the host (CPU)** until all previously
launched GPU work (kernels, memory copies, etc.) has completed. It is analogous
to `pthread_join` for GPU kernels.

**8e.** (1 mark)

`__global__`

---

## Question 9 — CUDA Architecture (4 marks)

**9a.** (1 mark)

A **warp** is a group of **32 threads** that are scheduled together on a
Streaming Multiprocessor (SM). All threads in a warp execute the same
instruction in lock-step (SIMT execution).

*(Some vendors use the equivalent term "wavefront".)*

**9b.** (1 mark)

**SIMT = Single-Instruction-Multiple-Thread.** It is analogous to SIMD in that
one instruction operates on multiple data items simultaneously—but at the thread
level rather than the register-lane level. In SIMT, 32 threads (a warp) all
execute the same instruction on their own private data in parallel.

**9c.** (1 mark)

**Fastest → Slowest:**

1. Thread-local memory
2. Block-local / shared memory (L1 cache, ~128 KB per SM)
3. Device-level / global memory (e.g., 48 GB on RTX-6000)

**9d.** (1 mark)

**B) `blockIdx.x * blockDim.x + threadIdx.x`**

This is the standard pattern: multiply the block's position in the grid by the
block size, then add the thread's position within the block.

---

## Question 10 — SystemVerilog (6 marks)

**10a.** (2 marks)

| Type | Symbol | Behaviour |
|------|--------|-----------|
| Blocking | `=` | Sequential — each assignment completes before the next statement executes. The new value is immediately visible to subsequent statements in the same block. |
| Non-blocking | `<=` | Concurrent — all right-hand sides are evaluated first, then all left-hand sides are updated simultaneously at the end of the time step. |

**Convention**: use `<=` (non-blocking) for **sequential/clocked** (`always
@(posedge clk)`) logic; use `=` (blocking) for **combinational**
(`always @*`) logic.

**10b.** (2 marks)

```systemverilog
module Counter (
  input  logic clk,
  input  logic reset,
  output reg [2:0] count
);
  always @(posedge clk)       // Blank 1: posedge clk
  begin
    if (reset) count = 0;     // Blank 2: = 0
    else       count = count + 1;  // Blank 3: = count + 1
  end
endmodule
```

*(Accept `<=` in place of `=` for full credit — both are correct; `<=` is the
preferred convention for clocked logic.)*

**10c.** (2 marks)

| Value | Valid for `wire` but NOT `bit`? |
|:-----:|:-------------------------------:|
| `0`   | **No** — `bit` supports `0`     |
| `1`   | **No** — `bit` supports `1`     |
| `Z`   | **Yes** — high-impedance; not in `bit`'s range `{0, 1}` |
| `X`   | **Yes** — unknown value; not in `bit`'s range `{0, 1}` |

*(1 mark for both Z and X correct; 1 mark for both 0 and 1 correct.)*
