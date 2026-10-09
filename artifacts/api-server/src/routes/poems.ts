import { Router, type IRouter, type RequestHandler } from "express";
import { asc, eq, sql } from "drizzle-orm";
import { db, poemsTable, poemViewsTable, type PoemRecord } from "@workspace/db";
import { getAuth } from "@clerk/express";
import { isAuthor } from "../lib/author-access";
import {
  ListPoemsResponse, CreatePoemBody, CreatePoemResponse,
  GetPoemParams, GetPoemResponse, UpdatePoemBody, UpdatePoemParams,
  UpdatePoemResponse, DeletePoemParams, ReorderPoemsBody,
  ReorderPoemsResponse, GetBlogInfoResponse,
  RecordPoemViewParams, RecordPoemViewBody, RecordPoemViewResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const serialized = (poem: PoemRecord) => ({ ...poem, createdAt: poem.createdAt.toISOString() });
const ordered = () => db.select().from(poemsTable).orderBy(asc(poemsTable.position), asc(poemsTable.id));
const requireEditor: RequestHandler = async (req, res, next) => {
  if (!getAuth(req).userId) {
    res.status(401).json({ error: "Entre na conta do autor para alterar poemas." });
    return;
  }
  try {
    if (!await isAuthor(req)) {
      res.status(403).json({ error: "Esta conta não tem autorização de autor." });
      return;
    }
  } catch {
    req.log.error("Não foi possível verificar a autorização do autor.");
    res.status(503).json({ error: "Não foi possível verificar o acesso. Tente novamente." });
    return;
  }
  if (!req.is("application/json") && req.method !== "DELETE") {
    res.status(415).json({ error: "Envie JSON." });
    return;
  }
  const origin = req.get("origin");
  const expectedHost = req.get("x-forwarded-host") ?? req.get("host");
  if (origin) {
    try {
      if (new URL(origin).host !== expectedHost) throw new Error("origin");
    } catch {
      res.status(403).json({ error: "Origem não autorizada." });
      return;
    }
  }
  next();
};

router.get("/poems", async (_req, res): Promise<void> => {
  res.json(ListPoemsResponse.parse((await ordered()).map(serialized)));
});
router.get("/blog-info", async (req, res): Promise<void> => {
  let canEdit: boolean;
  try { canEdit = await isAuthor(req); }
  catch {
    req.log.error("Não foi possível verificar a autorização do autor.");
    res.status(503).json({ error: "Não foi possível verificar o acesso. Tente novamente." });
    return;
  }
  res.set("Cache-Control", "private, no-store");
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
router.post("/poems/:id/views", async (req, res): Promise<void> => {
  res.set("Cache-Control", "private, no-store");
  if (!req.is("application/json")) {
    res.status(415).json({ error: "Envie JSON." }); return;
  }
  const origin = req.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== (req.get("x-forwarded-host") ?? req.get("host"))) throw new Error("origin");
    } catch {
      res.status(403).json({ error: "Origem não autorizada." }); return;
    }
  }
  const params = RecordPoemViewParams.safeParse(req.params);
  const parsed = RecordPoemViewBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Visualização inválida." }); return;
  }
  const [poem] = await db.select().from(poemsTable).where(eq(poemsTable.id, params.data.id));
  if (!poem) { res.status(404).json({ error: "Poema não encontrado." }); return; }
  try {
    if (await isAuthor(req)) {
      res.json(RecordPoemViewResponse.parse({ viewCount: poem.viewCount })); return;
    }
  } catch {
    // Never count a visit when the signed-in author's identity cannot be checked.
    req.log.error("Não foi possível verificar o autor para registrar a visualização.");
    res.status(503).json({ error: "Não foi possível registrar a visualização. Tente novamente." }); return;
  }
  const result = await db.transaction(async (tx) => {
    // Lock the poem so a concurrent deletion cannot invalidate the receipt.
    const [current] = await tx.select().from(poemsTable)
      .where(eq(poemsTable.id, params.data.id)).for("update");
    if (!current) return null;
    const receipt = await tx.insert(poemViewsTable).values({
      requestId: parsed.data.requestId, poemId: current.id,
    }).onConflictDoNothing().returning({ requestId: poemViewsTable.requestId });
    if (!receipt.length) return { viewCount: current.viewCount };
    const [updated] = await tx.update(poemsTable).set({
      viewCount: sql`${poemsTable.viewCount} + 1`,
    }).where(eq(poemsTable.id, current.id)).returning({ viewCount: poemsTable.viewCount });
    return updated;
  });
  if (!result) { res.status(404).json({ error: "Poema não encontrado." }); return; }
  res.json(RecordPoemViewResponse.parse(result));
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