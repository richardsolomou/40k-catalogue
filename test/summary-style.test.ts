import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { styleIssues, styleReport, type StyleRecord } from "../src/rule-summaries/style.ts";
import { stratagemSummary, type StratagemParts } from "../src/rule-summaries/summaries.ts";

const records = fileURLToPath(new URL("../fixtures/rule-summaries/records/", import.meta.url));
const fixtures = (): StyleRecord[] =>
  readdirSync(records).flatMap((c) => readdirSync(join(records, c)).map((f) => JSON.parse(readFileSync(join(records, c, f), "utf8"))));
const ability = (summary: string, data: object = {}): StyleRecord => ({ kind: "ability", id: "synthetic.ember-host.test", data: { ruleType: "unit-ability", summary, ...data } });
const stratagem = (parts: StratagemParts) => ability(stratagemSummary(parts), { ruleType: "stratagem", parts });

test("the synthetic summaries are in house style", () => {
  assert.deepEqual(styleReport(fixtures()).issues, {});
});

test("the style covers abilities and weapon abilities", () => {
  assert.equal(styleReport(fixtures()).checked, 4);
});

test("a summary the style does not cover has no issues", () => {
  assert.deepEqual(styleIssues({ kind: "core-rule", id: "synthetic.test", data: { summary: "Each time a unit may suffer." } }), []);
});

test("a Stratagem gives its parts", () => {
  assert.deepEqual(styleIssues(ability("Use it in your Command phase.", { ruleType: "stratagem" })), ["stratagem-parts"]);
});

test("a Stratagem's When part opens with whose phase it is", () => {
  const parts = { when: "When a unit is **selected to shoot**.", target: "That unit.", effect: "The unit gets +1 to Hit." };
  assert.deepEqual(styleIssues(stratagem(parts)), ["stratagem-when"]);
});

test("a Stratagem's When part can name any phase", () => {
  const parts = { when: "Any phase, after an enemy unit selects its targets.", target: "One unit of yours.", effect: "The unit gets -1 to Wound against it." };
  assert.deepEqual(styleIssues(stratagem(parts)), []);
});

test("an Enhancement opens with its bearer", () => {
  assert.deepEqual(styleIssues(ability("Limited to an **EMBER HOST** model. The bearer gets +1 OC.", { ruleType: "enhancement" })), ["enhancement-bearer"]);
});

test("a Damaged rule opens with its range of wounds", () => {
  assert.deepEqual(styleIssues({ ...ability("While down to 1-5 wounds, this model gets -1 to Hit."), id: "synthetic.ember-host.pyre-engine.damaged" }), ["damaged-opening", "phrasing/while-down-to"]);
});

test("a duration follows the effect it bounds", () => {
  assert.deepEqual(styleIssues(ability("For the rest of the phase, this unit gets +1 to Hit.")), ["duration-first"]);
});

test("a duration after a Stratagem's label is still first", () => {
  const parts = { when: "Your Shooting phase.", target: "One unit of yours.", effect: "For the rest of the phase, the unit gets +1 to Hit." };
  assert.deepEqual(styleIssues(stratagem(parts)), ["duration-first"]);
});

test("a phrasing the phrasebook replaces is reported", () => {
  assert.deepEqual(styleIssues(ability("Each time this unit attacks, it gets +1 to Hit.")), ["phrasing/each-time"]);
});

test("a game term in bold may use a replaced word", () => {
  assert.deepEqual(styleIssues(ability("Whenever this unit is **selected to shoot**, it gets +1 to Hit.")), []);
});

test("a linked name may use a replaced word", () => {
  assert.deepEqual(styleIssues(ability("This unit gets [Friendly Fire](vsdata:ability/synthetic.friendly-fire).")), []);
});

test("selected to shoot or fight is a game term without its bold", () => {
  assert.deepEqual(styleIssues(ability("Whenever this unit is selected to fight, it gets +1 to Hit.")), []);
});

test("a distance written with the inch sign the style replaces is reported", () => {
  assert.deepEqual(styleIssues(ability("This unit gets +1 OC while up to 6″ from an objective marker.")), ["phrasing/inch-sign"]);
});

test("a report lists the records breaking each rule", () => {
  const report = styleReport([ability("Each time this unit attacks, it may re-roll 1s to Hit.")]);
  assert.deepEqual(report.issues, { "phrasing/each-time": ["ability:synthetic.ember-host.test"], "phrasing/may": ["ability:synthetic.ember-host.test"] });
});
