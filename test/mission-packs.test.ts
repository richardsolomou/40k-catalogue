import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import type { MissionPack } from "../src/mission-packs/pack.ts";
import { compare, type ReferenceCases } from "../src/mission-packs/compare.ts";
import { type Banked, battlefieldsFor, type Moment, primaryForDetachment, scoreCard, setupFor } from "../src/mission-packs/play.ts";
import { validatePack } from "../src/mission-packs/validate.ts";

const raw = () => JSON.parse(readFileSync(new URL("../fixtures/mission-packs/synthetic-pack.json", import.meta.url), "utf8"));

function pack(): MissionPack {
  const result = validatePack(raw());
  if (!result.ok) assert.fail(result.errors.join("\n"));
  return result.pack;
}

const card = (p: MissionPack, id: string) => [...p.primaries, ...p.secondaries].find((c) => c.id === id)!;
const none: Banked = { round: 0, battle: 0, card: 0 };
const commandEnd = (round: number): Moment => ({ at: "phase-end", round, phase: "command", turn: "own" });
const turnEnd = (round: number, turn: "own" | "opponent" = "own"): Moment => ({ at: "turn-end", round, turn });

test("unresolved parts are reported as gaps", () => {
  const result = validatePack(raw());
  assert.ok(result.ok);
  assert.deepEqual(
    result.gaps.map((g) => g.path),
    ["/primaries/1/awards/0/criterion", "/secondaries/2/whenDrawn", "/secondaries/2/awards/0/windows/0", "/twists/1/effect"],
  );
});

const broken: [string, (p: any) => void, string][] = [
  ["an unknown disposition", (p) => (p.primaries[0].pairings[0].friendly = "raiders"), `/primaries/0/pairings/0/friendly names unknown disposition "raiders"`],
  ["a repeated pairing", (p) => (p.primaries[1].pairings[0].opposition = "bulwark"), "/primaries/1/pairings/0 repeats the vanguard against bulwark pairing"],
  ["a layout outside the pairing's deployments", (p) => p.primaries[0].pairings[0].layouts.push("corner-clash-a"), `/primaries/0/pairings/0/layouts/2 "corner-clash-a" permits none of the pairing's deployments`],
  ["a layout with an unknown deployment", (p) => (p.layouts[0].deployments = ["hammer-and-anvil"]), `/layouts/0/deployments/0 names unknown deployment "hammer-and-anvil"`],
  ["an award mode the card lacks", (p) => (p.secondaries[1].awards[0].modes = ["fixed"]), `/secondaries/1/awards/0/modes names "fixed", which the card cannot be played as`],
  ["a window after the last round", (p) => (p.primaries[0].awards[0].windows[1].rounds = { from: 5 }), "/primaries/0/awards/0/windows/1/rounds is after the last battle round"],
  ["a card that redraws on itself", (p) => (p.secondaries[1].whenDrawn.ifActive = "watchful-eye"), "/secondaries/1/whenDrawn/ifActive cannot name the card itself"],
  ["a repeated deployment id", (p) => (p.deployments[1].id = "split-field"), `/deployments/1/id repeats "split-field"`],
  ["a phase-end window without a phase", (p) => delete p.primaries[0].awards[0].windows[0].phase, "/primaries/0/awards/0/windows/0 must match exactly one schema in oneOf"],
];

for (const [what, mutate, error] of broken) {
  test(`rejects ${what}`, () => {
    const value = raw();
    mutate(value);
    const result = validatePack(value);
    assert.ok(!result.ok && result.errors.includes(error), JSON.stringify(result));
  });
}

test("a disposition pairing selects its primary and battlefields", () => {
  const setup = setupFor(pack(), "vanguard", "bulwark");
  assert.deepEqual([setup?.primary.id, setup?.deployments, setup?.layouts], ["hold-the-line", ["split-field"], ["split-field-a", "open-ground"]]);
});

test("a pairing the pack does not offer has no setup", () => {
  assert.equal(setupFor(pack(), "vanguard", "raiders"), null);
});

test("a primary can be selected by its detachment ID", () => {
  const value = raw();
  value.primaries[0].pairings = [];
  value.primaries[0].detachment = "flame-wardens";
  const result = validatePack(value);
  if (!result.ok) assert.fail(result.errors.join("\n"));
  assert.equal(primaryForDetachment(result.pack, "flame-wardens")?.id, "hold-the-line");
});

test("an unmapped detachment has no assigned primary", () => {
  assert.equal(primaryForDetachment(pack(), "flame-wardens"), null);
});

test("rejects two primaries assigned to the same detachment", () => {
  const value = raw();
  for (const primary of value.primaries) primary.detachment = "flame-wardens";
  const result = validatePack(value);
  assert.deepEqual(result, { ok: false, errors: ['/primaries/1/detachment repeats "flame-wardens"'] });
});

test("a primary scores at the end of the command phase from its first scoring round", () => {
  const p = pack();
  assert.equal(scoreCard(p, card(p, "hold-the-line"), [{ award: "hold-one", times: 1 }], commandEnd(2), none).vp, 3);
});

test("a primary does not score before its first scoring round", () => {
  const p = pack();
  assert.deepEqual(scoreCard(p, card(p, "hold-the-line"), [{ award: "hold-one", times: 1 }], commandEnd(1), none).errors, ["hold-one cannot be scored at this moment"]);
});

