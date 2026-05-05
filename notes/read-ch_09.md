---
title: "Parallel & Distributed: CUDA"
description: "Reading notes on Chapter 9: CUDA. Covers GPU architecture (SMs, SIMT, warps), the CUDA programming model (kernels, grids, blocks, threads), memory management (cudaMalloc, cudaMemcpy, unified memory), & several annotated code examples."
keywords:
  - "cuda"
  - "gpu"
  - "parallel computing"
  - "simt"
  - "kernels"
  - "c-lang"
  - "parallel & distributed"
  - "reading notes"
  - "computer science"
  - "cs 451"
  - "illinois tech"
meta:
  byline: Andrew Chang-DeWitt
  published: "2026-05-04T00:00-06:00"
---

> [!NOTE]
>
> reading notes on chapter 9 of the course textbook by Nik Sultana (© 2025,
> licensed CC BY-NC-SA 4.0). code samples largely unchanged from source material.

## agenda

- what is a GPU & how is it characterized?
- GPU architecture: SMs, SIMT, warps
- memory hierarchy: thread-local, block-local, device-level
- CUDA programming model: kernels, grids, blocks, threads
- memory management: cudaMalloc, cudaMemcpy, cudaFree, unified memory
- key examples: minimal kernels, hello_cuda, compute w/ data races

## what is a GPU?

_**def: GPU (Graphics Processing Unit)**_&mdash;originally fixed-function
hardware for rendering graphics. modern GPUs have evolved into resources for
highly parallel, general-purpose computing (GPGPU). provides far more hardware
parallelism than a CPU.

_**def: CUDA (Computer Unified Device Architecture)**_&mdash;NVIDIA's
programming model for GPUs; the dominant approach for GPU computing. primarily
associated w/ NVIDIA hardware but adaptation tools exist for other vendors.

> [!NOTE]
>
> alternatives to CUDA include: OpenACC, OpenCL, ISPC, HIP, ROCm, OneAPI,
> SYCL, Kokkos, JAX, & OpenMP's GPU targeting (from chapter 5).

### characterizing a GPU (RTX-6000 example)

| dimension              | value                     |
| ---------------------- | ------------------------- |
| compute                | 91.1 teraflops (FP32)     |
| on-board memory        | 48 GB                     |
| memory bandwidth       | 960 GB/s                  |
| PCIe I/O (host ↔ GPU) | 31.51 GB/s (PCIe 4.0 x16) |
| power                  | 300W max                  |

> [!IMPORTANT]
>
> host ↔ GPU transfers (PCIe) are ~30× slower than on-board memory bandwidth.
> this makes minimizing host↔device data movement critical for performance.

_**def: FLOPS**_&mdash;floating-point operations per second. GPU performance
is typically rated in FLOPS for FP32 (single-precision). other encodings
encountered: FP64, TF32, FP16, FP8, BF16.

## GPU architecture

```no-linenums
GPU
└─ SM (Streaming Multiprocessor) × 142
   └─ sub-core × 4
      └─ SIMT lane (SP / thread) × 32
         = warp
```

_**def: SM (Streaming Multiprocessor)**_&mdash;the closest thing to a CPU
core in a GPU. the RTX-6000 has 142 SMs.

_**def: SIMT (Single-Instruction-Multiple-Thread)**_&mdash;all threads in a
warp execute the same instruction in lock-step, analogous to SIMD lanes.

_**def: warp**_&mdash;a group of 32 threads that are scheduled together.
threads within a warp proceed in lock-step. (also called a "wavefront" by
some vendors.)

_**def: SP (Streaming Processor)**_&mdash;a single SIMT lane; synonymous w/
"thread" in the CUDA context.

total CUDA cores: 142 SMs × 4 sub-cores × 32 SPs = **18,176 CUDA cores**.

## memory hierarchy

three types of memory, ordered fastest → slowest:

1. **thread-local memory**&mdash;private to a single thread; fastest
2. **block-local / shared memory**&mdash;shared between threads in the same
   block; 128 KB per SM (L1 cache)
3. **device-level / global memory**&mdash;accessible to all threads; slowest
   (48 GB, 960 GB/s on RTX-6000)

> [!NOTE]
>
> L2 cache: 96 MB on the RTX-6000.

## the host/device model

CUDA programs run on both CPU (host) & GPU (device). typically:

1. host allocates memory on device
2. host copies data host → device
3. host launches a _kernel_ on device
4. host waits for device to finish (`cudaDeviceSynchronize()`)
5. host copies results device → host
6. host frees device memory

code annotations:

- `__host__` — callable & runs on host (default for regular C functions)
- `__device__` — callable from device only, runs on device
- `__global__` — callable from host or device, runs on device (this is how
  kernels are declared)

