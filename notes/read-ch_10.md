---
title: "Parallel & Distributed: SystemVerilog (reading)"
description: "Reading notes on Chapter 10: SystemVerilog. Covers hardware description languages (HDLs), the SystemVerilog language (modules, testbenches, datatypes, combinational & sequential logic), tooling (iverilog, Verilator, GTKWave), & waveform-based simulation."
keywords:
  - "systemverilog"
  - "hdl"
  - "hardware description"
  - "fpga"
  - "combinational logic"
  - "sequential logic"
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
> reading notes on chapter 10 of the course textbook by Nik Sultana (© 2026,
> licensed CC BY-NC-SA 4.0). source material only; no outside references.

## agenda

- why hardware description languages?
- tooling: iverilog, Verilator, GTKWave
- testbenches & waveforms
- SV syntax: wire, reg, logic, datatypes, literals
- combinational logic & gates
- sequential logic: latches, flip-flops, counters
- blocking vs. non-blocking assignment
- modules & composition

## hardware description languages (HDLs)

hardware ultimately works by manipulating physical properties, enabling vast
amounts of parallelism at extremely fine granularity. modern CPUs & GPUs are
composed of billions of transistors, which compose into logic gates & memory.

_**def: HDL (Hardware Description Language)**_&mdash;a language for designing
& reasoning about hardware components at a higher level of abstraction than
individual gates. HDL code is compiled to a circuit description that composes
gates & memory. that circuit can then be used to:
- program reconfigurable hardware (FPGAs, CPLDs), or
- guide fabrication of actual silicon chips.

_**def: SystemVerilog (SV)**_&mdash;a widely-used HDL. in this course we
use it to produce simulations of hardware designs.

## tooling

- **ICARUS Verilog (`iverilog`)**&mdash;open-source SV compiler/simulator.
  supports X & Z values. https://github.com/steveicarus/iverilog
- **Verilator**&mdash;converts SV to C++ for faster simulation. does _not_
  support X & Z values. https://verilator.org/
- **GTKWave**&mdash;waveform viewer. https://gtkwave.sourceforge.net/
- **Surfer**&mdash;another waveform viewer. https://surfer-project.org/
- **Yosys**&mdash;synthesis tool (maps SV to low-level gate description for
  FPGAs or fabrication). https://yosyshq.net/yosys/

> [!NOTE]
>
> since we want X/Z support in simulation, we use `iverilog` throughout
> (not Verilator).

## key values in SV

| value | meaning |
|-------|---------|
| `0` | logical zero |
| `1` | logical one |
| `Z` | high-impedance (disconnected hardware / no value available) |
| `X` | unknown value |

Z & X are not supported by Verilator. Logic starts out as X until initialized
(usually via a reset signal).

## datatypes

ranges over `{0, 1}` only:
- `bit`, `byte`, `shortint`, `int`, `longint` — all signed (except `bit`);
  use `unsigned` keyword to make them unsigned

ranges over `{0, 1, Z, X}`:
- `wire` — for combinational connections
- `reg` — for holding state (used in `always` blocks)
- `logic` — more general; use for both
- `integer` — 32-bit, ranges over `{0, 1, Z, X}`

## literals

literals include their width & base:

```no-linenums
8'b1        8-bit binary, value 1
8'b0        8-bit binary, value 0
4'hA        4-bit hex, value 0xA (decimal 10)
5'hA        5-bit hex, value 0xA
```

in addition to binary (`b`), values can be in hex (`h`) or decimal (`d`).

## structure: modules & composition

code is organized into **modules** that are _instantiated_ inside other
modules. ultimately everything is instantiated inside a testbench.

minimal module example:

```systemverilog
module M (input wire W1, output wire W2);
  assign W2 = W1;    // continuous assignment (combinational logic)
endmodule;
```

_**def: testbench**_&mdash;a module that drives a hardware description but
is not itself synthesizable. used for simulation only.

> [!IMPORTANT]
>
> some SV syntax is _non-synthesizable_ (only valid in simulation)—e.g.
> `$display`, `$dumpfile`, `$dumpvars`, `$finish`, and some comparison
> operators like `===`. synthesizable code should avoid those constructs.

## first testbench: introducing structure & time

```systemverilog
module tb;
  logic [4:0] x = 0;
  logic clk = 0;
  always #1 clk = ~clk;    // clock toggles every 1 time unit

  initial begin
    $dumpfile("tb_waveform.vcd");   // waveform output
    $dumpvars(0, tb);               // record all signals in tb

    $display("Starting");

    x = 0; #2; $display("Step 0: x=%h", x);
    x = 1; #2; $display("Step 1: x=%h", x);
    x = 2; #2; $display("Step 2: x=%h", x);
    x = 3; #2; $display("Step 3: x=%h", x);
    x = 4; #2; $display("Step 4: x=%h", x);

    $display("Ending");
    $finish;
  end
endmodule
```

run w/ Verilator:

```sh
$ verilator --binary --trace tb.sv
$ obj_dir/Vtb
Starting
Step 0: x=00
Step 1: x=01
...
Ending
- tb.sv:34: Verilog $finish
```

> [!NOTE]
>
> hardware design involves **explicit reasoning about time** (via `#N` delay
> primitives), unlike software design where time is mostly abstracted away.

## waveforms (VCD)

