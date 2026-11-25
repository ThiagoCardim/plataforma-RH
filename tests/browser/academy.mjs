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
  await mkdir("work/academy-review", { recursive: true });
  const errors = [];
  async function open(role, route = "/youcon-academy") {
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
    await p.screenshot({ path: `work/academy-review/${name}.png` });
    assert.ok(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      "horizontal page overflow",
    );
  }
  const dialog = (p) => p.getByRole("dialog");
  const card = (p, title) =>
    p
      .locator("article")
      .filter({ has: p.getByRole("heading", { name: title, exact: true }) });
  const courseTitle = "Projetos com clareza: da intenção à entrega";
  const titleExternal = "Biblioteca externa de ferramentas BIM";
  async function openCatalog(p, title) {
    await tab(p, "Catálogo");
    await p
      .getByRole("button")
      .filter({ has: p.getByRole("heading", { name: title, exact: true }) })
      .click();
  }
  async function learn(p, title) {
    await openCatalog(p, title);
    await dialog(p)
      .getByRole("button", { name: /^(Continuar|Iniciar) aprendizado$/ })
      .click();
    await dialog(p)
      .getByRole("heading", { name: "Sala de aprendizagem", exact: true })
      .waitFor();
  }
  console.log(
    "Academy learner: player, quiz, local evidence, artifacts, tracks, agenda, reload",
  );
  {
    const { ctx, page: p } = await open("professional");
    await p
      .getByRole("heading", { name: "YouCon Academy", exact: true })
      .waitFor();
    await p.getByText("Continue aprendendo", { exact: true }).waitFor();
    assert.equal(
      await p
        .getByRole("button", { name: "Gestão Academy", exact: true })
        .count(),
      0,
    );
    await shot(p, "home");
    await learn(p, courseTitle);
    await dialog(p)
      .getByRole("button", { name: "O essencial para começar", exact: true })
      .click();
    const video = dialog(p).locator("video");
    await video.evaluate((v) => v.play());
    await p.waitForTimeout(400);
    assert.ok(await video.evaluate((v) => v.currentTime > 0));
    assert.equal(await video.locator("track").count(), 1);
    await shot(p, "player");
    await dialog(p)
      .getByRole("button", { name: "Aplicar no seu contexto", exact: true })
      .click();
    await dialog(p)
      .getByRole("radio", { name: "Enviar sem revisar", exact: true })
      .check();
    await dialog(p)
      .getByRole("button", { name: "Verificar respostas da aula", exact: true })
      .click();
    await dialog(p)
      .getByText("Revise as respostas e tente novamente.", { exact: false })
      .waitFor();
    await dialog(p)
      .getByRole("button", { name: "Concluir esta aula", exact: true })
      .click();
    await dialog(p)
      .getByText(
        "Verifique o questionário e atenda aos critérios configurados.",
        { exact: true },
      )
      .waitFor();
    await dialog(p)
      .getByRole("radio", {
        name: "Confirmar expectativas e revisar a entrega",
        exact: true,
      })
      .check();
    await dialog(p)
      .getByRole("button", { name: "Verificar respostas da aula", exact: true })
      .click();
    await dialog(p)
      .getByRole("button", { name: "Concluir esta aula", exact: true })
      .click();
    await dialog(p).getByText("Concluído", { exact: true }).waitFor();
    await close(p);
    await tab(p, "Minhas Conquistas");
    await shot(p, "achievements");
    await p
      .getByRole("button")
      .filter({
        has: p.getByRole("heading", { name: courseTitle, exact: true }),
      })
      .click();
    await dialog(p)
      .getByText("Demonstração local · sem validade oficial", { exact: false })
      .waitFor();
    await shot(p, "certificate");
    const downloadPromise = p.waitForEvent("download");
    await dialog(p)
      .getByRole("button", { name: /Baixar/ })
      .click();
    const download = await downloadPromise;
    assert.ok(download.suggestedFilename().endsWith(".svg"));
    await close(p);
    await learn(p, titleExternal);
    await dialog(p)
      .getByLabel("Relato da evidência de aprendizagem", { exact: true })
      .fill("Certificado fictício de teste local da plataforma externa.");
    await dialog(p)
      .getByLabel("Certificado ou evidência local", { exact: true })
      .setInputFiles({
        name: "evidencia-demo.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("%PDF-1.4\nAcademy ficticia\n%%EOF"),
      });
    await dialog(p)
      .getByRole("button", {
        name: "Enviar conclusão para validação",
        exact: true,
      })
      .click();
    await dialog(p).getByText("Aguardando RH", { exact: true }).waitFor();
    await close(p);
    await p.reload();
    await learn(p, titleExternal);
    await dialog(p).getByText("Aguardando RH", { exact: true }).waitFor();
    await dialog(p)
      .getByText("evidencia-demo.pdf", { exact: true })
      .first()
      .waitFor();
    await close(p);
    await tab(p, "Trilhas de Aprendizagem");
    await shot(p, "tracks");
    await p.getByRole("button", { name: /Entregas com qualidade/ }).click();
    await dialog(p)
      .getByRole("heading", {
        name: "Mapa da trilha de aprendizagem",
        exact: true,
      })
      .waitFor();
    await close(p);
    await tab(p, "Agenda de Treinamentos");
    await p
      .getByRole("button", { name: /Workshop: comunicação de projetos/ })
      .click();
    await dialog(p)
      .getByRole("button", {
        name: "Registrar minha participação",
        exact: true,
      })
      .click();
    await dialog(p)
      .getByRole("button", {
        name: "Minha participação registrada",
        exact: true,
      })
      .waitFor();
    await close(p);
    await shot(p, "agenda");
    await tab(p, "Catálogo");
    await p.getByLabel("Buscar no catálogo", { exact: true }).fill("BIM");
    assert.equal(
      await p
        .locator("button")
        .filter({
          has: p.getByRole("heading", { name: titleExternal, exact: true }),
        })
        .count(),
      1,
    );
    assert.equal(
      await p.getByRole("heading", { name: courseTitle, exact: true }).count(),
      0,
    );
    await p.getByLabel("Buscar no catálogo", { exact: true }).fill("");
    await shot(p, "catalog");
    await ctx.close();
  }
  console.log(
    "Academy RH: content editor, file blocks, publication, licenses, evidence and live recording",
  );
  {
    const { ctx, page: p } = await open("hr");
    p.on("dialog", (d) => d.accept());
    await tab(p, "Gestão Academy");
    await shot(p, "management");
    await p.getByRole("button", { name: "Novo conteúdo", exact: true }).click();
    await dialog(p)
      .getByLabel("Título do conteúdo", { exact: true })
      .fill("Curso de revisão local");
    await dialog(p)
      .getByLabel("Descrição do conteúdo", { exact: true })
      .fill(
        "Conteúdo fictício para validar edição, publicação e preservação de versão.",
      );
    await dialog(p)
      .getByLabel("Tags (separadas por vírgula)", { exact: true })
      .fill("Revisão, Teste local");
    await tab(p, "Aulas e blocos");
    await dialog(p)
      .getByRole("button", { name: "+ Arquivo", exact: true })
      .click();
    await dialog(p)
      .getByLabel("Arquivo do bloco 1.1.2", { exact: true })
      .setInputFiles({
        name: "material-demo.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("%PDF-1.4\nmaterial\n%%EOF"),
      });
    await dialog(p)
      .getByRole("button", { name: "Salvar rascunho do conteúdo", exact: true })
      .click();
    await tab(p, "Conteúdos e aprovação");
    const created = card(p, "Curso de revisão local");
    await created.getByText("Rascunho", { exact: true }).waitFor();
    await created
      .getByRole("button", { name: "Aprovar e publicar", exact: true })
      .click();
    await created.getByText("Publicado v1", { exact: true }).waitFor();
    await created
      .getByRole("button", { name: "Duplicar conteúdo", exact: true })
      .click();
    await created
      .getByRole("button", { name: "Editar conteúdo", exact: true })
      .click();
    await dialog(p)
      .getByLabel("Título do conteúdo", { exact: true })
      .fill("Curso de revisão local — edição 2");
    await dialog(p)
      .getByRole("button", { name: "Salvar rascunho do conteúdo", exact: true })
      .click();
    await p.reload();
    await tab(p, "Gestão Academy");
    await tab(p, "Conteúdos e aprovação");
    const revised = card(p, "Curso de revisão local — edição 2");
    await revised.getByText("Publicado v1", { exact: true }).waitFor();
    await revised
      .getByRole("button", { name: "Aprovar e publicar", exact: true })
      .click();
    await revised.getByText("Publicado v2", { exact: true }).waitFor();
    await revised
      .getByRole("button", { name: "Arquivar conteúdo", exact: true })
      .click();
    await revised.getByText("Arquivado", { exact: true }).waitFor();
    await tab(p, "Cursos externos e licenças");
    await p
      .getByRole("button", {
        name: "Gerenciar condições e licenças",
        exact: true,
      })
      .first()
      .click();
    await dialog(p)
      .getByLabel("Profissional para atribuir licença", { exact: true })
      .selectOption("career-person-2");
    await dialog(p)
      .getByRole("button", { name: "Atribuir licença", exact: true })
      .click();
    await dialog(p)
      .getByLabel("Profissional para atribuir licença", { exact: true })
      .selectOption("career-person-3");
    await dialog(p)
      .getByRole("button", { name: "Atribuir licença", exact: true })
      .click();
    await dialog(p)
      .getByText("Não há licenças disponíveis.", { exact: true })
      .waitFor();
    await close(p);
    await tab(p, "Conclusões e evidências");
    await p
      .getByRole("button", { name: "Revisar conclusão", exact: true })
      .first()
      .click();
    await dialog(p)
      .getByLabel("Parecer da conclusão Academy", { exact: true })
      .fill("Evidência fictícia conferida e aprovada.");
    await dialog(p)
      .getByRole("button", { name: /Validar conclusão/ })
      .click();
    await close(p);
    await tab(p, "Agenda de Treinamentos");
    await p
      .getByLabel("Período da agenda", { exact: true })
      .selectOption("Realizados e histórico");
    await p
      .getByRole("button", { name: /Encontro realizado: padrões de entrega/ })
      .click();
    await dialog(p)
      .getByLabel("Presença: Luana Teste", { exact: true })
      .check();
    await dialog(p)
      .getByRole("button", {
        name: "Encerrar registro de participação",
        exact: true,
      })
      .click();
    await dialog(p)
      .getByRole("button", { name: "Usar gravação demonstrativa", exact: true })
      .click();
    await dialog(p)
      .getByRole("button", {
        name: "Preparar conteúdo permanente",
        exact: true,
      })
      .click();
    await close(p);
    await tab(p, "Gestão Academy");
    await tab(p, "Conteúdos e aprovação");
    const recording = card(p, "Encontro realizado: padrões de entrega");
    await recording.getByText("Em aprovação", { exact: true }).waitFor();
    await recording
      .getByRole("button", { name: "Aprovar e publicar", exact: true })
      .click();
    await recording.getByText(/Treinamento gravado/).waitFor();
    await recording.getByText("Publicado v2", { exact: true }).waitFor();
    // All integrations use a canonical content ID; no destination progression is changed.
    const canonical = card(p, courseTitle);
    for (const kind of ["onboarding", "pdi", "career", "performance"]) {
      await canonical
        .getByRole("button", { name: "Vincular a outro módulo", exact: true })
        .click();
      await dialog(p)
        .getByLabel("Módulo de destino Academy", { exact: true })
        .selectOption(kind);
      const select = dialog(p).getByLabel("Registro de destino Academy", {
        exact: true,
      });
      await p.waitForFunction(
        () =>
          document.querySelector('[aria-label="Registro de destino Academy"]')
            .options.length > 1,
      );
      const target = await select
        .locator("option")
        .nth(1)
        .getAttribute("value");
      await select.selectOption(target);
      await dialog(p)
        .getByLabel("Contexto da referência de aprendizagem", { exact: true })
        .fill(`Recurso fictício para ${kind}, sem efeito automático.`);
      await dialog(p)
        .getByRole("button", {
          name: "Vincular conteúdo da Academy",
          exact: true,
        })
        .click();
      await close(p);
    }
    await p.reload();
    await tab(p, "Gestão Academy");
    await shot(p, "management-after");
    const links = await p.evaluate(async () => {
      const db = await new Promise((resolve, reject) => {
        const r = indexedDB.open("youcon-demo-v1");
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      });
      return await new Promise((resolve) => {
        const tx = db.transaction("demos");
        const store = tx.objectStore("demos");
        const r = store.getAllKeys();
        r.onsuccess = () => {
          const key = r.result.find((k) => k.includes("academy-links-v1:"));
          const q = store.get(key);
          q.onsuccess = () => {
            resolve(q.result);
            db.close();
          };
        };
      });
    });
    assert.equal(links.length, 4);
    const destinations = [
      ["/onboarding-offboarding", "Onboardings", /Marina Costa/, "onboarding"],
      ["/pdi", null, /Marina Demo/, "pdi"],
      [
        "/plano-de-carreira",
        "Trilhas de Carreira",
        /Explorar cargo Assistente Fundamentos/,
        "career",
      ],
      [
        "/avaliacao-de-desempenho",
        "Desempenho Operacional",
        /Marina Demo/,
        "performance",
      ],
    ];
    for (const [route, section, button, kind] of destinations) {
      await p.goto(base + route);
      if (section) await tab(p, section);
      await p.getByRole("button", { name: button }).first().click();
      await dialog(p)
        .getByText(`Recurso fictício para ${kind}, sem efeito automático.`, {
          exact: true,
        })
        .waitFor();
      await dialog(p)
        .getByRole("link", { name: "Abrir conteúdo na Academy", exact: true })
        .waitFor();
      await close(p);
    }
    await ctx.addCookies([
      { name: "youcon-organization", value: "org-b", url: base },
    ]);
    await p.goto(base + "/youcon-academy");
    await tab(p, "Gestão Academy");
    await tab(p, "Conteúdos e aprovação");
    assert.equal(
      await p
        .getByRole("heading", {
          name: "Curso de revisão local · cópia",
          exact: true,
        })
        .count(),
      0,
    );
    await ctx.addCookies([
      { name: "youcon-organization", value: "org-a", url: base },
    ]);
    await p.goto(base + "/youcon-academy");
    await tab(p, "Gestão Academy");
    await tab(p, "Conteúdos e aprovação");
    await p
      .getByRole("heading", {
        name: "Curso de revisão local · cópia",
        exact: true,
      })
      .waitFor();
    await ctx.close();
  }
  console.log(
    "Academy scope: leadership team/proposal, PJ optional library, intern, director, tenant separation, mobile",
  );
  {
    const { ctx, page: p } = await open("leadership");
    await tab(p, "Gestão Academy");
    assert.equal(
      await p
        .getByRole("button", {
          name: "Cursos externos e licenças",
          exact: true,
        })
        .count(),
      0,
    );
    assert.equal(
      await p.getByText("Estúdio PJ Fictício", { exact: true }).count(),
      0,
    );
    await tab(p, "Meus conteúdos propostos");
    await card(p, "Oficina proposta pela liderança")
      .getByText("Em aprovação", { exact: true })
      .waitFor();
    assert.equal(
      await p
        .getByRole("button", { name: "Aprovar e publicar", exact: true })
        .count(),
      0,
    );
    await ctx.close();
  }
  for (const role of [
    "professional-pj",
    "professional-intern",
    "director",
    "leadership-pj",
  ]) {
    const { ctx, page: p } = await open(role);
    await tab(p, "Catálogo");
    if (role.endsWith("-pj")) {
      assert.equal(
        await p
          .getByRole("heading", {
            name: "Cultura YouCon: aprender e colaborar",
            exact: true,
          })
          .count(),
        0,
      );
      await tab(p, "Trilhas de Aprendizagem");
      assert.equal(
        await p
          .getByText("Colaboração e desenvolvimento contínuo", { exact: true })
          .count(),
        0,
      );
    }
    await ctx.close();
  }
  {
    const { ctx, page: p } = await open("professional");
    await p.setViewportSize({ width: 390, height: 844 });
    await p.emulateMedia({ reducedMotion: "reduce" });
    await shot(p, "mobile");
    await tab(p, "Catálogo");
    await shot(p, "mobile-catalog");
    await p
      .getByLabel("Buscar no catálogo", { exact: true })
      .fill("Projetos com clareza");
    const c = p.getByRole("button").filter({
      has: p.getByRole("heading", { name: courseTitle, exact: true }),
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
        "Learner player/video/captions/quiz, artifacts/download, evidence/reload, tracks, agenda, catalog filters; RH editor/files/publication/duplicate/archive, license capacity, evidence approval, live attendance/recording same ID/manual publication, four module references; leader/PJ/intern/director scope, mobile, keyboard and reduced motion",
    }),
  );
} catch (e) {
  await lastPage
    ?.screenshot({ path: "work/academy-review/failure.png" })
    .catch(() => {});
  throw e;
} finally {
  await browser?.close();
  next.kill("SIGTERM");
  api.closeAllConnections();
  api.close();
  log.end();
}
