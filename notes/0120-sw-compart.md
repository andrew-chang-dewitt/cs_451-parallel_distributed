---
title: "Parallel & Distributed: software compartmentalization"
description: "The beginnings of exploring software compartmentalization, a technique for dividing a monolithic application into multiple processes working together. Starts with a major motivator, privilege separation, then introduces some examples."
keywords:
  - "privileges"
  - "security"
  - "parallel & distributed"
  - "lecture notes"
  - "computer science"
  - "cs 451"
  - "illinois tech"
meta:
  byline: Andrew Chang-DeWitt
  published: "2026-01-20T10:00-06:00"
---

## agenda

- privilege separation
  - why this matters
  - how it works
- compartmentalization w/ `pitchfork` & `libcompart`

## privilege separation

_**def**_&mdash;the concept of composing software so that, at runtime,
different parts of the same application/program execute w/ different privilege
levels.

### why this matters

as a basic building block of software security, privsep is the same category as
some other techniques:

- ASLR (address space layout randomization)&mdash;makes it difficult to use
  buffer overflows to access a specific address location
- stack canaries&mdash;done for you by a compiler
- sandboxing&mdash;contains applications so if one is comprimised it doesn't
  have access to other applications or resources
- soft/hard bounds checking

these are all good to use, together where possible. some are difficult to apply
though.

today, we'll focus on privsep.

the goal of privsep is to compartmentalize code & data, changing monolithic
applications to concurrent set of cooperating programs. in doing so, we gain
the ability to go from a single, common privilege level in a monolithic app to
granular privileges for different segments of the application. this gives the
application internal vulnerability containment; if a vulnerability is
exploited, it is less likely to affect the entire set of programs.

### implementing privsep

openssh is a good example of an implementor of this.

how? need to change sw w/out introducing new bugs

what would the ideal solution look like? say we bisect an app into two portions
using some heuristics:

1. into higher privileged (_trusted_) portion:
   - components needing specific access
   - dependencies including libraries of those
   - cross-domain interfaces (network, filesystem, etc.)

2. into lower privileged (_untrusted_) portion:
   - more bugs already indicates need for less privileges so there's less
     points of attack
   - untrusted dependencies

of course this is only a simple view of it. privsep can get v complicated:

- maybe it needs split into > 2 layers?
- are all dependencies equally trusted?
- partitioning introduces new failure modes
- and more...

## goals of privilege separation & this course

:::

here we'll cover foundations of how distribution can assist in s/w
compartmentalization, leading to better privsep & security. we'll look at tool
support for enabling this, primarily two tools called pitchfork & libcompart.

1. pitchfork is applied in program source code & build scripts as annotations
   that indicate sections of the code that need elevated privileges, which,
   while meaningless in the C lang, are interpreted by a C preproc to then
   transform the source into a program ready for distributed execution
2. libcompart provides a runtime for bisecting a program, giving sync comms
   between all parts, monitoring & failure-handling

:::

> [!NOTE]
>
> for a deep dive on this, read the [pitchfork paper](http://www.cs.iit.edu/~nsultana1/files/pitchfork.pdf)
> linked on the course webpage.

we call this the

### compartment model

application is separated into multiple portions, `main`, & associated portions
labeled `compartN` (where N is a number) that may have different privilege
levels & dependencies. each **compartment** (_**def**_&mdash;portions of code that
share state across **segments**) (& main) may run on different **domain**s
(_**def**_&mdash;shared memory/handles/resources across compartments). each
domain may, or may not, run on the same host VM or hardware. `main` & `monitor` are
special compartments, always found in domain 0.

implementing this model requires a pluggable API for communications,
configuration, & enforcement of privsep.

an example in C code for triggering a console beep:

```c
if(console_type == BEEP_TYPE_CONSOLE) {
  pitchfork_start("Privileged");
  if(ioctl(console_fd, KIOCSOUND, period) < 0) {
    putchar('\a'); /* Output the only beep we can, in an effort to fall back on usefullness */
    perror("ioctl");
  }
  pitchfork_end("Privileged");
} else {
  /* BEEP_TYPE_EVDEV */
  struct input_event e;
  e.type = EV_SND;
  e.code = SND_TONE;
  e.value = freq;
  pitchfork_start("Privileged");
  if (write(console_fd, &e, sizeof(struct input_event)) < 0) {
    putchar('\a'); /* See above */
    perror("write");
  }
  pitchfork_end("Privileged");
}
```

in this example, the calls to `pitchfork_start` & `pitchfork_end` aren't
actually even functions, but instead the annotations made for the preprocessor
to identify different sections that can have/need to have different privilege
levels.

another example using `libcompart` to run an image conversion function in a
separate compartment, functioning much like RPC style code:

```c
#include "netpbm_interface.h"

int main(int argc, const char *argv[]) {
  compart_init(NO_COMPARTS, comparts, default_config);
  // initialize a new compartment, getting a pointer to the
  // compartmentalized function
  convertTIFF_ext =
    compart_register_fn("libtiff", &ext_convertTIFF);
  parseCommandLine_ext =
    compart_register_fn("cmdparse", &ext_parseCommandLine);
  // end compartment specification & execute
  compart_start("netpbm");

  struct CmdlinInfo cmdline;
  ...
}
```

similar libcompart example, showing how old code that handled command line
parsing & TIFF conversion locally via function calls can be replaced w/
libcompart by serializing args/data structures, & executing the vulnerable
functions by sending the serialized data to a separate compartment:

```c
// unchanged ...
pm_proginit(&argc, argv);
// was:
//   parseCommandLine(argc, argv, &cmdline);
// but replace w/ libcompart tools to compartentalize by:
struct extension_data arg;
args_to_data_CommandLine(&arg, argc, argv);
arg = compart_call_fn(parseCommandLine_ext, arg);
args_from_data(&arg, &cmdline);
// was:
//   tiffP = newTiffImageObject(cmdline.inputFilename);
//   if (cmdline.alphaStdout) {
//   ...
//   TIFFClose(tiffP);
// but replaced w/
args_to_data(&arg, &cmdline);
arg = compart_call_fn(convertTIFF_ext, arg);
// unchanged ...
pm_strfree(cmdline.inputFilename);
```
