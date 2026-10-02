const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const path = require('node:path');
const { test } = require('node:test');

// Resolve through both actual consumers, not a test-only braces dependency.
const apiRequire = createRequire(path.resolve('artifacts/api-server/package.json'));
const sandboxRequire = createRequire(path.resolve('artifacts/mockup-sandbox/package.json'));
const apiMicromatch = createRequire(apiRequire.resolve('http-proxy-middleware'))
  .resolve('micromatch');
const sandboxMicromatch = createRequire(sandboxRequire.resolve('fast-glob'))
  .resolve('micromatch');

for (const [consumer, micromatchPath] of [
  ['API proxy', apiMicromatch],
  ['sandbox file globbing', sandboxMicromatch],
]) {
  const requireMicromatch = createRequire(micromatchPath);
  const braces = requireMicromatch('braces');
  const micromatch = requireMicromatch(micromatchPath);
  const isDepthError = error => error instanceof SyntaxError
    && /nesting exceeds the safety limit/.test(error.message);

  test(`${consumer}: ordinary patterns retain their behavior`, () => {
    assert.deepEqual(braces.expand('a/{b,c}/d'), ['a/b/d', 'a/c/d']);
    assert.equal(braces.compile('a/{b,c}/d'), 'a/(b|c)/d');
    assert.equal(braces.stringify(braces.parse('a/{b,c}/d')), 'a/{b,c}/d');
    assert.deepEqual(braces.expand('{1..3}'), ['1', '2', '3']);
    assert.deepEqual(braces.expand('{a,{b,c}}'), ['a', 'b', 'c']);
    assert.deepEqual(braces.expand('file-\\{a,b\\}'), ['file-{a,b}']);
    assert.deepEqual(micromatch(['a.ts', 'b.js', 'c.md'], '*.{ts,js}'), ['a.ts', 'b.js']);
    const nested = '{'.repeat(30) + 'a,b' + '}'.repeat(30);
    assert.doesNotThrow(() => braces.compile(nested));
  });

  test(`${consumer}: deep strings fail safely across public entry points`, () => {
    const patterns = [
      '{'.repeat(4000) + 'a,b' + '}'.repeat(4000),
      '('.repeat(4000) + 'a' + ')'.repeat(4000),
      '{'.repeat(4000) + 'a',
      '({'.repeat(2000) + 'a,b' + '})'.repeat(2000),
    ];
    for (const pattern of patterns) {
      for (const operation of [
        () => braces(pattern),
        () => braces([pattern]),
        () => braces(pattern, { expand: true }),
        () => braces.parse(pattern),
        () => braces.compile(pattern),
        () => braces.expand(pattern),
        () => braces.stringify(pattern),
      ]) {
        assert.throws(operation, isDepthError);
      }
    }
    assert.throws(() => micromatch.braces(patterns[0]), isDepthError);
    // makeRe uses picomatch's own iterative parser, not the braces package.
    assert.doesNotThrow(() => micromatch.makeRe(patterns[0]));
  });

  test(`${consumer}: prebuilt deeply nested ASTs cannot bypass the parser guard`, () => {
    const root = { type: 'root', nodes: [] };
    let parent = root;
    for (let i = 0; i < 10000; i++) {
      const child = { type: 'paren', nodes: [], parent };
      parent.nodes.push(child);
      parent = child;
    }
    parent.nodes.push({ type: 'text', value: 'a', parent });
    for (const method of ['compile', 'expand', 'stringify']) {
      assert.throws(() => braces[method](root), isDepthError);
    }
  });
}