---
title: "Parallel & Distributed: multithreading"
description: "Some low-level explorations of multithreading. Digs into machine code compiled from C source using `pthread.h`, inspecting memory addresses, analyzing shared vs private pointers, & more."
keywords:
  - "multithreading"
  - "data races"
  - "c-lang"
  - "assembly"
  - "system design"
  - "parallel & distributed"
  - "lecture notes"
  - "computer science"
  - "cs 451"
  - "illinois tech"
meta:
  byline: Andrew Chang-DeWitt
  published: "2026-02-10T10:00-06:00"
---

## agenda

- motivating example: count
- more parallelism, more problems: data races

## motivating example: count

in class, we examined the following example of a c program using multithreading
(via `pthread.h`):

```c
#include <pthread.h>
#include <stdlib.h>
#include <stdio.h>

volatile long count = 0;

/// thread worker routine
///
/// simply increments shared count state in a loop until
/// it's incremented it the number of times given in vargp
void* thread(void* vargp) {
  long i, var = *((long *)vargp);
  for (i = 0; i < var; i++)
    count ++;
  return NULL;
}

/// main thread routine
int main(int argc, char** argv) {
  long variable;
  pthread_t tid1, tid2;

  // parse variable from cli
  variable = atoi(argv[1]);
  // init two kernal-level threads using worker routine defined above
  pthread_create(&tid1, NULL, thread, &variable);
  pthread_create(&tid2, NULL, thread, &variable);
  // wait for both threads to complete
  pthread_join(tid1, NULL);
  pthread_join(tid2, NULL);

  // check if threads calculated correctly
  if (count != (2 * variable))
    printf("Miscalculation: count=%ld\n", count);
  else
    printf("OK: count=%ld\n, count");
  return 0;
}
```

a fairly simple example, our intuition tells us that at the end, count should
always be 2x the input. however, our intuition is wrong here.

```
andrew@topo: ~/tmp/cscrtch
$ for i in {1..20}; do target/release/bin/main 10000; done
Miscalculation: count=11705
OK: count=20000
OK: count=20000
OK: count=20000
OK: count=20000
OK: count=20000
OK: count=20000
OK: count=20000
OK: count=20000
OK: count=20000
OK: count=20000
Miscalculation: count=12760
Miscalculation: count=14019
OK: count=20000
OK: count=20000
OK: count=20000
OK: count=20000
Miscalculation: count=13210
Miscalculation: count=10000
Miscalculation: count=10000
```

to begin to get an idea of what's wrong, let's inspect the compiled machine
code & look for some clues:

```arm
0000000000000918 <thread>:
 918:	d10083ff 	sub	sp, sp, #0x20
 91c:	f90007e0 	str	x0, [sp, #8]
 920:	f94007e0 	ldr	x0, [sp, #8]
 924:	f9400000 	ldr	x0, [x0]
 928:	f9000fe0 	str	x0, [sp, #24]
 92c:	f9000bff 	str	xzr, [sp, #16]
 930:	1400000b 	b	95c <thread+0x44>
 // gcc optimized i & count to the same, hence
 934:	90000100 	adrp	x0, 20000 <__data_start>
 // loading count here
 938:	91006000 	add	x0, x0, #0x18
 // into reg x0
 93c:	f9400000 	ldr	x0, [x0]
 // incrementing the reg
 940:	91000401 	add	x1, x0, #0x1
 944:	90000100 	adrp	x0, 20000 <__data_start>
 // then getting count addr again
 // note count addr!
 948:	91006000 	add	x0, x0, #0x18
 // before storing updated value
 94c:	f9000001 	str	x1, [x0]
 // then restarting loop
 950:	f9400be0 	ldr	x0, [sp, #16]
 954:	91000400 	add	x0, x0, #0x1
 958:	f9000be0 	str	x0, [sp, #16]
 95c:	f9400be1 	ldr	x1, [sp, #16]
 960:	f9400fe0 	ldr	x0, [sp, #24]
 964:	eb00003f 	cmp	x1, x0
 968:	54fffe6b 	b.lt	934 <thread+0x1c> // b.tstop
 96c:	d2800000 	mov	x0, #0x0
 970:	910083ff 	add	sp, sp, #0x20
 974:	d65f03c0 	ret

0000000000000978 <main>:
 // ...
 // get int from input str
 9ac:	97ffff79 	bl	790 <atoi@plt>
 9b0:	93407c00 	sxtw	x0, w0
 9b4:	f9000be0 	str	x0, [sp, #16]
 9b8:	910043e0 	add	x0, sp, #0x10
 9bc:	910063e4 	add	x4, sp, #0x18
 9c0:	aa0003e3 	mov	x3, x0
 // start threads
 9c4:	90000000 	adrp	x0, 0 <__abi_tag-0x278>
 9c8:	91246002 	add	x2, x0, #0x918
 9cc:	d2800001 	mov	x1, #0x0
 9d0:	aa0403e0 	mov	x0, x4
 9d4:	97ffff7f 	bl	7d0 <pthread_create@plt>
 9d8:	910043e0 	add	x0, sp, #0x10
 9dc:	910083e4 	add	x4, sp, #0x20
 9e0:	aa0003e3 	mov	x3, x0
 9e4:	90000000 	adrp	x0, 0 <__abi_tag-0x278>
 9e8:	91246002 	add	x2, x0, #0x918
 9ec:	d2800001 	mov	x1, #0x0
 9f0:	aa0403e0 	mov	x0, x4
 9f4:	97ffff77 	bl	7d0 <pthread_create@plt>
 // wait for threads to complete
 9f8:	f9400fe0 	ldr	x0, [sp, #24]
 9fc:	d2800001 	mov	x1, #0x0
 a00:	97ffff7c 	bl	7f0 <pthread_join@plt>
 a04:	f94013e0 	ldr	x0, [sp, #32]
 a08:	d2800001 	mov	x1, #0x0
 a0c:	97ffff79 	bl	7f0 <pthread_join@plt>
 a10:	f9400be0 	ldr	x0, [sp, #16]
 a14:	d37ff801 	lsl	x1, x0, #1
 a18:	90000100 	adrp	x0, 20000 <__data_start>
 // load count again to evaluate & log results
 // note count addr!
 a1c:	91006000 	add	x0, x0, #0x18
 a20:	f9400000 	ldr	x0, [x0]
 a24:	eb00003f 	cmp	x1, x0
 a28:	54000120 	b.eq	a4c <main+0xd4>   // b.none
 // ...
 a9c:	d65f03c0 	ret
```

careful inspection of the above machine code shows that the routine used by
both threads (`thread`) uses the same memory address for count&mdash;in fact,
so does `main` when checking & logging the result at the end. this means that
while the threads are executing simultaneously, they are both attempting to
read & update the value at the address `<__data_start> + 0x18`, leading to a

## data race (a.k.a. more parallelism, more problems)
