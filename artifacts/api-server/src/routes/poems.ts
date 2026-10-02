import { Router, type IRouter, type RequestHandler } from "express";
import { asc, eq, sql } from "drizzle-orm";
import { db, poemsTable, type PoemRecord } from "@workspace/db";
import {
  ListPoemsResponse, CreatePoemBody, CreatePoemResponse,
  GetPoemParams, GetPoemResponse, UpdatePoemBody, UpdatePoemParams,
  UpdatePoemResponse, DeletePoemParams, ReorderPoemsBody,
  ReorderPoemsResponse, GetBlogInfoResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const canEdit = process.env.NODE_ENV === "development";
const serialized = (poem: PoemRecord) => ({ ...poem, createdAt: poem.createdAt.toISOString() });
const ordered = () => db.select().from(poemsTable).orderBy(asc(poemsTable.position), asc(poemsTable.id));
// This initial preview deliberately has no public write access in production.
// Replace this gate with an authenticated owner check before enabling published editing.
const requireEditor: RequestHandler = (req, res, next) => {
  if (!canEdit) {
    res.status(403).json({ error: "A publicação está bloqueada até configurar o acesso exclusivo do autor." });
    return;
  }
  if (!req.is("application/json") && req.method !== "DELETE") {
    res.status(415).json({ error: "Envie JSON." });
    return;
  }
  const origin = req.get("origin");
  const expectedHost = req.get("x-forwarded-host") ?? req.get("host");
  if (origin && new URL(origin).host !== expectedHost) {
    res.status(403).json({ error: "Origem não autorizada." });
    return;
  }
  next();
};

router.get("/poems", async (_req, res): Promise<void> => {
  res.json(ListPoemsResponse.parse((await ordered()).map(serialized)));
});
router.get("/blog-info", async (_req, res): Promise<void> => {
  const poems = await ordered();
  const dates = new Map<string, number>();
  for (const poem of poems) {
    const date = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
    }).format(poem.createdAt);
    dates.set(date, (dates.get(date) ?? 0) + 1);
  }
  res.json(GetBlogInfoResponse.parse({
    total: poems.length, canEdit,
    archive: [...dates].sort(([a], [b]) => b.localeCompare(a)).map(([date, count]) => ({ date, count })),
  }));
});
router.post("/poems", requireEditor, async (req, res): Promise<void> => {
  const parsed = CreatePoemBody.safeParse(req.body);
  if (!parsed.success || !parsed.data.title.trim() || !parsed.data.content.trim()) {
    res.status(400).json({ error: "Preencha o título e o poema." }); return;
  }
  const poem = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(180241)`);
    await tx.update(poemsTable).set({ position: sql`${poemsTable.position} + 1` });
    const [created] = await tx.insert(poemsTable).values({
      title: parsed.data.title.trim(), content: parsed.data.content.trim(), position: 0,
    }).returning();
    return created;
  });
  res.status(201).json(CreatePoemResponse.parse(serialized(poem)));
});
router.put("/poems/reorder", requireEditor, async (req, res): Promise<void> => {
  const parsed = ReorderPoemsBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Ordem inválida." }); return; }
  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(180241)`);
    const existing = await tx.select({ id: poemsTable.id }).from(poemsTable);
    const ids = parsed.data.ids;
    if (new Set(ids).size !== ids.length || existing.length !== ids.length ||
      existing.some((p) => !ids.includes(p.id))) return null;
    for (const [position, id] of ids.entries()) {
      await tx.update(poemsTable).set({ position }).where(eq(poemsTable.id, id));
    }
    return tx.select().from(poemsTable).orderBy(asc(poemsTable.position));
  });
  if (!result) { res.status(409).json({ error: "A lista mudou. Atualize a página e tente novamente." }); return; }
  res.json(ReorderPoemsResponse.parse(result.map(serialized)));
});
router.get("/poems/:id", async (req, res): Promise<void> => {
  const params = GetPoemParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Identificador inválido." }); return; }
  const [poem] = await db.select().from(poemsTable).where(eq(poemsTable.id, params.data.id));
  if (!poem) { res.status(404).json({ error: "Poema não encontrado." }); return; }
  res.json(GetPoemResponse.parse(serialized(poem)));
});
router.patch("/poems/:id", requireEditor, async (req, res): Promise<void> => {
  const params = UpdatePoemParams.safeParse(req.params);
  const parsed = UpdatePoemBody.safeParse(req.body);
  if (!params.success || !parsed.success || !parsed.data.title.trim() || !parsed.data.content.trim()) {
    res.status(400).json({ error: "Preencha o título e o poema." }); return;
  }
  const [poem] = await db.update(poemsTable).set({
    title: parsed.data.title.trim(), content: parsed.data.content.trim(), isExample: false,
  }).where(eq(poemsTable.id, params.data.id)).returning();
  if (!poem) { res.status(404).json({ error: "Poema não encontrado." }); return; }
  res.json(UpdatePoemResponse.parse(serialized(poem)));
});
router.delete("/poems/:id", requireEditor, async (req, res): Promise<void> => {
  const params = DeletePoemParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Identificador inválido." }); return; }
  const deleted = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(180241)`);
    return tx.delete(poemsTable).where(eq(poemsTable.id, params.data.id)).returning();
  });
  if (!deleted.length) { res.status(404).json({ error: "Poema não encontrado." }); return; }
  res.sendStatus(204);
});
export default router;