import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import type { Release } from "../src/catalogue-identity/identity.ts";
import { buildCatalogueRelease, type CatalogueRecord, type Manifest } from "../src/catalogue-releases/catalogue.ts";
import type { ReleaseFiles } from "../src/releases/release.ts";
import { validateSummaries } from "../src/rule-summaries/summaries.ts";

const fixtures = fileURLToPath(new URL("../fixtures/rule-summaries/", import.meta.url));
const json = (path: string): any => JSON.parse(readFileSync(join(fixtures, path), "utf8"));
const identity = (): Release => json("identity.json");
const records = (): CatalogueRecord[] => readdirSync(join(fixtures, "records")).flatMap((c) => readdirSync(join(fixtures, "records", c)).map((f) => json(`records/${c}/${f}`)));
const OATH = { kind: "ability", id: "synthetic.ember-host.smouldering-oath" };
const VOLLEY = "synthetic.ember-host.kindled-vow.ember-volley";
const ERRATA = "synthetic-codex.errata.smouldering-oath";

function errors(change: (identity: Release, records: CatalogueRecord[]) => void) {
  const [id, recs] = [identity(), records()];
  change(id, recs);
  const result = validateSummaries(id, recs);
  return result.ok ? [] : result.errors;
}
const data = (recs: CatalogueRecord[], kind: string, id: string): any => recs.find((r) => r.kind === kind && r.id === id)!.data;

function build(change: (dir: string) => void = () => {}, release = "0.1.0", previous?: ReleaseFiles): ReleaseFiles {
  const dir = mkdtempSync(join(tmpdir(), "rule-summaries-"));
  test.after(() => rmSync(dir, { recursive: true, force: true }));
  cpSync(fixtures, dir, { recursive: true });
  change(dir);
  const result = buildCatalogueRelease(dir, { release, commit: "0".repeat(40), previous });
  if (!result.ok) assert.fail(result.errors.join("\n"));
  return result.files;
}
const category = (files: ReleaseFiles, name: string) => (JSON.parse(files.get("manifest.json")!) as Manifest).categories.find((c) => c.name === name)!;

test("the synthetic summaries validate and list the FAQ that amends a rule", () => {
  const result = validateSummaries(identity(), records());
  if (!result.ok) assert.fail(result.errors.join("\n"));
  assert.deepEqual(result.summaries.amendedBy(OATH).map((faq) => faq.id), [ERRATA]);
});

test("rules reference and mission rules build as categories, with undrafted entries unresolved", () => {
  const files = build();
  assert.ok(files.has("schema/rule-summaries/summaries.v1.schema.json"));
  const rules = category(files, "rules-reference");
  const missions = category(files, "mission-rules");
  assert.deepEqual(
    [rules.status, rules.unresolved, missions.status, missions.dependsOn],
    ["partial", [{ kind: "ability", id: "synthetic.ember-host.kindled-vow.cinder-ward" }], "complete", ["rules-reference"]],
  );
});

test("a retired FAQ reports the publications that superseded it", () => {
  const sources = [{ title: "Synthetic Faction Pack: Version 1.2", page: "5" }];
  const files = build(
    (dir) => {
      const path = join(dir, "identity.json");
      const value = JSON.parse(readFileSync(path, "utf8"));
      value.revision = 2;
      value.entries.find((e: { id: string }) => e.id === ERRATA).retired = { replacedBy: [], sources };
      writeFileSync(path, JSON.stringify(value));
      rmSync(join(dir, `records/rules-reference/faq.${ERRATA}.json`));
    },
    "0.2.0",
    build(),
  );
  assert.deepEqual(category(files, "rules-reference").changes.retired, [{ kind: "faq", id: ERRATA, replacedBy: [], sources }]);
});

test("a catalogue record's attribution must be complete", () => {
  const dir = mkdtempSync(join(tmpdir(), "rule-summaries-"));
  test.after(() => rmSync(dir, { recursive: true, force: true }));
  cpSync(fixtures, dir, { recursive: true });
  const path = join(dir, `records/rules-reference/ability.${OATH.id}.json`);
  const value = JSON.parse(readFileSync(path, "utf8"));
  delete value.attribution.licence;
  writeFileSync(path, JSON.stringify(value));
  const result = buildCatalogueRelease(dir, { release: "0.1.0", commit: "0".repeat(40) });
  assert.deepEqual(result.ok ? [] : result.errors, [`records/rules-reference/ability.${OATH.id}.json: /attribution must have required property 'licence'`]);
});

