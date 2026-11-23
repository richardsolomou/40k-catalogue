# Data sources

Records carry their edition, update and source reference. For imported data, record the upstream revision, credit, licence and changes alongside the record. A release manifest identifies the records and data categories it contains.

## Using source data

Read the source and describe the gameplay facts in structured fields and original wording. Cite the source page or URL so another contributor can check the mechanics. Keep source prose, downloads and model inputs outside Git. The [authoring guide](authoring.md) explains how to draft and review a record.

Before distributing adapted data, document the basis for reusing it. The project's [MIT licence](../LICENSE) covers original project material. Each upstream source has its own terms.

## Official sources

| Source | How records cite it |
| --- | --- |
| A signed build of an official app | Its title, app version, data build number and release date. The build is the version of the rules the record was checked against. |
| A publisher PDF | Its title as the document prints it, its URL, and the page where the rule is printed when known. |

[Rule summaries](rule-summaries.md#citations) list every official source in `citations`, and their `source` is the PDF page where there is one, else the app build. When a newer publication replaces a rule or FAQ, its retired identity entry names that publication in [`retired.sources`](catalogue-identity.md#releases-and-entries).

## Adapted data

A record built from upstream structured data carries an `attribution`: the upstream `url`, the pinned `revision`, the contributor `credit`, the `licence` URL and the `changes` made to the input. Mechanic records and [catalogue records](catalogue-releases.md#inputs) use the same fields.

## MFM 1.6 rule summaries

The [MFM 1.6 rule summaries](../data/mfm-1-6/rule-summaries/README.md) cite official sources only:

- Warhammer 40,000: The App 2.8.0, data build 981, released 2026-10-14. It is the signed build in force at the update's cutoff, and every record but one cites it.
- Games Workshop's faction packs and other rules PDFs on warhammer-community.com, by their printed title and the page that prints the rule, for 1,235 records. One erratum, first printed in a dated publisher update the app build does not yet carry, cites that page alone.

The units, detachments, wargear and publications that FAQs amend are identity entries of the retained `rosters` and `publications` categories, which still come from the app build.

Drafting also used Game Datacards' community data as private evidence, checked against the app build. It is not a cited source, and none of its text is published.

Every summary is original wording, drafted from the official sources alone. Up to v0.2.0, 168 records adapted structured fields from [40kdc-data](https://github.com/wn-mitch/40kdc-data) under CC BY 4.0: 140 mechanic records translated from its ability records, and 28 summaries whose typed facts used its Stratagem timing and target records. From v0.3.0 they are redrafted from the official text with their own typed facts, so no MFM 1.6 record carries 40kdc attribution and MFM 1.6 has no mechanics input: a mechanic record's summary is rendered from its structured fields, which were the 40kdc translation.

## Earlier 11th-edition rule summaries

The inputs for the eight earlier rules versions (`data/<version>/rule-summaries/` and `mechanics/`) follow the same rules. Each cites the signed app build in force at its own cutoff instead of build 981: Warhammer 40,000: The App 2.6.0, data build 946, released 2026-09-02, for `legacy-marine-old`; 2.7.0, data build 963, released 2026-09-30, for `legacy-rosters`; and 2.7.1, data build 972, released 2026-10-02, for the other six. A rule whose text first appears in a later build, or that no official source dated before the cutoff prints, has no record, and its input's README lists it. Their v0.1.0 inputs still carry the 40kdc mechanic records and adapted summaries described above, with its attribution, until their next release.

## Interpretations

Where a source leaves a point open and the project chooses a reading, the record states that reading and flags the open question in its [`interpretation`](rule-summaries.md#common-fields), so consumers can show it.

## Where mappings live

Catalogue records use [catalogue IDs and rules versions](catalogue-identity.md). Keep mappings to a consumer's stored IDs or other sources in that consumer.

[Source and migration issues](https://github.com/richardsolomou/vs-data/issues/13) · [Archived source inventory](https://github.com/richardsolomou/vs-data/blob/80733c1fb93dd338b3078408c7f46c30c4ec422d/docs/source-inventory.md)
