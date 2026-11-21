# Gameplay data cutover

The comparison uses the nine rules versions in the Praetorium snapshot pinned by [PR #1975](https://github.com/richardsolomou/praetorium.gg/pull/1975), with snapshot ID `9d1bbd972c311e52f7e6d2e912e08513ca55f865100957f3481110da31072466`. The released rules version is `mfm-1-6`. The other eight are retained versions.

## Staged fields and coverage

The private rehearsal preserves faction file membership, source identities, names, and the CP, phase and turn fields of stratagems. It counts rule documents, keyword entries and FAQ entries separately. The staging output contains no rules prose. It serves as a source inventory and comparison input.

| Data in `mfm-1-6` | Count |
| --- | ---: |
| Faction files | 29 |
| Faction and core inventory entries, including shared entries in multiple files | 5,553 |
| Distinct inventory IDs within each kind | 4,765 |
| Stratagem rows with CP, phase and turn present | 1,213 of 1,214 |
| Core rule document files | 6 |
| Keyword entries | 57 |
| FAQ entries | 675 |
| Matches to published pilot records | 4 |

The eight historical sources each contain 29 faction files and between 5,526 and 5,560 inventory entries. Staging all nine versions produced 49,999 inventory rows and 10,954 stratagem usage rows. These counts include entries that recur in several versions. A faction record in a historical source file can be outside the roster scope of that rules version.

The four matches use the IDs and version binding in the [Necrons audit](necrons-coverage.md). The rest still need reviewed mechanic records. Cost and timing metadata helps preserve stratagem identity and usage. Each effect still needs a verified record before this data can replace a game-rule implementation.

## Effect candidates from the existing app

A separate local run read the structured facts Praetorium already uses for combat. The current rules version used the full canonical catalogue, and the eight retired versions used their version-specific canonical catalogues. Of 33,455 rule occurrences across those catalogues, 6,324 had at least one numeric or enumerated combat effect available for review. The current version accounted for 2,055 of those candidates across 13,135 occurrences.

These are occurrences on cards, units and detachments. The count includes repeated abilities and differs from the distinct ID count above. The export kept the available effects and flagged omitted fields. Rule conditions and effect choices still need review before this data can drive gameplay.

## 40kdc-data coverage check

Version 1.5.1 contains structured effects and describes their rendered text as community-authored. The data licence permits reuse and adaptations with credit for the rights the project grants. Keep the pinned source, attribution and changes with any imported record. The upstream tools use MIT with public-deployment attribution terms, schemas use CC0, and data uses CC BY 4.0. [Package release](https://github.com/wn-mitch/40kdc-data/releases/tag/npm-v1.5.1) · [Data licence at the release](https://github.com/wn-mitch/40kdc-data/blob/0be661cbdc1de16ad4137b9e000265b2d6c6c7ad/LICENSE-DATA)

The local comparison used explicit source ID links where available. Other matches needed the same kind and normalized name in the relevant faction, unit or detachment. A candidate in the last column has one match at the `2026-10-14` dataslate tag with a structured effect.

| Inventory kind | Distinct IDs | Unique matches | Candidates at the selected tag |
| --- | ---: | ---: | ---: |
| Army rules | 43 | 24 | 17 |
| Detachment rules | 272 | 245 | 183 |
| Stratagems | 1,203 | 1,121 | 910 |
| Enhancements | 817 | 762 | 649 |
| Unit abilities | 2,365 | 1,316 | 1,150 |
| Core and weapon abilities | 54 | 42 | 0 |
| Core stratagems | 11 | 10 | 0 |
| Total | 4,765 | 3,520 | 2,909 (61.0%) |

The other 1,856 IDs include 605 unique matches at another version, 6 without a structured effect at the selected tag, 37 ambiguous matches and 1,208 unmatched IDs. The selected tag is a version filter. Check the matched rule against the relevant source update and review its conditions and effects before using it. The audit is coverage evidence for #7 and #13.

All 2,909 selected ability records pass the pinned upstream schema. The local review file keeps the trigger, scope, effect and usage fields with their attribution and review status.

An exact clause translation found no complete match in the pilot format. Adding explicit [always-on and phase-window timing](records.md#timing) gives 1,427 of 2,909 candidates exact timing from their structured source. This includes 915 passive rules, 254 uses in a phase window and 258 event-triggered rules. The other 1,482 need more timing or usage fields.

The extended format represents 141 candidates in full. It covers 60 enhancements, 20 stratagems and 61 unit abilities. [Re-rolls and weapon ability grants](records.md#weapons) account for 50 translations, including 20 stratagems that also check whether the target has been selected to shoot or fight this phase. A check that the ability's source model is leading any unit accounts for another 34. [Core ability grants](records.md#core-abilities) add 38 continuous effects, including seven Feel No Pain records.

The other 2,768 candidates still have format gaps, including compound conditions, ordered effects, target event history and effects that apply to the bearer model. The [structured import workflow](authoring.md#draft-a-proposal) preserves source revision, attribution and changes in a released record. All 141 drafts still need a confirmed rules update, printed source and mechanic review before publication under [#7](https://github.com/richardsolomou/40k-catalogue/issues/7).

### Source fingerprints

The private comparison uses 40kdc's pinned `source_digest` function against the Game Datacards content in snapshot `9d1bbd9`. It joins on the mapped card identity and uses 40kdc's section order for stratagems. The comparison hashes the rendered plain text in memory and records only the outcome. [Fingerprint contract at the upstream revision](https://github.com/wn-mitch/40kdc-data/blob/0be661cbdc1de16ad4137b9e000265b2d6c6c7ad/tools/src/source-digest.ts)

All 141 translated drafts have identical normalised source fingerprints, including all 20 stratagems. Across all 2,909 candidates, 2,659 match (91.4%), 234 differ, 13 have no comparable card body and three have more than one card fingerprint for the mapped identity. A mismatch may come from content changes or different source formats. It needs review before linking a candidate to the app's pinned rule.

A match verifies the wording represented by both pins after normalisation. The printed source citation, proof of the official rules update and review of the structured mechanic remain separate steps.

## Full summary coverage

The private inventory covers 55,329 records across nine rules versions. Grouping identical source content within each category gives 7,339 distinct entries that need a summary. For the current version, the queue has 6,158 records across the following categories.

| Category | Current records |
| --- | ---: |
| Gameplay references | 4,765 |
| Keyword descriptions | 57 |
| FAQs | 675 |
| Rulebook sections | 421 |
| Mission award criteria | 201 |
| Mission card texts | 18 |
| Mission actions | 15 |
| Mission twists | 6 |

The combined queue has 2,215 current drafts that passed automated checks, including 640 stratagems. Of these, 139 use native mechanic records, 1,999 come from pinned 40kdc structured fields, and 77 are core rule or keyword summaries backed by executable evidence or published rules. The typed renderer handles qualifying unrestricted re-rolls, per-success damage, Battle-shock state and battlefield-to-reserves transfers, aura rules with verified recipients, and targeting clauses whose actor or recipient is carried in another field. Negated phase-selection predicates are rendered when their event, actor and timing agree with the selected stratagem window. Eight drafts that repeated source wording were rewritten from their structured fields. Reuse across versions requires matching source content for the same qualified entry. That gives 19,714 versioned drafts across 2,043 distinct pieces of source content.

Each draft keeps the body and [bold or link spans](records.md#summaries) inline in JSON with its source and review state. The current drafts include 1,400 with bold spans and 1,256 with links. The build resolves each link to a rule or keyword record by ID in the relevant version. Sixty-one of the 82 linked destinations have drafts. The other twenty-one remain in the review queue. Printed uppercase keyword labels are retained where the source confirms them.

The current queue also records 556 entries held by unsupported structure, 215 incomplete drafts, 110 entries with partial facts, 54 derived names and 3,008 in the authoring queue. Two native translations are held for missing mechanical values. Shared phrases are flagged for editorial review. Publication still requires a confirmed printed source, rules version, mechanics review and a documented reuse basis under [#7](https://github.com/richardsolomou/40k-catalogue/issues/7).

### CP and Miracle dice

The player resource comparison adds 23 drafts covering 18 CP gains and five Miracle dice gains. For these effects the pinned compiler emits a constant target field, and both renderers describe the player as the recipient. Across 50 candidate fields, the checks varied all other unit references without changing the summary, then varied the amount to verify the gain clause. Three drafts were rewritten from their structured fields to avoid shared source phrasing. Five other entries remain held because the renderer reproduced the reference wording.

### Stratagems with exclusive target options

Eleven stratagem drafts now describe two mutually exclusive target options and preserve the recipients for each option. The checks cover one friendly target entry per mode, different target names and matching effect steps that differ only in their recipient. Twenty-one multi-target entries remain held, including cases with a mode-specific cost, targets selected together and relationships between targets.

### Charge target eligibility

Four stratagem drafts specify that the chosen friendly unit must be one the triggering enemy selected for its charge. The checks bind the candidate and the triggering unit to that selection event in the opponent's Charge phase. A comparison that substitutes attack target selection is rejected even though both renderers phrase it the same way. Seven existing target lines now group their keyword options and state the other eligibility requirements separately. Blind Grenades and Suboptimal Facade remain held for target grouping and a regional ownership condition.

### Linked core and weapon rules

The link audit uses pinned executable rules and printed sections to verify destinations against the reference version. The draft JSON carries the mechanic, the original summary, and references to the supporting tests or published rule sections.

The published 11th-edition Core Rules resolve two conflicts between the pinned engines. Devastating Wounds resolves after normal damage and keeps the mortal wounds from a single attack on one model. Lethal Hits gives the attacker a choice to take the automatic wound. The audit also recorded the normal-damage ordering for mortal wounds. [Core Rules, pp. 24, 80 and 82](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf)

The printed-source checks also cover Remain Stationary, Advance Move, Fall-Back Move, Surge Move, Hazard Rolls, Anti, Heavy and Melta. The Surge draft covers the numbered rule, with the fly-over note above it and the illustration below it kept as separate page content. The Anti and Melta values given as examples are kept in the review evidence. [Core Rules, pp. 24, 33 and 70](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=33)

Heavy adds 1 to hit in the unit's own Shooting phase when the unit is Unengaged, it was not set up this turn, and every model moved at most 3 inches this turn. Both pinned engines use Remain Stationary as the gate. The future engine integration needs test cases for the three flags and the exact 3-inch boundary. [Core Rules, §24.16](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=82)

The combat keyword batch adds eight source-matched abilities. Scout Move and Indirect Shooting have their own drafts, with the rules that refer to them linked by ID. Deep Strike and Infiltrators preserve the strict horizontal distance beyond 8 inches. One Shot retains a spent use on a returning model and gives newly added units their own uses. Psychic permits choosing which applicable characteristic and hit-roll modifiers to ignore. [Core Rules, pp. 35 and 79–85](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=80)

The reference description under both Pistol and Close-quarters matches the Close-quarters weapon ability in section 24.07. Printed section 24.27 confirms the alias. The weapon ability and the Close-Quarters Shooting mode each have their own draft. [Core Rules, §§10.06, 24.27 and 24.28](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=83)

### Phase overviews and steps

The Moving overview and all five phase overviews pass the source checks. Each phase lists its numbered steps in order with their rule IDs. Seventeen of the 19 numbered step drafts pass the combined checks across all nine versions. The audit distinguishes mandatory Movement selection from optional Shooting and Charge selection, and records the turn player's priority for Pile-In and Consolidation. Those two steps link to the move rules that specify their 3-inch maximum. [Core Rules, pp. 30–43](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=30)

End of Command Phase resolves triggered non-mission rules before both players check which mission aspects they have achieved. The Battle-Shock Step stays held because the reference includes a one-roll cap whose printed source is unconfirmed. The Fight Step stays held because the first selector after a return to Fights First is unspecified. Its draft includes the published FAQ's pass conditions and the ways a pass can end the step. [Core Rules, §§08.03, 08.05, 12.04 and p. 87](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=87)

### Shooting, charge and fight modes

Normal Shooting, Assault Shooting, Close-Quarters Shooting, Charge Move, Normal Fight and Overrun Fight have drafts across all nine versions. Close-Quarters Shooting records the hit penalty and the Blast restriction as separate checks for MONSTER and VEHICLE models. The Blast restriction still applies to attacks exempt from the penalty. Overrun Fight records the FAQ's requirement to meet the general Fight Step eligibility rules. Five of these modes link to the Making Attacks draft. [Core Rules, §§10.04–10.06, 11.04, 12.05–12.06 and p. 88](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=35)

### Making Attacks and weapon abilities

Making Attacks links to Select Weapons, Select Targets and Resolve Attacks. The steps have drafts with open review items. Nine reference accordions in Select Weapons and Resolve Attacks contain mechanics whose printed basis could not be confirmed. Three more repeat published material, and two still need classification. The proposed summaries leave open the scope of targeting exceptions and whether pooling identical attack dice is required. [Core Rules, pp. 16–17](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=16)

Assault, Blast and Close-quarters have separate drafts for their printed rules and their catalogue keyword IDs. The Assault draft includes the unengaged requirement from Assault Shooting. Blast counts models at Select Targets and adds one die per five models, or the specified value for Blast X. The Close-Quarters Shooting and FAQ evidence records the scope of the engagement restrictions. Close-quarters records the weapon selection limit for models outside the MONSTER and VEHICLE exceptions when using other shooting modes. [Core Rules, pp. 35, 79–80 and 88](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=79)

Precision makes the chosen visible CHARACTER group the current allocation group until the relevant attacks end or the group is destroyed. The allocation panel points to the next group in the declared order. Both Precision drafts remain held for the case where the chosen CHARACTER group was last and earlier groups still have surviving models. [Core Rules, §§05.03 and 24.28](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=84)

### Attack sequence and allocation

Attack Sequence links to Hit Rolls, Wound Rolls, Save Rolls and Inflict Damage. The overview and the Hit and Wound Rolls drafts pass across all nine versions. The Wound Rolls check pairs each printed Strength and Toughness comparison with its own threshold, including both boundaries. The dice-face and threshold glyphs were read from the printed tables and checked against the pinned reference digits. [Core Rules, p. 18](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=18)

The opposing player declares allocation order. The draft records the priority for wounded non-CHARACTER groups and the order constraints for CHARACTER groups. Save Rolls remains held for the final-group Precision case. Inflict Damage remains held for the invulnerable-save comparison and additional reference passages. The reference adds sequencing to Active Player and an attack-order choice to Save Rolls. Both need a confirmed printed basis. Inflict Damage also has reference-only clauses for ignored wounds and removal timing. [Core Rules, pp. 8, 14 and 19](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=19)

### Engagement and visibility

The Engagement draft records the horizontal and vertical distances, the base measurement rule and which models and units become engaged. Its reference's 9-inch passage comes from the Coherency illustration. Shooting, charge and fight drafts link to Engagement by ID. The linked Frame rule supplies the measurement point for FRAME models. Measuring Distances remains held for additional reference definitions, including wholly within. [Core Rules, pp. 9, 14–15 and 62](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=14)

The Visibility draft records the line-of-sight test and the distinctions between visible and fully visible models and units. It remains held because the reference adds a default observer for cases where a rule leaves the observer unspecified. The audit found no counterpart for that clause in the printed rules or FAQ, including under Snap Shooting and Plunging Fire. [Core Rules, pp. 24–25](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=24)

### Coherency and cover

Coherency records the two distance tests for each model, the End of Turn removal procedure and the FAQ for models added during a phase. The mission-scoring consequence of removals remains open. [Core Rules, pp. 14–15 and 88](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=14)

The Terrain And Visibility draft links to its four rules. Benefit of Cover records the conditions each target model must satisfy and the one-step worsening of the attack's BS. Hit Rolls resolves an unmodified 6 as a critical hit before checking BS. The audit still has no printed rule for the characteristic once it exceeds the die's range. [Core Rules, pp. 50–51](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=50)

### Frame, Obscuring and terrain objectives

Frame measures to the closest point on the model itself, including for models with a base. Its rotation clause applies to FRAME models without a base. Obscuring disregards an area when either model is within it. The reference's 15-inch value comes from the Hidden diagram and is kept with the example evidence. [Core Rules, pp. 50–51 and 62](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=50)

The Terrain Objectives draft links the terrain-area rule and Level of Control. The FAQ supplies the 40 mm marker, the horizontal and vertical measurement limits and permission to finish a move on the marker. Hidden and Solid stay held for reference-only additions and unresolved detection and height boundaries. [Core Rules, pp. 50–52 and 88](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=88)

### Direct structure pilot

The private pilot keeps source-shaped mechanics inside a Catalogue record with its own ID, rules version, summary, links, attribution and review state. It copies the matching 40kdc ability payload, including optional structured fields, and pins the upstream version. It also copies the corresponding typed stratagem row when the match is unique. Source annotations are excluded.

The pinned schemas validate 2,659 current ability payloads and 830 linked stratagem rows. Four additional stratagems need a verified source row. Across nine versions, the pilot validates 23,674 ability payloads. An ability can have valid structure while its summary still needs authoring or review.

### Mission award candidates

The structured award renderer passes all 43 upstream scoring fixtures. The private Chapter Approved review covers 89 current award criteria. Forty-five pass the checks for scoring values, criterion concepts and timing across the pinned reference and structured data. Another 19 pass with timing taken from the pinned card. Twenty-five are held for errata, missing condition details or scoring differences. Eleven holds concern cards named in the Event Companion errata. [Event Companion v1.2](https://assets.warhammer-community.com/eng_wh40k_event_companion-pl87i44rzn-a7ieny8i9x.pdf)

For 26 awards, the pinned card scores at the end of the player's Command phase in rounds 2–4 and at the end of their turn in round 5. The structured source keeps Command-phase timing through round 5. Seven of those 26 also have separate holds. Two Defend Stronghold awards have a different round range and fallback in the pinned card.

The 64 provisional summaries retain their pin, checks and review state. The Event Companion covers layouts and amendments. The full criteria still need a version-matched check against the Mission Deck or the publisher's app before these summaries count toward coverage. [Chapter Approved Mission Deck announcement](https://www.warhammer-community.com/en-gb/articles/adciuo3f/saturday-pre-orders-new40k-rules-card-packs-and-more/)

The same package has all 25 current Chapter Approved primary card names and 18 secondary card names, with the same number of award rows on each. It has no matches for the 26 current Combat Patrol primary cards. Its terrain data credits Battlemaster for 45 layouts and King of the Colosseum for one. These are separate checks from gameplay coverage. Mission conditions, scoring, source rights and geometry still need their own comparisons.

## Reproduce the staging output

Run the [gameplay coverage CLI](../src/gameplay-coverage/cli.ts) on each source revision. For the default version, use the snapshot's root `datacards/11th/gdc` directory. For a retained version, use the directory under `editions/<rules-version>` and the revision in that version's `revision.json`.

```sh
node src/gameplay-coverage/cli.ts stage <datacards-directory> --edition 11th \
  --update <rules-version> --title "Game Datacards" --revision <revision>
```

Keep the output outside Git. Match the report to verified records by rules version and source ID, using the consuming app's mapping. Preserve older source pins for any historical version that still needs those records. Track release readiness in [issue #13](https://github.com/richardsolomou/40k-catalogue/issues/13).
