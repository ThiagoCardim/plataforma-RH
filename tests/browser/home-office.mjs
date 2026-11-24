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
  await mkdir("work/home-office-review", { recursive: true });
  const dateSP = () =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  const shiftDay = (d, n) => {
    const x = new Date(d + "T12:00:00Z");
    x.setUTCDate(x.getUTCDate() + n);
    return x.toISOString().slice(0, 10);
  };
  const today = dateSP();
  for (const role of ["professional", "leadership", "hr", "director"]) {
    console.log("Home Office role", role);
    const ctx = await contextFor(role),
      page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("request", (r) => {
      if (new URL(r.url()).hostname.endsWith("supabase.co"))
        violations.push(r.url());
    });
    await page.goto(`${base}/home-office`);
    await page
      .getByRole("heading", { name: "Home Office", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Meu relatório de hoje", exact: true })
      .waitFor();
    const nav = page
      .locator(".desktop-sidebar")
      .getByRole("navigation", { name: "Navegação principal", exact: true });
    assert.equal(
      await nav
        .getByRole("link", { name: "Home Office", exact: true })
        .getAttribute("aria-current"),
      "page",
    );
    if (role === "professional") {
      await page
        .getByRole("button", { name: "Meu relatório de hoje", exact: true })
        .focus();
      await page.keyboard.press("Enter");
    } else
      await page
        .getByRole("button", { name: "Meu relatório de hoje", exact: true })
        .click();
    await page
      .getByLabel("Projeto Manhã 1", { exact: true })
      .fill("Projeto fictício Reviver");
    await page
      .getByLabel("Trabalho Manhã 1", { exact: true })
      .fill("Revisei o material demonstrativo da etapa inicial.");
    await page
      .getByLabel("Resultado Manhã 1", { exact: true })
      .fill("Revisão organizada para conferência da equipe.");
    await page
      .getByRole("button", { name: "Salvar rascunho", exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByText("Rascunho salvo neste navegador.", { exact: true })
      .waitFor();
    await page.keyboard.press("Escape");
    assert.equal(await page.getByRole("dialog").count(), 0);
    await page.reload();
    await page
      .getByRole("button", { name: "Meu relatório de hoje", exact: true })
      .click();
    assert.equal(
      await page.getByLabel("Projeto Manhã 1", { exact: true }).inputValue(),
      "Projeto fictício Reviver",
    );
    await page
      .getByRole("button", { name: "Enviar relatório de hoje", exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByText("Enviado e aguardando liderança", { exact: true })
      .waitFor();
    assert.equal(
      await page
        .getByRole("button", {
          name: "Conferir e encaminhar ao RH",
          exact: true,
        })
        .count(),
      0,
    );
    assert.equal(
      await page
        .getByRole("button", { name: "Validar relatório pelo RH", exact: true })
        .count(),
      0,
    );
    await page
      .getByRole("button", { name: "Ler regras aplicáveis", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Regras aplicáveis · v1", exact: true })
      .waitFor();
    await page
      .getByRole("dialog")
      .last()
      .getByRole("button", { name: "Fechar painel", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Fechar painel", exact: true })
      .click();
    await page.getByRole("button", { name: "Relatórios", exact: true }).click();
    await page
      .getByRole("button", {
        name: `Abrir relatório Marina Demo ${shiftDay(today, -7)}`,
        exact: true,
      })
      .click();
    assert.equal(
      await page
        .getByRole("button", { name: "Enviar relatório de hoje", exact: true })
        .count(),
      0,
    );
    await page
      .getByLabel("Complementação ou justificativa", { exact: true })
      .fill("Justificativa fictícia registrada posteriormente.");
    await page
      .getByRole("button", { name: "Registrar justificativa", exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByText("Não entregue no prazo", { exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Fechar painel", exact: true })
      .click();
    await page
      .getByRole("button", {
        name: `Abrir relatório Marina Demo ${shiftDay(today, -6)}`,
        exact: true,
      })
      .click();
    const original = await page
      .getByRole("dialog")
      .getByText(/Envio original de/)
      .textContent();
    await page
      .getByLabel("Complementação ou justificativa", { exact: true })
      .fill("Complementação fictícia: versão inicial concluída.");
    await page
      .getByRole("button", { name: "Enviar complementação", exact: true })
      .click();
    assert.equal(
      await page
        .getByRole("dialog")
        .getByText(/Envio original de/)
        .textContent(),
      original,
    );
    await page
      .getByRole("dialog")
      .getByText("Enviado e aguardando liderança", { exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Fechar painel", exact: true })
      .click();
    if (role === "professional") {
      assert.equal(
        await page.getByText("Felipe Engenharia", { exact: true }).count(),
        0,
      );
      assert.equal(
        await page
          .getByRole("button", { name: "Cadastrar acordo", exact: true })
          .count(),
        0,
      );
      await page.getByRole("button", { name: "Escalas", exact: true }).click();
      await page
        .getByRole("button", { name: "Sinalizar data", exact: true })
        .click();
      await page
        .getByLabel("Data da escala", { exact: true })
        .fill(shiftDay(today, 3));
      await page
        .getByLabel("Período da escala", { exact: true })
        .selectOption("Manhã");
      await page
        .getByLabel("Justificativa do combinado", { exact: true })
        .fill("Necessidade pontual demonstrativa.");
      await page
        .getByRole("button", { name: "Sinalizar data", exact: true })
        .last()
        .click();
      await page
        .getByText("Registro salvo neste navegador.", { exact: true })
        .waitFor();
      await page.getByRole("button", { name: "Regras", exact: true }).click();
      assert.equal(
        await page
          .getByRole("button", { name: "Editar regras", exact: true })
          .count(),
        0,
      );
    } else {
      if (role === "leadership") {
        assert.equal(
          await page.getByText("Felipe Engenharia", { exact: true }).count(),
          0,
        );
        await page
          .getByRole("button", {
            name: `Abrir relatório Bruno Projetos ${shiftDay(today, -1)}`,
            exact: true,
          })
          .click();
        await page
          .getByLabel("Comentário de revisão", { exact: true })
          .fill("Detalhe a versão entregue.");
        await page
          .getByRole("button", { name: "Pedir esclarecimento", exact: true })
          .click();
        await page
          .getByRole("dialog")
          .getByText("Em esclarecimento", { exact: true })
          .waitFor();
        await page
          .getByRole("button", { name: "Fechar painel", exact: true })
          .click();
        await page
          .getByRole("button", {
            name: `Abrir relatório Elisa Design ${shiftDay(today, -4)}`,
            exact: true,
          })
          .click();
        await page
          .getByRole("button", {
            name: "Conferir e encaminhar ao RH",
            exact: true,
          })
          .click();
        await page
          .getByRole("dialog")
          .getByText("Aguardando RH", { exact: true })
          .waitFor();
        await page
          .getByRole("button", { name: "Fechar painel", exact: true })
          .click();
      } else {
        await page
          .getByRole("button", {
            name: `Abrir relatório Clara Estágio ${shiftDay(today, -2)}`,
            exact: true,
          })
          .click();
        await page
          .getByLabel("Comentário de revisão", { exact: true })
          .fill("Relatório demonstrativo conferido.");
        await page
          .getByRole("button", {
            name: "Validar relatório pelo RH",
            exact: true,
          })
          .click();
        await page
          .getByRole("dialog")
          .getByText("Validado", { exact: true })
          .waitFor();
        if (role === "director")
          await page.screenshot({ path: "work/home-office-review/review.png" });
        await page
          .getByRole("button", { name: "Fechar painel", exact: true })
          .click();
        await page.getByRole("button", { name: "Regras", exact: true }).click();
        await page
          .getByRole("button", { name: "Editar regras", exact: true })
          .click();
        await page
          .getByLabel("Texto das regras", { exact: true })
          .fill(
            "Regras fictícias atualizadas para novos combinados. Prazo da demonstração: envio no mesmo dia até 23h59 de Brasília.",
          );
        await page
          .getByRole("button", { name: "Publicar nova versão", exact: true })
          .click();
        await page.getByText("Regras v3", { exact: true }).waitFor();
        if (role === "director")
          await page.screenshot({ path: "work/home-office-review/rules.png" });
        await page
          .getByRole("button", { name: "Escalas", exact: true })
          .click();
        await page
          .getByRole("button", { name: "Cadastrar acordo", exact: true })
          .click();
        await page
          .getByLabel("Profissional da escala", { exact: true })
          .selectOption("home-person-7");
        await page
          .getByLabel("Modalidade do acordo", { exact: true })
          .selectOption("Remoto permanente");
        await page
          .getByRole("button", { name: "Cadastrar acordo", exact: true })
          .last()
          .click();
        await page
          .getByText("Registro salvo neste navegador.", { exact: true })
          .waitFor();
        await page
          .getByRole("button", { name: `Selecionar dia ${today}`, exact: true })
          .click();
        await page
          .getByText("Dispensado de relatório", { exact: false })
          .first()
          .waitFor();
      }
      await page.getByRole("button", { name: "Escalas", exact: true }).click();
      await page
        .getByRole("button", {
          name: "Registrar home office combinado",
          exact: true,
        })
        .click();
      await page
        .getByLabel("Profissional da escala", { exact: true })
        .selectOption("home-person-3");
      await page
        .getByLabel("Data da escala", { exact: true })
        .fill(shiftDay(today, 5));
      await page
        .getByLabel("Período da escala", { exact: true })
        .selectOption("Tarde");
      await page
        .getByLabel("Justificativa do combinado", { exact: true })
        .fill("Combinado fictício realizado fora da plataforma.");
      await page
        .getByRole("button", { name: "Registrar combinado", exact: true })
        .click();
      await page
        .getByText("Registro salvo neste navegador.", { exact: true })
        .waitFor();
      await page
        .getByRole("button", {
          name: `Selecionar dia ${shiftDay(today, 3)}`,
          exact: true,
        })
        .click();
      await page
        .getByRole("button", { name: "Confirmar data", exact: true })
        .click();
      await page
        .getByText("Data confirmada e incluída nas obrigações de relatório.", {
          exact: true,
        })
        .waitFor();
      const future = shiftDay(today, 5);
      await page
        .getByRole("button", { name: `Selecionar dia ${future}`, exact: true })
        .click();
      await page
        .locator("aside article")
        .filter({ has: page.getByText("Clara Estágio", { exact: true }) })
        .getByRole("button", { name: "Trocar / cancelar", exact: true })
        .click();
      await page
        .getByLabel("Motivo da alteração", { exact: true })
        .fill("Ajuste pontual fictício da escala.");
      await page
        .getByRole("checkbox", { name: "Trocar por outra data", exact: true })
        .check();
      await page
        .getByLabel("Nova data da troca", { exact: true })
        .fill(shiftDay(today, 6));
      await page
        .getByRole("button", { name: "Confirmar troca", exact: true })
        .click();
      await page
        .getByText(
          "Ocorrência atualizada; as próximas semanas foram preservadas.",
          { exact: true },
        )
        .waitFor();
      await page.reload();
      await page
        .getByRole("heading", { name: "Home Office", exact: true })
        .waitFor();
      await page
        .getByRole("button", {
          name: `Selecionar dia ${shiftDay(today, 6)}`,
          exact: true,
        })
        .click();
      await page
        .locator("aside")
        .getByText("Clara Estágio", { exact: true })
        .waitFor();
      await page
        .getByLabel("Filtrar setor", { exact: true })
        .selectOption("Engenharia");
      assert.equal(
        await page
          .locator("aside")
          .getByText("Clara Estágio", { exact: true })
          .count(),
        0,
      );
      await page.getByLabel("Filtrar setor", { exact: true }).selectOption("");
      if (role === "director") {
        await page.getByRole("button", { name: "Hoje", exact: true }).click();
        await page.evaluate(() => {
          document.activeElement?.blur();
          window.scrollTo(0, 0);
        });
        assert.equal(
          await page.evaluate(
            () =>
              document.querySelector("main").getBoundingClientRect().left >=
              document.querySelector(".desktop-sidebar").getBoundingClientRect()
                .right,
          ),
          true,
        );
        await page.screenshot({
          path: "work/home-office-review/calendar.png",
          fullPage: false,
        });
        await page
          .getByRole("button", { name: "Relatórios", exact: true })
          .click();
        await page.screenshot({
          path: "work/home-office-review/reports.png",
          fullPage: false,
        });
        await page.setViewportSize({ width: 390, height: 900 });
        await page
          .getByRole("button", { name: "Escalas", exact: true })
          .click();
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
        );
        await page.evaluate(() => {
          document.activeElement?.blur();
          window.scrollTo(0, 0);
        });
        await page.screenshot({
          path: "work/home-office-review/mobile.png",
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
        "Home Office own submissions/drafts, reload, overdue and clarification, leader/RH reviews, rules versions, permanent agreements, pending approvals, combined days, swaps, filters, scoped views and mobile",
    }),
  );
} finally {
  await browser?.close();
  next.kill("SIGTERM");
  api.closeAllConnections();
  api.close();
  log.end();
}
