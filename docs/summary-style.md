# Summary house style

Every [rule summary](rule-summaries.md) of a faction rule follows one house style, so a player reads every Stratagem, Enhancement and ability the same way. The style follows the structure of the official app: the parts each kind of rule is made of, and the order they come in. The wording is VS Data's own. Summaries never reuse the source's sentences, and the phrasebook below gives one fixed phrasing for each idea the rules keep repeating.

The style covers `rules-reference` records of kinds `ability` and `weapon-ability`: Stratagems, Enhancements, datasheet abilities (auras, Leader abilities and Damaged rules among them), wargear abilities, Detachment rules and army rules. Core rules, FAQs and mission rules keep the [summary text](rule-summaries.md#summary-text) rules alone for now.

## Principles

- **Parts in a fixed order.** Each kind of rule is written as the parts listed under [part order](#part-order), in that order. A summary leaves out a part the rule does not have, and never adds a part the rule does not state.
- **One phrasing per idea.** Where the [phrasebook](#phrasebook) covers an idea, the summary uses its phrasing and none of the alternatives.
- **Own words.** No summary repeats a run of five words of the text it summarises outside exact game names, and none repeats ten. The phrasebook's phrasings are chosen so that the source's stock phrases never appear.
- **Names as printed.** Unit, model, weapon, ability, Stratagem, Enhancement, Detachment and keyword names are written exactly as printed. Keywords are bold capitals. A rule with a record is a link to it. A core rule term, such as a phase or **Engagement Range**, is a link to its core rule, and the link covers the whole term, including whose phase it is.
- **Plain and present.** Write in the present tense and the active voice. "You" is the player whose rule it is and "your opponent" is the other player. Use digits for numbers.
- **Groups in the plural.** A rule that applies to every unit of a group says so in the plural, such as "enemy units within range". The singular is for one unit, such as the one a trigger names.
- **Layout.** Open with a sentence. Give the parallel parts of a rule, such as options or steps, as a list after it, one per item, as [summary text](rule-summaries.md#summary-text) describes. A named part of a rule opens its own paragraph with its name in bold and a colon.

## Part order

Within a sentence, the parts come in the order the table gives. A sentence states one effect. A rule with several effects that share a trigger gives the trigger once and the effects as a list.

| Rule | Parts, in order |
| --- | --- |
| Stratagem | Four typed parts, [When, Target, Effect and Restrictions](#stratagems). |
| Enhancement | The bearer it is limited to, as its own paragraph: `Bearer:` and the model or unit, with any exclusion. Then the effect, written as a datasheet ability with "the bearer" as its subject. |
| Datasheet ability | Usage limit, timing, trigger, condition, effect, duration, exception. |
| Aura | `**Aura (6")**:`, with the aura's range, then the units in range in the plural, the effect, and any exception. |
| Leader ability | "While this model leads a unit," then the effect on that unit. |
| Damaged rule | "With 1-5 wounds left," with the model's range of wounds, then the effect. |
| Wargear ability | As a datasheet ability, with "the bearer" or "models carrying this weapon" as its subject. |
| Detachment rule | The units it applies to, then each part as a datasheet ability. Named parts follow in the order the rule prints them. |
| Army rule | The Army Faction it needs, as "With **FACTION** as your Army Faction," where the rule states one, then as a Detachment rule. |

The usage limit comes first because a player checks it first. The duration comes after the effect it bounds.

### Stratagems

A Stratagem is written as the four parts the app gives it, in this order:

| Part | Holds | Form |
| --- | --- | --- |
| When | The phase and the moment the Stratagem is used. | Whose phase and its name, then the moment after a comma, such as "Your Shooting phase, as one of your **EMBER HOST** units is **selected to shoot**." Whose phase is "Your", "Opponent's" or "Either player's", or "Any phase". The moment is "as it begins", "as it ends", or the event that triggers it. The end of a turn is "Your turn, as it ends", with whose turn it is. |
| Target | What the Stratagem targets. | "A **KEYWORD** unit of yours" (or "An"), with any condition, "Up to 2 **KEYWORD** units of yours" for more than one, or "That **KEYWORD** unit" for the unit the When part names. |
| Effect | What happens. | As a datasheet ability, with "the unit" or "the model" as the target's subject. |
| Restrictions | Limits and exclusions beyond the core rules' once per phase. | Left out when the Stratagem has none. |

Its cost and timing stay typed facts in `cp` and `stratagem`. A choice between effects is one Effect part with a list.

A Stratagem's record carries these parts as [`parts`](rule-summaries.md#records), and its `summary` is them joined, so an app that shows one block of text keeps working:

```json
{
  "parts": {
    "when": "[Your Shooting phase](vsdata:core-rule/shooting-phase), as one of your **EMBER HOST** units is **selected to shoot**.",
    "target": "That **EMBER HOST** unit.",
    "effect": "The unit's ranged weapons get [Searing 1](vsdata:weapon-ability/searing) for the rest of the phase."
  },
  "summary": "**When:** [Your Shooting phase](vsdata:core-rule/shooting-phase), as one of your **EMBER HOST** units is **selected to shoot**.\n\n**Target:** That **EMBER HOST** unit.\n\n**Effect:** The unit's ranged weapons get [Searing 1](vsdata:weapon-ability/searing) for the rest of the phase."
}
```

## Phrasebook

Each row is one idea and the one phrasing a summary uses for it. The last column lists phrasings earlier VS Data summaries used for the same idea, which the style replaces.

### Time

| Idea | Write | Not |
| --- | --- | --- |
| An effect that lasts to the end of the current phase | "for the rest of the phase", after the effect | "until phase end", "this phase" as a duration |
| The same for the turn or the battle | "for the rest of the turn", "for the rest of the battle" | "this turn" as a duration |
| An effect that lasts until a Command phase starts | "until your next Command phase", "until your opponent's next Command phase" | "until your next Command phase starts" |
| The start or end of a phase | "as your Command phase begins", "as your opponent's Fight phase ends"; in a Stratagem's When part, "Your Command phase, as it begins" | "when your Shooting phase opens", "once the phase is over" |
| The end of a turn or battle round | "as your turn ends", "as the battle round ends" | "when the turn finishes" |
| A trigger that can happen many times | "whenever" | "each time", "every time" |
| A trigger that follows an event | "after" | "just after", "right after", "immediately after" |
| A condition that holds for a time | "while" | "as long as", "when" for a condition |
| A phase of either player's turn | "in either player's Fight phase", with the link covering whose phase it is | "in the Fight phase" |

### Players, units and choices

| Idea | Write | Not |
| --- | --- | --- |
| A unit of the rule's own army | "a **KEYWORD** unit of yours", "your **KEYWORD** units" | "friendly" for the player's own units |
| Choosing something | "pick" | "choose", "select", "nominate" (the core terms **selected to shoot**, **selected to fight** and selecting targets stay as they are) |
| Something the player may do | "can" | "may", "is allowed to" |
| A rule the player decides to use, with its effect | "can" on the effect, such as "you can make that use cost 1CP more" | a separate sentence that uses the rule before its effect |
| A Detachment rule's limit on the army's Chapter | "Your army can contain **BLOOD ANGELS** units, and no **ADEPTUS ASTARTES** units of any other Chapter.", as the rule's last paragraph | a `Restrictions:` label, which is for Stratagems |
| A limit on how often a rule is used | "Once per battle," or "Once per turn," at the start of the summary | the limit after the effect, or in brackets |

### Effects

| Idea | Write | Not |
| --- | --- | --- |
| A change to a characteristic | "gets +1 OC", "gets +2 S", "gets -1 A", using the profile's abbreviation | "Objective Control falls by 4", "2 more Attacks" |
| A change to a roll | "+1 to Hit", "-1 to Wound", "+1 to its Advance and Charge rolls" | "a −1 Hit roll modifier", "1 is added to" |
| A multiple of a value | "costs 2 times its listed CP", "its A becomes 2 times its value" | "double its", "triple the", "twice its", "four times its", "doubled" |
| Attacks made against a unit | "attacks against this unit get -1 to Wound" | "when this unit is the target" |
| Re-rolling | "can re-roll 1s to Hit", "can re-roll its Hit rolls" | "re-roll any Hit roll of 1", "Hit rolls of 1 can be re-rolled" |
| Giving an ability or weapon ability | "gets **[LETHAL HITS]**", "gets [Deep Strike]" | "has", "gains", "is granted" |
| Mortal wounds | "takes D3 mortal wounds" | "suffers", "is dealt" |
| A distance from the rule's model or unit | "up to 12\" from this model" | "no more than 12″ away", "12″ or closer" |
| Being in Engagement Range | "in Engagement Range of an enemy unit" | "engaged with", "in combat with" |
| A Leader's unit | "While this model leads a unit," | "When this model leads a unit", "while leading a unit" |
| A Damaged rule's range of wounds | "With 1-5 wounds left," | "At 1–5 wounds", "while down to 1–5 wounds" |

### Numbers and units

Distances are digits and a straight double quote, such as `6"`. Dice are "a D6", "D3", "2D6". Command points are "1CP". A range of numbers is written with a hyphen, such as "1-5".

## Checking

`styleIssues(record)` in [src/rule-summaries/style.ts](../src/rule-summaries/style.ts) names the rules of this style a summary breaks, and `styleReport(records)` lists the records breaking each one. It finds what a pattern can: a Stratagem without its parts, whose When part does not open with whose phase or turn it is, or whose Target part opens with a count word, an Enhancement that does not open with its bearer, a unit's Damaged rule that does not open with its range of wounds, a duration before its effect, a phase named without whose it is (reading link text too), and those phrasings the phrasebook replaces that `REPLACED` in that file lists, outside bold and linked names. A summary outside the [summary text](rule-summaries.md#summary-text) grammar is reported as `invalid-summary`. A review still reads every summary for the rest of the style.

```sh
pnpm style data/mfm-1-6/rule-summaries/records
```

The report does not fail until every faction has been restyled; `--strict` makes it fail when any summary breaks the style.
