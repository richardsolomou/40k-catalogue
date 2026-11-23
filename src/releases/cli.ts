import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, realpathSync, writeFileSync } from "node:fs";
import { isAbsolute, join, relative, sep } from "node:path";
import { buildRelease, packRelease, verifyRelease, writeRelease } from "./release.ts";

const usage = "usage: node src/releases/cli.ts build <records-dir> <out-dir> <release> | verify <release-dir>";
const [command, ...args] = process.argv.slice(2);
const git = (...gitArgs: string[]) => execFileSync("git", gitArgs, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 }).trim();
const fail = (errors: string[]) => {
  for (const error of errors) console.error(error);
  process.exit(1);
};

if (command === "build" && args.length === 3) {
  const [input, out, release] = args;
  // The manifest names the commit, so the working tree must match it exactly.
  if (git("status", "--porcelain", "--untracked-files=all") !== "") fail(["build: commit or remove every change first"]);
  const root = realpathSync(git("rev-parse", "--show-toplevel"));
  const inputPath = relative(root, realpathSync(input));
  if (isAbsolute(inputPath) || inputPath === ".." || inputPath.startsWith(`..${sep}`)) {
    fail(["build: records must be in the repository named by the manifest"]);
  }
  const tracked = new Set(git("-C", root, "ls-files", "-z", "--", inputPath || ".").split("\0"));
  for (const file of readdirSync(input)) {
    if (!tracked.has(join(inputPath, file))) fail([`build: ${file} is not tracked by the release commit`]);
  }
  if (existsSync(out) || existsSync(`${out}.tar`)) fail(["build: the output directory and archive must be new"]);
  const result = buildRelease(input, { release, commit: git("rev-parse", "HEAD") });
  if (!result.ok) fail(result.errors);
  else {
    const archive = packRelease(result.files);
    writeRelease(out, result.files);
    writeFileSync(`${out}.tar`, archive, { flag: "wx" });
    console.log(`${out}: ${result.files.size} files, ${out}.tar`);
  }
} else if (command === "verify" && args.length === 1) {
  const errors = verifyRelease(args[0]);
  if (errors.length > 0) fail(errors);
  console.log(`${args[0]}: verified`);
} else {
  console.error(usage);
  process.exit(2);
}
