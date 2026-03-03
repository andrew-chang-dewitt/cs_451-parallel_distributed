---
title: "Parallel & Distributed: sockets & distributed ipc"
description: "TODO."
keywords:
  - "sockets"
  - "ipc"
  - "distributed systems"
  - "system design"
  - "parallel & distributed"
  - "lecture notes"
  - "computer science"
  - "cs 451"
  - "illinois tech"
meta:
  byline: Andrew Chang-DeWitt
  published: "2026-02-17T10:00-06:00"
---

## agenda

- overview
- sockets

## overview

- server proc w/ 1+ client procs
- server manages some resource
- server provides service exposing abilities of resource for clients
- client activates server by request

```no-linenums
    +------------------+  +-----------+
    |                  |  |           |
    |                  v  |           v
[ client ]          [ server ]   [ resource ]
    ^                  |  ^           |
    |                  |  |           |
    +------------------+  +-----------+
```

- _def: **connections**_&mdash;used for clients & servers to communicate via
  byte streams. connections are
  1. point-to-point (a single pair of processes),
  2. full-duplex (simultaneous bidirectional dataflow), &
  3. reliable (guarantee that each byte sent is received & in order).
- _def: **socket**_&mdash;an endpoint of a _connection_
- _def: **port**_&mdash;a 16-bit integer identifying a process

we'll focus here on

## sockets

we're heavily influenced by a design called berkeley sockets, created in the
80s at UC Berkeley. available on all modern systems, passes data as 4-byte
packets across a connection.

to the kernal, a socket is an endpoint of communication. can repr resources on
the same machine even, including `stdout`, `stderr`, files, etc.

sockets interface:

1. `open_listenfd`: server starts, begins listening at socket addr & port
2. `open_clientfd`: client starts, establishes connection to server at socket
   addr & port
3. server accepts connection request, then client & server exchange data.
4. client `close`s connection
5. server reads `EOF` from client (sent by `close`), then it closes the
   connection (dropping client)

```no-linenums
    +-----------------+      +-----------------+
    |   start client  |      |  start server   |
    |                 |      |                 |
    |                 |      |                 |
    |   getaddrinfo   |      |   getaddrinfo   |
    |        :        |      |       :         |
    |        ⇣        |      |       ⇣         |
    |     socket      |      |     socket      |
    |        :        |      |       :         |
    |        :        |      |       ⇣         |
    |        :        |      |      bind       |
    |        :        |      |       :         |
    |        :        |      |       ⇣         |
    |        :        |      |     listen      |
    |        :        |      |       :         |
    |        ⇣        |      |       ⇣         |
    |     connect   ···········⇢   accept     |
    |        :        |      |       :         |
 +--|        :        |------|       :         |--+
 |  +--------:--------+      +-------:---------+  |
 |           ⇣                       ⇣            |
 |     rio_written  ···········⇢ rio_readlineb   |
 |           :                       :            |
 |           ⇣                       ⇣            |
 |    rio_readlineb ⇠···········  rio_written     |
 |  +--------:--------+      +-------:---------+  |
 +--|        ⇣        |------|       ⇣         |--+
    |      close    ···········⇢ rio_readlineb|
    |                 |      |       :         |
    +-----------------+      |       ⇣         |
                             |     close       |
                             |                 |
                             +-----------------+
```
