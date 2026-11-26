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
  async function moveCard(p, name, value) {
    const card = p
      .locator("article.ats-card")
      .filter({ has: p.getByRole("button", { name: new RegExp("^" + name) }) });
    await card.locator("summary").click();
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
      .getByRole("heading", { name: "Processo Seletivo", exact: true })
      .waitFor();
    await p
      .getByRole("region", { name: "Kanban central de candidatos" })
      .waitFor();
    assert.equal(await p.locator(".ats-column").count(), 12);
    await shot(p, "central-kanban");
    const dragCard = p
      .locator("article.ats-card")
      .filter({ has: p.getByRole("button", { name: /^Alex Demo/ }) });
    await dragCard.dragTo(
      p.locator(".ats-column").filter({
        has: p.getByRole("heading", { name: "Triagem", exact: true }),
      }),
    );
    await dialog(p)
      .getByLabel("Motivo da movimentação")
      .fill("Triagem por arrastar e soltar.");
    await dialog(p)
      .getByRole("button", { name: "Confirmar movimentação" })
      .click();
    await dialog(p).waitFor({ state: "detached" });

    // Independent authenticated form outside the administrative shell.
    await p.goto(base + "/candidatura-demonstrativa");
    await p
      .getByLabel("Nome completo *", { exact: true })
      .fill("Pessoa Central Fictícia");
    await p
      .getByLabel("E-mail *", { exact: true })
      .fill("central-ficticia@exemplo.invalid");
    await p
      .getByLabel("Área de interesse *", { exact: true })
      .selectOption("Arquitetura");
    await p
      .getByLabel("Nível de experiência", { exact: true })
      .selectOption({ label: "Júnior: até 3 anos de experiência" });
    await p
      .getByLabel(
        "Confirmo o uso de dados exclusivamente fictícios nesta simulação local",
      )
      .check();
    await tab(p, "Registrar candidatura demonstrativa");
    await p.getByRole("link", { name: "Retornar ao processo" }).waitFor();
    assert.equal(
      await p.getByRole("navigation", { name: "Navegação principal" }).count(),
      0,
    );
    await route(p, "processo-seletivo", "Processo Seletivo");
    await p.getByRole("button", { name: /^Pessoa Central Fictícia/ }).waitFor();
    await p.reload();
    await p.getByRole("button", { name: /^Pessoa Central Fictícia/ }).waitFor();
    let s = await readDemo(p);
    const a = s.applications.find(
      (a) =>
        a.candidate ===
        s.candidates.find((p) => p.email === "central-ficticia@exemplo.invalid")
          .id,
    );
    assert.equal(a.job, "");
    assert.equal(a.stage, "pipeline-0");
    await moveCard(p, "Pessoa Central Fictícia", "pipeline-6");
    await p
      .getByRole("button", {
        name: "Marcar talento Pessoa Central Fictícia",
        exact: true,
      })
      .click();
    await moveCard(p, "Pessoa Central Fictícia", "pipeline-11");
    await p
      .getByLabel("Selecionar Pessoa Central Fictícia", { exact: true })
      .check();
    await tab(p, "Arquivar processos encerrados");
    await dialog(p)
      .getByLabel("Motivo do arquivamento")
      .fill("Resultado preservado, processo arquivado.");
    await dialog(p)
      .getByRole("button", { name: "Confirmar arquivamento local" })
      .click();
    await dialog(p).waitFor({ state: "detached" });
    await route(p, "talentos", "Banco de Currículos");
    await p
      .getByLabel(
        "Selecionar currículo Pessoa Central Fictícia · central-ficticia@exemplo.invalid",
        { exact: true },
      )
      .check();
    await tab(p, "Nova oportunidade");
    await dialog(p)
      .getByLabel("Motivo da nova oportunidade")
      .fill("Nova oportunidade fictícia.");
    await dialog(p)
      .getByRole("button", { name: "Iniciar novos processos revisados" })
      .click();
    await dialog(p).waitFor({ state: "detached" });
    await route(p, "processo-seletivo", "Processo Seletivo");
    await p.getByRole("button", { name: /^Pessoa Central Fictícia/ }).click();
    await dialog(p)
      .getByLabel("Experiência validada pelo RH")
      .selectOption("Pleno: de 4 a 6 anos de experiência");
    await dialog(p)
      .getByLabel("Vaga vinculada opcional")
      .selectOption("rec-job-0");
    await shot(p, "candidate-side-panel");
    await close(p);
    await tab(p, "YouCon Match");
    await dialog(p)
      .getByRole("button", { name: "Analisar e comparar selecionados" })
      .click();
    await dialog(p)
      .getByText("Perguntas sugeridas", { exact: true })
      .first()
      .waitFor();
    await shot(p, "match-evidence");
    await close(p);
    // Human approval and declined proposal retain the original offer and reason.
    await p.getByRole("button", { name: /^Alex Demo/ }).click();
    await dialog(p)
      .getByLabel("Parecer do RH para continuidade e proposta")
      .fill("Requisitos técnicos revisados.");
    await dialog(p)
      .getByRole("button", { name: "Aprovar continuidade e proposta" })
      .click();
    await dialog(p)
      .getByRole("button", { name: "Propostas e admissão", exact: true })
      .click();
    await dialog(p).getByLabel("Valor mensal da proposta (R$)").fill("4000");
    await dialog(p)
      .getByRole("button", { name: "Preparar proposta local" })
      .click();
    await dialog(p)
      .getByRole("button", { name: "Registrar envio simulado" })
      .click();
    await dialog(p)
      .getByLabel("Motivo da recusa", { exact: true })
      .fill("Condições contratuais fictícias.");
    await dialog(p)
      .getByRole("button", { name: "Registrar recusa demonstrativa" })
      .click();
    await close(p);
    s = await readDemo(p);
    assert.equal(
      s.applications.find((a) => a.id === "rec-application-0").stage,
      "pipeline-12",
    );
    assert.ok(s.offers.some((o) => o.state === "Recusada"));
    await moveCard(p, "Pessoa Central Fictícia", "pipeline-8");
    s = await readDemo(p);
    assert.equal(s.admissions.length, 1);
    assert.equal(s.employments.length, 0);
    await moveCard(p, "Pessoa Central Fictícia", "pipeline-0");
    await moveCard(p, "Pessoa Central Fictícia", "pipeline-8");
    s = await readDemo(p);
    assert.equal(s.admissions.length, 1);
    await route(p, "admissao", "Admissão Digital");
    await p.getByRole("button", { name: /^Pessoa Central Fictícia/ }).click();
    await dialog(p)
      .getByLabel("Referência do processo na Flash")
      .fill("FLASH-FICTICIO-001");
    await dialog(p)
      .getByLabel("RH conferiu a confirmação externa da admissão CLT")
      .check();
    await dialog(p).getByLabel("Valor bruto contratual (R$)").fill("4000");
    await dialog(p)
      .getByRole("button", { name: "Salvar acompanhamento da admissão" })
      .click();
    await dialog(p)
      .getByLabel("Confirmo a formalização fictícia revisada pelo RH")
      .check();
    await dialog(p)
      .getByRole("button", { name: "Confirmar formalização local" })
      .click();
    await dialog(p)
      .getByRole("link", { name: "Revisar e iniciar Onboarding" })
      .waitFor();
    await shot(p, "admission-clt-confirmed");
    await close(p);
    s = await readDemo(p);
    assert.equal(s.employments.length, 1);
    assert.equal(s.handoffs.length, 1);
    // Distinct PJ and intern admissions, no duplicate person.
    for (const [name, contract] of [
      ["Bia Exemplo", "PJ"],
      ["Caio Teste", "Estágio"],
    ]) {
      if (name === "Bia Exemplo") {
        await route(p, "talentos", "Banco de Currículos");
        await p
          .getByLabel(
            "Selecionar currículo Bia Exemplo · talento-1@exemplo.invalid",
            { exact: true },
          )
          .check();
        await tab(p, "Nova oportunidade");
        await dialog(p)
          .getByLabel("Motivo da nova oportunidade")
          .fill("Reativação de currículo selecionado para oportunidade PJ.");
        await dialog(p)
          .getByRole("button", { name: "Iniciar novos processos revisados" })
          .click();
        await dialog(p).waitFor({ state: "detached" });
      }
      await route(p, "processo-seletivo", "Processo Seletivo");
      await p.getByRole("button", { name: new RegExp("^" + name) }).click();
      await dialog(p).getByLabel("Vaga vinculada opcional").selectOption("");
      const select = dialog(p).getByLabel(
        "Modalidade pretendida para admissão",
      );
      if (await select.count()) await select.selectOption(contract);
      await close(p);
      await moveCard(p, name, "pipeline-8");
      await route(p, "admissao", "Admissão Digital");
      await p.getByLabel("Fluxo de admissão").selectOption(contract);
      await p.getByRole("button", { name: new RegExp("^" + name) }).click();
      const label =
        contract === "PJ"
          ? "Contrato de prestação assinado"
          : "Termo de compromisso assinado";
      await dialog(p)
        .getByLabel("Anexar " + label, { exact: true })
        .setInputFiles({
          name: "contrato-ficticio.pdf",
          mimeType: "application/pdf",
          buffer: Buffer.from("%PDF-1.4\nDemonstração fictícia"),
        });
      const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());
      await dialog(p).getByLabel("Data da assinatura confirmada").fill(today);
      await dialog(p)
        .getByRole("button", { name: "Salvar acompanhamento da admissão" })
        .click();
      await dialog(p)
        .getByRole("button", {
          name: "Preencher formulário individual demonstrativo",
        })
        .click();
      await dialog(p)
        .getByLabel(
          contract === "PJ"
            ? "Identificação cadastral da prestação de serviços *"
            : "Instituição de ensino e curso *",
          { exact: true },
        )
        .fill("Instituição / serviço inteiramente fictício");
      await dialog(p)
        .getByLabel(
          "Confirmo o uso de dados exclusivamente fictícios nesta simulação local",
        )
        .check();
      await dialog(p)
        .getByRole("button", { name: "Registrar candidatura demonstrativa" })
        .click();
      await dialog(p)
        .getByLabel("Confirmo a formalização fictícia revisada pelo RH")
        .check();
      await dialog(p)
        .getByRole("button", { name: "Confirmar formalização local" })
        .click();
      await dialog(p)
        .getByRole("link", { name: "Revisar e iniciar Onboarding" })
        .waitFor();
      await close(p);
    }
    await p.goto(base + "/onboarding-offboarding");
    await p
      .getByRole("heading", { name: "Admissões preparadas no Recrutamento" })
      .waitFor();
    await p
      .getByRole("button", { name: "Iniciar Onboarding demonstrativo" })
      .first()
      .click();
    await p.getByRole("button", { name: "Já iniciado", exact: true }).waitFor();
    await p.goto(base + "/offboarding");
    await p
      .getByText("Contratações locais · vínculo com Recrutamento", {
        exact: true,
      })
      .click();
    await p
      .getByLabel("Vínculo local para Offboarding")
      .selectOption({ label: "Pessoa Central Fictícia · CLT" });
    await tab(p, "Iniciar Offboarding vinculado");
    await p.getByText(/Ativo · Atividades no card de Offboarding/).waitFor();
    await p
      .getByLabel(
        "RH confirma a conclusão fictícia após conferir todas as atividades",
      )
      .check();
    await tab(p, "Confirmar conclusão e vínculo encerrado");
    await p
      .getByRole("alert")
      .filter({ hasText: "Conclua todas as atividades" })
      .waitFor();
    await shot(p, "offboarding-linked-gate");
    await tab(p, "Offboardings");
    await p.getByRole("button", { name: /Pessoa Central Fictícia/ }).click();
    for (const track of ["Trilha RH", "Trilha operacional"]) {
      await dialog(p)
        .getByRole("button", { name: new RegExp("^" + track) })
        .click();
      const details = dialog(p).locator("details");
      for (let i = 0; i < (await details.count()); i++) {
        const d = details.nth(i);
        if (!((await d.getAttribute("open")) !== null))
          await d.locator("summary").click();
      }
      const checks = dialog(p).getByRole("checkbox");
      for (let i = 0; i < (await checks.count()); i++) {
        if (await checks.nth(i).isEnabled()) await checks.nth(i).check();
      }
    }
    await dialog(p)
      .getByRole("button", { name: "Fechar painel", exact: true })
      .click();
    await tab(p, "Confirmar conclusão e vínculo encerrado");
    await p
      .getByRole("button", { name: "Encerramento confirmado", exact: true })
      .waitFor();

    await route(p, "indicadores", "Indicadores");
    await p.getByText("Formalizações RH", { exact: true }).waitFor();
    await shot(p, "indicators");
    s = await readDemo(p);
    assert.equal(s.employments.length, 3);
    assert.equal(
      s.admissions.filter((a) => a.state === "Confirmada").length,
      3,
    );
    assert.ok(
      s.applications.find(
        (a) =>
          a.candidate ===
          s.candidates.find((p) => p.name === "Pessoa Central Fictícia").id,
      ).fromBank,
    );
    await route(p, "configuracoes", "Configurações");
    await tab(p, "Cards e tags");
    await p.getByLabel("Cidade", { exact: true }).uncheck();
    await tab(p, "Salvar cards, tags e requisitos");
    await p.reload();
    await tab(p, "Cards e tags");
    assert.equal(
      await p.getByLabel("Cidade", { exact: true }).isChecked(),
      false,
    );
    await shot(p, "configuration");
    await route(p, "processo-seletivo", "Processo Seletivo");
    await tab(p, "Filtros avançados");
    await p.getByLabel("Cidade", { exact: true }).fill("inexistente");
    await p
      .getByText("Nenhum processo corresponde aos filtros.", { exact: true })
      .waitFor();
    await tab(p, "Limpar filtros");
    await tab(p, "Tabela");
    await p.getByRole("table").waitFor();
    await p.setViewportSize({ width: 390, height: 844 });
    await p.emulateMedia({ reducedMotion: "reduce" });
    await tab(p, "Kanban");
    await shot(p, "mobile-central");
    await p.getByRole("button", { name: /^Alex Demo/ }).focus();
    await p.keyboard.press("Enter");
    await dialog(p).waitFor();
    await close(p);
    await ctx.close();
  }
  for (const role of [
    "director",
    "leadership",
    "professional",
    "professional-pj",
    "professional-intern",
  ]) {
    const { ctx, page: p } = await open(
      role,
      "/recrutamento/processo-seletivo",
    );
    if (role.startsWith("professional")) {
      await p.waitForURL("**/acesso-negado");
    } else {
      await p
        .getByRole("heading", { name: "Processo Seletivo", exact: true })
        .waitFor();
      const nav = p.getByRole("navigation", {
        name: "Navegação principal",
        exact: true,
      });
      assert.equal(
        await nav
          .getByRole("link", { name: "Configurações", exact: true })
          .count(),
        0,
      );
      assert.equal(
        await nav
          .getByRole("link", { name: "Admissão Digital", exact: true })
          .count(),
        0,
      );
      if (role === "director") {
        assert.equal(
          await p.getByRole("button", { name: /^Alex Demo/ }).count(),
          0,
        );
        await shot(p, "director-managerial");
      } else {
        await shot(p, "leadership-assigned");
        await p.goto(base + "/recrutamento/vagas");
        await p.waitForURL("**/acesso-negado");
      }
    }
    await p.goto(base + "/candidatura-demonstrativa");
    await p.waitForURL("**/acesso-negado");
    await ctx.close();
  }
  const anon = await browser.newContext(),
    anonPage = await anon.newPage();
  await anonPage.goto(base + "/candidatura-demonstrativa");
  await anonPage.waitForURL("**/login**");
  await anon.close();
  assert.deepEqual(errors, []);
  assert.deepEqual(violations, []);
  console.log(
    JSON.stringify({
      result: "PASS",
      mutations: 0,
      requests: requests.length,
      flows:
        "Protected standalone intake -> entry/dedup/reload; optional stages; curated bank/reactivation; separate RH level; evidence Match; refused offer; unique admission; CLT Flash / PJ / intern document formalization; authorized Onboarding; Offboarding explicit conclusion gate; configurable cards; indicators; role/organization scoping; mobile keyboard/reduced-motion",
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
