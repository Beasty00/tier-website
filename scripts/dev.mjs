import { spawn } from "node:child_process";
import path from "node:path";

const isWindows = process.platform === "win32";
const bin = (name) => path.join(process.cwd(), "node_modules", ".bin", isWindows ? `${name}.cmd` : name);

const processes = [
  { name: "web", command: bin("next"), args: ["dev"], keepAliveExitZero: false },
  { name: "api", command: bin("tsx"), args: ["watch", "server/index.ts"], keepAliveExitZero: false }
];

const children = new Map();
let shuttingDown = false;

function prefix(name, chunk, stream) {
  const lines = chunk.toString().split(/\r?\n/).filter(Boolean);
  for (const line of lines) {
    stream.write(`[${name}] ${line}\n`);
  }
}

function stopAll(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children.values()) {
    if (!child.killed) child.kill("SIGTERM");
  }
  setTimeout(() => process.exit(code), 250).unref();
}

for (const processConfig of processes) {
  const child = spawn(processConfig.command, processConfig.args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: ["inherit", "pipe", "pipe"],
    shell: isWindows
  });

  children.set(processConfig.name, child);
  child.stdout.on("data", (chunk) => prefix(processConfig.name, chunk, process.stdout));
  child.stderr.on("data", (chunk) => prefix(processConfig.name, chunk, process.stderr));
  child.on("exit", (code) => {
    children.delete(processConfig.name);
    if (shuttingDown) return;
    if (code === 0 && processConfig.keepAliveExitZero) {
      console.log(`[${processConfig.name}] exited cleanly`);
      return;
    }
    console.error(`[${processConfig.name}] exited with code ${code}`);
    stopAll(code || 1);
  });
}

process.on("SIGINT", () => stopAll(0));
process.on("SIGTERM", () => stopAll(0));
