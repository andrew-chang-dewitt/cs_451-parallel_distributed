---
title: "Parallel & Distributed: diving into `libcompart`"
description: "a walkthrough of an example program implementing compartmentalization (see previous lecture) using `libcompart`, then a deep dive into how `libcompart` itself is implemented. starts with a quick overview of how to set up, connect to, execute code on FABRIC testbed"
keywords:
  - "libcompart"
  - "fabric"
  - "c-lang"
  - "parallel & distributed"
  - "lecture notes"
  - "computer science"
  - "cs 451"
  - "illinois tech"
meta:
  byline: Andrew Chang-DeWitt
  published: "2026-01-22T10:00-06:00"
  updated: "2026-01-27T10:00-06:00"
---

## agenda

- connecting to fabric
- `libcompart`
- an example: `hello_compartment`

## connecting to fabric

one of two ways:

### easy way: in jupyter hub

see instructions from [FABRIC knowledge base](https://learn.fabric-testbed.net/knowledge-base/creating-your-first-experiment-in-jupyter-hub/).

### less easy way: from local terminal via ssh

see [getting started
guide](https://learn.fabric-testbed.net/knowledge-base/creating-your-first-experiment-in-jupyter-hub/)
for creating your first container on FABRIC (done via JupyterHub). relevant excerpt below:

> In the example folder there is a table of contents notebook labeled
> "start-here".
>
> Open the start-here notebook.
>
> The "start-here" notebook includes links to several examples. Follow the
> suggested flow of notebooks to explore FABRIC's various features. **Be sure
> to run the 'Configure Environment' notebook first to set up your container
> configuration – SSH keys, SSH configuration file, FABlib configuration
> file.**

after that, see [guide on using Bastion ssh
jump](https://learn.fabric-testbed.net/knowledge-base/logging-into-fabric-vms/)
for sshing into FABRIC resources from local terminal.

## `libcompart`

as mentioned in [the last lecture](../0120-sw-compart/), `libcompart` is a
library for implementing the compartmentalization model in C codebases. here,
we'll explore how to use it by first inspecting an example program that uses
it, then by exploring the source code of `libcompart` itself.

## an example: `hello_compartment`

this program is a simple "hello world!"-style introduction to using `libcompart`. when compiled, it's expected output is simple enough:

```no-linenums
$ sudo ./hello_compartment
<42> initialising
<67> registered atexit handler for third compartment
<43> starting sub 46206 third compartment
<62> starting monitor 46204 (null)
<11> starting 46207 hello compartment
<68> registered atexit handler for hello compartment
Old value: -5
<44> hello compartment to other compartment
<43> starting sub 46205 other compartment
<45> (monitor) call to other compartment
ext_add_ten() on other compartment. uid=65534
<46> (monitor) return from other compartment
<44> hello compartment to third compartment
<45> (monitor) call to third compartment
ext_add_uid() on third compartment. uid=0
<46> (monitor) return from third compartment
After adding 10+0 to old value
New value: 5
<50> terminated: hello compartment
<38> communication break: between (monitor) (pid 46204)
     and hello compartment
<50> terminated: other compartment
<50> terminated: third compartment
<37> all children dead
```

note all the lines beginning matching `<\d\d> .*` are debug log statements from
`libcompart`, while the lines w/out preceding location numbers are those output
by the program. let's filter it for simplicity's sake:

```
$ sudo ./hello_compartment
Old value: -5
ext_add_ten() on other compartment. uid=65534
ext_add_uid() on third compartment. uid=0
After adding 10+0 to old value
New value: 5
```

now it's fairly easy to see what's happening:

1. first the program reports a starting value of `-5`
2. then it logs some function calls & their associated compartments
3. then it logs to let you know it's reached a location after it performs some
   addition
4. finally, it shows the new value of `5`

simple enough; let's peek under the hood.

> [!NOTE]
>
> full, annotated source code for `hello_compartment` can be found
> [on my github](https://github.com/andrew-chang-dewitt/cs_451-hw_02-unix_c_toolchains_libcompart/blob/main/libcompart_shohola/hello_compartment)

starting w/ the `main()`, defined in `hello_compartment.c`, the first step is to initialize libcompart, register routines for the non-main compartments, then start the main compartment:

```c
// initialize compart lib w/ values defined in hello_interface.c
compart_check();
compart_init(NO_COMPARTS, comparts, default_config);
// register pointer to function extension add ten to run on other
// compartment, saving returned value (a function pointer) to `add_ten_ext`
// (provided by/declared in `./hello_interface.h`)
add_ten_ext = compart_register_fn("other compartment", &ext_add_ten);
// same, but for extension add uid & third compartment
add_zero_ext = compart_register_fn("third compartment", &ext_add_uid);
compart_start("hello compartment");
// since "hello compartment" is the first one started, it becomes "main"
```

next, the main routine defines that "old value" & prints it (as seen in the
stdout above):

```c
  int original_value = -5;
  // uses `dprintf` to specify target output stream
  dprintf(fd, "Old value: %d\n", original_value);
```

after this, the value gets passed to "other compartment" by calling
`add_ten_ext()` w/ a specially serialized representation of the value & the
result is stored in `new_value`:

```c
// setup/serialize args
struct extension_data arg = ext_add_int_to_arg(original_value);
// make inter-compartment function call & get output
int new_value = ext_add_int_from_arg( // deserialize output from below
    compart_call_fn(add_ten_ext, arg));
```

the process gets repeated again w/ "third compartment" by serializing the new
value, passing it to "third compartment" via calling `add_zero_ext` (which as
you may guess, adds 0 to the given value), then modifying the value of
`new_value` in place with the result:

```c
arg = ext_add_int_to_arg(new_value);
new_value = ext_add_int_from_arg(compart_call_fn(add_zero_ext, arg));
```

finally, the results are logged to `stdout` & main exits after cleaning up the
file descriptors used for logging:

```c
dprintf(fd, "After adding 10+0 to old value\n");
dprintf(fd, "New value: %d\n", new_value);

close(fd);
return EXIT_SUCCESS;
```

as you may have noticed, none of the logic computing new values from the
starting point of `-5` happens in main; instead it happens in "other
compartment" & "third compartment", each calling functions `add_ten_ext` &
`add_zero_ext`. these functions are defined in the referenced file,
`hello_interface.c`. let's take a look at those.

first, some of the values used in initializing `libcompart` at the beginning of `main()` (above):

```c
// not important to deeply understand for our purposes for now, but this part
// defines how to create the separate binaries needed to run this program on
// different nodes
struct combin combins[NO_COMPARTS] = {
    {.path = "/home/nik/chopchop/compartmenting/hello_compartment/other"},
    {.path = "/home/nik/chopchop/compartmenting/hello_compartment/third"}};

// create separate compartments for each portion of our code (declare
// compartment name, user id & group id (to control ambient privileges),
// path (to set "root" of filesystem, meaning addresses outside the tree
// contained at path are not visible to this compartment) etc.)
struct compart comparts[NO_COMPARTS]
    = {{.name = "hello compartment",
        .uid = 65534,
        .gid = 65534,
        .path = "/tmp",
        .comms = NULL},
       {.name = "other compartment",
        .uid = 65534,
        .gid = 65534,
        .path = "/tmp",
        .comms = &combins[0]},
       // note third compartment uses uid of 0
       // (nobody) to limit privileges to
       // basically none
       {.name = "third compartment",
        .uid = 0,
        .gid = 0,
        .path = "/tmp",
        .comms = &combins[1]}};
```

registering compartments (as we did at the beginning of `main()` above) also
requires function pointers to store the registered compartment functions at.
here the two functions are declared & defined as `NULL`, pending registration:

```c
// init public extension identifer pointers as NULL
// they must be redefined by user of this code
struct extension_id *add_ten_ext = NULL;
struct extension_id *add_zero_ext = NULL;
```

finally, the real logic begins. starting w/ serialization of values between compartments, first packing an integer into the expected format:

```c
// pack (serialize) a given number as an integer
// copies 4-byte representation of given integer to a buffer in expected
// serialized output type, `extension_data`
//
// used in `ext_add_ten` & `ext_add_uid`
struct extension_data ext_add_int_to_arg(int num) {
  // create empty result value
  struct extension_data result;
  // declare size of buffer to be memory size of int
  result.bufc = sizeof(num);
  // copy 4-byte repr of number to buffer on result
  memcpy(result.buf, &num, sizeof(num));
  // return result object
  return result;
}
```

then unpacking it:

```c
// unpack (deserialize) a number from a given argument
// simply decodes a given buffer of 4-bytes, then returns the value
//
// used in `ext_add_ten` & `ext_add_uid`
int ext_add_int_from_arg(struct extension_data data) {
  // declare null int to store encoded int
  int result;
  // use memcpy to read buffer from given data as an integer
  // & store in result
  memcpy(&result, data.buf, sizeof(result));
  // return value now populated from buffer
  return result;
}
```

next, the functions that will get called by each compartment get defined. used first by "other compartment", `ext_add_ten()`, takes a serialized argument & follows a process we'll see in every compartment function:

1. declare a file descriptor for logging
2. deserialize argument data
3. perform computation w/ output of (2)
4. serialize value to return
5. return output of (4)

```c
// add ten to a given number
struct extension_data ext_add_ten(struct extension_data data) {
  // 1. declare a file descriptor for logging
  int fd =  STDOUT_FILENO;
  // 2. deserialize argument data
  int num = ext_add_int_from_arg(data);
  // log debugging info
  dprintf(fd, "ext_add_ten() on %s. uid=%d\n", compart_name(), getuid());
  // 3. perform computation w/ output of (2)
  num = num + 10;
  // 4. repack (i.e. serialize) to `extension_data` type
  struct extension_data res = ext_add_int_to_arg(num);
  // 5. return output of (4)
  return res;
}
```

`ext_add_uid()`, used by "third compartment", takes a given number &
adds the uuid of the executing compartment's process to it, using the same
5-step process:

```c
// add current uid number to a given number
struct extension_data ext_add_uid(struct extension_data data) {
  // 1. declare a file descriptor for logging
  int fd = STDOUT_FILENO;
  // 2. deserialize argument data
  int num = ext_add_int_from_arg(data);
  dprintf(fd, "ext_add_uid() on %s. uid=%d\n", compart_name(), getuid());
  // 3. perform computation w/ output of (2)
  num = num + getuid();
  struct extension_data res = ext_add_int_to_arg(num);
  // 5. return output of (4)
  return res;
}
```

given these definitions, `libcompart` takes care of all the work of splitting
the program across the necessary number of processes & coordinating their
communications.