## the programming model: kernels, grids & blocks

_**def: kernel**_&mdash;a function marked `__global__` that is called from
the CPU but executes on the GPU. launched w/ the special `<<<grid, block>>>`
execution configuration syntax.

_**def: execution configuration**_&mdash;the `<<<grid, block>>>` parameters
in a kernel call. `grid` = number of blocks; `block` = number of threads per
block. both can be `dim3` structs (x/y/z dimensions) or simple integers.

```c
kernel<<<grid, block>>>(parameters);
```

each thread can query its identity at runtime:

```c
gridDim.x / .y / .z    // total blocks in grid
blockDim.x / .y / .z   // threads per block
blockIdx.x / .y / .z   // this block's index in grid
threadIdx.x / .y / .z  // this thread's index in block
warpSize                // threads per warp (typically 32)
```

computing a thread's unique 1-D ID (most common pattern):

```c
int idx = blockIdx.x * blockDim.x + threadIdx.x;
```

connections to other course topics:

- **SIMD/vector processing**: SIMT is the GPU analog of SIMD lanes
- **MPI**: grids/blocks ~ communicator topologies; rank ~ thread idx;
  `<<<L, M>>>` ~ `-n` / hosts file

## memory management API

```c
// allocate N bytes on device
cudaMalloc((void**)&ptr, N);

// copy between host and device
cudaMemcpy(dst, src, N, cudaMemcpyHostToDevice);
cudaMemcpy(dst, src, N, cudaMemcpyDeviceToHost);

// free device memory
cudaFree(ptr);

// wait for all queued work on device to complete
cudaDeviceSynchronize();
```

### unified memory (simpler alternative)

```c
// allocate memory accessible from both host & device
// avoids explicit cudaMemcpy, but still requires cudaFree
cudaMallocManaged(&ptr, N);
```

## key examples

### minimal kernels (NVIDIA's originals)

```c
// kernel 1: set every element to 7
__global__ void kernel(int *a)
{
  int idx = blockIdx.x * blockDim.x + threadIdx.x;
  a[idx] = 7;
}

// kernel 2: set every element to its block index
__global__ void kernel(int *a)
{
  int idx = blockIdx.x * blockDim.x + threadIdx.x;
  a[idx] = blockIdx.x;
}

// kernel 3: set every element to its thread index within block
__global__ void kernel(int *a)
{
  int idx = blockIdx.x * blockDim.x + threadIdx.x;
  a[idx] = threadIdx.x;
}
```

### hello_cuda: grids & blocks in action

```c
#include <stdio.h>

__global__ void hello_cuda() {
  printf("hello from (%d / %d)\n", threadIdx.x, blockIdx.x);
}

int main()
{
  hello_cuda<<<2, 5>>>();    // 2 blocks × 5 threads = 10 threads total
  cudaDeviceSynchronize();
  return 0;
}
```

```sh
$ nvcc hello2.cu -L /usr/local/cuda/lib -lcudart -o hello2
$ ./hello2
hello from (0 / 1)
hello from (1 / 1)
hello from (2 / 1)
hello from (3 / 1)
hello from (4 / 1)
hello from (0 / 0)
...
```

order of blocks in output is nondeterministic; order within a block is
deterministic (threads in a warp run in lock-step).

### compute with data races (grid/block size exploration)

using unified memory & varying grid/block parameters reveals data races:

```c
#include <stdio.h>

__host__
void print_contents(int arr_size, int* arr, const char* caption)
{
  int stride = 80;
  printf("%s", caption);
  for (int i = 0; i < arr_size; i += stride) {
    for (int j = i; j < i + stride; j++) {
      if (j >= arr_size) break;
      printf("%d,", arr[j]);
    }
    printf("\n");
  }
}

__global__
void compute(int arr_size, int *arr)
{
  for (int i = 0; i < arr_size; i++)
    arr[i] = threadIdx.x;    // data race if multiple threads write same index
}

int main(void)
{
  // primary config
  int arr_size = 1 << 5;    // (A)
  // alternate configs
  // int arr_size = 1 <<10; // (B) (C) (D) (E)

  // init array mem
  int *arr;
  cudaMallocManaged(&arr, sizeof(int) * arr_size);
  // & set all members to -1
  for (int i = 0; i < arr_size; i++) {
    arr[i] = -1;
  }

  print_contents(arr_size, arr, "before:\n");
  // (A) 1 block, 1 thread — no race
  compute<<<1, 1>>>(arr_size, arr); // (A)
  // (B) 1 block, 100 threads
  // compute<<<1, 100>>>(arr_size, arr); // (B)
  // (C) 2 blocks, 100 threads
  // compute<<<2, 100>>>(arr_size, arr); // (C)
  // (D) 1 block, 512 threads
  // compute<<<1, 512>>>(arr_size, arr);   // (D)
  // (E) 2 blocks, 512 threads  ← data races visible in output
  // compute<<<2, 512>>>(arr_size, arr);   // (E)
  cudaDeviceSynchronize();
  print_contents(arr_size, arr, "after:\n");

  cudaFree(arr);
  return 0;
}
```

