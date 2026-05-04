# Test 1: Tiny TypeScript Browser Game

Purpose: exercise the engineering skills on a small greenfield project with domain language, lightweight ownership, stateful models, vertical issues, TDD, and architecture review.

## Project

The app lives in [project](./project). It is a Vite + TypeScript project with `xstate` installed.

## Scenario

Build a tiny browser game:

- Menu has Start
- Start enters Playing
- Player square moves with arrow keys
- P pauses/resumes
- Enemy collision causes Game Over
- Restart starts a new run

## Skill Run Order

Run these from `test/test_1/project`:

1. `/setup-matt-pocock-skills`
2. `/grill-with-docs`
3. `/to-prd`
4. `/to-issues`
5. `/tdd` for the first stateful issue
6. `/tdd` for a later same-owner-machine issue
7. `/improve-codebase-architecture`

## What To Watch

- Does `/grill-with-docs` discover domain language, lightweight ownership, and stateful model ownership?
- Does `/to-prd` record `Lightweight Ownership` and `Stateful Models` without overdesign?
- Does `/to-issues` create vertical slices with `Ownership`, `Stateful model`, and correct `Blocked by` sequencing?
- Does `/tdd` apply `/executable-statecharts` inline and refresh against current machine code?
- Does `/improve-codebase-architecture` react to real code rather than generating greenfield architecture?

