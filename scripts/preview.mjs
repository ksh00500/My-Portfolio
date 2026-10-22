/** Explicit, disposable local preview. It never uses the user's DATABASE_URL. */
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createRequire } from "node:module";
import { cpSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createPreviewData } from "./preview-data.mjs";

const require = createRequire(import.meta.url);
const database = await PGlite.create();
await createPreviewData(database);
const server = new PGLiteSocketServer({
  db: database,
  host: "127.0.0.1",
  port: 55439,
  maxConnections: 20,
});
await server.start();
const port = process.env.PREVIEW_PORT || "3100";
const env = {
  ...process.env,
  DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:55439/postgres",
  PORTFOLIO_PREVIEW: "1",
  NEXT_TELEMETRY_DISABLED: "1",
  ADMIN_PASSWORD: randomBytes(24).toString("hex"),
  SESSION_SECRET: randomBytes(48).toString("hex"),
};
const production = process.argv.includes("--production");
const standalone = new URL("../.next/standalone/server.js", import.meta.url);
if (production) {
  if (!existsSync(standalone))
    throw new Error("Run npm run build before preview:production.");
  cpSync(
    new URL("../public", import.meta.url),
    new URL("../.next/standalone/public", import.meta.url),
    { recursive: true },
  );
  cpSync(
    new URL("../.next/static", import.meta.url),
    new URL("../.next/standalone/.next/static", import.meta.url),
    { recursive: true },
  );
}
const child = spawn(
  process.execPath,
  [
    ...(production
      ? [fileURLToPath(standalone)]
      : [
          require.resolve("next/dist/bin/next"),
          "dev",
          "--hostname",
          "127.0.0.1",
          "--port",
          port,
        ]),
  ],
  { stdio: "inherit", env: { ...env, HOSTNAME: "127.0.0.1", PORT: port } },
);
console.log(
  `Local preview: http://127.0.0.1:${port}/ko (historical fixture, NOT the production database)`,
);
let closing = false;
async function close(code = 0) {
  if (closing) return;
  closing = true;
  child.kill();
  await server.stop();
  await database.close();
  process.exit(code);
}
process.on("SIGINT", () => void close());
process.on("SIGTERM", () => void close());
child.on("exit", (code) => void close(code || 0));
