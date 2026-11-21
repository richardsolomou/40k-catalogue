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

The private inventory covers 55,329 records across nine rules versions. Grouping identical source content within each category gives 6,010 distinct pieces of source content. For the current version, the queue has 6,158 records across the following categories.

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

The combined queue has 3,062 current drafts that passed automated checks, including 800 faction stratagems. Of these, 140 use native mechanic records, 2,199 come from pinned structured fields and 723 use verified rules or source evidence. The drafts cover 151 core rule sections and keyword descriptions, seven core stratagems, 105 Event Companion entries, 150 FAQ and errata entries and three mission entries. The typed renderer handles qualifying unrestricted re-rolls, per-success damage, Battle-shock state and battlefield-to-reserves transfers, aura rules with verified recipients, and targeting clauses whose actor or recipient is carried in another field. Negated phase-selection predicates are rendered when their event, actor and timing agree with the selected stratagem window. An earlier pass rewrote 27 drafts with repeated source wording from their structured fields. Reuse across versions requires matching source content for the same qualified entry. That gives 25,412 versioned drafts covering 2,676 distinct pieces of source content.

Each draft keeps the body and [bold or link spans](records.md#summaries) inline in JSON with its source and review state. The current drafts include 1,841 with bold spans and 1,877 with links. The build resolves each link to a rule or keyword record by ID in the relevant version. Drafts exist for 175 of the 267 linked destinations. The other 92 remain in the review queue. Printed uppercase keyword labels are retained where the source confirms them.

The current queue also records 391 entries held by unsupported structure, 158 incomplete drafts, 107 entries with partial facts, 36 derived names and 2,404 in the authoring queue. One native translation is held for a missing mechanical value. Shared phrases are flagged for editorial review. Publication still requires a confirmed printed source, rules version, mechanics review and a documented reuse basis under [#7](https://github.com/richardsolomou/40k-catalogue/issues/7).

### CP and Miracle dice

The player resource comparison adds 23 drafts covering 18 CP gains and five Miracle dice gains. For these effects the pinned compiler emits a constant target field, and both renderers describe the player as the recipient. Across 50 candidate fields, the checks varied all other unit references without changing the summary, then varied the amount to verify the gain clause. Three drafts were rewritten from their structured fields to avoid shared source phrasing. Five other entries remain held because the renderer reproduced the reference wording.

### Stratagems with exclusive target options

Eleven stratagem drafts now describe two mutually exclusive target options and preserve the recipients for each option. The checks cover one friendly target entry per mode, different target names and matching effect steps that differ only in their recipient. A follow-up recovered 12 of the other 21 multi-target entries, including passenger and transport pairs, ordered friendly and enemy targets, and paid alternate modes. The checks verify target counts, relationships and order, and which targets receive each effect. Nine of those entries remain held.

### Charge target eligibility

Four stratagem drafts specify that the chosen friendly unit must be one the triggering enemy selected for its charge. The checks bind the candidate and the triggering unit to that selection event in the opponent's Charge phase. A comparison that substitutes attack target selection is rejected even though both renderers phrase it the same way. Seven existing target lines now group their keyword options and state the other eligibility requirements separately. Blind Grenades and Suboptimal Facade remain held for target grouping and a regional ownership condition.

A follow-up verifies four of 13 held stratagems by checking the target identity, eligibility conditions and timing. All four retain their 1 CP cost. The other nine have structural gaps or source mismatches.

### Effect recipients

The recipient audit examined 70 entries where the effect recipient was the sole reported hold. Fifty-one passed for the current version, with 451 added drafts across all nine versions. The comparison checks whether the compiler fixes the recipient for an effect or copies it from the same side that the summary names. Tests distinguish alternate recipients, ownership, phase and duration even when the two renderers produce the same words.

Nineteen stay held for source mismatches, ambiguous recipients, missing selectors or other mechanics that the typed fields leave open. Four of these need a shared trigger restriction, a shooting replacement, a conditional payment or a move-scoped embark restriction represented. Eight summaries were rewritten from verified mechanics. Six Fire Overwatch restrictions link to the core rule.

Four further drafts preserve optional effect branches and attack-type qualifiers that the pinned renderer does not distinguish. Three rows remain held because the source separates effects with different conditions, assigns re-rolls to a specific model, or requires an eligibility selector missing from the typed data.

The nested-effect review verifies Pain Adept's recipient on success and links Command Phase and Power From Pain by ID. Six other rows need a corrected unit recipient, survival condition or eligibility binding. The available Codex preview supports some Power From Pain mechanics in its own revision. The October rules still need evidence for token gains, spending restrictions and timing for attached units.

Six drafts pass after checking disagreements between the renderer ports against the pinned mechanics. The review verifies leading-unit keywords, named-weapon triggers and the Firing Deck weapon restriction. Protector of the Paths remains held because the typed modifiers omit the unmodified Hit Roll condition. Spore-laced Shock Waves links Afflicted to Nurgle’s Gift in all nine versions. The current Codex rule is needed to establish the aura’s range, which units take its modifiers and any eligibility limits. The dated army-rule candidate and the provisional detachment alias share a fingerprint, so that match alone cannot establish the army-rule binding.

The stratagem identity review verifies Scouting Outriders and Move Out against the dated source, including their CP, recipients and placement conditions. Scramble Field remains held on reinforcement scope. The Realm of Chaos lacks complete target and return bindings. Adaptive Strategy still needs a matching source identity and support for its exclusivity flag.

### Keyword casing, target selectors and duration

Exact casing and bold checks recover 21 stratagem drafts. Two additional repairs remain held because the typed records lack a distance. Five stratagem selectors pass exact checks for event history and eligibility. The follow-up recipient pass adds 11 drafts where pinned witnesses account for all held recipient fields.

Thirteen designation drafts pass after confirming that the designation's duration and the enclosing duration are identical. Eleven of these need original wording. Two visibility actors and one keyword casing case remain held.

### Identical ability bodies and numeric checks

Thirty-three unit ability records reuse a summary after the pinned card bodies matched across all nine versions. The comparison checks the entire body, mechanical values, casing, and whether the same link destinations apply. Source differences, wording overlap and link scope leave 17 candidates held.

The numeric checks recovered 36 drafts whose distances, dice counts or modifiers were already present in typed fields. Each check ties the value to its mechanical role and to the specific record and source revision. Sixteen of those drafts also use original wording to avoid a repeated source phrase. Values without a verified binding remain held. The movement review checked 10 of the 24 current numeric holds. Eight need a card-specific movement maximum that the typed data omits. Two depend on the unresolved Consolidation rules.

### Designation replacement and model removal

Four designation summaries now describe the verified replacement event. Five fight-on-death summaries cover when to remove the model. The checks distinguish event timing, eligibility and recipient, and preserve the source's uppercase labels and stable links. Twelve other candidates in these effect groups remain held for source or timing mismatches.

### Core FAQ source alignment

Question-and-answer digests now bind 178 current FAQ records and 1,506 records across versions. This reduces the FAQ list to 704 distinct pieces of content from 2,033. One unanswered entry still lacks a digest.

The 84 indexed Core Rules FAQ and errata entries have no match in the pinned PDF appendix. Its five printed questions also have no matching indexed entry. The indexed records need a source for the applicable rules version before draft review.

Eight faction launch packs match 193 indexed FAQ or errata entries, including 57 question-and-answer pairs and 136 errata. Those entries have the same content digest in all nine snapshots. Their applicability to the pinned October update remains open.

The June print review produced 34 provisional question-and-answer summaries and 14 provisional errata summaries. Holds cover 23 question-and-answer entries and 122 errata. Five errata drafts verify a replacement value whose earlier printed value remains unconfirmed. The private queue attaches this review to all 193 entries and verifies summary links by record ID and digest in each version.

The September and October publisher packs establish 268 exact FAQ and errata pairs. Sixty-eight have current drafts, including 29 new summaries and 39 reverified June summaries. Four summaries were revised during integration to show the stated CP reward or both distances in an amendment. The date check applies to the current version. The older records carry identity and link evidence for review. A further 48 dated entries now have drafts. The latest pass adds 31 errata and three FAQ rulings for the current version. It preserves the roles of stated quantities, including changes to distances and CP discounts. Four candidates still need printed uppercase verification. The remaining 118 exact pairs still need summary or mechanics review.

### Verified keyword casing

Exact keyword casing and branch checks add 9 stratagem summaries. Each summary preserves the casing of the keyword in its printed role and retains its timing, cost and target restrictions.

### Datasheet-derived keyword links

The source comparison binds 26 datasheet-derived names to their rule in each pinned version. It checks the ability or weapon profile that uses the keyword, its role, and the linked rule’s identity and digest. Eighteen entries also have original summaries supported by the linked mechanics. The other eight carry their verified destination and any corroborated parameter. Another 28 names remain held, including unresolved variants.

### Event Companion variants

The separate Singles, Doubles, Teams and Dominatus publications support 105 current drafts. The latest pass adds 21 exact text matches and four near matches with independent evidence for the heading, body and event format. The replay adds 161 drafts across versions. Sixty-four older Singles placements still need earlier print evidence. Of the remaining current entries, 45 need diagram verification and 30 need source, mechanics or emphasis review.

### Publisher mission card images

Three current non-award drafts match the full published card image and the pinned mission pack. They cover the Punishment card rule, the BOOBY TRAP action and the Martial Pride twist. Their summaries link directly to the relevant core rule IDs. This evidence applies to the current pack. The Combat Patrol missions and Chapter Approved scoring awards still require their own source checks.

### Publisher faction pack matches

The published faction packs support 80 datasheet ability drafts and five enhancement drafts. The checks bind the card and its full rule body to the source page, then verify the date and content digest for each rules version. The datasheet drafts cover 59 Damaged entries and seven each for Aspect Shrine Token, Daemonic Icon and Instrument of Chaos. Where PDF extraction separates a Damaged heading from its rule, the page coordinates establish which model and wound range the paragraph belongs to.

Three Travelling Players drafts preserve the default roster limit and its explicit overrides. The same structured comparison leaves both Shock Charge entries and Synaptic Strategy held where the rule name or order of use differs.

Fourteen further Stratagem drafts preserve the printed CP, timing, target restrictions and effects. Nine short ability summaries preserve the printed keywords and link the granted ability by ID. Seven citations for the Custodes preview remain held because the published evidence postdates the preview launch.

Thirty-two further faction Stratagems match their published cards, including CP, timing, targets, effects and optional branches. The replay covers 209 versioned placements and verifies 530 rule link bindings. Eight placements in the October 10 Custodes preview need earlier print evidence. The same date check returns 19 existing preview placements to review.

A further 29 faction Stratagems passed the printed card checks. This brings the publisher-matched group to 75 completed drafts out of 86 cards. Five cards still need a publication that shows their CP cost. The other six need proof for specific effects, conditions or exceptions. The replay adds 182 drafts across versions and verifies 458 rule links. Eight later printings remain held for the October 10 Custodes preview.

A further 24 unit-ability drafts match whole printed ability blocks. The checks bind each block to the named datasheet and preserve its mechanical values and linked rules. This adds 191 drafts across nine versions. In 25 older placements, the matching print falls after the version's date.

Repeated ability bodies and independently verified mechanics support 63 more drafts. Twelve have exact publisher card matches. The other 51 bind to the pinned datasheet and await a confirmed printed citation.

### Linked core and weapon rules

The link audit uses pinned executable rules and printed sections to verify destinations against the reference version. The printed rule summaries cover round sequencing and movement. The draft JSON carries the mechanic, the original summary, and references to the supporting tests or published rule sections.

The Objectives overview now has a draft and links to Level of Control. Ten more printed sections cover core concepts, faction and wargear abilities, auras, and Aircraft rules. Three related sections remain held where extra clauses or the timing of a choice still need source verification.

The Pile-In Move draft follows the printed movement and engagement conditions. Objective eligibility differs between print and Datacards for Consolidation, and the timing of fights triggered by that move remains unclear. The Consolidation draft stays held. [Core Rules, pp. 38–42](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=38)

The published 11th-edition Core Rules resolve two conflicts between the pinned engines. Devastating Wounds resolves after normal damage and keeps the mortal wounds from a single attack on one model. Lethal Hits gives the attacker a choice to take the automatic wound. The audit also recorded the normal-damage ordering for mortal wounds. [Core Rules, pp. 24, 80 and 82](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf)

The printed-source checks also cover Remain Stationary, Advance Move, Fall-Back Move, Surge Move, Hazard Rolls, Anti, Heavy and Melta. The Surge draft covers the numbered rule, with the fly-over note above it and the illustration below it kept as separate page content. The Anti and Melta values given as examples are kept in the review evidence. [Core Rules, pp. 24, 33 and 70](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=33)

Heavy adds 1 to hit in the unit's own Shooting phase when the unit is Unengaged, it was not set up this turn, and every model moved at most 3 inches this turn. Both pinned engines use Remain Stationary as the gate. The future engine integration needs test cases for the three flags and the exact 3-inch boundary. [Core Rules, §24.16](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=82)

The combat keyword batch adds eight source-matched abilities. Scout Move and Indirect Shooting have their own drafts, with the rules that refer to them linked by ID. Deep Strike and Infiltrators preserve the strict horizontal distance beyond 8 inches. One Shot retains a spent use on a returning model and gives newly added units their own uses. Psychic permits choosing which applicable characteristic and hit-roll modifiers to ignore. [Core Rules, pp. 35 and 79–85](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=80)

The reference description under both Pistol and Close-quarters matches the Close-quarters weapon ability in section 24.07. Printed section 24.27 confirms the alias. The weapon ability and the Close-Quarters Shooting mode each have their own draft. [Core Rules, §§10.06, 24.27 and 24.28](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=83)

### Phase overviews and steps

The Moving overview and all five phase overviews pass the source checks. Each phase lists its numbered steps in order with their rule IDs. Seventeen of the 19 numbered step drafts pass the combined checks across all nine versions. The audit distinguishes mandatory Movement selection from optional Shooting and Charge selection, and records the turn player's priority for Pile-In and Consolidation. Those two steps link to the move rules that specify their 3-inch maximum. [Core Rules, pp. 30–43](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=30)

End of Command Phase resolves triggered non-mission rules before both players check which mission aspects they have achieved. The printed Battle-Shock Step calls for one roll from each eligible unit. The reference's cap on extra rolls and its override remain held. The Fight Step stays held because the first selector after a return to Fights First is unspecified. Its draft includes the published FAQ's pass conditions and the ways a pass can end the step. [Core Rules, §§08.03, 08.05, 12.04 and p. 87](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=87)

### Leadership and Battle-shock

Leadership Rolls and Battle-shock Rolls pass across all nine versions. The extra Datacards sentences identify alternate names for the same rolls. The Battle-shock summary covers the effects of failing, including Objective Control being set to a dash, Stratagem targeting and Actions. Its Command-phase recovery is tracked in the Battle-Shock Step. Dice and Profiles remain held for additional mechanics in Datacards. [Core Rules, pp. 9–10 and 30](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=9)

### Datasheets, Stratagems and Actions

The Datasheets and Wargear Options drafts pass across all nine versions. Five other datasheet entries retain source or clause holds, alongside the existing Profiles hold. The Stratagems and Actions overviews pass and resolve existing Battle-shock links. Performing Actions retains holds for slash notation, which Objective Control the eligibility test reads, what happens to an interrupted Action after Battle-shock and how the Objective Control dash enters the control total. [Core Rules, pp. 10–11 and 54–58](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=54)

### Shooting, charge and fight modes

Normal Shooting, Assault Shooting, Close-Quarters Shooting, Charge Move, Normal Fight and Overrun Fight have drafts across all nine versions. Close-Quarters Shooting records the hit penalty and the Blast restriction as separate checks for MONSTER and VEHICLE models. The Blast restriction still applies to attacks exempt from the penalty. Overrun Fight records the FAQ's requirement to meet the general Fight Step eligibility rules. Five of these modes link to the Making Attacks draft. [Core Rules, §§10.04–10.06, 11.04, 12.05–12.06 and p. 88](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=35)

### Making Attacks and weapon abilities

Making Attacks links to Select Weapons, Select Targets and Resolve Attacks. The steps have drafts with open review items. Nine reference accordions in Select Weapons and Resolve Attacks contain mechanics whose printed basis could not be confirmed. Three more repeat published material, and two still need classification. The proposed summaries leave open the scope of targeting exceptions and whether pooling identical attack dice is required. [Core Rules, pp. 16–17](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=16)

Assault, Blast and Close-quarters have separate drafts for their printed rules and their catalogue keyword IDs. The Assault draft includes the unengaged requirement from Assault Shooting. Blast counts models at Select Targets and adds one die per five models, or the specified value for Blast X. The Close-Quarters Shooting and FAQ evidence records the scope of the engagement restrictions. Close-quarters records the weapon selection limit for models outside the MONSTER and VEHICLE exceptions when using other shooting modes. [Core Rules, pp. 35, 79–80 and 88](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=79)

Shooting at Engaged Monsters and Vehicles remains held on which shooters qualify for the Hit Roll exception, how it interacts with related shooting rules and whether the additional Datacards conditions apply. [Core Rules, §17.03](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=62)

Precision makes the chosen visible CHARACTER group the current allocation group until the relevant attacks end or the group is destroyed. The allocation panel points to the next group in the declared order. Both Precision drafts remain held on which allocation group follows a destroyed override group, including when the chosen CHARACTER group was last and earlier groups still have surviving models. The numbered rule also needs a version-matched source for its mortal-wound clause. [Core Rules, §§05.03 and 24.28](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=84)

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

### Terrain categories and control

Placing Terrain covers the three setup methods and where to find a terrain area's boundary. Terrain Categories links to Exposed, Light and Dense Terrain and records that one area may contain several categories. The audit classifies the setup panel and captions as guidance and examples. The dense-terrain list puts the ceiling and floor restrictions under the entry for models that must climb. Terrain and Movement remains held for the climbing route and the raised-surface overhang test for models without bases. The p. 49 illustration shows the blocked route and the route around the wall, with no height measurement to settle the difference. [Core Rules, pp. 46–51](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=46)

The Flying Models draft limits the two-inch reduction and the movement exceptions to the move for which the active player declares that the unit takes to the skies. It links to the eligible moves and the Hover exception. Plunging Fire remains held because the three-inch test could measure the platform or the whole feature. Its separate visible-unit condition also leaves the observer unspecified. [Core Rules, pp. 71, 73 and 82](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=71)

Secured Objectives passes with the printed tie exception. The securing player keeps control on an equal level of control and loses that protection when an opponent has a higher level at the end of a phase. Level of Control still has holds for terrain-area inclusion, the reference's end-step ordering and how a dash in Objective Control enters the total. Profiles establishes that a model with the dash cannot control objectives. The facing-page diagram counts vehicles described as within and wholly within an area without identifying the measurement points. [Core Rules, pp. 52–53](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=52)

### Move conditions and Hover

Hover removes the two-inch reduction for taking to the skies. Its rule and keyword description match across all nine versions and share one summary. Normal Move records where the unit must be unengaged. Ingress Move records the placement distances, the early-round deployment restriction and the lockout until the next Charge phase. [Core Rules, pp. 33, 69 and 82](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=69)

Set Up returns the whole unit to its original position if it cannot place all its models. The side panel allows another selection later when setup was the effect of a move. Emergency Disembark supplies a separate outcome for models that cannot be placed. Moving Units and Set Up remain held over how their checklists interact and for additional reference guidance. [Core Rules, pp. 12–14 and 65](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=14)

The Strategic Reserves overview links to placement, repositioning, arrival and the Ingress move. The placement and arrival drafts retain holds over whether mandatory Aircraft count toward the points cap, how passengers arrive with a reserve Transport and additional reference clauses. [Core Rules, pp. 68–69 and 74](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=68)

### Transports and reserve arrivals

The Transports overview links to the printed rules for capacity, embarking and disembarking. The Disembarking draft identifies who resolves an Emergency Disembark and when. The Rapid Disembark panel applies the Transport's Ingress restrictions to disembarking models, including the distance from enemy units and the opposing deployment-zone restriction when it applies. Repositioned Units covers selection after a move in the same Movement phase, movement history when a unit returns in the same turn and effects that persist while the unit is off the battlefield. Both drafts pass across all nine versions. [Core Rules, pp. 64 and 68](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=64)

Rapid Disembark applies a Transport's Ingress restrictions to passengers. The printed example supports the reading that passengers arrive aboard their Transport. The arrival rule does not explicitly say so, so Disembark Move and the arrival exception stay held. Emergency Disembark Move stays held over a reference-only placement instruction. Aircraft Deployment establishes that reserve placement is mandatory, with no printed ruling on what happens if the Aircraft exceed the points cap. [Core Rules, pp. 65, 68–69 and 74](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=65)

Transport Capacity and Embarking retain holds for Datacards-only requirements and the formation-step reference. The Core Rules and Combat Patrol documents use the same section number for Dice and Declare Battle Formations respectively. Assault Disembark and Shock Disembark need their defining publication checked. [Core Rules, pp. 64–65 and 88](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=64)

### Attached units

The overview links to formation, attacks, keywords and abilities. Keywords in Attached Units records how the unit and its individual models keep track of keywords, with the printed Anti-Psyker example. Forming Attached Units corroborates the app's eligibility lists for Leader and Support. The FAQ evidence covers Starting Strength and the return of revived models. [Core Rules, pp. 66–67 and 86–88](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=66)

Forming Attached Units retains a Datacards-only separation clause. Attacking Attached Units and Abilities in Attached Units are held for the slash notation and a partly verified table cell. Muster Armies needs a printed source for its indexed overview.

### Stratagems triggered by model losses

Four drafts identify which unit lost models, which enemy caused the losses and when the attacks resolved. Protocol of the Undying Legions stays held for the Shooting and Fight trigger and the interaction between ability activation and healing. Suboptimal Facade still needs evidence that its region owner affects targeting.

### Abilities triggered by a stratagem

Seven drafts identify the unit chosen for Fire Overwatch, including two enhancements that apply to the bearer's unit. They link to the core rules entry through its source stratagem ID. Three single-model unit abilities apply their cost multiplier when a stratagem targets that model. Esoteric Explosives stays held for a model-to-unit targeting mismatch. Stalwart's Honours stays held because the evidence leaves the order issuer unclear.

The Fire Overwatch core rule and standalone card share a summary after their timing, targeting, effect and cost matched across all nine versions. Each keeps its source ID. The CP cost sits in its own JSON field.

The Using Stratagems draft covers the printed section, including selection, payment and resolution in that order. The reference adds a 0 CP floor, a limit on how long cost changes apply, a rule about when selected targets count as affected and definitions for whose Stratagems and units the effect refers to. The full record stays held while those additions lack a confirmed printed basis. [Core Rules, p. 54](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=54)

Select Targets requires each target to be visible to the model firing the weapon. For Snap Shooting, the separate unit-level visibility condition still leaves the observer unspecified. The printed Hit Rolls table treats an unmodified 6 as a Critical Hit. Whether Snap Shooting inherits that result remains held because the reference explicitly excludes Critical Hits. [Core Rules, pp. 16–18 and 57](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=57)

### Core stratagem cards

Command Re-roll, Epic Challenge, Insane Bravery, Rapid Ingress and Smokescreen have drafts for their printed entries and the standalone cards with matching timing. Six historical copies of the standalone Insane Bravery card remain held because their phase tag says Charge and their rule text specifies Command. The record keeps each source identity and separates CP from the summary. [Core Rules, pp. 55–57](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=55)

Counteroffensive has one summary for both indexed entries, with its 2 CP cost stored separately. Its link to Fights First resolves to the core rule, whose body matches the verified keyword description across all nine versions. [Core Rules, pp. 57 and 81](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=57)

Explosives, Crushing Impact and Heroic Intervention remain held for the printed slash notation. Crushing Impact also has an open cap question for wounds to the charging unit. The audit preserves the printed and reference rule numbers for Explosives and Crushing Impact. Using Stratagems establishes Heroic Intervention's 1 CP standard cost and 2 CP alternative cost. When the player commits to the option and how cost modifiers interact with it remain open. New Orders is held in both historical forms pending a printed source. [Core Rules, pp. 10–11, 39 and 54–57](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=54)

### Keyword and core rule equivalence

Seventeen section 24 rules reuse a verified keyword summary across all nine versions. Fifteen have matching printed bodies and game data. Melta differs only in a final full stop, and the Datacards text for Scouts names the Scout Move section that print points to. Each record keeps its core rule ID, printed source and review state. It preserves the keyword draft's summary and link spans. [Core Rules, pp. 79–85](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=79)

Five comparisons remain held. Feel No Pain's draft needs a wording review. Heavy and Pistol differ between sources. The Datacards core rule adds components for One Shot and Torrent. The numbered One Shot entry still needs confirmation on tracking uses for identical weapons on one model and spending them in the same selection window. Ten parameterised keyword entries also remain held because their shared body leaves out a parameter named in their heading.

Firing Deck, Leader and Support have drafts for both their core and keyword entries. Firing Deck distinguishes picking a weapon carried by an embarked model from equipping the Transport with that weapon temporarily. The shared Leader and Support panel on p. 66 supplies the mechanics for both section 24 pointers. Its attachment limits are preserved, with the FAQ on returning destroyed models tracked separately. [Core Rules, pp. 66, 81–82, 85 and 88](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=66)

The Damaged entries remain held pending a printed source. Deadly Demise differs between the printed and Datacards triggers when only some models in a unit have the ability. Super-Heavy Walker retains a hold on the scope of the printed MONSTER/VEHICLE notation. [Core Rules, pp. 80 and 85](https://assets.warhammer-community.com/eng_01-06_warhammer40k_new40k_core_rules-was6fbu1ix-hfewhmxyiy.pdf#page=80)

### Direct structure pilot

The private pilot keeps source-shaped mechanics inside a Catalogue record with its own ID, rules version, summary, links, attribution and review state. It copies the matching 40kdc ability payload, including optional structured fields, and pins the upstream version. It also copies the corresponding typed stratagem row when the match is unique. Source annotations are excluded.

The pinned schemas validate 2,659 current ability payloads and 830 linked stratagem rows. Four additional stratagems need a verified source row. Across nine versions, the pilot validates 23,674 ability payloads. An ability can have valid structure while its summary still needs authoring or review.

### Mission award candidates

The structured award renderer passes all 43 upstream scoring fixtures. The private Chapter Approved review covers 89 current award criteria. Forty-five pass the checks for scoring values, criterion concepts and timing across the pinned reference and structured data. Another 19 pass with timing taken from the pinned card. Twenty-five are held for errata, missing condition details or scoring differences. Eleven holds concern cards named in the Event Companion errata. The three rulings on page 4 are identical in v1.2 and v1.3. The private review records one verified condition each for Death Trap, Surveil the Foe and Vital Link. Their full criteria, VP, scoring windows and battle rounds still need the printed cards. [Event Companion v1.3, p. 4](https://assets.warhammer-community.com/eng_14-10_wh40k_event_companion-rdwnqprl4c-nj8oqogadv.pdf#page=4)

For 26 awards, the pinned card scores at the end of the player's Command phase in rounds 2–4 and at the end of their turn in round 5. The structured source keeps Command-phase timing through round 5. Seven of those 26 also have separate holds. Two Defend Stronghold secondary awards remain held. Datacards gives a round-five fallback that the queue represents as battle end. The structured port starts scoring in round two and records a separate first-round redraw. The printed cards are needed to settle both scoring and redraw timing.

The 64 provisional summaries retain their pin, checks and review state. The Event Companion covers layouts and amendments. The full criteria still need a version-matched check against the Mission Deck or the publisher's app before these summaries count toward coverage. [Chapter Approved Mission Deck announcement](https://www.warhammer-community.com/en-gb/articles/adciuo3f/saturday-pre-orders-new40k-rules-card-packs-and-more/)

The same package has all 25 current Chapter Approved primary card names and 18 secondary card names, with the same number of award rows on each. It has no matches for the 26 current Combat Patrol primary cards. Its terrain data credits Battlemaster for 45 layouts and King of the Colosseum for one. These are separate checks from gameplay coverage. Mission conditions, scoring, source rights and geometry still need their own comparisons.

## Reproduce the staging output

Run the [gameplay coverage CLI](../src/gameplay-coverage/cli.ts) on each source revision. For the default version, use the snapshot's root `datacards/11th/gdc` directory. For a retained version, use the directory under `editions/<rules-version>` and the revision in that version's `revision.json`.

```sh
node src/gameplay-coverage/cli.ts stage <datacards-directory> --edition 11th \
  --update <rules-version> --title "Game Datacards" --revision <revision>
```

Keep the output outside Git. Match the report to verified records by rules version and source ID, using the consuming app's mapping. Preserve older source pins for any historical version that still needs those records. Track release readiness in [issue #13](https://github.com/richardsolomou/40k-catalogue/issues/13).
