// Dedicated disposable test database only; never run against application data.
import app from "../../server/src/app.js";
import { setupTestDatabase } from "../../server/__tests__/helpers/testHelper.js";
await setupTestDatabase();
app.listen(5000, "127.0.0.1", () => console.log("Smoke API ready"));
