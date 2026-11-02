const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const numericFields = [
  "qty",
  "actualBaseQty",
  "minStock",
  "initialStock",
  "currentStockBase",
  "buyPrice",
  "sellPrice",
  "unitPrice",
  "creditLimit",
  "termDays",
  "amount",
  "discount",
  "discountPercent",
  "conversionFactor",
  "level",
];
export function validate(req, res, next) {
  const fail = (message) => res.status(400).json({ success: false, message });
  for (const [key, value] of Object.entries({ ...req.params, ...req.query })) {
    if ((key === "id" || key.endsWith("Id")) && value && !uuid.test(value))
      return fail(`${key} harus UUID valid.`);
  }
  function check(object) {
    if (!object || typeof object !== "object" || Array.isArray(object))
      return "Body/item harus berupa object.";
    for (const [key, value] of Object.entries(object)) {
      if (
        (key === "id" || key.endsWith("Id")) &&
        value != null &&
        value !== "" &&
        !uuid.test(value)
      )
        return `${key} harus UUID valid.`;
      if (numericFields.includes(key) && value !== undefined) {
        if (
          value === null ||
          typeof value === "boolean" ||
          String(value).trim() === "" ||
          !Number.isFinite(Number(value)) ||
          Number(value) < 0
        )
          return `${key} harus angka non-negatif yang valid.`;
        if (
          ["qty", "conversionFactor", "level", "termDays"].includes(key) &&
          Number(value) <= 0
        )
          return `${key} harus lebih dari nol.`;
        if (key === "discountPercent" && Number(value) > 100)
          return "Diskon maksimal 100%.";
      }
      if (
        [
          "name",
          "sku",
          "baseUnit",
          "unitName",
          "username",
          "password",
        ].includes(key) &&
        (typeof value !== "string" || !value.trim())
      )
        return `${key} wajib berupa teks tidak kosong.`;
      if (["items", "units", "payments"].includes(key)) {
        if (!Array.isArray(value)) return `${key} harus array.`;
        for (const item of value) {
          const error = check(item);
          if (error) return error;
        }
      }
    }
  }
  if (
    Array.isArray(req.body?.items) &&
    req.originalUrl.includes("/transactions")
  ) {
    for (const item of req.body.items) {
      if (
        !item ||
        !uuid.test(item.productId) ||
        !uuid.test(item.unitId) ||
        item.qty === undefined
      )
        return fail(
          "Setiap item wajib memiliki productId, unitId, dan qty yang valid.",
        );
    }
  }
  const error = check(req.body || {});
  if (error) return fail(error);
  if (
    req.query.limit !== undefined &&
    (!/^\d+$/.test(req.query.limit) ||
      Number(req.query.limit) < 1 ||
      Number(req.query.limit) > 1000)
  )
    return fail("Limit harus 1–1000.");
  next();
}