test("a Stratagem needs its CP cost", () => {
  assert.deepEqual(
    errors((_, recs) => delete data(recs, "ability", VOLLEY).cp),
    [`ability:${VOLLEY} is a Stratagem with no CP cost`],
  );
});

test("only a Stratagem has a CP cost", () => {
  assert.deepEqual(
    errors((_, recs) => (data(recs, "ability", OATH.id).cp = 1)),
    [`ability:${OATH.id} is not a Stratagem but has a CP cost or Stratagem timing`],
  );
});

test("a Stratagem's Detachment is a reference of its identity entry", () => {
  assert.deepEqual(
    errors((id) => id.entries.find((e) => e.id === VOLLEY)!.references!.pop()),
    [`ability:${VOLLEY} names detachment:synthetic.ember-host.kindled-vow but its identity entry does not reference it`],
  );
});

test("a Stratagem's windows give each of its phases a turn, and differ", () => {
  const timing = (recs: CatalogueRecord[], windows: object[]) => Object.assign(data(recs, "ability", VOLLEY).stratagem, { phases: ["shooting", "fight"], turn: "any", windows });
  assert.deepEqual(errors((_, recs) => timing(recs, [{ phase: "shooting", turn: "opponent" }, { phase: "fight", turn: "any" }])), []);
  assert.deepEqual(
    errors((_, recs) => timing(recs, [{ phase: "fight", turn: "any" }, { phase: "shooting", turn: "opponent" }])),
    [`ability:${VOLLEY} Stratagem windows must give each of its phases, in order, turns that differ, with turn any`],
  );
});

test("a summary span must lie within the summary", () => {
  assert.deepEqual(
    errors((_, recs) => (data(recs, "weapon-ability", "synthetic.searing").summarySpans[0].end = 500)),
    ["weapon-ability:synthetic.searing span 0 does not lie within the summary"],
  );
});

test("summary spans must not overlap", () => {
  assert.deepEqual(
    errors((_, recs) => (data(recs, "ability", OATH.id).summarySpans[1].start = 30)),
    [`ability:${OATH.id} span 1 overlaps or precedes the span before it`],
  );
});

test("a linked rule must be a reference of the record's identity entry", () => {
  assert.deepEqual(
    errors((id) => delete id.entries.find((e) => e.id === OATH.id)!.references),
    [`ability:${OATH.id} names core-ability:synthetic.ashwalk but its identity entry does not reference it`],
  );
});

test("an FAQ must amend at least one catalogued rule", () => {
  assert.deepEqual(
    errors((_, recs) => (data(recs, "faq", ERRATA).amends = [])),
    [`faq:${ERRATA} data/amends must NOT have fewer than 1 items`],
  );
});

test("mechanic facts are checked as mechanic fields", () => {
  assert.deepEqual(
    errors((_, recs) => (data(recs, "ability", VOLLEY).facts.fields.effect.by = 0)),
    [`ability:${VOLLEY} facts/effect/by must NOT be valid`],
  );
});

const AWARD = "synthetic-pack.hold-the-pyre.each-objective";
const ENHANCEMENT = {
  format: "vs-data-facts",
  version: "1",
  fields: { enhancement: { type: "model", points: 15, eligibility: { anyOf: [{ keywords: ["INFANTRY"], factionKeywords: ["SYNTHETIC"] }], excludedKeywords: ["EPIC HERO"] } } },
};

test("typed facts are checked against the shape for the record's kind", () => {
  assert.deepEqual(
    errors((_, recs) => (data(recs, "mission-award", AWARD).facts.fields = { detail: { window: "turn-end" } })),
    [`mission-award:${AWARD} facts must have required property 'award'`],
  );
});

