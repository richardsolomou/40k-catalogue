import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, realpathSync, writeFileSync } from "node:fs";
import { isAbsolute, join, relative, sep } from "node:path";
import { packRelease, writeRelease } from "../releases/release.ts";
import { buildCatalogueRelease, readCatalogueRelease, verifyCatalogueRelease } from "./catalogue.ts";

const usage = "usage: node src/catalogue-releases/cli.ts build <input-dir> <out-dir> <release> [<previous-release-dir>] | verify <release-dir>";
const [command, ...args] = process.argv.slice(2);
const git = (...gitArgs: string[]) => execFileSync("git", gitArgs, { encoding: "utf8" }).trim();
const fail = (errors: string[]): never => {
  for (const error of errors) console.error(error);
  process.exit(1);
};

if (command === "build" && (args.length === 3 || args.length === 4)) {
  const [input, out, release, previousDir] = args;
  // The manifest names the commit, so the working tree must match it exactly.
  if (git("status", "--porcelain", "--untracked-files=all") !== "") fail(["build: commit or remove every change first"]);
  const root = realpathSync(git("rev-parse", "--show-toplevel"));
  const inputPath = relative(root, realpathSync(input));
  if (isAbsolute(inputPath) || inputPath === ".." || inputPath.startsWith(`..${sep}`)) {
    fail(["build: inputs must be in the repository named by the manifest"]);
  }
  const tracked = new Set(git("-C", root, "ls-files", "-z", "--", inputPath || ".").split("\0"));
  for (const file of readdirSync(input, { recursive: true, withFileTypes: true })) {
    const path = relative(root, join(realpathSync(file.parentPath), file.name));
    if (!file.isDirectory() && !tracked.has(path)) fail([`build: ${path} is not tracked by the release commit`]);
  }
  if (existsSync(out) || existsSync(`${out}.tar`)) fail(["build: the output directory and archive must be new"]);
  const previous = previousDir === undefined ? undefined : readCatalogueRelease(previousDir);
  if (previous && !previous.ok) fail(previous.errors.map((e) => `previous: ${e}`));
  const result = buildCatalogueRelease(input, { release, commit: git("rev-parse", "HEAD"), previous: previous?.ok ? previous.files : undefined });
  if (!result.ok) fail(result.errors);
  else {
    const archive = packRelease(result.files);
    writeRelease(out, result.files);
    writeFileSync(`${out}.tar`, archive, { flag: "wx" });
    console.log(`${out}: ${result.files.size} files, ${out}.tar`);
  }
} else if (command === "verify" && args.length === 1) {
  const errors = verifyCatalogueRelease(args[0]);
  if (errors.length > 0) fail(errors);
  console.log(`${args[0]}: verified`);
} else {
  console.error(usage);
  process.exit(2);
}
