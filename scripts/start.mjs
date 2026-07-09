import { spawn } from "node:child_process";
import path from "node:path";

const isWindows = process.platform === "win32";
const bin = (name) => path.join(process.cwd(), "node_modules", ".bin", isWindows ? `${name}.cmd` : name);
const processes = [
  { name: "web", command: bin("next"), args: ["start"] },
  { name: "api", command: bin("tsx"), args: ["server/index.ts"] }
];
const children = [];

function prefix(name, chunk, stream) {
  for (const line of chunk.toString().split(/\r?\n/).filter(Boolean)) stream.write(`[${name}] ${line}\n`);
}

function shutdown(code = 0) {
  for (const child of children) if (!child.killed) child.kill("SIGTERM");
  setTimeout(() => process.exit(code), 250).unref();
}

for (const item of processes) {
  const child = spawn(item.command, item.args, { cwd: process.cwd(), env: process.env, stdio: ["inherit", "pipe", "pipe"], shell: isWindows });
  children.push(child);
  child.stdout.on("data", (chunk) => prefix(item.name, chunk, process.stdout));
  child.stderr.on("data", (chunk) => prefix(item.name, chunk, process.stderr));
  child.on("exit", (code) => shutdown(code || 0));
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
