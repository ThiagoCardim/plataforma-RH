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
  await mkdir("work/performance-hall-review", { recursive: true });
  const errors = [];
  async function open(role, route = "/avaliacao-de-desempenho") {
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
    await p.screenshot({ path: `work/performance-hall-review/${name}.png` });
    assert.ok(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      "horizontal page overflow",
    );
  }
  const nowSP = () =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  const dayPlus = (d, n) =>
    new Date(Date.parse(d + "T12:00:00Z") + n * 86400000)
      .toISOString()
      .slice(0, 10);
  console.log(
    "RH: evaluation validation, immutable criteria, links and leadership",
  );
  {
    const { ctx, page } = await open("hr");
    await page
      .getByRole("heading", { name: "Avaliação de Desempenho", exact: true })
      .waitFor();
    const nav = page
      .locator(".desktop-sidebar")
      .getByRole("navigation", { name: "Navegação principal", exact: true });
    const links = await nav.locator("a").allTextContents();
    assert.equal(
      links.indexOf("Hall de Destaques"),
      links.indexOf("Avaliação de Desempenho") + 1,
    );
    await shot(page, "evaluation-overview");
    await tab(page, "Desempenho Operacional");
    await page
      .getByLabel("Ciclo de avaliação", { exact: true })
      .selectOption("performance-current");
    await page
      .getByRole("button", { name: /Em validação.*Luana Teste/ })
      .click();
    await page
      .getByLabel("Parecer do RH", { exact: true })
      .fill("Entregas e contexto conferidos nesta demonstração.");
    await tab(page, "Validar avaliação");
    await page
      .getByRole("button", {
        name: "Finalizar e liberar avaliação",
        exact: true,
      })
      .waitFor();
    await tab(page, "Finalizar e liberar avaliação");
    await tab(page, "Conectar ao PDI ou reconhecimento");
    await page
      .getByLabel("Plano ou ciclo de destino")
      .selectOption("pdi-demo-career-person-2");
    await page
      .getByLabel("Síntese para desenvolvimento ou análise")
      .fill("Evidência local para o PDI: aprofundar clareza da revisão.");
    await tab(page, "Vincular referência local");
    await page
      .getByRole("status")
      .getByText(/Referência vinculada localmente/)
      .waitFor();
    await page.getByLabel("Destino da avaliação").selectOption("recognition");
    await page
      .getByLabel("Plano ou ciclo de destino")
      .selectOption("recognition-cycle-1");
    await page
      .getByLabel("Síntese para desenvolvimento ou análise")
      .fill(
        "Resultado contextualizado para análise humana, sem promoção automática.",
      );
    await tab(page, "Vincular referência local");
    await close(page);
    await page.goto(base + "/pdi");
    await page.getByRole("button", { name: /Luana Teste/ }).click();
    await page
      .getByText("Evidência local para o PDI: aprofundar clareza da revisão.", {
        exact: true,
      })
      .waitFor();
    await close(page);
    await page.goto(base + "/plano-de-carreira");
    await tab(page, "Ciclos de Reconhecimento");
    await page
      .getByText(
        "Resultado contextualizado para análise humana, sem promoção automática.",
        { exact: true },
      )
      .waitFor();
    await page.goto(base + "/avaliacao-de-desempenho");
    await tab(page, "Desempenho dos Setores");
    await page.getByLabel("Setor", { exact: true }).selectOption("revenue");
    await page.getByRole("heading", { name: "Revenue", exact: true }).waitFor();
    await page.getByText("Marketing · 4 avaliações", { exact: true }).waitFor();
    await page.getByText("Comercial · 4 avaliações", { exact: true }).waitFor();
    await shot(page, "revenue-function-dashboards");
    await tab(page, "Modelos e Critérios");
    await page
      .getByRole("button", { name: "Duplicar", exact: true })
      .first()
      .click();
    await page
      .getByLabel("Nome do modelo", { exact: true })
      .fill("Modelo de revisões local · cópia");
    await page.getByLabel("Peso do critério 1", { exact: true }).fill("2");
    await tab(page, "Salvar modelo");
    await page
      .getByRole("heading", {
        name: "Modelo de revisões local · cópia",
        exact: true,
      })
      .waitFor();
    await page.reload();
    await tab(page, "Modelos e Critérios");
    await page
      .getByRole("heading", {
        name: "Modelo de revisões local · cópia",
        exact: true,
      })
      .waitFor();
    await tab(page, "Desempenho das Lideranças");
    await page
      .getByLabel("Liderança acompanhada", { exact: true })
      .selectOption("career-person-10");
    await tab(page, "Registrar acontecimento");
    await page
      .getByLabel("Registro confidencial", { exact: true })
      .fill("Marcador privado: conversa contínua de acompanhamento.");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Salvar", exact: true })
      .click();
    await tab(page, "Responsabilidade recorrente");
    await page
      .getByLabel("Nome da responsabilidade", { exact: true })
      .fill("Revisão recorrente da validação local");
    await page
      .getByLabel("Expectativa / critério de gestão", { exact: true })
      .fill("Clareza de prioridades e revisão dos impedimentos.");
    await page.getByLabel("Primeira ocorrência", { exact: true }).fill(nowSP());
    await page
      .getByLabel("Fim da recorrência", { exact: true })
      .fill(dayPlus(nowSP(), 9));
    await page
      .getByLabel("Frequência", { exact: true })
      .selectOption("Personalizada");
    await page
      .getByLabel("Intervalo personalizado (dias)", { exact: true })
      .fill("3");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Salvar", exact: true })
      .click();
    await page.goto(base + "/metas-dos-lideres");
    await page
      .getByRole("heading", { name: "Metas dos Líderes", exact: true })
      .waitFor();
    const occurrencesThisMonth = [0, 3, 6, 9].filter(
      (n) => dayPlus(nowSP(), n).slice(0, 7) === nowSP().slice(0, 7),
    ).length;
    assert.equal(
      await page
        .getByRole("button", { name: /Revisão recorrente da validação local/ })
        .count(),
      occurrencesThisMonth,
    );
    await page
      .getByRole("button", { name: /Revisão recorrente da validação local/ })
      .first()
      .click();
    await page
      .getByLabel("Evidência da ocorrência", { exact: true })
      .fill("Revisão concluída e material fictício organizado.");
    await page
      .getByLabel("Feedback de acompanhamento", { exact: true })
      .fill("Prioridades esclarecidas.");
    await page.getByLabel("Marcar como concluída", { exact: true }).check();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Salvar", exact: true })
      .click();
    await close(page);
    await page.reload();
    await page
      .getByRole("button", { name: /Revisão recorrente da validação local/ })
      .first()
      .click();
    assert.equal(
      await page
        .getByLabel("Marcar como concluída", { exact: true })
        .isChecked(),
      true,
    );
    await close(page);
    await tab(page, "Consolidar acompanhamento");
    await page
      .getByRole("button", {
        name: "Abrir avaliação da liderança",
        exact: true,
      })
      .first()
      .click();
    await page
      .getByText("Consolidação confidencial do acompanhamento", { exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByText(/Marcador privado: conversa contínua de acompanhamento/)
      .waitFor();
    await shot(page, "leadership-consolidation");
    await close(page);
    await page.goto(base + "/hall-de-destaques");
    await tab(page, "Gerenciar Reconhecimentos");
    await tab(page, "Categorias");
    await tab(page, "Nova categoria");
    await page
      .getByLabel("Nome da categoria", { exact: true })
      .fill("Destaque de Revisão · Arquitetura demo");
    await page
      .getByLabel("Nome do selo colecionável", { exact: true })
      .fill("Revisão exemplar");
    await page
      .getByLabel("Critérios demonstrativos", { exact: true })
      .fill(
        "Qualidade e prazos, frente às expectativas específicas da função.",
      );
    await tab(page, "Salvar categoria");
    await tab(page, "Reconhecimentos");
    await tab(page, "Analisar candidatos");
    await page
      .getByLabel("Categoria para analisar", { exact: true })
      .selectOption({ label: "Destaque de Revisão · Arquitetura demo" });
    await page
      .getByRole("dialog")
      .locator("article")
      .filter({
        has: page.getByRole("heading", { name: "Luana Teste", exact: true }),
      })
      .first()
      .getByRole("button", {
        name: "Preparar candidatura para revisão",
        exact: true,
      })
      .click();
    await page
      .getByLabel("Mês do reconhecimento", { exact: true })
      .fill(nowSP().slice(0, 7));
    await page
      .getByLabel("Mensagem personalizada", { exact: true })
      .fill(
        "Reconhecimento demonstrativo revisado a partir da avaliação validada de Luana.",
      );
    await page
      .getByLabel("Frase de impacto", { exact: true })
      .fill("Uma entrega que inspira novas possibilidades.");
    await tab(page, "Salvar preparação privada");
    await page
      .locator("article")
      .filter({ hasText: "Destaque de Revisão · Arquitetura demo" })
      .filter({ hasText: "Rascunho" })
      .getByRole("button", { name: "Abrir preparação", exact: true })
      .click();
    await tab(page, "Validar vencedor");
    page.once("dialog", (d) => d.accept());
    await tab(page, "Publicar reconhecimento");
    await close(page);
    await tab(page, "Destaques do Mês");
    await page
      .getByRole("button", { name: /Destaque de Revisão.*Luana Teste/ })
      .waitFor();
    await ctx.close();
  }
  console.log(
    "RH: Hall management, images, public consent and private ceremony",
  );
  {
    const { ctx, page } = await open("hr", "/hall-de-destaques");
    await page
      .getByRole("heading", { name: "Hall de Destaques", exact: true })
      .waitFor();
    await shot(page, "hall-monthly");
    await tab(page, "Ranking Semestral");
    await page
      .getByLabel("Categoria do ranking", { exact: true })
      .selectOption("hall-architecture");
    await shot(page, "hall-podium");
    const before = await page.evaluate(async () => {
      const r = indexedDB.open("youcon-demo-v1", 1);
      const db = await new Promise(
        (resolve) => (r.onsuccess = () => resolve(r.result)),
      );
      const tx = db.transaction("demos");
      const q = tx.objectStore("demos").getAll();
      const values = await new Promise(
        (resolve) => (q.onsuccess = () => resolve(q.result)),
      );
      db.close();
      return values
        .filter((v) => v.awards)
        .flatMap((v) => v.awards)
        .filter((a) => a.status === "Publicado").length;
    });
    await tab(page, "Modo Cerimônia");
    await tab(page, "Iniciar apresentação");
    const ceremony = page.getByRole("dialog", {
      name: "Cerimônia do Hall de Destaques",
      exact: true,
    });
    await ceremony.waitFor();
    await tab(page, "Revelar primeiro destaque");
    await ceremony
      .getByRole("heading", { name: "Clara Exemplo", exact: true })
      .waitFor();
    await shot(page, "ceremony-reveal");
    await tab(page, "Revelar próximo destaque");
    await ceremony
      .getByRole("heading", { name: "Gabriel Exemplo", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Fechar cerimônia", exact: true })
      .click();
    const after = await page.evaluate(async () => {
      const r = indexedDB.open("youcon-demo-v1", 1);
      const db = await new Promise(
        (resolve) => (r.onsuccess = () => resolve(r.result)),
      );
      const tx = db.transaction("demos");
      const q = tx.objectStore("demos").getAll();
      const values = await new Promise(
        (resolve) => (q.onsuccess = () => resolve(q.result)),
      );
      db.close();
      return values
        .filter((v) => v.awards)
        .flatMap((v) => v.awards)
        .filter((a) => a.status === "Publicado").length;
    });
    assert.equal(after, before, "ceremony must never publish");
    await tab(page, "Gerenciar Reconhecimentos");
    const draft = page
      .locator("article")
      .filter({
        has: page.getByRole("heading", { name: "Luana Teste", exact: true }),
      })
      .filter({ hasText: "Rascunho" });
    await draft
      .getByRole("button", { name: "Abrir preparação", exact: true })
      .click();
    await tab(page, "Editar preparação");
    await page
      .getByLabel("Mensagem personalizada", { exact: true })
      .fill(
        "Mensagem fictícia preparada e validada para celebrar atitudes observáveis.",
      );
    await page
      .getByLabel("Frase de impacto", { exact: true })
      .fill("Atitudes que inspiram a próxima entrega.");
    await page
      .getByLabel("Selecionar foto demonstrativa", { exact: true })
      .setInputFiles("public/demo/hall/portraits.png");
    await tab(page, "Salvar preparação privada");
    await page.reload();
    await tab(page, "Gerenciar Reconhecimentos");
    await page
      .locator("article")
      .filter({
        has: page.getByRole("heading", { name: "Luana Teste", exact: true }),
      })
      .filter({ hasText: "Rascunho" })
      .getByRole("button", { name: "Abrir preparação", exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByText("Atitudes que inspiram a próxima entrega.", { exact: true })
      .waitFor();
    assert.ok(
      (
        await page.getByRole("dialog").getByRole("img").getAttribute("src")
      ).startsWith("blob:"),
    );
    await tab(page, "Validar vencedor");
    page.once("dialog", (d) => d.accept());
    await tab(page, "Publicar reconhecimento");
    await close(page);
    await tab(page, "Destaques do Mês");
    await page
      .getByRole("button", { name: /Destaque Cultural.*Luana Teste/ })
      .waitFor();
    await tab(page, "Gerenciar Reconhecimentos");
    await tab(page, "Analisar candidatos");
    await page
      .getByLabel("Categoria para analisar", { exact: true })
      .selectOption("hall-revenue");
    await page
      .getByRole("dialog")
      .getByText(/privado/)
      .first()
      .waitFor();
    await close(page);
    await tab(page, "Regulamento");
    await tab(page, "Personalizar regulamento");
    await page
      .getByLabel("Texto do regulamento", { exact: true })
      .fill(
        "Versão demonstrativa local. PJ: exclusivamente excelência dos serviços prestados; eventuais prêmios financeiros exigem tratamento contratual próprio. Sem divulgação automática.",
      );
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Salvar", exact: true })
      .click();
    await page.getByText("Versão publicada 2", { exact: true }).waitFor();
    await ctx.close();
  }
  for (const role of [
    "leadership",
    "professional",
    "professional-intern",
    "director",
    "hr-pj",
  ]) {
    console.log("Permissions and own evaluations", role);
    const { ctx, page } = await open(role);
    await page
      .getByRole("heading", { name: "Avaliação de Desempenho", exact: true })
      .waitFor();
    if (role === "leadership") {
      assert.equal(
        await page
          .getByRole("button", {
            name: "Desempenho das Lideranças",
            exact: true,
          })
          .count(),
        0,
      );
      assert.ok(
        !(await page.content()).includes("Registro reservado fictício"),
      );
      await tab(page, "Nova avaliação");
      const candidates = await page
        .getByLabel("Profissional avaliado", { exact: true })
        .locator("option")
        .allTextContents();
      assert.ok(!candidates.some((x) => x.includes("Gabriel")));
      assert.ok(candidates.some((x) => x.includes("Luana")));
      await page
        .getByLabel("Profissional avaliado", { exact: true })
        .selectOption("career-person-2");
      await page
        .getByLabel("Modelo da avaliação", { exact: true })
        .selectOption("op-architecture-analyst");
      await page
        .getByLabel("Ciclo para avaliar", { exact: true })
        .selectOption("performance-lab");
      await tab(page, "Criar rascunho");
      await tab(page, "Desempenho Operacional");
      await page
        .getByLabel("Ciclo de avaliação", { exact: true })
        .selectOption("performance-lab");
      await page.getByRole("button", { name: /Rascunho.*Luana Teste/ }).click();
      for (let i = 1; i <= 5; i++) {
        await page
          .getByLabel(`Não observado/Não aplicável · ${i}`, { exact: true })
          .uncheck();
        await page
          .getByLabel(`Realizado · critério ${i}`, { exact: true })
          .fill(i === 1 ? "10" : "100");
        await page
          .getByLabel(`Justificativa · critério ${i}`, { exact: true })
          .fill("Entrega avaliada frente à expectativa acordada da função.");
        await page
          .getByLabel(`Evidência / referência · critério ${i}`, { exact: true })
          .fill("Revisão fictícia de projeto e material aceito.");
      }
      await tab(page, "Salvar rascunho");
      await close(page);
      await page.reload();
      await tab(page, "Desempenho Operacional");
      await page
        .getByLabel("Ciclo de avaliação", { exact: true })
        .selectOption("performance-lab");
      await page.getByRole("button", { name: /Rascunho.*Luana Teste/ }).click();
      assert.equal(
        await page
          .getByLabel("Realizado · critério 1", { exact: true })
          .inputValue(),
        "10",
      );
      await tab(page, "Enviar para validação do RH");
      assert.equal(
        await page
          .getByRole("button", { name: "Validar avaliação", exact: true })
          .count(),
        0,
      );
      await close(page);
    } else if (role.startsWith("professional")) {
      assert.equal(
        await page
          .getByRole("button", { name: "Nova avaliação", exact: true })
          .count(),
        0,
      );
      assert.equal(
        await page
          .getByRole("button", { name: "Modelos e Critérios", exact: true })
          .count(),
        0,
      );
      assert.equal(
        await page.getByRole("button", { name: /Luana Teste/ }).count(),
        0,
      );
      await page
        .getByRole("button", { name: /Marina Demo/ })
        .first()
        .focus();
      await page.keyboard.press("Enter");
      assert.equal(
        await page
          .getByRole("button", { name: "Salvar rascunho", exact: true })
          .count(),
        0,
      );
      await close(page);
    } else if (role === "director") {
      await tab(page, "Modelos e Critérios");
      assert.equal(
        await page
          .getByRole("button", { name: "Novo modelo", exact: true })
          .count(),
        0,
      );
    }
    await page.goto(base + "/hall-de-destaques");
    await page
      .getByRole("heading", { name: "Hall de Destaques", exact: true })
      .waitFor();
    if (!["director", "hr-pj"].includes(role)) {
      assert.equal(
        await page
          .getByRole("button", {
            name: "Gerenciar Reconhecimentos",
            exact: true,
          })
          .count(),
        0,
      );
      assert.equal(
        await page
          .getByRole("button", { name: "Modo Cerimônia", exact: true })
          .count(),
        0,
      );
      const html = await page.content();
      for (const marker of [
        "Registro reservado fictício",
        "Uma mensagem confidencial preparada",
        '\\"answers\\"',
      ])
        assert.ok(!html.includes(marker), marker);
      await tab(page, "Minhas Conquistas");
      await page
        .getByRole("button", { name: /Marina Demo/ })
        .first()
        .waitFor();
      if (role === "professional") {
        await shot(page, "my-achievements");
        await page.setViewportSize({ width: 390, height: 844 });
        await tab(page, "Destaques do Mês");
        await shot(page, "hall-mobile");
        await page.goto(base + "/avaliacao-de-desempenho");
        await page
          .getByRole("heading", {
            name: "Avaliação de Desempenho",
            exact: true,
          })
          .waitFor();
        await shot(page, "evaluation-mobile");
      }
    }
    await ctx.close();
  }
  for (const role of ["professional-pj", "leadership-pj"]) {
    const { ctx, page } = await open(role);
    await page.waitForURL(/\/acesso-negado$/);
    await page.goto(base + "/metas-dos-lideres");
    await page.waitForURL(/\/acesso-negado$/);
    await page.goto(base + "/hall-de-destaques");
    await page
      .getByRole("heading", { name: "Hall de Destaques", exact: true })
      .waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "Gerenciar Reconhecimentos", exact: true })
        .count(),
      0,
    );
    await tab(page, "Ranking Semestral");
    await page
      .getByLabel("Categoria do ranking", { exact: true })
      .selectOption("hall-engineering");
    await ctx.close();
  }
  {
    const { ctx, page } = await open("hr", "/hall-de-destaques");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page
      .getByRole("heading", { name: "Hall de Destaques", exact: true })
      .waitFor();
    await tab(page, "Modo Cerimônia");
    await tab(page, "Iniciar apresentação");
    await tab(page, "Revelar primeiro destaque");
    await page
      .getByRole("dialog")
      .getByRole("heading", { name: "Clara Exemplo", exact: true })
      .waitFor();
    assert.equal(await page.locator(".hall-suspense").count(), 0);
    assert.equal(
      await page
        .locator(".hall-confetti")
        .first()
        .evaluate((e) => getComputedStyle(e).display),
      "none",
    );
    await page.keyboard.press("Tab");
    await page.keyboard.press("Escape");
    assert.equal(await page.getByRole("dialog").count(), 0);
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
        "Evaluation review/release, private projections, PJ/sector/team guards, criterion snapshots, local PDI and career links, recurring goals shared with leadership, diary/consolidation, drafts/reload, category rankings, award photos/reload, manual validation/publication, private ceremony and reduced motion, mobile and keyboard",
    }),
  );
} catch (e) {
  await lastPage
    ?.screenshot({ path: "work/performance-hall-review/failure.png" })
    .catch(() => {});
  throw e;
} finally {
  await browser?.close();
  next.kill("SIGTERM");
  api.closeAllConnections();
  api.close();
  log.end();
}
