import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

if (process.env.RUN_DB_MIGRATIONS === "true") {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL is required when RUN_DB_MIGRATIONS=true");
  }

  await new Promise((resolvePromise, rejectPromise) => {
    const migration = spawn(process.execPath, ["scripts/migrate.mjs"], {
      stdio: "inherit",
      env: process.env,
    });
    migration.once("error", rejectPromise);
    migration.once("exit", (code) => {
      if (code === 0) resolvePromise();
      else rejectPromise(new Error(`Database migration exited with code ${code ?? "unknown"}`));
    });
  });
}

if (!existsSync(resolve(process.cwd(), "out", "index.html"))) {
  throw new Error("Static export not found (out/index.html). The image must be built with `npm run build`.");
}

const server = spawn(process.execPath, ["--import", "tsx", "src/server/server.ts"], {
  stdio: "inherit",
  env: {
    ...process.env,
    // Do not reuse the container's default HOSTNAME; it is a bind address.
    BIND_HOST: process.env.BIND_HOST || "0.0.0.0",
    PORT: process.env.PORT || "3000",
  },
});

const forwardSignal = (signal) => server.kill(signal);
process.on("SIGTERM", () => forwardSignal("SIGTERM"));
process.on("SIGINT", () => forwardSignal("SIGINT"));

server.once("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