at configuration (E), output shows inconsistent values—evidence of data races
across threads writing overlapping array indices.

### add example (CPU → CUDA port)

a demo on converting a CPU array addition program to a CUDA kernel using
unified memory:

```c
// C port of C++ code from
// https://developer.nvidia.com/blog/even-easier-introduction-cuda
// gcc add.c add -llm

#include "math.h"
#include "stdio.h"
#include "stdlib.h"

void add(int n, float *x, float *y)
{
  for (int i = 0; i < n; i++)
    y[i] = x[i] + y[i];
}

int main(void)
{
  int N = 1<<20;

  float *x = malloc(sizeof(float) * N);
  float *y = malloc(sizeof(float) * N);

  for (int i = 0; i < N; i++) {
    x[i] = 1.0f;
    y[i] = 2.0f;
  }

  add(N, x, y);

  float maxError = 0.0f;
  for (int i = 0; i < N; i++)
    maxError = fmax(maxError, fabs(y[i] - 3.0f));
  printf("Max error: %f\n", maxError);

  free(x);
  free(y);
  return 0;
}
```

to be ported to CUDA by:

1. annotating `add` as `__global__`
2. using `cudaMallocManaged` instead of `malloc`
3. calling `add<<<grid, block>>>(N, x, y)` & `cudaDeviceSynchronize()`

```c
// C port of C++ code from
// https://developer.nvidia.com/blog/even-easier-introduction-cuda
// gcc add.c add -llm

#include "math.h"
#include "stdio.h"
#include "stdlib.h"

// step 1, annotate add as kernal
__global__
void add(int n, float *x, float *y)
{
  for (int i = 0; i < n; i++)
    y[i] = x[i] + y[i];
}

int main(void)
{
  int N = 1<<20;

  // step 2: use CUDA mem management
  float *x, *y;
  cudaMallocManaged(&x, N*sizeof(float));
  cudaMallocManaged(&y, N*sizeof(float));

  for (int i = 0; i < N; i++) {
    x[i] = 1.0f;
    y[i] = 2.0f;
  }

  // step 3: use fn<<<...>>> notation to "launch" as CUDA kernal
  //         i.e. tell it to run on GPU instead of CPU
  add<<<1, 1>>>(N, x, y);
  //         & block until it is done (like thread join)
  cudaDeviceSynchronize();

  float maxError = 0.0f;
  for (int i = 0; i < N; i++)
    maxError = fmax(maxError, fabs(y[i] - 3.0f));
  printf("Max error: %f\n", maxError);

  cudaFree(x);
  cudaFree(y);
  return 0;
}
```

### querying device attributes

```c
cudaDeviceGetAttribute(&mp_count,    cudaDevAttrMultiProcessorCount,   DEVNO);
cudaDeviceGetAttribute(&warp_size,   cudaDevAttrWarpSize,              DEVNO);
cudaDeviceGetAttribute(&max_threads, cudaDevAttrMaxThreadsPerBlock,    DEVNO);
// ... and many more (l2_cache_size, unified_addressing, ecc_enabled, etc.)
```

example output on the FABRIC gpu-node:

```no-linenums
cap_maj=7, cap_min=5
pci_bus=7, pci_device=0
mp_count=72, warp_size=32, max_threads_per_block=1024, max_threads_per_mp=1024
memory_clock_rate=6501000, global_memory_bus_width=384,
  l2_cache_size=6291456, unified_addressing=1, ecc_enabled=1,
  max_shared_memory_per_block=49152, total_constant_memory=65536,
  integrated=0, can_map_host_memory=1
```

## further topics (next steps)

- `__shared__` annotation to place variables in block-local shared memory
- `__syncthreads()` — barrier across threads within a block (analogous to
  `#pragma omp barrier` in OpenMP)
- optimizing grid/block sizes based on SM & warp knowledge
- maximum threads per block: 1024 (hardware limit)

> [!TODO]
>
> the chapter references an LLM inference example (`yalm/src/infer.cu`) that
> uses CUDA for matrix multiplication. working through that example, especially
> w/ tiling optimizations, would be valuable followup.
>
> also recommended: Chamberlain's blog post on 30 years of parallel
> programming: https://chapel-lang.org/blog/posts/30years/
