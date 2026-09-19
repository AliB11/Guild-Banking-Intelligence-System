/**
 * Smoke test: boots the Node server (demo mode, no database) on a scratch
 * port and verifies the static pages and JSON API respond as expected.
 * Run: npm run smoke   (also part of CI after `npm run build`)
 */
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const port = Number.parseInt(process.env.SMOKE_PORT ?? "4173", 10);
const base = `http://127.0.0.1:${port}`;
const root = resolve(process.cwd());

const server = spawn(process.execPath, ["--import", "tsx", "src/server/server.ts"], {
  cwd: root,
  stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env, PORT: String(port), BIND_HOST: "127.0.0.1" },
});

let serverLog = "";
server.stdout.on("data", (chunk) => (serverLog += chunk));
server.stderr.on("data", (chunk) => (serverLog += chunk));

function fail(message) {
  console.error(`[smoke] FAIL: ${message}`);
  if (serverLog) console.error(`[smoke] server log:\n${serverLog}`);
  server.kill("SIGTERM");
  process.exit(1);
}

async function waitReady() {
  for (let attempt = 0; attempt < 40; attempt++) {
    if (server.exitCode !== null) fail(`server exited with code ${server.exitCode}`);
    try {
      const res = await fetch(`${base}/api/health`);
      if (res.ok) return res.json();
    } catch {
      // Server not up yet.
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  fail("server did not become ready in 10s");
}

async function expectStatus(path, expected, init) {
  const res = await fetch(`${base}${path}`, init);
  if (res.status !== expected) {
    const body = (await res.text()).slice(0, 200);
    fail(`${init?.method ?? "GET"} ${path} -> ${res.status} (expected ${expected}) body=${body}`);
  }
  return res;
}

async function main() {
  const health = await waitReady();
  if (!health.ok || health.mode !== "demo") {
    fail(`unexpected health payload: ${JSON.stringify(health)}`);
  }
  console.log("[smoke] health ok (demo mode)");

  const home = await expectStatus("/", 200);
  const html = await home.text();
  if (!html.includes("GBI")) fail("home page does not look like the GBI app");
  console.log("[smoke] home page ok");

  for (const path of ["/guilds/", "/leads/", "/calculator/"]) {
    await expectStatus(path, 200);
    console.log(`[smoke] ${path} ok`);
  }
  await expectStatus("/nope", 404);
  console.log("[smoke] 404 page ok");

  const dashboard = await (await expectStatus("/api/dashboard", 200)).json();
  if (!dashboard.totals || !Array.isArray(dashboard.trend)) fail("dashboard payload missing keys");
  console.log(`[smoke] dashboard ok (${dashboard.totals.merchantCount} merchants, period ${dashboard.latestPeriod})`);

  const leads = await (await expectStatus("/api/leads", 200)).json();
  if (leads.stats.total <= 0) fail("no leads returned");
  console.log(`[smoke] leads ok (${leads.stats.total} leads)`);

  const calculator = await (
    await expectStatus(
      "/api/calculator",
      200,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyTxCount: 100,
          avgBasketRials: 10_000_000,
          retentionDays: 3,
          posUnits: 1,
          cccDays: 10,
          isTaxCompliant: true,
          riskStatus: "LOW",
        }),
      },
    )
  ).json();
  if (typeof calculator.netBankMargin !== "number") fail("calculator payload missing keys");
  console.log("[smoke] calculator ok");

  const leadId = leads.leads[0].id;
  const patched = await (
    await expectStatus(`/api/leads/${leadId}`, 200, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pipeline_stage: "CONTACTED" }),
    })
  ).json();
  if (patched.lead?.pipelineStage !== "CONTACTED") fail("lead stage was not updated");
  console.log("[smoke] lead mutation ok");

  console.log("[smoke] ALL CHECKS PASSED");
  server.kill("SIGTERM");
  process.exit(0);
}

main().catch((error) => fail(String(error)));
