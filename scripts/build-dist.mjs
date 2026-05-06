/**
 * Production build: compile Sass and copy static assets into dist/.
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");

async function rmrf(p) {
  await fs.rm(p, { recursive: true, force: true });
}

async function copyRecursive(src, dest, { skip } = {}) {
  const stat = await fs.stat(src);
  if (stat.isDirectory()) {
    await fs.mkdir(dest, { recursive: true });
    const names = await fs.readdir(src);
    for (const name of names) {
      if (skip?.(path.join(src, name), name)) continue;
      await copyRecursive(path.join(src, name), path.join(dest, name), { skip });
    }
  } else {
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(src, dest);
  }
}

function skipScss(full, name) {
  return name.endsWith(".scss") || name.endsWith(".css.map");
}

async function main() {
  const sassBin =
    process.platform === "win32"
      ? path.join(root, "node_modules", ".bin", "sass.cmd")
      : path.join(root, "node_modules", ".bin", "sass");
  const sass = spawnSync(
    sassBin,
    ["src/styles/main.scss:src/styles/main.css", "--style=compressed", "--no-source-map"],
    { cwd: root, stdio: "inherit" },
  );
  if (sass.status !== 0) process.exit(sass.status ?? 1);

  await rmrf(dist);
  await fs.mkdir(dist, { recursive: true });

  await fs.copyFile(path.join(root, "index.html"), path.join(dist, "index.html"));
  await copyRecursive(path.join(root, "assets"), path.join(dist, "assets"));
  await copyRecursive(path.join(root, "src"), path.join(dist, "src"), {
    skip: (full, name) => skipScss(full, name),
  });

  console.log("Built:", dist);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
