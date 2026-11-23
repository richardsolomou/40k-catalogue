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

## Interpretations

Where a source leaves a point open and the project chooses a reading, the record states that reading and flags the open question in its [`interpretation`](rule-summaries.md#common-fields), so consumers can show it.

## Where mappings live

Catalogue records use [catalogue IDs and rules versions](catalogue-identity.md). Keep mappings to a consumer's stored IDs or other sources in that consumer.

[Source and migration issues](https://github.com/richardsolomou/vs-data/issues/13) · [Archived source inventory](https://github.com/richardsolomou/vs-data/blob/80733c1fb93dd338b3078408c7f46c30c4ec422d/docs/source-inventory.md)
