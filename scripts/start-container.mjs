import { spawn } from "node:child_process";

if (process.env.RUN_DB_MIGRATIONS === "true") {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL is required when RUN_DB_MIGRATIONS=true");
  }

  await new Promise((resolve, reject) => {
    const migration = spawn(process.execPath, ["scripts/migrate.mjs"], {
      stdio: "inherit",
      env: process.env,
    });
    migration.once("error", reject);
    migration.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Database migration exited with code ${code ?? "unknown"}`));
    });
  });
}

const server = spawn(process.execPath, ["server.js"], {
  stdio: "inherit",
  env: {
    ...process.env,
    // Do not reuse the container's default HOSTNAME; it is not a bind address.
    HOSTNAME: process.env.BIND_HOST || "0.0.0.0",
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
