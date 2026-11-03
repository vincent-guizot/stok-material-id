import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";

if (process.env.NODE_ENV !== "test")
  throw new Error(
    "Run with NODE_ENV=test and a disposable PostgreSQL test database.",
  );
const api = spawn(process.execPath, ["e2e/server.mjs"], {
  stdio: ["ignore", "pipe", "pipe"],
  env: process.env,
});
const vite = spawn(
  process.execPath,
  ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1"],
  { stdio: ["ignore", "pipe", "pipe"] },
);
let serverLogs = "";
for (const child of [api, vite])
  for (const stream of [child.stdout, child.stderr])
    stream.on("data", (chunk) => {
      serverLogs += chunk;
    });
let browser;
try {
  async function ready(url) {
    for (let i = 0; i < 120; i++) {
      try {
        if ((await fetch(url)).ok) return;
      } catch {}
      await delay(250);
    }
    throw new Error(`Server not ready: ${url}\n${serverLogs}`);
  }
  await ready("http://127.0.0.1:5000/api/v1/health");
  await ready("http://127.0.0.1:3000");
  browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
          args: ["--no-sandbox", "--disable-dev-shm-usage"],
        }
      : {}),
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(15000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.url().includes("/api/") && response.status() >= 400)
      errors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto("http://127.0.0.1:3000/");
  await page.waitForURL("**/login");
  await page.getByPlaceholder("admin / kasir / gudang").fill("admintest");
  await page.locator("input[type=password]").fill("admin123");
  await page.getByRole("button", { name: "MASUK SEKARANG" }).click();
  await page.waitForURL("http://127.0.0.1:3000/");
  await page.getByText("Semen Gresik Test", { exact: false }).first().waitFor();
  await page.getByRole('button', { name: '+ Kg', exact: true }).click();
  await page.getByRole('button', { name: 'Lanjut ke Pembayaran (F10)' }).click();
  await page.getByPlaceholder('0', { exact: true }).fill('10000');
  const checkoutResponse = page.waitForResponse((r) => r.url().endsWith('/api/v1/transactions') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Selesaikan Transaksi (F10)' }).click();
  const sale = await checkoutResponse;
  assert.equal(sale.status(), 201);
  const invoice = (await sale.json()).data;
  assert.equal(Number(invoice.totalAmount), 1500);
  await page.getByText('Transaksi Berhasil Diselesaikan!', { exact: true }).waitFor();
  assert((await page.locator('#printable-receipt').innerText()).includes(invoice.invoiceNumber));
  console.log('PASS UI checkout, persisted total and receipt');
  for (const route of [
    "pos",
    "checkout",
    "inventory",
    "debts",
    "master",
    "suppliers",
    "reports",
    "settings",
    "help",
  ]) {
    await page.goto(`http://127.0.0.1:3000/${route}`);
    await page.waitForLoadState("networkidle");
    assert(
      !(await page.locator("body").innerText()).includes(
        "Unexpected Application Error",
      ),
      route,
    );
    console.log(`PASS route /${route}`);
  }
  await page.goto("http://127.0.0.1:3000/reports");
  await page.getByRole("heading", { name: "Laporan Keuangan" }).waitFor();
  console.log("PASS report data loaded");
  assert(!(await page.locator("body").innerText()).includes("124.580.000"));
  for (const tab of ["Penjualan", "Piutang Mandor", "Stok Barang"])
    await page.getByRole("button", { name: tab, exact: true }).click();
  console.log("PASS report tabs");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:3000/pos");
  await page.getByText("Semen Gresik Test", { exact: false }).first().waitFor();
  console.log("PASS mobile POS");
  // Trigger a real expired token request; Zustand and route guard must log out.
  await page.evaluate(() =>
    localStorage.setItem("stokmaterial_token", "expired"),
  );
  await page.goto("http://127.0.0.1:3000/settings");
  await page.waitForURL("**/login");
  assert.equal(
    await page.evaluate(() => localStorage.getItem("stokmaterial_token")),
    null,
  );
  assert.deepEqual(
    errors.filter((error) => !error.startsWith("401 ")),
    [],
  );
  console.log(
    "PASS admin login, report tabs, mobile route, session expiration; no runtime errors",
  );
} finally {
  if (browser) await browser.close();
  api.kill("SIGTERM");
  vite.kill("SIGTERM");
}
