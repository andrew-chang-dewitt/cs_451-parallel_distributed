---
title: "Parallel & Distributed: getting started w/ FABRIC testbed"
description: "Some basics on working with FABRIC, a state of the art testbed for parallel & distributed computing."
keywords:
  - "fabric"
  - "parallel & distributed"
  - "lecture notes"
  - "computer science"
  - "cs 451"
  - "illinois tech"
meta:
  byline: Andrew Chang-DeWitt
  published: "2026-01-15T10:00-06:00"
  updated: "2026-01-19T22:00-06:00"
---

## agenda

- what is FABRIC?
- jargon
- demos

## what is FABRIC?

a _testbed_, like ARPANET, for research & governmental purposes used to
play with the ideas of networking & distributed computing.

in this course, we'll use it as a platform assignments/projects for
hands on demonstrations of working on distributed systems. additionally
it gives some uniformity, easing learning.

### what is _not_ FABRIC

a physical h/w platform that must be maintained/operated by all
researchers using it (although there _is_ h/w that is operated byprofessionals mostly).

### what can you do with FABRIC?

- ex 1: patchwork
  - a tool for making observations on the state of FABRIC
  - visualizations, analysis, etc.
- ex 2: crinkle
  - debugging tools for dist. sys.
  - ui
- large-scale experiments
  - trigger primative generation (TPG)
  - clusters, tracks, etc.

## jargon

- _**site**_&mdash;aka _node_; a location in the network, containing racks of
  servers, or as they're called in FABRIC...
- ..._**worker**_&mdash; a single server, containing physical
- _**resource**s_&mdash;various distributed h/w elements available, including
  ram, cpu, storage, etc.
- _**slice**_&mdash;the key unit of assignment; a set of resources across FABRIC
- _**sliver**_&mdash;a portion of a slice w/out dedicated access to resources,
  e.g. a VM (incidentally, a VM is called a _**node**_ in FABRIC lingo)

## demo: deploying an llm on FABRIC

see jupyter notebook! a brief overview w/ comments
from prof:

- inits python lib `fablib_manager` w/ uuid, then
  uses it to create a slice
- then gets a node from that slice, getting its GPU
  sliver
- finally utilizes that GPU via the sliver to run
  the LLM

once a VM is created, you can ssh using
fabric-testbed.net browser GUI (easier to setup
credentials), but also possible from nativeterminal instead if you want to.

> [!NOTE]
>
> visualizations are vvv important in term project!

## demo: basics

perhaps the easiest way to interact w/ fabric is via python, starting by
initializing an instance of the manager library connection w/ a project id

```python
from fabrictestbed_extensions.fablib.fablib import FablibManager as fablib_manager

fablib = fablib_manager(project_id="...")
```

from there, you can set up nodes & slices w/ name, OS image, optional site.
configuration is done declaratively, building nodes/slices/etc. as objects.

```python
slice_name = "libcompart"
image = "default_ubuntu_22"
site = None # can specify this, or let fablib figure it out
slice = fablib.new_slice(name = slice_name)
# first node
n1 = slice.add_node(name = "n1", image = image, cores = 2, ram = 4, disk = 9, site = site)
# network interface for first node
n1_iface1 = n1.add_component(model = "NIC_Basic", name = "iface1").get_interfaces()[0]
# second node
n2 = slice.add_node(name = "n1", image = image, cores = 2, ram = 4, disk = 9, site = site)
# network interface for first node
n2_iface1 = n2.add_component(model = "NIC_Basic", name = "iface1").get_interfaces()[0]
# create network connection between both nodes (VMs)
# can specify type, but may (always?) need to specify site above when creating
# nodes first as some (all?) networks may require VMs to be on same site
net = slice.add_l2network(name = "net", interfaces=[n1_iface1, n2_iface1])
```

when config is built, a requisition request must be submitted. this step will
take some time & logs can be monitored in separate ssh instance if desired.

```python
slice.submit()
```

now slice should be available by name

```python
slice2 = fablib.get_slice(slice_name)
assert slice == slice2
```

& slice can execute commands programmatically w/ python

```python
n1.execute("sudo apt update -y -qq")
n1.execute("sudo apt install -y build-essential net-tools python3-scipy")
```

or you could ssh into the vm to execute the same commands.