the testbench produces a `.vcd` (Value Change Dump) file. viewing w/
the course's `simpleVCD` tool:

```no-linenums
11 samples / 1ps / zoom: 1

x [4:0] [5]: 0 0 1 1 2 2 3 3 4 4 4
clk    [ 1]: _/\_/\_/\_/\_/\_
```

## combinational logic

_**def: combinational logic**_&mdash;logic whose output depends only on
current inputs (no memory/state).

in SV, expressed using `assign` (continuous assignment) or `always @*` blocks:

```systemverilog
assign W2 = W1;          // driven by W1 continuously
// or equivalently:
always @* begin
  W2 = W1;
end
```

### logic operators

| operation | bit-wise SV syntax | logical SV syntax |
|-----------|-------------------|-------------------|
| AND | `&` | `&&` |
| OR | `\|` | `\|\|` |
| NOT | `~` | `!` |
| XOR | `^` | — |
| NOR | `~\|` | — |
| NAND | `~&` | — |
| XNOR | `~^` | — |

bit-wise operators (`&`, `|`, `~`, `^`) work on arrays of bits. logical
operators (`&&`, `||`) work on scalar boolean values.

> [!TODO]
>
> the chapter includes diagrams of AND, OR, NOT, XOR, XNOR gate symbols &
> a multiplexer diagram. couldn't reproduce reliably via OCR. would be worth
> adding ASCII art or an image of the standard gate shapes here.

### combinational logic example module

```systemverilog
module M (
  input  wire clk,
  input  wire a,
  input  wire b,
  output reg [4:0] result = 0
);
  always @(posedge clk)
  begin
    result = a | b;
  end
endmodule
```

### multiplexer (mux)

_**def: multiplexer (mux)**_&mdash;a combinational circuit that selects one
of multiple inputs & routes it to the output, based on a `choice` signal.

```no-linenums
In1 ──┐
In2 ──┤ mux ──► Out
       │
Choice ┘
```

> [!TODO]
>
> add truth table for mux (2-input, 1-bit choice).

## sequential logic

_**def: sequential logic**_&mdash;logic w/ memory/state; output depends on
both current inputs & past state.

two common 1-bit memory abstractions:
- _**latch**_&mdash;level-triggered; output changes when the enable signal
  is at a given level
- _**flip-flop**_&mdash;edge-triggered; output changes on the clock edge.
  most common in synchronous digital design

synchronous designs typically use the positive clock edge:

```systemverilog
always @(posedge clk)
begin
  // state update logic here
end
```

### counter example

```systemverilog
module Counter (
  input  logic clk,
  input  logic reset,
  output reg [2:0] count
);
  always @(posedge clk)
  begin
    if (reset) count = 0;
    else       count = count + 1;
  end
endmodule;
```

## blocking vs. non-blocking assignment

two types of assignment in `always` blocks:

| type | symbol | behavior |
|------|--------|----------|
| blocking | `=` | sequential; each assignment completes before next |
| non-blocking | `<=` | concurrent; all RHS evaluated before any LHS updated |

compare these two patterns:

```systemverilog
// BLOCKING — a gets current b, then b gets current c
// result: a = old_b, b = old_c
always @(posedge clk) begin
  a = b;
  b = c;
end

// NON-BLOCKING — both assignments happen simultaneously
// result: a = old_b, b = old_c  (same in this case, but different
// semantics & synthesis results)
always @(posedge clk) begin
  a <= b;
  b <= c;
end
```

> [!IMPORTANT]
>
> the choice between blocking & non-blocking assignment affects synthesis.
> convention: use `<=` (non-blocking) for sequential (clocked) logic, & `=`
> (blocking) for combinational logic.

## comparison & arithmetic operators

arithmetic: `+`, `-`, `*`, `/`, `%` (mod), `**` (exponentiation)

> [!NOTE]
>
> some operators (like `%` & `**`) may not synthesize or may synthesize
> inefficiently—prefer simpler primitives when possible.

shift operators:
- `>>` — logical shift right (inserts zeroes)
- `>>>` — arithmetic shift right (inserts sign bit)
- `<<`, `<<<` — left equivalents

comparison:
- `==`, `!=` — equality for `{0, 1}` values
- `===`, `!==` — equality including X & Z (non-synthesizable)
- `>`, `<`, `>=`, `<=` (note `<=` is overloaded—also non-blocking assignment)

## sensitivity lists

`always @(...)` takes a sensitivity list:

```systemverilog
always @(posedge clk)  // triggered on rising edge of clk
always @(negedge clk)  // triggered on falling edge of clk
always @*              // triggered by any change to any signal read in block
```

## further resources

there is much more to SystemVerilog & hardware design beyond this introduction.
resources for further exploration:
- open RISC-V implementations: https://github.com/riscv/
- OpenTitan hardware security chip
- FPGA boards for hands-on practice
- Yosys primer: https://yosyshq.readthedocs.io/projects/yosys/en/latest/appendix/primer.html
- Emu rapid prototyping framework: https://github.com/NaaS/emu-Live/tree/master/lib

> [!TODO]
>
> chapter includes several waveform diagrams (tick-based signal timing charts
> for mux inputs a, b, choice, result). couldn't reliably reproduce via OCR.
> worth drawing these by hand or finding the source PDF diagrams to add here.
