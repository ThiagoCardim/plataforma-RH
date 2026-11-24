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
  const managerial = role === "hr" || role === "director";
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
    contract_type: "pj",
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
    membership_roles: [{ role_code: role }],
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
let browser;
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
  await mkdir("work/offboarding-review", { recursive: true });
  for (const role of ["professional", "hr", "director", "leadership"]) {
    console.log("Offboarding role", role);
    const ctx = await contextFor(role),
      page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("request", (r) => {
      if (new URL(r.url()).hostname.endsWith("supabase.co"))
        violations.push(r.url());
    });
    await page.goto(`${base}/offboarding`);
    if (role === "professional") {
      await page.waitForURL(/acesso-negado$/);
      await ctx.close();
      continue;
    }
    await page
      .getByRole("heading", { name: "Offboarding", exact: true })
      .waitFor();
    const nav = page
      .locator(".desktop-sidebar")
      .getByRole("navigation", { name: "Navegação principal", exact: true });
    const links = await nav.getByRole("link").allTextContents();
    assert.ok(
      links.findIndex((s) => s.includes("Offboarding")) ===
        links.findIndex((s) => s.trim() === "Onboarding") + 1,
    );
    if (role === "director")
      await page.screenshot({
        path: "work/offboarding-review/overview.png",
        fullPage: true,
      });
    await page
      .getByRole("button", { name: "Offboardings", exact: true })
      .click();
    await page.getByRole("button", { name: /Camila Demo/ }).waitFor();
    if (role === "leadership") {
      assert.equal(
        await page
          .getByRole("button", { name: "Novo offboarding", exact: true })
          .count(),
        0,
      );
      assert.equal(
        await page
          .getByRole("combobox", { name: "Mover Camila Demo", exact: true })
          .count(),
        0,
      );
      assert.equal(
        await page.getByRole("button", { name: /Lara Exemplo/ }).count(),
        0,
      );
      await page.getByRole("button", { name: /Camila Demo/ }).click();
      const dialog = page.getByRole("dialog");
      assert.equal(
        await dialog.getByRole("button", { name: /Trilha RH/ }).count(),
        0,
      );
      assert.equal(
        await dialog
          .getByText("Pendências administrativas e contratuais", {
            exact: false,
          })
          .count(),
        0,
      );
      assert.equal(
        await dialog
          .getByText("Entrevista de desligamento", { exact: false })
          .count(),
        0,
      );
      await dialog
        .getByRole("button", { name: "Editar etapa", exact: true })
        .first()
        .click();
      assert.deepEqual(
        await page
          .getByLabel("Responsável", { exact: true })
          .locator("option")
          .allTextContents(),
        ["Liderança"],
      );
      await page
        .getByLabel("Nome da etapa", { exact: true })
        .fill("Transferência operacional revisada");
      await page
        .getByRole("button", { name: "Salvar etapa", exact: true })
        .click();
      await page
        .getByText("1. Transferência operacional revisada", { exact: true })
        .waitFor();
      await dialog.getByRole("checkbox").first().check();
      if (role === "leadership")
        await page.screenshot({ path: "work/offboarding-review/leader.png" });
      await page
        .getByRole("button", { name: "Fechar painel", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Modelos de Offboarding", exact: true })
        .click();
      await page
        .getByRole("button", {
          name: /Transferência operacional · CLT · Voluntário/,
        })
        .click();
      assert.equal(
        await page
          .getByRole("button", { name: "Aprovar modelo", exact: true })
          .count(),
        0,
      );
      await page
        .getByRole("button", { name: "Fechar painel", exact: true })
        .click();
    } else {
      await page
        .getByLabel("Mover Camila Demo", { exact: true })
        .selectOption("done");
      await page
        .getByText(
          "Conclua as atividades obrigatórias das duas trilhas antes de finalizar.",
          { exact: true },
        )
        .waitFor();
      const card = page
        .locator("article")
        .filter({ has: page.getByRole("button", { name: /Camila Demo/ }) });
      await card.dragTo(page.locator('[data-column="handover"]'), {
        targetPosition: { x: 100, y: 40 },
      });
      await page
        .locator('[data-column="handover"]')
        .getByRole("button", { name: /Camila Demo/ })
        .waitFor();
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
      );
      if (role === "director")
        await page.screenshot({ path: "work/offboarding-review/kanban.png" });
      await page
        .getByLabel("Filtrar setor", { exact: true })
        .selectOption("Engenharia");
      assert.equal(
        await page.getByRole("button", { name: /Camila Demo/ }).count(),
        0,
      );
      await page.getByLabel("Filtrar setor", { exact: true }).selectOption("");
      await page
        .getByRole("button", { name: "Personalizar quadro", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Adicionar coluna", exact: true })
        .click();
      await page
        .getByLabel("Nome da coluna 5", { exact: true })
        .fill("Conferência demo");
      await page
        .getByRole("button", { name: "Fechar painel", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Novo offboarding", exact: true })
        .click();
      await page
        .getByLabel("Nome do profissional", { exact: true })
        .fill("Off Demo Teste");
      await page
        .getByLabel("Vínculo da jornada", { exact: true })
        .selectOption("PJ");
      await page
        .getByLabel("Tipo de desligamento", { exact: true })
        .selectOption("Involuntário");
      await page
        .getByText("Encerramento administrativo · PJ · Involuntário · v1", {
          exact: true,
        })
        .waitFor();
      await page
        .getByRole("button", {
          name: "Criar jornada demonstrativa",
          exact: true,
        })
        .click();
      const dialog = page.getByRole("dialog");
      await dialog
        .getByRole("heading", { name: "Off Demo Teste", exact: true })
        .waitFor();
      await page
        .getByRole("button", { name: "Editar etapa", exact: true })
        .first()
        .click();
      assert.deepEqual(
        await page
          .getByLabel("Responsável", { exact: true })
          .locator("option")
          .allTextContents(),
        ["RH"],
      );
      await page
        .getByRole("button", { name: "+ Arquivo", exact: true })
        .click();
      await page
        .getByLabel("Arquivo do conteúdo 3", { exact: true })
        .setInputFiles({
          name: "encerramento-demo.pdf",
          mimeType: "application/pdf",
          buffer: Buffer.from("%PDF-1.4 apenas demonstrativo"),
        });
      await page
        .getByRole("button", { name: "Salvar etapa", exact: true })
        .click();
      await page.getByText("encerramento-demo.pdf", { exact: true }).waitFor();
      if (role === "director")
        await page.screenshot({ path: "work/offboarding-review/process.png" });
      await page
        .getByRole("button", { name: "Fechar painel", exact: true })
        .click();
      await page.reload();
      await page
        .getByRole("button", { name: "Offboardings", exact: true })
        .click();
      await page.getByRole("button", { name: /Off Demo Teste/ }).click();
      await page.getByText("encerramento-demo.pdf", { exact: true }).waitFor();
      assert.match(
        await page
          .getByRole("link", { name: "Baixar arquivo", exact: true })
          .getAttribute("href"),
        /^blob:/,
      );
      await page
        .getByRole("button", { name: "Fechar painel", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Modelos de Offboarding", exact: true })
        .click();
      await page
        .getByRole("button", {
          name: /Transferência de projetos · Arquitetura/,
        })
        .click();
      await page
        .getByLabel("Tipo de desligamento do modelo", { exact: true })
        .selectOption("Involuntário");
      await page
        .getByRole("button", { name: "Aprovar modelo", exact: true })
        .click();
      await page.getByText("Aprovado · v1", { exact: true }).waitFor();
      await page
        .getByRole("button", { name: "Fechar painel", exact: true })
        .click();
      if (role === "director")
        await page.screenshot({
          path: "work/offboarding-review/models.png",
          fullPage: true,
        });
      await page.goto(`${base}/onboarding-offboarding`);
      await page
        .getByRole("button", { name: "Onboardings", exact: true })
        .click();
      assert.equal(
        await page.getByRole("button", { name: /Off Demo Teste/ }).count(),
        0,
      );
      if (role === "director") {
        await page.goto(`${base}/offboarding`);
        await page
          .getByRole("heading", { name: "Offboarding", exact: true })
          .waitFor();
        await page.setViewportSize({ width: 390, height: 900 });
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
        );
        await page.screenshot({
          path: "work/offboarding-review/mobile.png",
          fullPage: true,
        });
      }
    }
    assert.deepEqual(errors, []);
    await ctx.close();
  }
  assert.deepEqual(violations, []);
  console.log(
    JSON.stringify({
      result: "PASS",
      mutations: 0,
      requests: requests.length,
      flows:
        "Offboarding scopes, drag/drop, columns, exit-type matching, administrative files and reload, templates, independent Onboarding and mobile",
    }),
  );
} finally {
  await browser?.close();
  next.kill("SIGTERM");
  api.closeAllConnections();
  api.close();
  log.end();
}
