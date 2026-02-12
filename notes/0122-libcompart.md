---
title: "Parallel & Distributed: diving further into using FABRIC"
description: "a walkthrough of how to set up, connect to, execute code on FABRIC testbed. also some explainations of code to be used in second homework assignment."
keywords:
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

- setup fabric resources
- connecting
- execution
- hw 2, code explaination

## setup fabric resources

summary of how to set up necessary computing resources for running `hello_compartment` example:

1. connect to project
2. create slice
3. create slivers (nodes)
4. connect to slivers

## connecting

one of two ways:

### easy way: in jupyter hub

see []

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
