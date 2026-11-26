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
  async function route(p, id, title) {
    await p.goto(base + "/recrutamento/" + id);
    await p.getByRole("heading", { name: title, exact: true }).waitFor();
    await p
      .getByRole("button", { name: "Restaurar exemplos", exact: true })
      .waitFor();
  }
  {
    const { ctx, page: p } = await open("hr", "/recrutamento/talentos");
    await p
      .getByRole("heading", { name: "Banco de Currículos", exact: true })
      .waitFor();
    await p
      .getByRole("button", { name: "Nina Currículo Demo", exact: true })
      .waitFor();
    let s = await readDemo(p);
    const originalProcessIds = s.applications.map((a) => a.id).sort();
    assert.equal(s.resumeVersion, 1);
    assert.equal(
      s.central.stages.some((st) => st.kind === "bank"),
      false,
    );
    assert.equal(await p.locator("tbody tr").count(), 10);
    await shot(p, "resume-database");
    await p
      .getByRole("button", {
        name: "Marcar talento Nina Currículo Demo",
        exact: true,
      })
      .click();
    await p.getByRole("button", { name: /^Talentos selecionados/ }).click();
    await p
      .getByRole("button", { name: "Nina Currículo Demo", exact: true })
      .waitFor();
    await p.reload();
    await p
      .getByRole("button", {
        name: "Desmarcar talento Nina Currículo Demo",
        exact: true,
      })
      .waitFor();
    await p
      .getByLabel(
        "Selecionar currículo Nina Currículo Demo · nina-cv@exemplo.invalid",
        { exact: true },
      )
      .check();
    await tab(p, "Solicitar atualização cadastral");
    await dialog(p)
      .getByRole("button", { name: "Copiar link individual" })
      .waitFor();
    const link = await dialog(p)
      .getByRole("link", { name: "Abrir simulação protegida" })
      .getAttribute("href");
    await shot(p, "resume-update-invitation");
    s = await readDemo(p);
    const first = s.candidates.find((p) => p.id === "resume-only-demo").created;
    await p.goto(link);
    await p
      .getByRole("heading", { name: "Atualize seu currículo", exact: true })
      .waitFor();
    assert.equal(
      await p.getByRole("navigation", { name: "Navegação principal" }).count(),
      0,
    );
    assert.equal(
      await p
        .getByRole("button", { name: "DISC e Temperamentos", exact: true })
        .count(),
      0,
    );
    await p
      .getByLabel("Cidade", { exact: true })
      .fill("Cidade Atualizada Fictícia");
    await p
      .getByLabel("Competências", { exact: true })
      .fill("BIM e compatibilização fictícia");
    await p
      .getByLabel("Novo currículo demonstrativo", { exact: true })
      .setInputFiles({
        name: "curriculo-atualizado.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("%PDF-1.4\nCurrículo inteiramente fictício"),
      });
    await p
      .getByLabel(
        "Confirmo os dados fictícios e a finalidade desta atualização demonstrativa",
      )
      .check();
    await tab(p, "Salvar atualização do currículo");
    await p
      .getByRole("heading", { name: "Currículo atualizado no mesmo cadastro" })
      .waitFor();
    s = await readDemo(p);
    assert.equal(
      s.candidates.filter((p) => p.id === "resume-only-demo").length,
      1,
    );
    assert.equal(
      s.candidates.find((p) => p.id === "resume-only-demo").created,
      first,
    );
    assert.equal(
      s.candidates.find((p) => p.id === "resume-only-demo").cv.name,
      "curriculo-atualizado.pdf",
    );
    assert.equal(
      s.resumeRequests.find((r) => link.includes(r.id)).state,
      "Utilizada",
    );
    await p.goto(link);
    await p
      .getByRole("alert")
      .filter({ hasText: "Link demonstrativo inválido" })
      .waitFor();
    await route(p, "talentos", "Banco de Currículos");
    await p
      .getByRole("button", { name: "Nina Currículo Demo", exact: true })
      .click();
    await dialog(p)
      .getByText("Versões cadastrais e currículos anteriores", { exact: true })
      .click();
    await dialog(p)
      .getByText("curriculo-atualizado.pdf", { exact: true })
      .first()
      .waitFor();
    await dialog(p)
      .getByText("Contatos e lembretes de retorno", { exact: true })
      .click();
    await dialog(p)
      .getByLabel("Disponibilidade profissional atual", { exact: true })
      .selectOption("Empregado, mas aberto a propostas");
    await dialog(p)
      .getByLabel("Observação do contato", { exact: true })
      .fill("Contato fictício registrado para retorno.");
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    await dialog(p)
      .getByLabel("Lembrete de retorno", { exact: true })
      .fill(today);
    await dialog(p)
      .getByRole("button", { name: "Registrar contato", exact: true })
      .click();
    await dialog(p)
      .getByText("Contato fictício registrado para retorno.", { exact: true })
      .waitFor();
    await shot(p, "resume-individual-history");
    await close(p);
    await p.reload();
    await p
      .getByRole("button", { name: "Nina Currículo Demo", exact: true })
      .waitFor();
    await p
      .getByLabel(
        "Selecionar currículo Alex Demo · talento-0@exemplo.invalid",
        { exact: true },
      )
      .check();
    await p
      .getByLabel(
        "Selecionar currículo Alex Demo · alex-alternativo@exemplo.invalid",
        { exact: true },
      )
      .check();
    await tab(p, "Comparar 2 cadastros");
    await dialog(p)
      .getByLabel("Manter Cidade", { exact: true })
      .selectOption("right");
    await dialog(p)
      .getByLabel("Justificativa da revisão de duplicidade", { exact: true })
      .fill("Mesma identidade conferida pelo RH; manter cidade mais recente.");
    await dialog(p)
      .getByLabel("Revisei a identidade e os campos antes de decidir")
      .check();
    await shot(p, "resume-duplicate-comparison");
    await dialog(p)
      .getByRole("button", {
        name: "Unificar registros revisados",
        exact: true,
      })
      .click();
    await dialog(p)
      .getByText(/Unificados · Mesma identidade/)
      .waitFor();
    await close(p);
    assert.equal(await p.locator("tbody tr").count(), 9);
    s = await readDemo(p);
    assert.equal(
      s.candidates.find((p) => p.id === "rec-candidate-0").city,
      "Campinas",
    );
    assert.equal(
      s.candidates.find((p) => p.id === "resume-duplicate-demo").mergedInto,
      "rec-candidate-0",
    );
    assert.deepEqual(
      s.applications.map((a) => a.id).sort(),
      originalProcessIds,
    );
    await p.goto(base + "/candidatura-demonstrativa");
    await p
      .getByLabel("Nome completo *", { exact: true })
      .fill("Outra Pessoa Fictícia");
    await p
      .getByLabel("E-mail *", { exact: true })
      .fill("talento-0@exemplo.invalid");
    await p
      .getByLabel("Área de interesse *", { exact: true })
      .selectOption("Engenharia");
    await p
      .getByLabel(
        "Confirmo o uso de dados exclusivamente fictícios nesta simulação local",
      )
      .check();
    await tab(p, "Registrar candidatura demonstrativa");
    await p.getByRole("link", { name: "Retornar ao processo" }).waitFor();
    await route(p, "talentos", "Banco de Currículos");
    assert.equal(await p.locator("tbody tr").count(), 9);
    await p.getByRole("button", { name: /^Revisar duplicidades/ }).click();
    await dialog(p)
      .getByLabel("Justificativa da revisão de duplicidade")
      .fill(
        "Pessoas distintas, contato compartilhado apenas para este teste fictício.",
      );
    await dialog(p)
      .getByLabel("Revisei a identidade e os campos antes de decidir")
      .check();
    await dialog(p)
      .getByRole("button", { name: "Manter registros separados", exact: true })
      .click();
    await dialog(p)
      .getByText(/Separados · Pessoas distintas/)
      .waitFor();
    await close(p);
    assert.equal(await p.locator("tbody tr").count(), 10);
    await tab(p, "Importar demonstração");
    await dialog(p)
      .getByRole("button", { name: "Carregar exemplo fictício" })
      .click();
    await dialog(p)
      .getByRole("button", {
        name: "Pré-visualizar e identificar duplicidades",
      })
      .click();
    await dialog(p)
      .getByText(/Possível duplicidade/)
      .first()
      .waitFor();
    await shot(p, "resume-import-review");
    await dialog(p)
      .getByLabel(
        "Revisei as linhas e confirmo que são exclusivamente dados fictícios",
      )
      .check();
    await dialog(p)
      .getByRole("button", { name: "Simular importação local revisada" })
      .click();
    await dialog(p)
      .getByRole("heading", { name: "Relatório da importação demonstrativa" })
      .waitFor();
    await dialog(p)
      .getByText(
        "1 cadastros · 1 revisões de duplicidade · 0 linhas ignoradas",
        { exact: true },
      )
      .waitFor();
    await close(p);
    await p.reload();
    await p
      .getByRole("button", { name: "Rui Importação Demo", exact: true })
      .waitFor();
    s = await readDemo(p);
    assert.equal(s.importReports.length, 1);
    assert.equal(
      s.applications.some(
        (a) =>
          a.candidate ===
          s.candidates.find((p) => p.email === "rui-import@exemplo.invalid").id,
      ),
      false,
    );
    await tab(p, "YouCon Match");
    await dialog(p)
      .getByLabel("Pesquisar em linguagem natural", { exact: true })
      .fill("Nina");
    await dialog(p)
      .getByLabel("Priorizar talentos selecionados", { exact: true })
      .check();
    await dialog(p)
      .getByRole("button", { name: "Analisar e comparar selecionados" })
      .click();
    await dialog(p)
      .getByRole("heading", { name: /Nina Currículo Demo/ })
      .waitFor();
    await shot(p, "resume-match-whole-database");
    await close(p);
    await tab(p, "Preferências");
    await dialog(p).getByLabel("Limite 1 em meses", { exact: true }).fill("1");
    await dialog(p).getByLabel("Limite 2 em meses", { exact: true }).fill("4");
    await dialog(p).getByLabel("Limite 3 em meses", { exact: true }).fill("8");
    await dialog(p)
      .getByLabel("Validade do link demonstrativo em horas", { exact: true })
      .fill("3");
    await dialog(p)
      .getByLabel(
        "Arquivar automaticamente processos encerrados nesta demonstração",
      )
      .check();
    await dialog(p)
      .getByRole("button", { name: "Salvar preferências locais" })
      .click();
    await close(p);
    await p.reload();
    await p
      .getByRole("button", { name: "Nina Currículo Demo", exact: true })
      .waitFor();
    s = await readDemo(p);
    assert.deepEqual(s.resumeConfig.months, [1, 4, 8]);
    assert.equal(s.resumeConfig.linkHours, 3);
    await tab(p, "Filtros");
    await p
      .getByLabel("Situação profissional no Banco", { exact: true })
      .selectOption("Empregado, mas aberto a propostas");
    await p
      .getByRole("button", { name: "Nina Currículo Demo", exact: true })
      .waitFor();
    await tab(p, "Limpar filtros do Banco");
    await tab(p, "Filtros");
    await p.setViewportSize({ width: 390, height: 844 });
    await p.emulateMedia({ reducedMotion: "reduce" });
    await shot(p, "resume-mobile-table");
    await tab(p, "Cards");
    await shot(p, "resume-mobile-cards");
    await p
      .getByRole("button", { name: "Nina Currículo Demo", exact: true })
      .focus();
    await p.keyboard.press("Enter");
    await dialog(p).waitFor();
    await p.keyboard.press("Escape");
    assert.equal(await dialog(p).count(), 0);
    await p.setViewportSize({ width: 1440, height: 1080 });
    await tab(p, "Cadastrar currículo");
    await dialog(p)
      .getByLabel("Nome completo", { exact: true })
      .fill("Cadastro Manual Fictício");
    await dialog(p)
      .getByLabel("E-mail", { exact: true })
      .fill("manual-cv@exemplo.invalid");
    await dialog(p)
      .getByLabel("Setor de interesse", { exact: true })
      .fill("Arquitetura");
    assert.ok(
      (await dialog(p)
        .getByLabel("Retenção demonstrativa até", { exact: true })
        .inputValue()) > today,
    );
    await dialog(p)
      .getByRole("button", { name: "Salvar talento", exact: true })
      .click();
    await dialog(p).waitFor({ state: "detached" });
    await p
      .getByRole("button", { name: "Cadastro Manual Fictício", exact: true })
      .waitFor();
    await ctx.close();
  }
  for (const role of [
    "director",
    "leadership",
    "professional",
    "professional-pj",
  ]) {
    const { ctx, page: p } = await open(role, "/recrutamento/talentos");
    await p.waitForURL("**/acesso-negado");
    await p.goto(base + "/candidatura-demonstrativa?atualizar=fake&token=fake");
    await p.waitForURL("**/acesso-negado");
    await ctx.close();
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(violations, []);
  console.log(
    JSON.stringify({
      result: "PASS",
      mutations: 0,
      flows:
        "All CVs and legacy bank migration, independent talents, temporary update and replay denial, CV history/reload, contacts/reminders, human merge and keep-separate, CSV mapping/duplicate review/report, Match over whole eligible base, configurable intervals/archive rules, role guards, mobile and keyboard",
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
