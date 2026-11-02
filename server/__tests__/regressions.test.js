import { readFileSync } from "node:fs";
import request from "supertest";
import app from "../src/app.js";
import { setupTestDatabase } from "./helpers/testHelper.js";
import {
  sequelize,
  Product,
  ProductUnit,
  Transaction,
  Customer,
} from "../src/models/index.js";

const spec = JSON.parse(
  readFileSync(new URL("../src/openapi.json", import.meta.url)),
);
const absentId = "00000000-0000-4000-8000-000000000099";
let data, token, cashierToken;
const send = (method, path, body, auth = token) => {
  let call = request(app)[method](`/api/v1${path}`);
  if (auth) call = call.set("Authorization", `Bearer ${auth}`);
  return body === undefined ? call : call.send(body);
};
const cart = (qty = 1) => ({
  items: [{ productId: data.product.id, unitId: data.unitKg.id, qty }],
});
beforeAll(async () => {
  data = await setupTestDatabase();
  token = (
    await send(
      "post",
      "/auth/login",
      { username: "admintest", password: "admin123" },
      null,
    )
  ).body.data.token;
  cashierToken = (
    await send(
      "post",
      "/auth/login",
      { username: "kasirtest", password: "kasir123" },
      null,
    )
  ).body.data.token;
});
afterAll(() => sequelize.close());

