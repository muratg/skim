# SkimJS

## Notes

This is WIP Scheme interpreter in JS.

It's implemented in a yet-to-be-announced language and compiled into JavaScript.

What works:

- For now, we only have a very few basic forms: `define`, `begin`, `if`, `set!`, `quote`, `+`, `-`, etc.
- You have to start with a `(` in the repl. so `x` won't work, but `(begin x)` will.
- Only single line expressions in the REPL

What doesn't work:

- Anything else

## Installation

`npm i -g skimjs`

## Command line

`skim`: simple repl (WIP)

## Features

```scheme
(define x 1)
(begin x)
```
