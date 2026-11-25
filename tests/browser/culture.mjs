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
  await mkdir("work/culture-review", { recursive: true });
  const errors = [];
  async function open(role, route = "/cultura") {
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
    await p.screenshot({ path: `work/culture-review/${name}.png` });
    assert.ok(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      "horizontal page overflow",
    );
  }
  const dialog = (p) => p.getByRole("dialog");
  const hero =
    "Você não entrou para uma empresa. Você entrou para um movimento.";
  const revised = hero + " · Teste local";
  async function ownOnboarding(p) {
    await p.goto(base + "/onboarding-offboarding");
    await tab(p, "Onboardings");
    await p.getByRole("button", { name: /Marina Costa/ }).click();
    await dialog(p)
      .getByRole("heading", {
        name: "Manual de Cultura · leitura compartilhada",
        exact: true,
      })
      .waitFor();
  }
  async function editBlocks(p, button, text) {
    await p.getByRole("button", { name: button, exact: true }).click();
    await dialog(p)
      .getByRole("button", { name: "+ Texto", exact: true })
      .click();
    await dialog(p)
      .getByRole("textbox", { name: "Conteúdo", exact: true })
      .last()
      .fill(text);
    await dialog(p)
      .getByRole("button", { name: "Salvar simulação", exact: true })
      .click();
    assert.equal(await dialog(p).count(), 0);
  }
  console.log(
    "Cultura institucional: reader, values, founders, PDF absence and published Hall",
  );
  {
    const { ctx, page: p } = await open("professional");
    await p.getByRole("heading", { name: "Cultura", exact: true }).waitFor();
    await p.getByRole("heading", { name: hero, exact: true }).waitFor();
    await shot(p, "landing");
    assert.equal(
      await p
        .getByRole("button", { name: "Gerenciar Cultura", exact: true })
        .count(),
      0,
    );
    await p
      .getByRole("heading", { name: "Alicerce da cultura", exact: true })
      .waitFor();
    await p
      .getByRole("heading", { name: "Como vivemos na prática", exact: true })
      .waitFor();
    await p.locator("summary").filter({ hasText: "Postura de Dono" }).click();
    await p
      .locator("#culture-values")
      .screenshot({ path: "work/culture-review/values.png" });
    await p.getByRole("button", { name: /Carta de um fundador/ }).click();
    await dialog(p)
      .getByText("Conteúdo oficial ainda não disponibilizado.", {
        exact: false,
      })
      .waitFor();
    await close(p);
    await tab(p, "Manual de Cultura");
    assert.equal(
      await p
        .getByRole("button", {
          name: "Registrar ciência de leitura",
          exact: true,
        })
        .count(),
      0,
    );
    await p
      .getByText("Documento oficial ainda não disponibilizado", { exact: true })
      .waitFor();
    await ctx.close();
  }
  console.log(
    "Cultura RH: drafts, shared block editor, files/video, preview, publication and history",
  );
  {
    const { ctx, page: p } = await open("hr");
    p.on("dialog", (d) => d.accept());
    await tab(p, "Gerenciar Cultura");
    await p
      .getByRole("button", { name: "Descer seção 1", exact: true })
      .click();
    await p.getByRole("button", { name: "Subir seção 2", exact: true }).click();
    await p
      .getByLabel("Exibir seção na página publicada", { exact: true })
      .uncheck();
    await p
      .getByLabel("Exibir seção na página publicada", { exact: true })
      .check();
    await p.getByLabel("Título do banner", { exact: true }).fill(revised);
    await tab(p, "Salvar rascunho");
    await tab(p, "Nossa Cultura");
    await p.getByRole("heading", { name: hero, exact: true }).waitFor();
    assert.equal(
      await p.getByRole("heading", { name: revised, exact: true }).count(),
      0,
    );
    await p.reload();
    await tab(p, "Gerenciar Cultura");
    assert.equal(
      await p.getByLabel("Título do banner", { exact: true }).inputValue(),
      revised,
    );
    await p
      .getByRole("button", { name: /^Valores que ganham vida nas escolhas/ })
      .click();
    await p.locator("summary").filter({ hasText: "Postura de Dono" }).click();
    await editBlocks(
      p,
      "Editar blocos do card 1",
      "Exemplo fictício para testar o editor. A explicação oficial depende do manual.",
    );
    await p.getByRole("button", { name: /^De quem começou/ }).click();
    await p
      .locator("summary")
      .filter({ hasText: "Carta de um fundador" })
      .click();
    await p
      .getByRole("button", { name: "Editar blocos do card 1", exact: true })
      .click();
    await dialog(p)
      .getByRole("button", { name: "+ Texto", exact: true })
      .click();
    await dialog(p)
      .getByRole("textbox", { name: "Conteúdo", exact: true })
      .fill("Carta de teste, fictícia e sem atribuição a uma pessoa real.");
    await dialog(p)
      .getByRole("button", { name: "+ Arquivo", exact: true })
      .click();
    await dialog(p)
      .getByLabel("Selecionar arquivo", { exact: true })
      .setInputFiles("public/demo/culture/manual-demo.pdf");
    await dialog(p)
      .getByRole("button", { name: "+ Vídeo", exact: true })
      .click();
    await dialog(p)
      .getByLabel("Vídeo local", { exact: true })
      .setInputFiles("public/demo/academy/intro.webm");
    await dialog(p)
      .getByLabel("Legendas VTT", { exact: true })
      .setInputFiles("public/demo/academy/intro.vtt");
    await dialog(p)
      .getByRole("button", { name: "Subir bloco 3", exact: true })
      .click();
    await dialog(p)
      .getByRole("button", { name: "Salvar simulação", exact: true })
      .click();
    await p
      .getByRole("button", {
        name: "Carregar manual fictício de teste",
        exact: true,
      })
      .click();
    await p
      .getByText("manual-demonstrativo.pdf", { exact: false })
      .first()
      .waitFor();
    await p
      .getByLabel("Conteúdo do manual conferido e disponível para leitura", {
        exact: true,
      })
      .check();
    await p
      .getByLabel("Resumo da publicação", { exact: true })
      .fill("Publicação de teste com manual e carta fictícios.");
    await tab(p, "Prévia editorial");
    await dialog(p)
      .getByRole("heading", { name: revised, exact: true })
      .waitFor();
    await close(p);
    await tab(p, "Publicar Cultura");
    await p.getByText("Versão publicada 2", { exact: true }).waitFor();
    await tab(p, "Nossa Cultura");
    await p.getByRole("heading", { name: revised, exact: true }).waitFor();
    await p.getByRole("button", { name: /Carta de um fundador/ }).click();
    await dialog(p)
      .getByText(
        "Carta de teste, fictícia e sem atribuição a uma pessoa real.",
        { exact: true },
      )
      .waitFor();
    await dialog(p)
      .getByRole("button", { name: "Fechar painel", exact: true })
      .waitFor();
    const video = dialog(p).locator("video");
    await video.evaluate((v) => v.play());
    await p.waitForTimeout(350);
    assert.ok(await video.evaluate((v) => v.currentTime > 0));
    assert.equal(await video.locator("track").count(), 1);
    await shot(p, "founder-letter");
    await close(p);
    await p.reload();
    await p.getByRole("button", { name: /Carta de um fundador/ }).click();
    await dialog(p).getByText("manual-demo.pdf", { exact: true }).waitFor();
    assert.ok(
      (await dialog(p).locator("video").getAttribute("src")).startsWith(
        "blob:",
      ),
    );
    await close(p);
    await tab(p, "Manual de Cultura");
    await p
      .getByRole("button", { name: "Visualizar PDF", exact: true })
      .click();
    await p.getByTitle("PDF do Manual de Cultura", { exact: true }).waitFor();
    await shot(p, "manual");
    const downloaded = p.waitForEvent("download");
    await p.getByRole("link", { name: "Baixar arquivo", exact: true }).click();
    assert.equal(
      (await downloaded).suggestedFilename(),
      "manual-demonstrativo.pdf",
    );

    await p
      .getByRole("checkbox", {
        name: "Li a versão 2 do manual disponibilizado.",
        exact: true,
      })
      .check();
    await tab(p, "Registrar ciência de leitura");
    await p
      .getByText("Ciência registrada · manual v2", { exact: true })
      .waitFor();
    await ownOnboarding(p);
    await dialog(p)
      .getByText("Ciência registrada · manual v2", { exact: true })
      .waitFor();
    assert.equal(
      await dialog(p)
        .getByRole("button", {
          name: "Registrar ciência de leitura",
          exact: true,
        })
        .count(),
      0,
    );
    await dialog(p).getByText("origem: Cultura.", { exact: false }).waitFor();
    await close(p);
    await p.goto(base + "/cultura");
    await tab(p, "Gerenciar Cultura");
    await editBlocks(
      p,
      "Editar capítulo 1",
      "Complemento fictício da segunda edição do manual para teste.",
    );
    await p
      .getByLabel("Resumo da publicação", { exact: true })
      .fill("Segunda edição fictícia do manual.");
    await tab(p, "Publicar Cultura");
    await p.getByText("Versão publicada 3", { exact: true }).waitFor();
    await ownOnboarding(p);
    await dialog(p)
      .getByRole("checkbox", {
        name: "Li a versão 3 do manual disponibilizado.",
        exact: true,
      })
      .check();
    await dialog(p)
      .getByRole("button", {
        name: "Registrar ciência de leitura",
        exact: true,
      })
      .click();
    await dialog(p)
      .getByText("Ciência registrada · manual v3", { exact: true })
      .waitFor();
    await close(p);
    await p.goto(base + "/cultura");
    await tab(p, "Manual de Cultura");
    await p
      .getByText("Ciência registrada · manual v3", { exact: true })
      .waitFor();
    await p.getByText("origem: Onboarding.", { exact: false }).waitFor();
    await p
      .locator("summary")
      .filter({ hasText: "Meu histórico de leitura (2)" })
      .click();
    await p.getByText(/Manual v2 · Cultura/).waitFor();
    await p.getByText(/Manual v3 · Onboarding/).waitFor();
    await tab(p, "Gerenciar Cultura");
    await p.getByRole("button", { name: /^VERSÃO 1/ }).click();
    await dialog(p)
      .getByRole("button", { name: "Recuperar como rascunho", exact: true })
      .click();
    assert.equal(
      await p.getByLabel("Título do banner", { exact: true }).inputValue(),
      hero,
    );
    await tab(p, "Nossa Cultura");
    await p.getByRole("heading", { name: revised, exact: true }).waitFor();
    await ctx.addCookies([
      { name: "youcon-organization", value: "org-b", url: base },
    ]);
    await p.goto(base + "/cultura");
    await p.getByRole("heading", { name: hero, exact: true }).waitFor();
    await tab(p, "Manual de Cultura");
    assert.equal(
      await p
        .getByText("Ciência registrada · manual v3", { exact: true })
        .count(),
      0,
    );
    await ctx.addCookies([
      { name: "youcon-organization", value: "org-a", url: base },
    ]);
    await p.goto(base + "/cultura");
    await tab(p, "Gerenciar Cultura");
    assert.equal(
      await p.getByLabel("Título do banner", { exact: true }).inputValue(),
      hero,
    );
    await shot(p, "management");
    const keys = await p.evaluate(async () => {
      const db = await new Promise((resolve) => {
        const r = indexedDB.open("youcon-demo-v1");
        r.onsuccess = () => resolve(r.result);
      });
      return await new Promise((resolve) => {
        const r = db.transaction("demos").objectStore("demos").getAllKeys();
        r.onsuccess = () => {
          resolve(r.result);
          db.close();
        };
      });
    });
    assert.equal(
      keys.filter(
        (k) =>
          k.includes("performance-hall-v1:") ||
          k.includes("published-hall-v1:"),
      ).length,
      0,
    );
    await ctx.close();
  }
  console.log(
    "Culture access: PJ institutional only, employees/leaders, director, keyboard/mobile and reduced motion",
  );
  for (const role of [
    "professional-pj",
    "leadership-pj",
    "hr-pj",
    "professional-intern",
    "leadership",
    "director",
  ]) {
    const { ctx, page: p } = await open(role);
    await p.getByRole("heading", { name: "Cultura", exact: true }).waitFor();
    assert.equal(
      await p
        .getByRole("button", { name: "Gerenciar Cultura", exact: true })
        .count(),
      role === "director" || role === "hr-pj" ? 1 : 0,
    );
    if (role.endsWith("-pj")) {
      assert.equal(await p.locator("#culture-values").count(), 0);
      assert.equal(await p.locator("#culture-rituals").count(), 0);
      assert.equal(await p.locator("#culture-hall").count(), 0);
      await tab(p, "Manual de Cultura");
      await p
        .getByText(
          "O Manual de Cultura e a ciência de compromissos são destinados a CLT e Estágio.",
          { exact: false },
        )
        .waitFor();
      assert.equal(
        await p
          .getByRole("button", {
            name: "Registrar ciência de leitura",
            exact: true,
          })
          .count(),
        0,
      );
    }
    await ctx.close();
  }
  {
    const { ctx, page: p } = await open("professional");
    await p.getByRole("heading", { name: "Cultura", exact: true }).waitFor();
    await p.setViewportSize({ width: 390, height: 844 });
    await p.emulateMedia({ reducedMotion: "reduce" });
    await shot(p, "mobile");
    const founder = p.getByRole("button", { name: /Carta de um fundador/ });
    await founder.focus();
    await p.keyboard.press("Enter");
    await dialog(p).waitFor();
    await p.keyboard.press("Escape");
    assert.equal(await dialog(p).count(), 0);
    assert.equal(
      await p
        .locator(".culture-lift")
        .first()
        .evaluate((e) => getComputedStyle(e).transitionDuration),
      "0s",
    );
    await ctx.close();
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(violations, []);
  console.log(
    JSON.stringify({
      result: "PASS",
      mutations: 0,
      requests: requests.length,
      flows:
        "Institutional landing and values, founder letters, draft/publication separation, reused block editor/files/video/captions/reload, local PDF and digital manual, single Culture/Onboarding reading receipt and version history, historical recovery to draft, scoped tenants, PJ restrictions, leadership/director/RH scopes, read-only Hall, mobile/keyboard/reduced motion",
    }),
  );
} catch (e) {
  await lastPage
    ?.screenshot({ path: "work/culture-review/failure.png" })
    .catch(() => {});
  throw e;
} finally {
  await browser?.close();
  next.kill("SIGTERM");
  api.closeAllConnections();
  api.close();
  log.end();
}