it("OpenAPI documents every runtime route/method and no phantom operations", () => {
  const routes = [];
  const apiRouter = app._router.stack.find(
    (layer) => layer.name === "router",
  ).handle;
  for (const layer of apiRouter.stack) {
    if (layer.route) {
      routes.push(`get ${layer.route.path}`);
      continue;
    }
    const prefix = layer.regexp.source.match(/^\^\\\/(\w+)/)[1];
    for (const child of layer.handle.stack) {
      if (!child.route) continue;
      for (const method of Object.keys(child.route.methods))
        routes.push(
          `${method} /${prefix}${child.route.path === "/" ? "" : child.route.path.replace(":id", "{id}")}`,
        );
    }
  }
  const documented = Object.entries(spec.paths).flatMap(([path, ops]) =>
    Object.keys(ops).map((method) => `${method} ${path}`),
  );
  expect(documented.sort()).toEqual(routes.sort());
});
it("Swagger UI, JSON, health, aliases, root and unknown routes respond", async () => {
  expect((await request(app).get("/api-docs/")).status).toBe(200);
  const json = await request(app).get("/api-docs.json");
  expect(json.body.openapi).toBe("3.0.3");
  expect((await request(app).get("/")).body.docs).toBe("/api-docs");
  expect((await request(app).get("/api/health")).status).toBe(200);
  expect((await request(app).get("/missing")).status).toBe(404);
});
for (const [path, operations] of Object.entries(spec.paths)) {
  for (const [method, op] of Object.entries(operations)) {
    if (!op.security?.length) continue;
    it(`${method.toUpperCase()} ${path} rejects anonymous access`, async () => {
      const response = await send(
        method,
        path.replace("{id}", absentId),
        undefined,
        null,
      );
      expect(response.status).toBe(401);
    });
  }
}
it.each(["products", "customers", "suppliers", "transactions"])(
  "%s rejects malformed IDs, missing records, and bad limits",
  async (resource) => {
    expect((await send("get", `/${resource}/invalid`)).status).toBe(400);
    expect((await send("get", `/${resource}/${absentId}`)).status).toBe(404);
  },
);
it.each([-1, "NaN", "Infinity", "2junk", null, true])(
  "stock rejects invalid qty %p without persistence",
  async (qty) => {
    const before = (await Product.findByPk(data.product.id)).currentStockBase;
    expect(
      (await send("post", "/stocks/in", { productId: data.product.id, qty }))
        .status,
    ).toBe(400);
    expect((await Product.findByPk(data.product.id)).currentStockBase).toBe(
      before,
    );
  },
);
it("stock out overdraw and foreign units are rejected atomically", async () => {
  const before = (await Product.findByPk(data.product.id)).currentStockBase;
  expect(
    (
      await send("post", "/stocks/out", {
        productId: data.product.id,
        qty: before + 1,
      })
    ).status,
  ).toBe(400);
  expect(
    (
      await send("post", "/stocks/in", {
        productId: data.product.id,
        unitId: absentId,
        qty: 1,
      })
    ).status,
  ).toBe(400);
  expect((await Product.findByPk(data.product.id)).currentStockBase).toBe(
    before,
  );
});
it("adjustment, inbound, outbound, transfer and movement history persist consistent stock", async () => {
  expect(
    (
      await send("post", "/stocks/adjust", {
        productId: data.product.id,
        actualBaseQty: 1000,
      })
    ).status,
  ).toBe(200);
  expect(
    (
      await send("post", "/stocks/in", {
        productId: data.product.id,
        unitId: data.unitSak.id,
        qty: 1,
      })
    ).status,
  ).toBe(201);
  expect(
    (await send("post", "/stocks/out", { productId: data.product.id, qty: 10 }))
      .status,
  ).toBe(201);
  expect(
    (
      await send("post", "/stocks/transfer", {
        productId: data.product.id,
        qty: 5,
        fromLocation: "A",
        toLocation: "B",
      })
    ).status,
  ).toBe(201);
  expect((await Product.findByPk(data.product.id)).currentStockBase).toBe(1040);
  expect(
    (await send("get", `/stocks/movements?productId=${data.product.id}`)).body
      .data.length,
  ).toBeGreaterThanOrEqual(4);
});
it("same product in multiple units decrements accumulated stock, not last line only", async () => {
  const before = (await Product.findByPk(data.product.id)).currentStockBase;
  const body = cart(10);
  body.items.push({
    productId: data.product.id,
    unitId: data.unitSak.id,
    qty: 2,
  });
  expect((await send("post", "/transactions", body)).status).toBe(201);
  expect((await Product.findByPk(data.product.id)).currentStockBase).toBe(
    before - 110,
  );
  const tooMuch = cart(600);
  tooMuch.items.push({
    productId: data.product.id,
    unitId: data.unitKg.id,
    qty: 600,
  });
  expect((await send("post", "/transactions", tooMuch)).status).toBe(400);
  expect((await Product.findByPk(data.product.id)).currentStockBase).toBe(
    before - 110,
  );
});
it.each([1, 99999])(
  "incorrect split payment %p cannot create a transaction or mutate stock",
  async (amount) => {
    const before = await Transaction.count();
    const stock = (await Product.findByPk(data.product.id)).currentStockBase;
    expect(
      (
        await send("post", "/transactions/checkout", {
          ...cart(),
          payments: [{ method: "CASH", amount }],
        })
      ).status,
    ).toBe(400);
    expect(await Transaction.count()).toBe(before);
    expect((await Product.findByPk(data.product.id)).currentStockBase).toBe(
      stock,
    );
  },
);
it("invalid payment, negative price, discount > subtotal and malformed limit are rejected", async () => {
  expect(
    (await send("post", "/transactions", { ...cart(), paymentMethod: "CARD" }))
      .status,
  ).toBe(400);
  expect(
    (
      await send("post", "/transactions", {
        items: [{ ...cart().items[0], unitPrice: -1 }],
      })
    ).status,
  ).toBe(400);
  expect(
    (await send("post", "/transactions", { ...cart(), discount: 999999 }))
      .status,
  ).toBe(400);
  expect((await send("get", "/transactions?limit=oops")).status).toBe(400);
});
it("debt payment updates invoice status and rejects unrelated invoice allocation", async () => {
  const invoice = await send("post", "/transactions", {
    ...cart(),
    customerId: data.customer.id,
    paymentMethod: "DEBT",
  });
  expect(invoice.status).toBe(201);
  const debtBefore = Number(
    (await Customer.findByPk(data.customer.id)).currentDebt,
  );
  expect(
    (
      await send("post", "/debts/pay", {
        customerId: data.customer.id,
        transactionId: absentId,
        amount: 1,
      })
    ).status,
  ).toBe(400);
  const paid = await send("post", "/debts/pay", {
    customerId: data.customer.id,
    transactionId: invoice.body.data.id,
    amount: 1500,
  });
  expect(paid.status).toBe(201);
  expect(Number((await Customer.findByPk(data.customer.id)).currentDebt)).toBe(
    debtBefore - 1500,
  );
  expect((await Transaction.findByPk(invoice.body.data.id)).paymentStatus).toBe(
    "PAID",
  );
});
it("admin registration, user CRUD, role guards and password change affect real login", async () => {
  expect(
    (
      await send(
        "post",
        "/auth/register",
        { name: "X", username: "evil", password: "abc123", role: "admin" },
        cashierToken,
      )
    ).status,
  ).toBe(403);
  expect(
    (await send("get", "/reports/summary", undefined, cashierToken)).status,
  ).toBe(403);
  expect(
    (await send("put", "/settings", { storeName: "X" }, cashierToken)).status,
  ).toBe(403);
  const created = await send("post", "/auth/register", {
    name: "New User",
    username: "newuser",
    password: "abc123",
    role: "cashier",
  });
  expect(created.status).toBe(201);
  const id = created.body.data.id;
  expect(
    (await send("get", "/auth/users")).body.data.some((u) => u.id === id),
  ).toBe(true);
  expect(
    (await send("get", "/auth/users")).body.data.every((u) => !u.password),
  ).toBe(true);
  expect(
    (await send("put", `/auth/users/${id}`, { name: "Edited" })).status,
  ).toBe(200);
  const login = await send(
    "post",
    "/auth/login",
    { username: "newuser", password: "abc123" },
    null,
  );
  const userToken = login.body.data.token;
  expect(
    (
      await send(
        "put",
        "/auth/password",
        { currentPassword: "wrong", newPassword: "new123" },
        userToken,
      )
    ).status,
  ).toBe(400);
  expect(
    (
      await send(
        "put",
        "/auth/password",
        { currentPassword: "abc123", newPassword: "new123" },
        userToken,
      )
    ).status,
  ).toBe(200);
  expect(
    (
      await send(
        "post",
        "/auth/login",
        { username: "newuser", password: "abc123" },
        null,
      )
    ).status,
  ).toBe(401);
  expect(
    (
      await send(
        "post",
        "/auth/login",
        { username: "newuser", password: "new123" },
        null,
      )
    ).status,
  ).toBe(200);
  expect((await send("delete", `/auth/users/${id}`)).status).toBe(200);
});
it("suppliers CRUD stays empty after deleting the last supplier", async () => {
  expect((await send("get", "/suppliers")).body.data).toEqual([]);
  const created = await send("post", "/suppliers", { name: "Supplier" });
  expect(created.status).toBe(201);
  const id = created.body.data.id;
  expect(
    (await send("put", `/suppliers/${id}`, { name: "Supplier Edited" })).status,
  ).toBe(200);
  expect((await send("get", `/suppliers/${id}`)).body.data.name).toBe(
    "Supplier Edited",
  );
  expect((await send("delete", `/suppliers/${id}`)).status).toBe(200);
  expect((await send("get", "/suppliers")).body.data).toEqual([]);
});
it("product currentStockBase alias and default base unit persist", async () => {
  const created = await send("post", "/products", {
    sku: "ALIAS-STOCK",
    name: "Alias Test",
    baseUnit: "Pcs",
    currentStockBase: 25,
  });
  expect(created.status).toBe(201);
  expect(created.body.data.currentStockBase).toBe(25);
  expect(
    await ProductUnit.count({ where: { productId: created.body.data.id } }),
  ).toBe(1);
});

it.each([{ items: {} }, { items: [{}] }, { items: [null] }])('malformed cart %p returns 400 instead of 500', async (body) => {
  expect((await send('post', '/transactions', body)).status).toBe(400);
});

it('multi-material inbound persists every line atomically and rolls back invalid units', async () => {
  const before = (await Product.findByPk(data.product.id)).currentStockBase;
  const failed = await send('post', '/stocks/in', { items: [
    { productId: data.product.id, unitId: data.unitKg.id, qty: 3 },
    { productId: data.product.id, unitId: absentId, qty: 2 },
  ] });
  expect(failed.status).toBe(400);
  expect((await Product.findByPk(data.product.id)).currentStockBase).toBe(before);
  const success = await send('post', '/stocks/in', { items: [
    { productId: data.product.id, unitId: data.unitKg.id, qty: 5 },
    { productId: data.product.id, unitId: data.unitSak.id, qty: 1 },
  ] });
  expect(success.status).toBe(201);
  expect(success.body.data.entries).toHaveLength(2);
  expect((await Product.findByPk(data.product.id)).currentStockBase).toBe(before + 55);
});
