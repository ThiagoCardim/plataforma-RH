/** Full Next app test with a loopback-only synthetic Auth/Data API. Never uses hosted Supabase.
 * Setup: npm install --prefix work/browser --no-save playwright@1.56.1
 * For optimized builds, use the loopback env below while building, then RUN_BUILT_APP=1.
 * Run: node tests/browser/people.mjs (Chromium: /usr/bin/chromium, override CHROMIUM_PATH).
 */
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
import { chromium } from "../../work/browser/node_modules/playwright/index.mjs";
const port = 3103,
  apiPort = 3104;
const base = `http://127.0.0.1:${port}`;
await mkdir("work/stage-03b", { recursive: true });
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
      if ((await fetch(`${base}/login`)).ok) break;
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
  const routes = ["", "/nova", "/demo-1", "/demo-1/editar"].map(
    (p) => `/gente-gestao/pessoas${p}`,
  );
  const anonymous = await browser.newContext();
  const anonPage = await anonymous.newPage();
  await anonPage.goto(`${base}${routes[0]}`);
  await anonPage.waitForURL(/\/login$/);
  await anonymous.close();
  for (const role of ["professional", "leadership"]) {
    const ctx = await contextFor(role),
      page = await ctx.newPage();
    for (const route of routes) {
      await page.goto(`${base}${route}`);
      await page.waitForURL(/\/acesso-negado$/);
    }
    await ctx.close();
  }
  for (const role of ["hr", "director"]) {
    const ctx = await contextFor(role),
      page = await ctx.newPage();
    console.log("Testing role", role);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (req) => {
      if (new URL(req.url()).hostname.endsWith("supabase.co"))
        violations.push(req.url());
    });
    await page.goto(`${base}/gente-gestao`);
    await page
      .getByRole("heading", { name: "Pessoas que constroem." })
      .waitFor();
    await page
      .getByRole("link", { name: "Cadastrar pessoa", exact: true })
      .waitFor();
    await page.waitForFunction(() => {
      const button = [...document.querySelectorAll("button")].find((b) =>
        b.textContent.includes("Próxima"),
      );
      return (
        button &&
        Object.keys(button).some(
          (key) =>
            key.startsWith("__reactProps") &&
            typeof button[key]?.onClick === "function",
        )
      );
    });
    await page.getByRole("button", { name: "Próxima", exact: true }).click();

    await page
      .getByRole("link", { name: "Ver ficha de Sofia Planta", exact: true })
      .waitFor();
    await page.getByRole("button", { name: "Anterior", exact: true }).click();
    await page.getByLabel("Pesquisar pessoa").fill("MARINA");
    assert.equal(await page.locator("tbody tr").count(), 1);
    await page.getByLabel("Pesquisar pessoa").fill("zzzz");
    await page
      .getByRole("heading", { name: "Nenhuma pessoa encontrada" })
      .waitFor();
    await page.getByRole("button", { name: "Limpar filtros" }).click();
    await page.getByLabel("Vínculo", { exact: true }).selectOption("pj");
    await page.getByLabel("Situação", { exact: true }).selectOption("Vigente");
    await page.getByLabel("Setor", { exact: true }).selectOption("Engenharia");
    assert.equal(await page.locator("tbody tr").count(), 1);
    await page.getByRole("button", { name: "Limpar filtros" }).click();
    if (role === "director") {
      await page.waitForFunction(() => {
        const side = document
          .querySelector(".desktop-sidebar")
          .getBoundingClientRect();
        return (
          document.querySelector("main").getBoundingClientRect().left >=
          side.right
        );
      });
      await page.screenshot({
        path: "work/stage-03b/list-desktop.png",
        fullPage: true,
        animations: "disabled",
      });
      for (const width of [360, 390, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
          `list overflow ${width}`,
        );
      }
      await page.setViewportSize({ width: 390, height: 900 });
      await page.screenshot({
        path: "work/stage-03b/list-mobile.png",
        fullPage: true,
        animations: "disabled",
      });
      await page.setViewportSize({ width: 1440, height: 1080 });
    }
    await page
      .getByRole("link", { name: "Ver ficha de Marina Exemplo", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Histórico profissional", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Reingresso", exact: true })
      .waitFor();
    await page
      .getByRole("heading", { name: "Encerramento", exact: true })
      .waitFor();
    await page.getByRole("button", { name: "Acesso", exact: true }).click();
    await page.getByText("Nenhuma conta é criada", { exact: false }).waitFor();
    await page.getByRole("link", { name: "Todas as pessoas" }).click();
    await page
      .getByRole("link", { name: "Cadastrar pessoa", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Simular cadastro", exact: true })
      .click();
    await page
      .getByRole("alert")
      .filter({ hasText: "Revise os campos" })
      .waitFor();
    assert.equal(
      await page.locator("#name").getAttribute("aria-invalid"),
      "true",
    );
    await page
      .getByLabel("Nome completo", { exact: false })
      .fill("Teste Fictício");
    await page
      .getByLabel("Tipo de vínculo", { exact: false })
      .selectOption("pj");
    await page.getByLabel("Empresa e escopo da prestação").waitFor();
    await page
      .getByLabel("Tipo de vínculo", { exact: false })
      .selectOption("intern");
    await page.getByLabel("Instituição de ensino e curso").waitFor();
    await page
      .getByLabel("Tipo de vínculo", { exact: false })
      .selectOption("clt");
    await page
      .getByLabel("Data de início", { exact: false })
      .fill("2026-11-01");
    await page
      .getByLabel("Cargo ou função", { exact: false })
      .fill("Analista demonstrativo");
    await page.getByLabel("Setor", { exact: false }).selectOption("Engenharia");
    await page.getByLabel("Unidade", { exact: false }).selectOption("Sede");
    await page
      .getByLabel("E-mail profissional", { exact: false })
      .fill("invalido");
    await page
      .getByRole("button", { name: "Simular cadastro", exact: true })
      .click();
    await page
      .getByRole("alert")
      .getByText(/e-mail profissional válido/)
      .waitFor();
    await page.getByLabel("E-mail profissional", { exact: false }).fill("");
    await page
      .getByLabel("Nome completo", { exact: false })
      .fill("Marina Exemplo");
    await page
      .getByRole("button", { name: "Simular cadastro", exact: true })
      .click();
    await page
      .getByRole("alert")
      .filter({ hasText: "Revise os campos" })
      .getByText(/Revise a possível duplicidade/)
      .waitFor();
    await page.getByLabel("Revisei a ocorrência", { exact: false }).check();
    await page
      .getByLabel("Nome completo", { exact: false })
      .fill("Teste Fictício");
    if (role === "director") {
      await page.setViewportSize({ width: 390, height: 900 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
        "form mobile overflow",
      );
      await page.screenshot({
        path: "work/stage-03b/form-mobile.png",
        fullPage: true,
        animations: "disabled",
      });
      await page.setViewportSize({ width: 1440, height: 1080 });
    }
    await page
      .getByRole("button", { name: "Simular cadastro", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Teste Fictício", exact: true })
      .waitFor();
    await page
      .getByRole("status")
      .getByText(/Simulação concluída/)
      .waitFor();
    await page.getByRole("link", { name: "Editar pessoa" }).click();
    assert.equal(
      await page.getByLabel("Tipo de vínculo", { exact: false }).isDisabled(),
      true,
    );
    await page
      .getByLabel("Cargo ou função", { exact: false })
      .fill("Coordenação demonstrativa");
    await page.getByRole("button", { name: "Simular edição" }).click();
    await page
      .getByText("Coordenação demonstrativa", { exact: true })
      .first()
      .waitFor();
    await page
      .getByRole("button", { name: "Histórico profissional", exact: true })
      .click();
    await page
      .getByRole("heading", {
        name: "Alteração de cargo ou função",
        exact: true,
      })
      .waitFor();
    if (role === "director") {
      await page.waitForFunction(
        () =>
          document.querySelector("main").getBoundingClientRect().left >=
          document.querySelector(".desktop-sidebar").getBoundingClientRect()
            .right,
      );
      await page.screenshot({
        path: "work/stage-03b/history-desktop.png",
        fullPage: true,
        animations: "disabled",
      });
      await page.setViewportSize({ width: 360, height: 900 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
        "detail mobile overflow",
      );
      await page.screenshot({
        path: "work/stage-03b/detail-mobile.png",
        fullPage: true,
        animations: "disabled",
      });
    }
    assert.deepEqual(
      await page.evaluate(() => Object.keys(sessionStorage)),
      [],
    );
    // Auth cookie is synthetic. Demo person fields must never enter browser persistence.
    assert.equal(
      await page.evaluate(() =>
        JSON.stringify(localStorage).includes("Teste Fictício"),
      ),
      false,
    );
    await page.reload();
    await page.getByRole("heading", { name: "Ficha indisponível" }).waitFor();
    await ctx.addCookies([
      { name: "youcon-organization", value: "org-b", url: base },
    ]);
    await page.goto(`${base}/gente-gestao/pessoas`);
    await page
      .getByRole("heading", { name: "Pessoas que constroem." })
      .waitFor();
    await page
      .getByText("Organização B · teste", { exact: true })
      .first()
      .waitFor({ state: "attached" });
    assert.equal(
      await page
        .locator("tbody")
        .innerText()
        .then((text) => text.includes("Teste Fictício")),
      false,
    );
    assert.deepEqual(errors, []);
    await ctx.close();
  }
  assert.deepEqual(violations, []);
  assert.ok(requests.length > 0);
  console.log(
    JSON.stringify(
      {
        result: "PASS",
        roles: ["anonymous", "professional", "leadership", "hr", "director"],
        routes,
        syntheticApiRequests: requests.length,
        mutations: 0,
        screenshots: "work/stage-03b",
        flow: "list → search/filters → profile/history → create/errors → edit → reload discards",
      },
      null,
      2,
    ),
  );
} finally {
  await browser?.close();
  next.kill("SIGTERM");
  api.closeAllConnections();
  api.close();
  log.end();
}
