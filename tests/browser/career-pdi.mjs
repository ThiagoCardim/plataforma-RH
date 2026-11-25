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
  await mkdir("work/career-review", { recursive: true });
  const allErrors = [];
  async function open(role, route = "/plano-de-carreira") {
    const ctx = await contextFor(role),
      page = await ctx.newPage();
    page.setDefaultTimeout(12000);
    page.on("pageerror", (e) => allErrors.push(`${role}: ${e.message}`));
    page.on("request", (r) => {
      if (new URL(r.url()).hostname.endsWith("supabase.co"))
        violations.push(r.url());
    });
    await page.goto(base + route);
    return { ctx, page };
  }
  async function tab(page, name) {
    await page.getByRole("button", { name, exact: true }).click();
  }
  async function close(page) {
    await page.keyboard.press("Escape");
    assert.equal(await page.getByRole("dialog").count(), 0);
  }
  async function shot(page, name) {
    await page.evaluate(() => {
      document.activeElement?.blur();
      window.scrollTo(0, 0);
    });
    await page.screenshot({ path: `work/career-review/${name}.png` });
    const dimensions = await page.evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    assert.ok(
      dimensions.scroll <= dimensions.width + 1,
      JSON.stringify(dimensions),
    );
  }
  console.log("Career RH");
  {
    const { ctx, page } = await open("hr");
    await page
      .getByRole("heading", { name: "Plano de Carreira", exact: true })
      .waitFor();
    const tabs = [
      "Visão Geral",
      "Trilhas de Carreira",
      "Cargos e Competências",
      "Faixas Salariais",
      "Ciclos de Reconhecimento",
      "Movimentações e Simulações",
      "Diretrizes",
    ];
    for (const t of tabs)
      assert.equal(
        await page.getByRole("button", { name: t, exact: true }).count(),
        1,
        t,
      );
    await shot(page, "admin-overview");
    await tab(page, "Trilhas de Carreira");
    await page.getByLabel("Ampliar mapa").click();
    await page.getByLabel("Restaurar zoom do mapa").click();
    await page
      .getByRole("button", { name: /Explorar cargo Especialista/ })
      .click();
    await page
      .getByRole("dialog")
      .getByText("Responsabilidades", { exact: true })
      .waitFor();
    await close(page);
    await shot(page, "admin-map");
    await tab(page, "Cargos e Competências");
    await tab(page, "Novo cargo");
    await page
      .getByLabel("Nome do cargo", { exact: true })
      .fill("Especialista de inovação demonstrativo");
    await page.getByLabel("Nome do nível", { exact: true }).fill("Referência");
    await page.getByLabel("Ordem do nível", { exact: true }).fill("5");
    await page.getByLabel("Caminho", { exact: true }).selectOption("Técnica");
    await page
      .getByLabel("Responsabilidades (uma por linha)", { exact: true })
      .fill("Organizar experiências e revisões técnicas");
    await page
      .getByLabel("Requisitos (um por linha)", { exact: true })
      .fill("Atuação técnica com autonomia e colaboração");
    await page
      .getByLabel("Competências (nome | descrição, uma por linha)", {
        exact: true,
      })
      .fill("Experimentação | Documentar aprendizados das experiências");
    await page
      .getByLabel("Publicar cargo no mapa dos profissionais", { exact: true })
      .check();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Salvar", exact: true })
      .click();
    await page
      .getByRole("heading", {
        name: "Especialista de inovação demonstrativo",
        exact: true,
      })
      .waitFor();
    await page.reload();
    await tab(page, "Cargos e Competências");
    await page
      .getByRole("heading", {
        name: "Especialista de inovação demonstrativo",
        exact: true,
      })
      .waitFor();
    await tab(page, "Faixas Salariais");
    await shot(page, "salary-bands");
    await tab(page, "Ciclos de Reconhecimento");
    await shot(page, "cycles");
    await tab(page, "Movimentações e Simulações");
    await tab(page, "Simular reconhecimento");
    await page
      .getByLabel("Pessoa da análise", { exact: true })
      .selectOption("career-person-3");
    assert.deepEqual(
      await page
        .getByLabel("Tipo de reconhecimento", { exact: true })
        .locator("option")
        .allTextContents(),
      ["Revisão de bolsa"],
    );
    await page
      .getByLabel("Pessoa da análise", { exact: true })
      .selectOption("career-person-4");
    assert.deepEqual(
      await page
        .getByLabel("Tipo de reconhecimento", { exact: true })
        .locator("option")
        .allTextContents(),
      ["Honorários PJ"],
    );
    await page
      .getByLabel("Pessoa da análise", { exact: true })
      .selectOption("career-person-0");
    await page
      .getByLabel("Valor bruto mensal proposto", { exact: true })
      .fill("6500");
    await page
      .getByLabel("Fundamentos de mérito", { exact: true })
      .fill(
        "Revisão fictícia fundamentada na evolução consistente das entregas.",
      );
    await shot(page, "simulation");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /Salvar/ })
      .click();
    await page.getByRole("button", { name: /Marina Demo/ }).click();
    await tab(page, "Enviar à Diretoria");
    await page
      .getByRole("dialog")
      .getByText(
        "Análise enviada à Diretoria, sem reservar orçamento antes da aprovação.",
        { exact: true },
      )
      .waitFor();
    await close(page);
    await page.getByRole("button", { name: /Luana Teste/ }).click();
    assert.equal(
      await page
        .getByRole("button", { name: "Efetivar na demonstração" })
        .isEnabled(),
      false,
    );
    await page
      .getByLabel("Confirmo que a efetivação é somente uma simulação local")
      .check();
    await tab(page, "Efetivar na demonstração");
    await tab(page, "Autorizar publicação do reconhecimento efetivado");
    await page
      .getByLabel("Título público", { exact: true })
      .fill("Reconhecimento local já efetivado");
    await page
      .getByLabel("Conteúdo institucional", { exact: true })
      .fill(
        "Celebramos um avanço fictício de carreira, autorizado para esta demonstração.",
      );
    await page
      .getByLabel(
        "Autorizo a publicação deste conteúdo institucional como RH",
        { exact: true },
      )
      .check();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Salvar", exact: true })
      .click();
    // The financial analysis stays open behind the publication form.
    if (await page.getByRole("dialog").count()) await close(page);
    await tab(page, "Visão Geral");
    await page
      .getByRole("heading", { name: "Reconhecimento local já efetivado" })
      .waitFor();
    await tab(page, "Diretrizes");
    await tab(page, "Personalizar diretrizes");
    await page
      .getByLabel("Texto das diretrizes", { exact: true })
      .fill(
        "Diretrizes locais: desenvolvimento contínuo, mérito e análise sustentável. Nenhuma promoção é automática.",
      );
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Salvar", exact: true })
      .click();
    await page.reload();
    await tab(page, "Diretrizes");
    await page
      .getByText(/Diretrizes locais: desenvolvimento contínuo/)
      .first()
      .waitFor();
    await page.goto(base + "/pdi");
    assert.equal(
      await page
        .getByRole("button", { name: "Criar PDI da equipe", exact: true })
        .count(),
      0,
    );
    await page.getByRole("button", { name: /Luana Teste/ }).click();
    await page
      .getByLabel("Parecer do RH no PDI")
      .fill("Objetivo e ações adequados para este ciclo demonstrativo.");
    await tab(page, "Aprovar e publicar PDI");
    await page
      .getByRole("dialog")
      .getByText("PDI aprovado e publicado pelo RH.", { exact: true })
      .waitFor();
    await close(page);
    await shot(page, "pdi-admin");
    await ctx.close();
  }
  console.log("Career director");
  {
    const { ctx, page } = await open("director");
    await tab(page, "Movimentações e Simulações");
    assert.equal(
      await page
        .getByRole("button", { name: "Simular reconhecimento", exact: true })
        .count(),
      0,
    );
    await page.getByRole("button", { name: /Gabriel Exemplo/ }).click();
    await page
      .getByLabel("Parecer da Diretoria")
      .fill("Viabilidade conferida nesta demonstração; reserva autorizada.");
    await tab(page, "Aprovar reconhecimento");
    await page
      .getByRole("dialog")
      .getByText("Aprovação e reserva demonstrativas registradas.", {
        exact: true,
      })
      .waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "Efetivar na demonstração", exact: true })
        .count(),
      0,
    );
    await close(page);
    await page.reload();
    await tab(page, "Movimentações e Simulações");
    await page.getByRole("button", { name: /Gabriel Exemplo/ }).click();
    await page
      .getByRole("button", { name: "Cancelar reserva aprovada", exact: true })
      .waitFor();
    await close(page);
    await ctx.close();
  }
  for (const role of ["leadership", "professional", "professional-intern"]) {
    console.log("Career own and PDI", role);
    const { ctx, page } = await open(role);
    await page
      .getByRole("heading", { name: "Plano de Carreira", exact: true })
      .waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "Faixas Salariais", exact: true })
        .count(),
      0,
    );
    assert.equal(
      await page
        .getByRole("button", {
          name: "Movimentações e Simulações",
          exact: true,
        })
        .count(),
      0,
    );
    assert.equal(
      await page
        .getByRole("button", { name: "Simular reconhecimento", exact: true })
        .count(),
      0,
    );
    const html = await page.content();
    for (const key of [
      '"compensation"',
      '\\"compensation\\"',
      '"merit"',
      '\\"merit\\"',
      '"revenueTarget"',
      '\\"revenueTarget\\"',
    ])
      assert.ok(!html.includes(key), key);
    await page.getByRole("button", { name: /Explorar cargo Analista/ }).focus();
    await page.keyboard.press("Enter");
    await page
      .getByRole("dialog")
      .getByText("Responsabilidades", { exact: true })
      .waitFor();
    await close(page);
    if (role === "professional") await shot(page, "employee-career");
    await page.goto(base + "/pdi");
    await page.getByRole("heading", { name: "PDI", exact: true }).waitFor();
    if (role === "leadership") {
      await page.getByRole("button", { name: /Gabriel Exemplo/ }).click();
      await page
        .getByRole("button", { name: "Adicionar evidência", exact: true })
        .first()
        .click();
      await page
        .getByLabel("Descrição da evidência")
        .fill("Revisão técnica acompanhada registrada localmente.");
      await page.getByLabel("Arquivo da evidência").setInputFiles({
        name: "aprendizados.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("Evidência exclusivamente fictícia"),
      });
      await tab(page, "Salvar evidência local");
      await close(page);
      await page.reload();
      await page.getByRole("button", { name: /Gabriel Exemplo/ }).click();
      await page.getByText("aprendizados.txt", { exact: true }).waitFor();
      await close(page);
      await tab(page, "Criar PDI da equipe");
      await page
        .getByLabel("Profissional do PDI")
        .selectOption("career-person-1");
      await page.getByLabel("Ciclo do PDI").selectOption("pdi-cycle-2");
      await tab(page, "Criar plano em rascunho");
      await page
        .getByRole("button", { name: /Gabriel Exemplo/ })
        .first()
        .click();
      await tab(page, "Editar estrutura do PDI");
      await page
        .getByLabel("Título do PDI", { exact: true })
        .fill("Aprofundamento técnico do ciclo local");
      await page
        .getByLabel("Objetivo de desenvolvimento", { exact: true })
        .fill(
          "Desenvolver a autonomia em revisões de projeto com acompanhamento.",
        );
      await page
        .getByLabel("Ação do PDI 1", { exact: true })
        .fill("Realizar uma revisão acompanhada");
      await tab(page, "Enviar versão ao RH");
      await page
        .getByRole("dialog")
        .getByText("Versão enviada à aprovação do RH.", { exact: true })
        .waitFor();
      assert.equal(
        await page
          .getByRole("button", { name: "Aprovar e publicar PDI", exact: true })
          .count(),
        0,
      );
      await close(page);
    } else {
      assert.equal(
        await page
          .getByRole("button", { name: "Criar PDI da equipe", exact: true })
          .count(),
        0,
      );
      await page.getByRole("button", { name: /Marina Demo/ }).click();
      assert.equal(
        await page
          .getByRole("button", { name: "Editar estrutura do PDI", exact: true })
          .count(),
        0,
      );
      const action = page.getByRole("checkbox", {
        name: /Concluir ação Organizar/,
      });
      await action.check();
      await page
        .getByLabel("Feedback do PDI")
        .fill("Consegui aplicar o aprendizado em uma revisão fictícia.");
      await tab(page, "Registrar feedback");
      await close(page);
      await page.reload();
      await page.getByRole("button", { name: /Marina Demo/ }).click();
      assert.equal(
        await page
          .getByRole("checkbox", { name: /Concluir ação Organizar/ })
          .isChecked(),
        true,
      );
      await page
        .getByText("Consegui aplicar o aprendizado em uma revisão fictícia.", {
          exact: true,
        })
        .waitFor();
      if (role === "professional") await shot(page, "pdi-individual");
      await close(page);
    }
    await shot(page, "pdi-" + role);
    if (role === "professional") {
      await page.setViewportSize({ width: 390, height: 844 });
      await shot(page, "pdi-mobile");
      await page.goto(base + "/plano-de-carreira");
      await shot(page, "career-mobile");
    }
    await ctx.close();
  }
  for (const role of ["professional-pj", "leadership-pj"]) {
    const { ctx, page } = await open(role);
    await page.waitForURL(/\/acesso-negado$/);
    await page.goto(base + "/pdi");
    if (role === "professional-pj") await page.waitForURL(/\/acesso-negado$/);
    else {
      await page.getByRole("heading", { name: "PDI", exact: true }).waitFor();
      assert.equal(
        await page.getByRole("button", { name: /Estúdio PJ Fictício/ }).count(),
        0,
      );
      await page.getByRole("button", { name: /Gabriel Exemplo/ }).waitFor();
      await page.getByRole("button", { name: /Gabriel Exemplo/ }).click();
      assert.equal(
        await page
          .getByRole("link", { name: "Consultar avaliações", exact: true })
          .count(),
        0,
      );
      await close(page);
    }
    await ctx.close();
  }
  assert.deepEqual(allErrors, []);
  assert.deepEqual(violations, []);
  console.log(
    JSON.stringify({
      result: "PASS",
      mutations: 0,
      requests: requests.length,
      flows:
        "Career role privacy, interactive graph, published roles, simulations, contract compatibility, RH publication, director reserve, independent PDI creation/approval, evidence file persistence, own progress/feedback, PJ exclusion, responsive layouts and keyboard",
    }),
  );
} finally {
  await browser?.close();
  next.kill("SIGTERM");
  api.closeAllConnections();
  api.close();
  log.end();
}