test("an Enhancement's eligibility is typed facts of an Enhancement only", () => {
  const asEnhancement = (recs: CatalogueRecord[], facts: object) => Object.assign(data(recs, "ability", OATH.id), { ruleType: "enhancement", facts });
  assert.deepEqual(errors((_, recs) => asEnhancement(recs, ENHANCEMENT)), []);
  assert.deepEqual(
    errors((_, recs) => (data(recs, "ability", VOLLEY).facts = ENHANCEMENT)),
    [`ability:${VOLLEY} facts must NOT have additional properties`],
  );
});

test("typed keywords are upper case", () => {
  const lower = structuredClone(ENHANCEMENT);
  lower.fields.enhancement.eligibility.anyOf[0].keywords = ["Infantry"];
  assert.deepEqual(
    errors((_, recs) => Object.assign(data(recs, "ability", OATH.id), { ruleType: "enhancement", facts: lower })),
    [`ability:${OATH.id} facts/enhancement/eligibility/anyOf/0/keywords/0 must match pattern "^[^a-z]*[A-Z0-9][^a-z]*$"`],
  );
});

test("award rounds are ascending", () => {
  assert.deepEqual(
    errors((_, recs) => (data(recs, "mission-award", AWARD).facts.fields.award.rounds = [3, 2])),
    [`mission-award:${AWARD} facts/award/rounds are not in ascending order`],
  );
});

test("typed facts name their format version", () => {
  assert.deepEqual(
    errors((_, recs) => (data(recs, "mission-award", AWARD).facts.version = "2")),
    [`mission-award:${AWARD} facts use vs-data-facts version 2, not 1`],
  );
});

const STRATAGEM = {
  format: "vs-data-facts",
  version: "1",
  fields: {
    stratagem: {
      limit: "battle",
      when: { at: "phase", after: "enemy-selected-targets" },
      target: { count: 1, side: "friendly", entity: "unit", keywords: ["INFANTRY"], conditions: ["targeted-by-the-attacking-unit"] },
    },
  },
};

test("a Stratagem's typed facts give its limit, moment and target, or say what is unresolved", () => {
  const unresolved = structuredClone(STRATAGEM);
  (unresolved.fields.stratagem as { when: object }).when = { unresolved: "event not typed" };
  assert.deepEqual(errors((_, recs) => (data(recs, "ability", VOLLEY).facts = STRATAGEM)), []);
  assert.deepEqual(errors((_, recs) => (data(recs, "ability", VOLLEY).facts = unresolved)), []);
});

test("a Stratagem's moment names a typed event", () => {
  const unknown = structuredClone(STRATAGEM);
  unknown.fields.stratagem.when.after = "enemy-sneezed";
  assert.deepEqual(
    errors((_, recs) => (data(recs, "ability", VOLLEY).facts = unknown)),
    [
      `ability:${VOLLEY} facts/stratagem/when/after must be equal to one of the allowed values`,
      `ability:${VOLLEY} facts/stratagem/when/after must match "else" schema`,
      `ability:${VOLLEY} facts/stratagem/when must match "else" schema`,
    ],
  );
});

const EFFECTS = {
  format: "vs-data-facts",
  version: "1",
  fields: {
    grants: { abilities: [{ ability: "Feel No Pain 5+", to: "unit", whileAttached: true, against: ["mortal-wounds"] }] },
    weaponAbilities: [{ ability: "LETHAL HITS", attacks: ["melee"], to: "led-unit" }],
    reminder: { timings: [{ at: "phase-start", phase: "shooting", turn: "own" }] },
    combat: {
      applies: { target: { anyOf: [["INFANTRY"]] }, leading: true },
      readings: [
        { choices: [{ conditions: [{ kind: "leading" }], effects: [{ role: "attacker", attacks: ["melee"], rolls: { hitModifier: 1 } }] }], default: 1, roles: ["attacker"] },
        { roles: ["attacker"] },
      ],
      trees: [[{ ask: { unitHas: "INFANTRY" }, yes: 1, no: 2 }, { reading: 0 }, { reading: 1 }]],
      contexts: { "own.many.known": 0, "leading.many.known": 0 },
    },
  },
};

