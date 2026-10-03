import { build } from "esbuild";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

// Exercise the real routes and development PostgreSQL with only author identity
// stubbed in the isolated test bundle. No authentication bypass exists in the app.
if (process.env.NODE_ENV === "production") throw new Error("Development-only test.");
const directory = await mkdtemp(join(tmpdir(), "poem-views-"));
try {
  const result = await build({
    stdin: {
      resolveDir: resolve("artifacts/api-server"),
      contents: `
        import assert from 'node:assert/strict';
        import { randomUUID, createHash } from 'node:crypto';
        import express from 'express';
        import { db, pool, poemsTable } from '@workspace/db';
        import { asc, eq } from 'drizzle-orm';
        import router from './src/routes/poems';
        const app = express();
        app.use(express.json());
        app.use((req, res, next) => { req.log = { error() {} }; next(); });
        app.use('/api', router);
        const server = app.listen(0, '127.0.0.1');
        await new Promise(resolve => server.once('listening', resolve));
        const base = 'http://127.0.0.1:' + server.address().port + '/api';
        const snapshot = async () => createHash('sha256').update(JSON.stringify(
          await db.select().from(poemsTable).orderBy(asc(poemsTable.id))
        )).digest('hex');
        const before = await snapshot();
        let fixture;
        try {
          [fixture] = await db.insert(poemsTable).values({
            title: 'View counter regression ' + randomUUID(), content: 'Isolated test fixture.', position: 1000000
          }).returning();
          const send = (requestId, author = '') => fetch(base + '/poems/' + fixture.id + '/views', {
            method: 'POST', headers: { 'content-type': 'application/json', 'x-test-author': author },
            body: JSON.stringify({ requestId })
          });
          const count = async () => (await (await fetch(base + '/poems/' + fixture.id)).json()).viewCount;
          assert.equal(await count(), 0, 'GET must not count views');
          const opening = randomUUID();
          assert.equal((await (await send(opening)).json()).viewCount, 1);
          assert.equal((await (await send(opening)).json()).viewCount, 1, 'retry must be idempotent');
          assert.equal((await (await send(randomUUID(), 'yes')).json()).viewCount, 1, 'author excluded');
          assert.equal((await send(randomUUID(), 'unavailable')).status, 503);
          assert.equal(await count(), 1, 'failed identity verification must not increment');
          assert.equal((await send('invalid')).status, 400);
          const concurrent = await Promise.all(Array.from({length: 5}, () => send(randomUUID())));
          assert.ok(concurrent.every(response => response.status === 200));
          assert.equal(await count(), 6, 'concurrent readers must not lose increments');
          const duplicate = randomUUID();
          await Promise.all(Array.from({length: 3}, () => send(duplicate)));
          assert.equal(await count(), 7, 'concurrent retries count once');
          const missing = await fetch(base + '/poems/2147483647/views', {
            method: 'POST', headers: {'content-type':'application/json'},
            body: JSON.stringify({requestId: randomUUID()})
          });
          assert.equal(missing.status, 404);
          console.log('PASS: public views, author exclusion, auth failure, retries, concurrency, validation and missing poem.');
        } finally {
          if (fixture) await db.delete(poemsTable).where(eq(poemsTable.id, fixture.id));
          assert.equal(await snapshot(), before, 'existing poems must be unchanged');
          console.log('PASS: test fixture removed; existing texts and counters unchanged.');
          await new Promise(resolve => server.close(resolve));
          await pool.end();
        }
      `,
    },
    bundle: true, platform: "node", format: "esm",
    banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
    write: false,
    plugins: [{
      name: "isolated-author-fixture",
      setup(builder) {
        builder.onResolve({ filter: /author-access$/ }, () => ({ path: "author-fixture", namespace: "test" }));
        builder.onLoad({ filter: /.*/, namespace: "test" }, () => ({
          contents: `export async function isAuthor(req) {
            if (req.get('x-test-author') === 'unavailable') throw new Error('Identity unavailable');
            return req.get('x-test-author') === 'yes';
          }`, loader: "js",
        }));
      },
    }],
  });
  const file = join(directory, "test.mjs");
  await writeFile(file, result.outputFiles[0].contents);
  const run = spawnSync(process.execPath, [file], { encoding: "utf8", env: process.env });
  process.stdout.write(run.stdout);
  process.stderr.write(run.stderr);
  if (run.status !== 0) process.exitCode = 1;
} finally {
  await rm(directory, { recursive: true, force: true });
}