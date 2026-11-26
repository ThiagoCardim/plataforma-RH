/** Full Next app test with a loopback-only synthetic Auth/Data API. Never uses hosted Supabase.
 * Setup: npm install --prefix work/browser --no-save playwright@1.56.1
 * For optimized builds, use the loopback env below while building, then RUN_BUILT_APP=1.
 * Run: node tests/browser/people.mjs (Chromium: /usr/bin/chromium, override CHROMIUM_PATH).
 */
import { createServer, get } from "node:http";
import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
import { chromium } from "../../work/browser/node_modules/playwright/index.mjs";
const port = 3103,
  apiPort = 3104;
const base = `http://127.0.0.1:${port}`;
await mkdir("work/stage-03b", { recursive: true });
await mkdir("work/navigation-review", { recursive: true });
const violations = [],
  requests = [];
const api = createServer((req, res) => {
  requests.push({ method: req.method, url: req.url });
  if (req.method !== "GET") {
    violations.push(req.method);
    res.writeHead(405).end();
    return;
  }
  const token = req.headers.authorization?.split(" ")[1];
  let role = "professional";
  try {
    role = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString(),
    ).sub;
  } catch {}
  const org =
    new URL(req.url, base).searchParams.get("id")?.replace("eq.", "") ??
    "org-a";
  const baseRole = role.split("-")[0];
  const managerial = baseRole === "hr" || baseRole === "director";
  const user = {
    id: role,
    aud: "authenticated",
    role: "authenticated",
    email: `${role}@exemplo.invalid`,
    app_metadata: {},
    user_metadata: {},
    created_at: "2026-01-01T00:00:00Z",
  };
  const membership = (organization_id) => ({
    id: `membership-${organization_id}`,
    organization_id,
    user_id: role,
    active: true,
    contract_type: role.endsWith("-pj")
      ? "pj"
      : role.endsWith("-intern")
        ? "intern"
        : "clt",
    created_at: "2026-01-01T00:00:00Z",
  });
  const answers = {
    organizations: {
      id: org,
      name:
        org === "org-b"
          ? "Organização B · teste"
          : "YouCon · organização de teste",
    },
    memberships: [membership("org-a"), membership("org-b")],
    profiles: { display_name: "Conta sintética" },
    membership_roles: [{ role_code: baseRole }],
    role_permissions: [
      "home.view",
      ...(managerial
        ? ["people.management.view", "people.dashboard.view"]
        : []),
    ].map((permission_code) => ({ permission_code })),
  };
  res.setHeader("Content-Type", "application/json");
  if (req.url.startsWith("/auth/v1/user")) res.end(JSON.stringify(user));
  else if (req.url.startsWith("/rest/v1/"))
    res.end(JSON.stringify(answers[req.url.split("/")[3].split("?")[0]] ?? []));
  else res.writeHead(404).end("{}");
});
await new Promise((resolve) => api.listen(apiPort, "127.0.0.1", resolve));
const log = createWriteStream("work/stage-03b/next-browser.log");
const next = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    ...(process.env.RUN_BUILT_APP === "1" ? ["start"] : ["dev", "--webpack"]),
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  {
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${apiPort}`,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_synthetic_loopback",
      NEXT_TELEMETRY_DISABLED: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
next.stdout.pipe(log);
next.stderr.pipe(log);
let browser, lastPage;
try {
  for (let i = 0; i < 120; i++) {
    try {
      if (
        await new Promise((resolve) => {
          const req = get(`${base}/login`, (res) => {
            res.resume();
            resolve(res.statusCode === 200);
          });
          req.on("error", () => resolve(false));
          req.setTimeout(3000, () => {
            req.destroy();
            resolve(false);
          });
        })
      )
        break;
    } catch {}
    if (next.exitCode !== null) throw new Error("Next exited before ready");
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  async function contextFor(role) {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 1080 },
      locale: "pt-BR",
    });
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const jwt = `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ sub: role, exp, role: "authenticated" })).toString("base64url")}.synthetic`;
    const session = {
      access_token: jwt,
      refresh_token: "synthetic-refresh",
      token_type: "bearer",
      expires_in: 3600,
      expires_at: exp,
      user: { id: role, aud: "authenticated", role: "authenticated" },
    };
    await ctx.addCookies([
      {
        name: "youcon-people-auth",
        value: `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`,
        url: base,
      },
    ]);
    return ctx;
  }
  await mkdir("work/recruitment-review", { recursive: true });
  const errors = [];
  async function open(role, route = "/recrutamento/visao-geral") {
    const ctx = await contextFor(role),
      page = await ctx.newPage();
    lastPage = page;
    page.setDefaultTimeout(12000);
    page.on("pageerror", (e) => errors.push(`${role}: ${e.message}`));
    page.on("request", (r) => {
      if (new URL(r.url()).hostname.endsWith("supabase.co"))
        violations.push(r.url());
    });
    await page.goto(base + route);
    return { ctx, page };
  }
  const tab = (p, name) => p.getByRole("button", { name, exact: true }).click();
  async function close(p) {
    await p.keyboard.press("Escape");
    assert.equal(await p.getByRole("dialog").count(), 0);
  }
  async function shot(p, name) {
    await p.evaluate(() => {
      document.activeElement?.blur();
      window.scrollTo(0, 0);
    });
    await p.screenshot({ path: `work/recruitment-review/${name}.png` });
    assert.ok(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      "horizontal page overflow",
    );
  }
  const dialog = (p) => p.getByRole("dialog");
  async function readDemo(p) {
    return p.evaluate(async () => {
      const db = await new Promise((resolve, reject) => {
        const r = indexedDB.open("youcon-demo-v1");
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      });
      return new Promise((resolve) => {
        const tx = db.transaction("demos"),
          store = tx.objectStore("demos"),
          r = store.getAllKeys();
        r.onsuccess = () => {
          const key = r.result.find((k) =>
            String(k).startsWith("recruitment-v1:"),
          );
          const q = store.get(key);
          q.onsuccess = () => {
            resolve(q.result);
            db.close();
          };
        };
      });
    });
  }
  async function moveCard(p, name, value) {
    const card = p
      .locator("article.ats-card")
      .filter({ has: p.getByRole("button", { name: new RegExp("^" + name) }) });
    await card.locator("summary").filter({ hasText: "Mover card" }).click();
    await p.getByLabel("Mover " + name, { exact: true }).selectOption(value);
    await dialog(p)
      .getByLabel("Motivo da movimentação", { exact: true })
      .fill("Movimentação fictícia validada no navegador.");
    await dialog(p)
      .getByRole("button", { name: "Confirmar movimentação", exact: true })
      .click();
    await dialog(p).waitFor({ state: "detached" });
  }
  {
    const { ctx, page: p } = await open(
      "hr",
      "/recrutamento/processo-seletivo",
    );
    await p
      .getByRole("button", { name: "Configurar Kanban", exact: true })
      .waitFor();
    await p
      .getByRole("button", { name: "Configurar Kanban", exact: true })
      .focus();
    await p.keyboard.press("Enter");
    await dialog(p)
      .getByRole("button", { name: "Adicionar fase", exact: true })
      .click();
    await dialog(p)
      .getByLabel("Nome da fase", { exact: true })
      .fill("Revisão demonstrativa");
    await dialog(p).getByLabel("Cor da fase", { exact: true }).fill("#334455");
    await dialog(p)
      .getByRole("button", { name: "Salvar fase", exact: true })
      .click();
    await dialog(p)
      .getByRole("button", {
        name: "Subir fase Revisão demonstrativa",
        exact: true,
      })
      .click();
    await close(p);
    assert.equal(await p.locator(".ats-column").count(), 13);
    const st = (await readDemo(p)).central.stages.find(
      (s) => s.name === "Revisão demonstrativa",
    );
    await moveCard(p, "Alex Demo", st.id);
    await p
      .getByRole("button", { name: "Configurar Kanban", exact: true })
      .click();
    await dialog(p)
      .getByRole("button", {
        name: "Remover fase Revisão demonstrativa",
        exact: true,
      })
      .click();
    assert.equal(
      await dialog(p)
        .getByRole("button", { name: "Transferir e excluir fase", exact: true })
        .isDisabled(),
      true,
    );
    const next = (await readDemo(p)).central.stages.find(
      (s) => s.kind === "entry",
    );
    await dialog(p)
      .getByLabel("Transferir cards para", { exact: true })
      .selectOption(next.id);
    await dialog(p)
      .getByLabel("Confirmo a transferência e a exclusão da fase", {
        exact: true,
      })
      .check();
    await dialog(p)
      .getByRole("button", { name: "Transferir e excluir fase", exact: true })
      .click();
    await close(p);
    assert.equal(await p.locator(".ats-column").count(), 12);
    let snapshot = await readDemo(p);
    assert.equal(
      snapshot.applications.find((a) => a.candidate === "rec-candidate-0")
        .stage,
      next.id,
    );
    assert.ok(
      snapshot.applications
        .find((a) => a.candidate === "rec-candidate-0")
        .events.some((e) =>
          e.text.includes("Fase Revisão demonstrativa excluída"),
        ),
    );
    await p
      .getByRole("button", { name: "Configurar Kanban", exact: true })
      .click();
    await tab(p, "Campos da ficha");
    await dialog(p)
      .getByRole("button", { name: "Adicionar campo", exact: true })
      .click();
    await dialog(p)
      .locator("summary")
      .filter({ hasText: "Nova pergunta" })
      .click();
    await dialog(p)
      .getByLabel("Pergunta 13", { exact: true })
      .fill("Especialidade adicional");
    await dialog(p)
      .getByRole("button", { name: "Salvar campos da ficha", exact: true })
      .click();
    await tab(p, "Aparência dos cards");
    await dialog(p)
      .getByLabel("Cor padrão dos cards", { exact: true })
      .fill("#aabbcc");
    await dialog(p)
      .getByLabel("Especialidade adicional", { exact: true })
      .check();
    await dialog(p)
      .getByRole("button", { name: "Salvar aparência", exact: true })
      .click();
    await tab(p, "Formulário de currículos");
    await dialog(p)
      .getByLabel("Nome do formulário", { exact: true })
      .fill("Inscrição demonstrativa editada");
    await dialog(p)
      .getByRole("button", { name: "Salvar formulário", exact: true })
      .click();
    await close(p);
    await p
      .getByRole("button", { name: "Cadastrar currículo", exact: true })
      .click();
    await dialog(p)
      .getByLabel("Nome completo *", { exact: true })
      .fill("Pessoa Kanban Fictícia");
    await dialog(p)
      .getByLabel("E-mail *", { exact: true })
      .fill("kanban-ficticio@exemplo.invalid");
    await dialog(p)
      .getByLabel("Especialidade adicional", { exact: true })
      .fill("Detalhamento BIM");
    await dialog(p)
      .getByLabel("Cor deste card", { exact: true })
      .fill("#778899");
    await dialog(p)
      .getByRole("button", { name: "Salvar talento", exact: true })
      .click();
    await dialog(p).waitFor({ state: "detached" });
    await p.getByRole("button", { name: /^Pessoa Kanban Fictícia/ }).waitFor();
    await p.reload();
    await p.getByRole("button", { name: /^Pessoa Kanban Fictícia/ }).waitFor();
    const card = p.locator("article.ats-card").filter({
      has: p.getByRole("button", { name: /^Pessoa Kanban Fictícia/ }),
    });
    assert.ok((await card.textContent()).includes("Detalhamento BIM"));
    await card
      .getByLabel("Ações do card de Pessoa Kanban Fictícia", { exact: true })
      .click();
    await card
      .getByRole("button", { name: "Editar card", exact: true })
      .click();
    await dialog(p)
      .getByLabel("Especialidade adicional", { exact: true })
      .fill("BIM editado");
    await dialog(p)
      .getByRole("button", { name: "Salvar talento", exact: true })
      .click();
    await dialog(p).waitFor({ state: "detached" });
    await card
      .getByRole("button", { name: "Abrir ficha", exact: true })
      .click();
    await dialog(p)
      .getByText(/Especialidade adicional: BIM editado/)
      .waitFor();
    await close(p);
    await card
      .getByRole("button", { name: "Excluir card", exact: true })
      .click();
    await dialog(p)
      .getByLabel("Motivo da exclusão local", { exact: true })
      .fill("Remover exemplo manual do quadro");
    p.once("dialog", (d) => d.accept());
    await dialog(p)
      .getByRole("button", { name: "Confirmar exclusão local", exact: true })
      .click();
    await dialog(p).waitFor({ state: "detached" });
    assert.equal(await card.count(), 0);
    snapshot = await readDemo(p);
    const person = snapshot.candidates.find(
      (c) => c.email === "kanban-ficticio@exemplo.invalid",
    );
    assert.ok(person);
    assert.ok(
      snapshot.applications.find((a) => a.candidate === person.id).archived,
    );
    const alex = p
      .locator("article.ats-card")
      .filter({ has: p.getByRole("button", { name: /^Alex Demo/ }) });
    await alex
      .getByLabel("Ações do card de Alex Demo", { exact: true })
      .click();
    await alex
      .getByRole("button", { name: "Excluir dados fictícios", exact: true })
      .click();
    const deletion = p.getByRole("dialog", {
      name: "Excluir dados fictícios",
      exact: true,
    });
    await deletion
      .getByLabel("Motivo da exclusão local", { exact: true })
      .fill("Anonimização de exemplo fictício");
    p.once("dialog", (d) => d.accept());
    await deletion
      .getByRole("button", { name: "Confirmar exclusão local", exact: true })
      .click();
    await p.getByRole("dialog").waitFor({ state: "detached" });
    const erased = (await readDemo(p)).candidates.find(
      (c) => c.id === "rec-candidate-0",
    );
    assert.ok(erased.erased);
    assert.equal(erased.email, "");
    await shot(p, "selection-kanban-desktop");
    await p.setViewportSize({ width: 390, height: 844 });
    await shot(p, "selection-kanban-mobile");
    await ctx.close();
  }
  {
    const { ctx, page: p } = await open(
      "director",
      "/recrutamento/processo-seletivo",
    );
    await p
      .getByRole("link", { name: "Testar RH com dados fictícios", exact: true })
      .waitFor();
    assert.equal(
      await p
        .getByRole("button", { name: "Configurar Kanban", exact: true })
        .count(),
      0,
    );
    const original = await readDemo(p);
    await p
      .getByRole("link", { name: "Testar RH com dados fictícios", exact: true })
      .click();
    await p
      .getByRole("button", { name: "Configurar Kanban", exact: true })
      .waitFor();
    assert.ok(
      (await p.locator("main").textContent()).includes(
        "Perfil autenticado: Diretoria",
      ),
    );
    await p
      .getByRole("button", { name: "Configurar Kanban", exact: true })
      .click();
    await tab(p, "Aparência dos cards");
    await dialog(p)
      .getByLabel("Cor padrão dos cards", { exact: true })
      .fill("#334466");
    await dialog(p)
      .getByRole("button", { name: "Salvar aparência", exact: true })
      .click();
    await close(p);
    await p.reload();
    await p
      .getByRole("button", { name: "Configurar Kanban", exact: true })
      .waitFor();
    const labStored = await p.evaluate(async () => {
      const db = await new Promise((resolve) => {
        const r = indexedDB.open("youcon-demo-v1");
        r.onsuccess = () => resolve(r.result);
      });
      return new Promise((resolve) => {
        const store = db.transaction("demos").objectStore("demos"),
          r = store.getAllKeys();
        r.onsuccess = () => {
          const q = store.get(
            r.result.find((k) =>
              String(k).startsWith("recruitment-v1:selection-rh-demo:"),
            ),
          );
          q.onsuccess = () => {
            resolve(q.result);
            db.close();
          };
        };
      });
    });
    assert.equal(labStored.central.selection.cardColor, "#334466");
    const normal = await readDemo(p);
    assert.deepEqual(normal, original);
    await p
      .getByRole("link", { name: "Voltar ao perfil real", exact: true })
      .click();
    await p
      .getByRole("link", { name: "Testar RH com dados fictícios", exact: true })
      .waitFor();
    assert.equal(
      await p
        .getByRole("button", { name: "Configurar Kanban", exact: true })
        .count(),
      0,
    );
    await p.goto(base + "/recrutamento/configuracoes?demonstracao=rh");
    await p.waitForURL("**/acesso-negado");
    await ctx.close();
  }
  for (const role of ["professional", "professional-pj"]) {
    const { ctx, page: p } = await open(
      role,
      "/recrutamento/processo-seletivo?demonstracao=rh",
    );
    await p.waitForURL("**/acesso-negado");
    await ctx.close();
  }
  const anon = await browser.newContext(),
    ap = await anon.newPage();
  await ap.goto(base + "/recrutamento/processo-seletivo?demonstracao=rh");
  await ap.waitForURL("**/login**");
  await anon.close();
  assert.deepEqual(errors, []);
  assert.deepEqual(violations, []);
  console.log(
    JSON.stringify({
      result: "PASS",
      mutations: 0,
      requests: requests.length,
      flows:
        "Selection Kanban CRUD; phase transfers/history; custom forms/profile/cards; isolated RH demo; role guards; reload; keyboard/mobile; no remote writes",
    }),
  );
} catch (e) {
  await lastPage
    ?.screenshot({ path: "work/recruitment-review/failure.png" })
    .catch(() => {});
  throw e;
} finally {
  await browser?.close();
  next.kill("SIGTERM");
  api.closeAllConnections();
  api.close();
  log.end();
}
