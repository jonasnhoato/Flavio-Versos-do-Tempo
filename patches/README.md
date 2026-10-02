# Dependency security patches

`braces@3.0.3.patch` mitigates GHSA-vfj7-8cjw-p6xm, a stack-exhaustion
denial of service from deeply nested brace/parenthesis patterns.
The advisory currently lists all released versions (through 3.0.3) as affected,
with no patched release.

The patch bounds parser nesting and all three recursive AST walkers
(`compile`, `expand`, `stringify`) at a fixed safety limit of 64.
Excessive nesting throws a descriptive `SyntaxError` rather than exhausting
the JavaScript call stack. The walker checks also protect callers supplying
prebuilt ASTs. Normal shallow glob patterns are unchanged.

pnpm applies this patch to every workspace consumer via `patchedDependencies`;
the lockfile records its hash. Version-only vulnerability scanners may still
report 3.0.3, because this is a local mitigation, not an upstream fixed version.
Replace it with a verified upstream fix when one is published.

Run the regression checks from the workspace root:

```sh
node --test scripts/tests/braces-security.test.cjs
```