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
  async function area(p, name) {
    await p
      .getByRole("navigation", { name: "Áreas de Recrutamento", exact: true })
      .getByRole("link", { name, exact: true })
      .click();
    await p.getByRole("heading", { name, exact: true }).waitFor();
  }
  async function talent(p, name = "Alex Demo") {
    await area(p, "Banco de Talentos");
    await p
      .locator("article")
      .filter({ has: p.getByRole("heading", { name, exact: true }) })
      .getByRole("button", { name: "Abrir ficha", exact: true })
      .click();
  }
  async function readDemo(p, keyPart) {
    return p.evaluate(async (keyPart) => {
      const db = await new Promise((resolve) => {
        const r = indexedDB.open("youcon-demo-v1");
        r.onsuccess = () => resolve(r.result);
      });
      return await new Promise((resolve) => {
        const store = db.transaction("demos").objectStore("demos"),
          r = store.getAllKeys();
        r.onsuccess = () => {
          const key = r.result.find((k) => k.includes(keyPart));
          if (!key) {
            resolve(undefined);
            db.close();
            return;
          }
          const q = store.get(key);
          q.onsuccess = () => {
            resolve(q.result);
            db.close();
          };
        };
      });
    }, keyPart);
  }
  console.log(
    "Recruitment RH: navigation, dashboard, Kanban, stage constraints and vacancy editing",
  );
  {
    const { ctx, page: p } = await open("hr");
    p.on("dialog", (d) => d.accept());
    await p
      .getByRole("heading", { name: "Visão Geral", exact: true })
      .waitFor();
    await shot(p, "overview");
    await area(p, "Gestão de Vagas");
    await p
      .getByRole("button", {
        name: "Selecionar vaga Analista de Arquitetura · Demo",
        exact: true,
      })
      .click();
    const card = p.locator("article[draggable=true]").filter({
      has: p.getByRole("heading", { name: "Alex Demo", exact: true }),
    });
    await card.dragTo(p.locator('[data-stage="stage-1"]'), { force: true });
    await p.waitForTimeout(250);
    await p
      .locator('[data-stage="stage-1"]')
      .getByRole("heading", { name: "Alex Demo", exact: true })
      .waitFor();
    await p
      .getByLabel("Mover Alex Demo", { exact: true })
      .selectOption("stage-0");
    await p.getByRole("button", { name: "Duplicar vaga", exact: true }).click();
    await p
      .getByRole("button", {
        name: "Selecionar vaga Analista de Arquitetura · Demo · cópia",
        exact: true,
      })
      .waitFor();
    await p.getByRole("button", { name: "Editar vaga", exact: true }).click();
    await tab(p, "Etapas e campos");
    await tab(p, "Adicionar etapa");
    await dialog(p)
      .getByRole("button", { name: "Salvar vaga", exact: true })
      .click();
    await p
      .locator("[data-stage]")
      .filter({
        has: p.getByRole("heading", { name: "Nova etapa", exact: true }),
      })
      .waitFor();
    await shot(p, "kanban");
    await tab(p, "Lista");
    await p.getByRole("table").waitFor();
    await tab(p, "Kanban");
    await area(p, "Banco de Talentos");
    await p.getByLabel("Softwares no banco", { exact: true }).fill("Revit");
    await p
      .getByLabel("Localização no banco", { exact: true })
      .fill("Curitiba");
    await tab(p, "Salvar combinação de filtros");
    await dialog(p)
      .getByLabel("Nome da consulta salva", { exact: true })
      .fill("Revit em Curitiba");
    await dialog(p)
      .getByRole("button", { name: "Salvar", exact: true })
      .click();
    await p.reload();
    await p
      .getByLabel("Consulta salva de talentos", { exact: true })
      .selectOption({ label: "Revit em Curitiba" });
    assert.equal(
      await p.getByRole("heading", { name: "Alex Demo", exact: true }).count(),
      0,
    );
    await tab(p, "Limpar filtros");
    await shot(p, "talents");
    await tab(p, "Novo talento");
    await dialog(p)
      .getByLabel("Nome completo", { exact: true })
      .fill("Novo Talento Fictício");
    await dialog(p)
      .getByLabel("E-mail", { exact: true })
      .fill("novo-demo@exemplo.invalid");
    await dialog(p)
      .getByLabel("Setor de interesse", { exact: true })
      .fill("Arquitetura");
    await tab(p, "Currículo e evidências");
    await dialog(p)
      .getByLabel("Importar currículo demonstrativo", { exact: true })
      .setInputFiles("public/demo/culture/manual-demo.pdf");
    await dialog(p)
      .getByRole("button", { name: "Salvar talento", exact: true })
      .click();
    await p.reload();
    await p
      .locator("article")
      .filter({
        has: p.getByRole("heading", {
          name: "Novo Talento Fictício",
          exact: true,
        }),
      })
      .getByRole("button", { name: "Abrir ficha", exact: true })
      .click();
    await dialog(p).getByText("manual-demo.pdf", { exact: true }).waitFor();
    await close(p);
    console.log(
      "Recruitment RH: Match batch, missing vs unmet, no automatic movement",
    );
    const before = await readDemo(p, "recruitment-v1:");
    await area(p, "YouCon Match");
    await p
      .getByLabel("Vaga para YouCon Match", { exact: true })
      .selectOption("rec-job-0");
    await p
      .getByLabel("Selecionar Alex Demo para comparar", { exact: true })
      .check();
    await p
      .getByLabel("Selecionar Caio Teste para comparar", { exact: true })
      .check();
    await p
      .getByRole("button", { name: "Analisar selecionados (2)", exact: true })
      .click();
    await p.getByText("Comparação lado a lado", { exact: true }).waitFor();
    await p.getByText(/Revit · Não atendido/).waitFor();
    await p.getByText(/BIM · Não informado/).waitFor();
    await shot(p, "match");
    const after = await readDemo(p, "recruitment-v1:");
    assert.deepEqual(after.applications, before.applications);
    assert.equal(after.analyses.length, 2);
    await p
      .getByLabel("Busca em linguagem natural (simulação por termos)", {
        exact: true,
      })
      .fill("Revit em Curitiba");
    await tab(p, "Buscar no banco por termos");
    assert.equal(
      await p
        .getByLabel("Selecionar Alex Demo para comparar", { exact: true })
        .count(),
      0,
    );
    console.log(
      "Recruitment RH: private notes, technical delegation, individual assessment, proposal and formalization",
    );
    await talent(p);
    await tab(p, "Técnica e pareceres");
    await dialog(p)
      .getByLabel("Parecer ou evidência técnica", { exact: true })
      .fill("Observação RH confidencial de teste local.");
    await dialog(p)
      .getByRole("button", { name: "Registrar parecer", exact: true })
      .click();
    await tab(p, "DISC e Temperamentos");
    await dialog(p)
      .getByLabel("Modelo de instrumento", { exact: true })
      .selectOption("template-0");
    await dialog(p)
      .getByRole("link", {
        name: "Abrir link individual protegido",
        exact: true,
      })
      .first()
      .click();
    await p.waitForURL("**/recrutamento/modelos?assessment=*");
    await dialog(p)
      .getByLabel(
        "Descreva uma situação profissional que ajude a contextualizar este tema.",
        { exact: true },
      )
      .waitFor();

    await dialog(p)
      .getByRole("button", {
        name: "Abrir instrumento individual",
        exact: true,
      })
      .first()
      .click();
    await dialog(p)
      .getByLabel(
        "Descreva uma situação profissional que ajude a contextualizar este tema.",
        { exact: true },
      )
      .fill("Resposta de teste sem diagnóstico.");
    await dialog(p)
      .getByLabel(
        "Que informações você considera importantes para a conversa?",
        { exact: true },
      )
      .fill("Contexto fictício.");
    await dialog(p)
      .getByRole("button", {
        name: "Registrar respostas fictícias",
        exact: true,
      })
      .click();
    await tab(p, "Candidaturas");
    await dialog(p)
      .getByLabel("Parecer de decisão RH", { exact: true })
      .fill("Evidências profissionais conferidas pelo RH nesta simulação.");
    await dialog(p)
      .getByRole("button", {
        name: "Aprovar continuidade pelo RH",
        exact: true,
      })
      .click();
    await tab(p, "Propostas e admissão");
    await dialog(p)
      .getByLabel("Valor mensal da proposta (R$)", { exact: true })
      .fill("5000");
    await dialog(p)
      .getByLabel("Condições da proposta demonstrativa", { exact: true })
      .fill("Condições fictícias de contratação, sem envio real.");
    await dialog(p)
      .getByRole("button", { name: "Preparar proposta local", exact: true })
      .click();
    await dialog(p)
      .getByRole("button", { name: "Registrar envio simulado", exact: true })
      .click();
    await dialog(p)
      .getByRole("button", {
        name: "Registrar aceite demonstrativo",
        exact: true,
      })
      .click();
    await dialog(p)
      .getByRole("button", { name: "Confirmar contratação local", exact: true })
      .click();
    await dialog(p)
      .getByText(
        "Confirme formalização, aprovação RH, proposta aceita e orçamento autorizado.",
        { exact: true },
      )
      .waitFor();
    await dialog(p)
      .getByLabel(
        "Confirmo formalização exclusivamente fictícia desta contratação",
        { exact: true },
      )
      .check();
    await dialog(p)
      .getByRole("button", { name: "Confirmar contratação local", exact: true })
      .click();
    await dialog(p)
      .getByLabel("Autorizar campo email", { exact: true })
      .check();
    await dialog(p)
      .getByRole("button", {
        name: "Preparar admissão sem duplicidade",
        exact: true,
      })
      .click();
    await dialog(p).getByText("Preparada", { exact: true }).waitFor();
    await shot(p, "proposal");
    await close(p);
    await p.goto(base + "/onboarding-offboarding");
    await p
      .getByRole("heading", {
        name: "Admissões preparadas no Recrutamento",
        exact: true,
      })
      .waitFor();
    await p
      .getByRole("button", {
        name: "Iniciar Onboarding demonstrativo",
        exact: true,
      })
      .click();
    await p.getByRole("button", { name: "Já iniciado", exact: true }).waitFor();
    await p.reload();
    await p.getByRole("button", { name: "Já iniciado", exact: true }).waitFor();
    await p.getByRole("button", { name: "Onboardings", exact: true }).click();
    await p.getByRole("button", { name: /Alex Demo/ }).waitFor();
    await p.goto(base + "/recrutamento/modelos");
    await tab(p, "Automações");
    await p.getByText("Execuções simuladas", { exact: true }).waitFor();
    await shot(p, "automations");
    await p
      .getByRole("button", { name: "Desativar", exact: true })
      .first()
      .click();
    await p
      .getByRole("button", { name: "Ativar", exact: true })
      .first()
      .waitFor();
    console.log(
      "Recruitment RH: form builder, conditional preview, protected career application and duplicate prevention",
    );
    await tab(p, "Formulários");
    await p
      .getByRole("button", {
        name: "Editar formulário Inscrição demonstrativa",
        exact: true,
      })
      .click();
    await dialog(p)
      .getByRole("button", { name: "Adicionar campo", exact: true })
      .click();
    const details = dialog(p).locator("details").last();
    await details.locator("summary").click();
    await dialog(p)
      .getByLabel("Pergunta 10", { exact: true })
      .fill("Software de interesse");
    await dialog(p)
      .getByLabel("Exibir campo 10 quando", { exact: true })
      .selectOption("field-sector");
    await dialog(p)
      .getByLabel("Resposta que exibe campo 10", { exact: true })
      .fill("Engenharia");
    await dialog(p)
      .getByRole("button", { name: "Salvar formulário", exact: true })
      .click();
    await area(p, "Página de Carreiras");
    await shot(p, "careers");
    assert.equal(
      await p
        .getByRole("heading", {
          name: "Projetista de Engenharia · Demo",
          exact: true,
        })
        .count(),
      0,
    );
    await p
      .getByRole("button", {
        name: "Simular cadastro no Banco de Talentos",
        exact: true,
      })
      .click();
    await p
      .getByLabel("Nome completo *", { exact: true })
      .fill("Candidatura Protegida Demo");
    await p
      .getByLabel("E-mail *", { exact: true })
      .fill("candidatura-demo@exemplo.invalid");
    await p
      .getByLabel("Área de interesse *", { exact: true })
      .selectOption("Arquitetura");
    assert.equal(
      await p.getByLabel("Software de interesse", { exact: true }).count(),
      0,
    );
    await p
      .getByLabel("Área de interesse *", { exact: true })
      .selectOption("Engenharia");
    await p.getByLabel("Software de interesse", { exact: true }).fill("Revit");
    await p
      .getByLabel(
        "Confirmo o uso de dados exclusivamente fictícios nesta simulação local",
        { exact: true },
      )
      .check();
    await p
      .getByRole("button", {
        name: "Registrar candidatura demonstrativa",
        exact: true,
      })
      .click();
    await p
      .getByText(
        "Cadastro de teste registrado apenas neste navegador. Nenhuma candidatura real foi enviada.",
        { exact: true },
      )
      .waitFor();
    await p
      .getByRole("button", {
        name: "Registrar candidatura demonstrativa",
        exact: true,
      })
      .click();
    const submitted = await readDemo(p, "recruitment-v1:");
    assert.equal(
      submitted.candidates.filter(
        (c) => c.email === "candidatura-demo@exemplo.invalid",
      ).length,
      1,
    );
    await area(p, "Banco de Talentos");
    await p
      .locator("article")
      .filter({
        has: p.getByRole("heading", {
          name: "Candidatura Protegida Demo",
          exact: true,
        }),
      })
      .getByRole("button", { name: "Abrir ficha", exact: true })
      .click();
    await tab(p, "Privacidade");
    await dialog(p)
      .getByLabel("Justificativa da exclusão local", { exact: true })
      .fill("Teste de anonimização local.");
    await dialog(p)
      .getByRole("button", {
        name: "Anonimizar cadastro demonstrativo",
        exact: true,
      })
      .click();
    assert.equal(
      await p
        .getByRole("heading", {
          name: "Candidatura Protegida Demo",
          exact: true,
        })
        .count(),
      0,
    );
    await ctx.addCookies([
      { name: "youcon-organization", value: "org-b", url: base },
    ]);
    await p.goto(base + "/recrutamento/talentos");
    assert.equal(
      await p
        .getByRole("heading", { name: "Novo Talento Fictício", exact: true })
        .count(),
      0,
    );
    await ctx.close();
  }
  console.log(
    "Director and leadership: scoped pages, private data boundaries, finance review and technical feedback",
  );
  {
    const { ctx, page: p } = await open("director");
    await p
      .getByRole("heading", { name: "Visão Geral", exact: true })
      .waitFor();
    assert.equal(
      await p
        .getByRole("navigation", { name: "Áreas de Recrutamento", exact: true })
        .getByRole("link")
        .count(),
      2,
    );
    assert.equal(await p.getByText("Alex Demo", { exact: true }).count(), 0);
    await p
      .getByRole("button", { name: "Revisar exceção financeira", exact: true })
      .click();
    await dialog(p)
      .getByLabel("Parecer da Diretoria", { exact: true })
      .fill("Exceção fictícia conferida, dentro das condições de teste.");
    await dialog(p)
      .getByRole("button", {
        name: "Registrar decisão financeira",
        exact: true,
      })
      .click();
    await p.getByText(/Aprovada/).waitFor();
    await p.goto(base + "/recrutamento/talentos");
    await p.waitForURL("**/acesso-negado");
    await ctx.close();
  }
  {
    const { ctx, page: p } = await open("leadership", "/recrutamento/vagas");
    await p
      .getByRole("heading", { name: "Gestão de Vagas", exact: true })
      .waitFor();
    assert.equal(
      await p.getByRole("button", { name: "Nova vaga", exact: true }).count(),
      0,
    );
    assert.equal(await p.getByText(/Orçamento mensal aprovado/).count(), 0);
    assert.equal(
      await p.getByRole("heading", { name: "Caio Teste", exact: true }).count(),
      0,
    );
    await p
      .getByRole("button")
      .filter({
        has: p.getByRole("heading", { name: "Alex Demo", exact: true }),
      })
      .click();
    assert.equal(
      await dialog(p)
        .getByRole("button", { name: "DISC e Temperamentos", exact: true })
        .count(),
      0,
    );
    assert.equal(
      await dialog(p)
        .getByText(/Observação confidencial demonstrativa/)
        .count(),
      0,
    );
    await tab(p, "Técnica e pareceres");
    await dialog(p)
      .getByLabel("Parecer ou evidência técnica", { exact: true })
      .fill("Parecer técnico do responsável designado, fictício.");
    await dialog(p)
      .getByRole("button", { name: "Registrar parecer", exact: true })
      .click();
    await dialog(p)
      .getByText("Parecer técnico do responsável designado, fictício.", {
        exact: true,
      })
      .waitFor();
    await close(p);
    await shot(p, "leadership");
    await ctx.close();
  }
  for (const role of [
    "professional",
    "professional-pj",
    "professional-intern",
  ]) {
    const { ctx, page: p } = await open(role);
    await p.waitForURL("**/acesso-negado");
    await p.goto(base + "/recrutamento/carreiras");
    await p.waitForURL("**/acesso-negado");
    await ctx.close();
  }
  {
    const { ctx, page: p } = await open("hr", "/recrutamento/visao-geral");
    await p
      .getByRole("heading", { name: "Visão Geral", exact: true })
      .waitFor();
    await p.setViewportSize({ width: 390, height: 844 });
    await p.emulateMedia({ reducedMotion: "reduce" });
    await shot(p, "mobile-overview");
    await area(p, "Gestão de Vagas");
    await shot(p, "mobile-kanban");
    const c = p.getByRole("button").filter({
      has: p.getByRole("heading", { name: "Alex Demo", exact: true }),
    });
    await c.focus();
    await p.keyboard.press("Enter");
    await dialog(p).waitFor();
    await p.keyboard.press("Escape");
    assert.equal(await dialog(p).count(), 0);
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
        "RH Kanban drag/drop, snapshots/custom stages, talent import/reload and saved filters, explainable Match batch/compare without movement, private notes and individual profile instruments, human approval and financial proposal gates, explicit hire and idempotent authorized Onboarding copy, conditional form builder, protected career submission/deduplication and privacy erasure, scoped tenants, director finance-only decisions, assigned technical leadership, staff/PJ route denial, mobile/keyboard/reduced motion",
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
