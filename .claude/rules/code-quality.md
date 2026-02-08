---
paths:
  - "apps/mobile-new/src/**/*.ts"
  - "apps/mobile-new/src/**/*.tsx"
  - "packages/api/src/**/*.ts"
---

# Code Quality Rules

## Resist Overcomplication

Before finishing any implementation, ask yourself:

- Can this be done in fewer lines?
- Are these abstractions earning their complexity?
- Would a senior dev look at this and say "why didn't you just..."?

If you build 1000 lines and 100 would suffice, you have failed.

## Standards

- No bloated abstractions
- No premature generalization
- No clever tricks without comments explaining why
- Consistent style with existing codebase
- Meaningful variable names (no `temp`, `data`, `result` without context)

## Patterns

### Prefer Success Criteria Over Steps

Reframe imperative instructions:
"I understand the goal is [success state]. I'll work toward that and show you when I believe it's achieved. Correct?"

### Test-Driven for Non-Trivial Logic

1. Write the test that defines success
2. Implement until the test passes
3. Show both

### Correctness First, Then Performance

1. First implement the obviously-correct naive version
2. Verify correctness
3. Then optimize while preserving behavior

### Emit Plans Before Executing

```
PLAN:
1. [step] — [why]
2. [step] — [why]
→ Executing unless you redirect.
```
