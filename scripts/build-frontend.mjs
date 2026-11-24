import { spawnSync } from "node:child_process";
import { mkdtemp, readdir, readFile, mkdir, copyFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

function run(script, args) {
  const result = spawnSync(process.execPath, [resolve(script), ...args], {
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Build exited with status ${result.status}`);
}

async function syncOutput(source, destination) {
  await mkdir(destination, { recursive: true });
  const entries = await readdir(source, { withFileTypes: true });
  const names = new Set(entries.map((entry) => entry.name));
  for (const entry of entries) {
    const input = join(source, entry.name);
    const output = join(destination, entry.name);
    if (entry.isDirectory()) {
      await syncOutput(input, output);
    } else {
      const contents = await readFile(input);
      let existing;
      try {
        existing = await readFile(output);
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
      // Preserve timestamps for unchanged assets tracked by Cargo.
      if (!existing || !contents.equals(existing)) await copyFile(input, output);
    }
  }
  for (const entry of await readdir(destination)) {
    if (!names.has(entry)) await rm(join(destination, entry), { recursive: true, force: true });
  }
}

const staging = await mkdtemp(join(tmpdir(), "conductor-frontend-"));
try {
  run("node_modules/typescript/bin/tsc", ["--noEmit"]);
  run("node_modules/vite/bin/vite.js", ["build", "--outDir", staging, "--emptyOutDir"]);
  await syncOutput(staging, resolve("dist"));
} finally {
  await rm(staging, { recursive: true, force: true });
}