test("in the final round the primary moves from the command phase to the end of the turn", () => {
  const p = pack();
  const hold = card(p, "hold-the-line");
  const claim = [{ award: "hold-one", times: 1 }];
  assert.deepEqual([scoreCard(p, hold, claim, commandEnd(4), none).vp, scoreCard(p, hold, claim, turnEnd(4), none).vp], [0, 3]);
});

test("a per-objective award stops at its own maximum", () => {
  const p = pack();
  assert.equal(scoreCard(p, card(p, "hold-the-line"), [{ award: "hold-each", times: 4 }], commandEnd(2), none).vp, 6);
});

test("a primary stops at the round cap", () => {
  const p = pack();
  const claims = [{ award: "hold-one", times: 1 }, { award: "hold-each", times: 3 }];
  const score = scoreCard(p, card(p, "hold-the-line"), claims, commandEnd(2), { round: 5, battle: 5, card: 5 });
  assert.deepEqual([score.vp, score.capped], [7, true]);
});

test("a primary stops at the battle cap", () => {
  const p = pack();
  assert.equal(scoreCard(p, card(p, "hold-the-line"), [{ award: "hold-each", times: 3 }], commandEnd(3), { round: 0, battle: 38, card: 38 }).vp, 2);
});

test("a fixed secondary stops at its own card cap", () => {
  const p = pack();
  const score = scoreCard(p, card(p, "scouting-sweep"), [{ award: "sweep-fixed", times: 4 }], turnEnd(3, "opponent"), { round: 0, battle: 16, card: 16 }, "fixed");
  assert.equal(score.vp, 2);
});

test("a tactical secondary ignores the fixed card cap", () => {
  const p = pack();
  const score = scoreCard(p, card(p, "scouting-sweep"), [{ award: "sweep-tactical", times: 1 }], turnEnd(3), { round: 0, battle: 16, card: 16 }, "tactical");
  assert.equal(score.vp, 4);
});

test("an award for another mode is refused", () => {
  const p = pack();
  const score = scoreCard(p, card(p, "scouting-sweep"), [{ award: "sweep-fixed", times: 1 }], turnEnd(2), none, "tactical");
  assert.deepEqual(score.errors, ["sweep-fixed does not apply when the card is played as tactical"]);
});

test("only one award in an exclusive group can be claimed", () => {
  const p = pack();
  const claims = [{ award: "eye-one", times: 1 }, { award: "eye-all", times: 1 }];
  const score = scoreCard(p, card(p, "watchful-eye"), claims, turnEnd(2, "opponent"), none, "tactical");
  assert.deepEqual([score.vp, score.errors], [2, [`eye-all shares exclusive group "eye" with another claim`]]);
});

test("an opponent's-turn award scores at the battle end when this player took the last turn", () => {
  const p = pack();
  const score = scoreCard(p, card(p, "watchful-eye"), [{ award: "eye-all", times: 1 }], { at: "battle-end", round: 4, lastTurn: "own" }, none, "tactical");
  assert.equal(score.vp, 5);
});

test("an opponent's-turn award does not score at the battle end when the opponent took the last turn", () => {
  const p = pack();
  const score = scoreCard(p, card(p, "watchful-eye"), [{ award: "eye-all", times: 1 }], { at: "battle-end", round: 4, lastTurn: "opponent" }, none, "tactical");
  assert.equal(score.vp, 0);
});

test("an unresolved window is reported as unenforced", () => {
  const p = pack();
  const score = scoreCard(p, card(p, "relic-hunt"), [{ award: "relic", times: 2 }], { at: "battle-end", round: 4, lastTurn: "own" }, none, "fixed");
  assert.deepEqual([score.vp, score.unenforced], [10, ["relic has an unresolved scoring window"]]);
});

test("an unresolved cap is reported and not enforced", () => {
  const p = pack();
  p.caps.primary = { unresolved: "the source states no primary cap" };
  const score = scoreCard(p, card(p, "hold-the-line"), [{ award: "hold-each", times: 3 }], commandEnd(2), { round: 11, battle: 39, card: 39 });
  assert.deepEqual([score.vp, score.unenforced], [6, ["primary cap"]]);
});

test("a table's battlefields suit both sides' primaries", () => {
  const p = pack();
  p.primaries[0]!.pairings[1]!.layouts = ["open-ground"];
  assert.deepEqual(battlefieldsFor(p, "vanguard", "bulwark"), [{ deployment: "split-field", layout: "open-ground" }]);
});

const cases = (): ReferenceCases => JSON.parse(readFileSync(new URL("../fixtures/mission-packs/synthetic-cases.json", import.meta.url), "utf8"));

test("reference cases that match the pack report no differences", () => {
  const differences = Object.values(compare(pack(), cases())).flatMap((s) => s.differences);
  assert.deepEqual(differences, []);
});

test("reference cases for another pack are rejected", () => {
  assert.throws(() => compare(pack(), { ...cases(), pack: "synthetic.another-pack" }), /cases name pack synthetic\.another-pack/);
});

test("a differing amount is reported without either value", () => {
  const c = cases();
  c.amounts[0]!.vp = 8;
  assert.deepEqual(compare(pack(), c).amounts.differences, ["hold-the-line/hold-each x4"]);
});
