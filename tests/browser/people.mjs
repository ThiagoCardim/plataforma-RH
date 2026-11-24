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
const navigationPages = [
  ["onboarding-offboarding", "Onboarding"],
  ["offboarding", "Offboarding"],
  ["plano-de-carreira", "Plano de Carreira"],
  ["home-office", "Home Office"],
  ["avaliacao-de-desempenho", "Avaliação de Desempenho"],
  ["pdi", "PDI"],
  ["metas-dos-lideres", "Metas dos Líderes"],
  ["youcon-academy", "YouCon Academy"],
  ["cultura", "Cultura"],
  ["politicas-compliance", "Políticas e Compliance"],
  ["programa-de-indicacao-de-vagas", "Programa de Indicação de Vagas"],
];
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
  const routes = ["", "/nova", "/demo-1", "/demo-1/editar"]
    .map((p) => `/gente-gestao/pessoas${p}`)
    .concat(
      navigationPages.map(([slug]) => `/${slug}`),
      "/gente-gestao/dashboard",
    );
  const anonymous = await browser.newContext();
  const anonPage = await anonymous.newPage();
  await anonPage.goto(`${base}${routes[0]}`);
  await anonPage.waitForURL(/\/login$/);
  await anonymous.close();
  for (const role of ["professional", "leadership"]) {
    const ctx = await contextFor(role),
      page = await ctx.newPage();
    for (const route of routes.filter(
      (r) =>
        ![
          "/politicas-compliance",
          "/onboarding-offboarding",
          "/home-office",
          ...(role === "leadership" ? ["/offboarding", "/pdi"] : []),
        ].includes(r),
    )) {
      await page.goto(`${base}${route}`);
      await page.waitForURL(/\/acesso-negado$/);
    }
    for (const lib of ["politicas-compliance"]) {
      await page.goto(`${base}/${lib}`);
      await page
        .getByRole("heading", {
          name: "Políticas e Compliance",
          exact: true,
        })
        .waitFor();
      assert.equal(
        await page
          .getByRole("link", { name: "Criar documento", exact: true })
          .count(),
        0,
      );
      await page.goto(`${base}/${lib}/${lib}-5`);
      await page
        .getByRole("heading", { name: "Documento indisponível" })
        .waitFor();
      await page.goto(`${base}/${lib}/novo`);
      await page.waitForURL(/acesso-negado$/);
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
    await page.setViewportSize({ width: 1440, height: 1280 });
    await page.waitForFunction(
      () =>
        document.querySelector("main").getBoundingClientRect().left >=
        document.querySelector(".desktop-sidebar").getBoundingClientRect()
          .right,
    );
    const nav = page
      .locator(".desktop-sidebar")
      .getByRole("navigation", { name: "Navegação principal", exact: true });
    assert.equal(await nav.getByRole("link").count(), 14);
    assert.equal(
      await nav
        .getByRole("link", { name: "Gente & Gestão", exact: true })
        .count(),
      0,
    );
    for (const [slug, label] of navigationPages) {
      await nav.getByRole("link", { name: label, exact: true }).click();
      await page.getByRole("heading", { name: label, exact: true }).waitFor();
      if (
        ![
          "politicas-compliance",
          "onboarding-offboarding",
          "offboarding",
          "home-office",
          "plano-de-carreira",
          "pdi",
        ].includes(slug)
      )
        await page.getByText("Em preparação", { exact: true }).waitFor();
      assert.equal(new URL(page.url()).pathname, `/${slug}`);
      assert.equal(await nav.locator('a[aria-current="page"]').count(), 1);
      assert.equal(
        await nav
          .getByRole("link", { name: label, exact: true })
          .getAttribute("aria-current"),
        "page",
      );
      const crumb = page.getByRole("navigation", {
        name: "Localização",
        exact: true,
      });
      await crumb.getByText(label, { exact: true }).waitFor();
    }
    await nav
      .getByRole("link", { name: "Dashboard Gerencial", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Dashboard gerencial", exact: true })
      .waitFor();
    assert.equal(
      await nav
        .getByRole("link", { name: "Colaboradores", exact: true })
        .getAttribute("aria-current"),
      null,
    );
    await nav.getByRole("link", { name: "Colaboradores", exact: true }).click();
    await page
      .getByRole("heading", { name: "Pessoas que constroem." })
      .waitFor();
    assert.equal(await page.locator("tbody tr").count(), 8);
    if (role === "director") {
      await nav.evaluate((el) => {
        el.scrollTop = 0;
      });
      await page.screenshot({
        path: "work/navigation-review/colaboradores-desktop.png",
        fullPage: true,
        animations: "disabled",
      });
      await nav.getByRole("link", { name: "Onboarding", exact: true }).click();
      await page
        .getByRole("heading", { name: "Onboarding", exact: true })
        .waitFor();
      await nav.evaluate((el) => {
        el.scrollTop = 0;
      });
      await page.screenshot({
        path: "work/navigation-review/menu-desktop.png",
        fullPage: true,
        animations: "disabled",
      });
      await page
        .getByRole("button", { name: "Recolher navegação", exact: true })
        .click();
      await page.waitForFunction(
        () =>
          document.querySelector(".desktop-sidebar").getBoundingClientRect()
            .width === 76,
      );
      assert.equal(
        await nav
          .getByRole("link", { name: "YouCon Academy", exact: true })
          .getAttribute("title"),
        "YouCon Academy",
      );
      await nav
        .getByRole("link", { name: "YouCon Academy", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "YouCon Academy", exact: true })
        .waitFor();
      await page
        .getByRole("button", { name: "Expandir navegação", exact: true })
        .click();
      for (const width of [360, 390, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
          `navigation overflow ${width}`,
        );
      }
      await page.setViewportSize({ width: 390, height: 900 });
      await page
        .getByRole("button", { name: "Abrir navegação", exact: true })
        .click();
      const dialog = page.getByRole("dialog", {
        name: "Navegação principal",
        exact: true,
      });
      await dialog.waitFor();
      await page.screenshot({
        path: "work/navigation-review/menu-mobile.png",
        fullPage: true,
        animations: "disabled",
      });
      await dialog
        .getByRole("link", {
          name: "Programa de Indicação de Vagas",
          exact: true,
        })
        .click();
      await page
        .getByRole("heading", {
          name: "Programa de Indicação de Vagas",
          exact: true,
        })
        .waitFor();
      await dialog.waitFor({ state: "hidden" });
      await page.screenshot({
        path: "work/navigation-review/pagina-mobile.png",
        fullPage: true,
        animations: "disabled",
      });
      await page
        .getByRole("button", { name: "Abrir navegação", exact: true })
        .click();
      await dialog
        .getByRole("link", { name: "Dashboard Gerencial", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "Dashboard gerencial", exact: true })
        .waitFor();
      await dialog.waitFor({ state: "hidden" });
      await page
        .getByRole("button", { name: "Abrir navegação", exact: true })
        .click();
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden" });
      assert.equal(
        await page
          .getByRole("button", { name: "Abrir navegação", exact: true })
          .evaluate((el) => el === document.activeElement),
        true,
      );
    }
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.goto(`${base}/politicas-compliance`);
    await page
      .getByRole("heading", { name: "Políticas e Compliance", exact: true })
      .waitFor();
    await page.getByLabel("Pesquisar documento").fill("Trabalho remoto");
    await page.getByText("1 documentos encontrados", { exact: true }).waitFor();
    await page
      .getByRole("button", { name: "Limpar filtros", exact: true })
      .click();
    await page
      .getByRole("combobox", { name: /^Status/ })
      .selectOption("Rascunho");
    await page.getByText("2 documentos encontrados", { exact: true }).waitFor();
    await page
      .getByRole("button", { name: "Limpar filtros", exact: true })
      .click();
    await page.getByRole("button", { name: "Visualizar em cards" }).click();
    if (role === "director") {
      await mkdir("work/documents-review", { recursive: true });
      await page.evaluate(() => {
        document.activeElement?.blur();
        window.scrollTo(0, 0);
      });
      await page.screenshot({
        path: "work/documents-review/cards.png",
        fullPage: true,
        animations: "disabled",
      });
    }
    await page
      .getByRole("link", { name: "Criar documento", exact: true })
      .click();
    await page
      .getByLabel("Título", { exact: true })
      .fill("Manual fictício de teste");
    await page.getByRole("button", { name: "+ Arquivo", exact: true }).click();
    await page.getByLabel("Selecionar arquivo", { exact: true }).setInputFiles({
      name: "exemplo.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4 demo"),
    });
    await page
      .getByRole("button", { name: "Subir bloco 2", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Descer bloco 1", exact: true })
      .click();
    await page.getByLabel("Substituir arquivo", { exact: true }).setInputFiles({
      name: "demonstracao.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("Demonstração"),
    });
    await page.getByText("demonstracao.txt", { exact: true }).waitFor();
    await page
      .getByRole("button", { name: "Remover arquivo", exact: true })
      .click();
    await page.getByLabel("Selecionar arquivo", { exact: true }).setInputFiles({
      name: "exemplo.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4 demo"),
    });
    await page
      .getByLabel("Conteúdo", { exact: true })
      .fill("Texto fictício editado no navegador.");
    for (const [label, text] of [
      ["Título", "Orientações de teste"],
      ["Lista", "Primeira orientação\nSegunda orientação"],
      ["Tabela", "Item|Responsável\nTeste|RH"],
      ["Link", "Link de exemplo"],
    ]) {
      await page
        .getByRole("button", { name: `+ ${label}`, exact: true })
        .click();
      await page.getByLabel("Conteúdo", { exact: true }).last().fill(text);
    }
    await page
      .getByLabel("Endereço do link", { exact: true })
      .fill("https://example.com");
    await page.getByRole("button", { name: "+ Imagem", exact: true }).click();
    await page.getByLabel("Selecionar imagem", { exact: true }).setInputFiles({
      name: "imagem-ficticia.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j4uoAAAAASUVORK5CYII=",
        "base64",
      ),
    });
    await page
      .getByLabel("Descrição da imagem", { exact: true })
      .fill("Imagem fictícia de teste");
    await page
      .getByRole("button", { name: "Pré-visualizar conteúdo", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Orientações de teste", exact: true })
      .waitFor();
    await page.getByRole("cell", { name: "RH", exact: true }).waitFor();
    await page
      .getByRole("button", { name: "Voltar ao editor", exact: true })
      .click();
    await page.getByLabel("Status", { exact: true }).selectOption("Ativa");
    await page
      .getByRole("button", { name: "Simular publicação", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Manual fictício de teste", exact: true })
      .waitFor();
    await page.getByText("exemplo.pdf", { exact: true }).waitFor();
    await page
      .getByRole("button", { name: "Editar documento", exact: true })
      .click();
    await page
      .getByLabel("Título", { exact: true })
      .fill("Manual fictício revisado");
    await page
      .getByRole("button", { name: "Salvar simulação", exact: true })
      .click();
    await page
      .getByText("Existe uma versão publicada anterior.", { exact: false })
      .waitFor();
    await page
      .getByRole("button", { name: "Histórico de versões (2)", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Visualizar versão 1", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Manual fictício de teste", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Voltar à atual", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Duplicar documento", exact: true })
      .click();
    page.once("dialog", (dialog) => dialog.accept());
    await page
      .getByRole("button", { name: "Arquivar documento", exact: true })
      .click();
    await page.getByRole("link", { name: "Voltar à biblioteca" }).click();
    await page
      .getByRole("link", {
        name: "Manual fictício revisado · cópia",
        exact: true,
      })
      .waitFor();
    if (role === "director") {
      await mkdir("work/documents-review", { recursive: true });
      await page.screenshot({
        path: "work/documents-review/library.png",
        fullPage: true,
        animations: "disabled",
      });
      await page
        .getByRole("link", {
          name: "Trabalho remoto e colaboração",
          exact: true,
        })
        .click();
      await page
        .getByRole("button", { name: "Confirmar leitura", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Leitura confirmada", exact: true })
        .waitFor();
      await page.evaluate(() => {
        document.activeElement?.blur();
        window.scrollTo(0, 0);
      });
      await page.screenshot({
        path: "work/documents-review/document.png",
        fullPage: true,
        animations: "disabled",
      });
      await page.setViewportSize({ width: 390, height: 900 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
      );
      await page.screenshot({
        path: "work/documents-review/mobile.png",
        fullPage: true,
        animations: "disabled",
      });
    }
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
        screenshots: {
          people: "work/stage-03b",
          navigation: "work/navigation-review",
          documents: "work/documents-review",
        },
        flow: "People and navigation regression + document filters/cards/blocks/attachments/publication/history/duplicate/archive/reading + role and audience guards",
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
