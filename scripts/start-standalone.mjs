import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

const serverPath = resolve(process.cwd(), ".next/standalone/server.js");
if (!existsSync(serverPath)) {
  throw new Error("Standalone build not found. Run npm run build first.");
}

const server = spawn(process.execPath, [serverPath], {
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