test("an ability's effect blocks give its grants, weapon abilities, reminders and combat readings", () => {
  assert.deepEqual(errors((_, recs) => (data(recs, "ability", OATH.id).facts = EFFECTS)), []);
});

test("a combat reading's trees and contexts point at entries that exist", () => {
  const broken = structuredClone(EFFECTS);
  broken.fields.combat.trees[0]![2] = { reading: 2 } as never;
  (broken.fields.combat.contexts as Record<string, number>)["army.one.known"] = 1;
  assert.deepEqual(errors((_, recs) => (data(recs, "ability", OATH.id).facts = broken)), [
    `ability:${OATH.id} facts/combat/trees/0/2 names a reading that does not exist`,
    `ability:${OATH.id} facts/combat/contexts/army.one.known names a tree that does not exist`,
  ]);
});

test("an effect names only the fields the format lists", () => {
  const unknown = structuredClone(EFFECTS);
  (unknown.fields.combat.readings[0]!.choices![0]!.effects[0] as Record<string, unknown>).reroll = "all";
  assert.ok(errors((_, recs) => (data(recs, "ability", OATH.id).facts = unknown)).includes(`ability:${OATH.id} facts/combat/readings/0/choices/0/effects/0 must NOT have additional properties`));
});

test("rules the facts name are references of the record", () => {
  const named = { ...EFFECTS, fields: { ...EFFECTS.fields, references: [{ kind: "ability", id: VOLLEY }] } };
  assert.deepEqual(errors((_, recs) => (data(recs, "ability", OATH.id).facts = named)), [`ability:${OATH.id} facts name ability:${VOLLEY} but its identity entry does not reference it`]);
});

test("an effect block can be withheld as unresolved", () => {
  const withheld = { ...EFFECTS, fields: { ...EFFECTS.fields, combat: { unresolved: "the reading gives the effect to the wrong unit" } } };
  assert.deepEqual(errors((_, recs) => (data(recs, "ability", OATH.id).facts = withheld)), []);
});

test("an effect can be the bearer's alone, and a target only an Attached unit", () => {
  const scoped = structuredClone(EFFECTS);
  (scoped.fields.combat.readings[0]!.choices![0]!.effects[0] as Record<string, unknown>).bearerOnly = true;
  (scoped.fields.combat.applies.target as Record<string, unknown>).attached = true;
  scoped.fields.combat.readings[0]!.choices![0]!.conditions.push({ kind: "enemy-status", status: "BATTLE-SHOCKED" } as never);
  assert.deepEqual(errors((_, recs) => (data(recs, "ability", OATH.id).facts = scoped)), []);
});

test("a grant, an invulnerable save and an effect can be limited to some models or a stated condition", () => {
  const limited = structuredClone(EFFECTS);
  (limited.fields.grants.abilities[0] as Record<string, unknown>).conditional = true;
  (limited.fields as Record<string, unknown>).invulnerableSave = { roll: 4, keywords: ["CHARACTER"], conditional: true };
  (limited.fields.combat.readings[0]!.choices![0]!.effects[0] as Record<string, unknown>).modelKeywords = ["CHARACTER"];
  limited.fields.combat.readings[0]!.choices![0]!.conditions.push({ kind: "own-status", status: "EMPOWERED" } as never, { kind: "target-tougher" } as never);
  assert.deepEqual(errors((_, recs) => (data(recs, "ability", OATH.id).facts = limited)), []);
});

test("an effect can change Wounds, regain wounds, cap mortal wounds and re-roll saves", () => {
  const more = structuredClone(EFFECTS);
  Object.assign(more.fields.combat.readings[0]!.choices![0]!.effects[0] as Record<string, unknown>, {
    wounds: 1,
    regainWounds: { dice: 1, sides: 3, bonus: 0 },
    rolls: { hitModifier: 1, saveReroll: "ones", singleRerolls: ["save"] },
    mortalWounds: { timing: "outside-attacks", rolls: 3, max: 3, outcomes: [{ min: 4, max: 6, damage: { dice: 0, sides: 6, bonus: 1 } }] },
  });
  assert.deepEqual(errors((_, recs) => (data(recs, "ability", OATH.id).facts = more)), []);
});
