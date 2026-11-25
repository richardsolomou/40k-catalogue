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
  const parts = { when: "Any phase, after an enemy unit selects its targets.", target: "A unit of yours.", effect: "The unit gets -1 to Wound against it." };
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
  const parts = { when: "Your Shooting phase.", target: "A unit of yours.", effect: "For the rest of the phase, the unit gets +1 to Hit." };
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

test("a Stratagem's When part may use a curly apostrophe", () => {
  assert.deepEqual(styleIssues(stratagem({ when: "Opponent’s Shooting phase, after an enemy unit has shot.", target: "A unit of yours.", effect: "The unit gets -1 to Wound against it." })), []);
});

test("a Stratagem's When part names a phase, not just any sentence with the word", () => {
  assert.deepEqual(styleIssues(stratagem({ when: "Your unit is **selected to shoot** in the Shooting phase.", target: "That unit.", effect: "The unit gets +1 to Hit." })), ["stratagem-when"]);
});

test("a Stratagem's When part says Opponent's, not your opponent's", () => {
  assert.deepEqual(styleIssues(stratagem({ when: "Your opponent's Shooting phase, as it ends.", target: "A unit of yours.", effect: "The unit gets +1 OC." })), ["stratagem-when"]);
});

test("a Stratagem's When part can be the end of a turn", () => {
  assert.deepEqual(styleIssues(stratagem({ when: "Either player's turn, as it ends.", target: "A unit of yours.", effect: "The unit gets +1 OC." })), []);
});

test("only a unit's own Damaged rule opens with its range of wounds", () => {
  assert.deepEqual(styleIssues({ ...ability("Damaged X: below X wounds, the model gets -1 to Hit.", { ruleType: "core-ability" }), id: "synthetic.core.damaged" }), []);
});

test("a Damaged rule named with its range of wounds is checked", () => {
  assert.deepEqual(styleIssues({ ...ability("This model gets -1 to Hit below 5 wounds."), id: "synthetic.ember-host.pyre-engine.damaged-1-4-wounds-remaining" }), ["damaged-opening"]);
});

test("a duration after a named part's colon is first", () => {
  assert.deepEqual(styleIssues(ability("**Ember Ward**: for the rest of the battle, this unit gets +1 to Hit.")), ["duration-first"]);
});

test("a duration after a usage limit is first", () => {
  assert.deepEqual(styleIssues(ability("Once per battle, until your next Command phase, this unit gets +1 to Hit.")), ["duration-first"]);
});

test("a duration written to the end of the phase is reported", () => {
  assert.deepEqual(styleIssues(ability("This unit gets +1 to Hit until the end of the phase.")), ["phrasing/until-the-end-of"]);
});

test("a distance in inches written as a word is reported", () => {
  assert.deepEqual(styleIssues(ability("This unit gets +1 OC while up to 6 inches from an objective marker.")), ["phrasing/inches-word"]);
});

test("a usage limit in brackets is reported", () => {
  assert.deepEqual(styleIssues(ability("(Once per battle) This unit gets +1 OC.")), ["phrasing/limit-in-brackets"]);
});

test("a summary outside the grammar is reported rather than thrown", () => {
  assert.deepEqual(styleIssues(ability("Gets _hot_.")), ["invalid-summary"]);
});

test("a Stratagem's Target part does not open with a count word", () => {
  assert.deepEqual(styleIssues(stratagem({ when: "Your Command phase.", target: "One **INFANTRY** unit of yours.", effect: "The unit gets +1 OC." })), ["stratagem-target"]);
});

test("a Stratagem's Target part writes a count above one in digits", () => {
  assert.deepEqual(styleIssues(stratagem({ when: "Your Command phase.", target: "Up to two **INFANTRY** units of yours.", effect: "The units get +1 OC." })), ["stratagem-target"]);
});
