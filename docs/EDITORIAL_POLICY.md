# Editorial policy

## Purpose

This project distinguishes the text being displayed from the editorial choices used to display it. It does not claim to reconstruct an author's autograph or identify a single uniquely correct text.

## Required text basis

Every work must include a `textBasis` object in its work JSON. It records:

- `status`: `unverified`, `reviewed`, or `critical`.
- `baseText`: the actual edition or witness used as the displayed base text.
- `witnesses`: the source materials consulted, their type, date or period when known, role, and a stable reference.
- `editorialLayers`: transformations added for this reader, such as simplified characters, punctuation, chapter numbering, titles, or normalized character forms.
- `limitations`: what has not been checked and what the display must not be taken to prove.

`baseText: "通行本"` by itself is never enough to mark a text as reviewed.

## Evidence order

When the aim is early textual evidence rather than modern readability, prefer and identify:

1. Directly inspectable excavated manuscripts, facsimiles, or authoritative excavation transcriptions.
2. Critical editions that state their witnesses and editorial decisions.
3. Transmitted editions, used as named witnesses rather than as invisible defaults.
4. Modern reading editions only when they are clearly labeled as such.

This is an evidence policy, not a rule that a source is trustworthy or untrustworthy because of its country, institution, language, or political association. Claims of alteration must be supported by identifiable textual differences and witnesses.

## Editorial rules

- Never silently combine readings from different witnesses into smoother prose.
- Keep the selected base reading separate from `variants` or `ambiguities`.
- Treat modern punctuation, chapter division, titles, and simplified-character conversion as editorial layers.
- Do not let an LLM invent missing characters, silently normalize disputed readings, or call one reading "original" without adequate evidence.
- If a difference affects meaning, order, omission, addition, or segmentation, expose it as an uncertainty or variant.
- If the evidence is incomplete, use `unverified` and say what is missing rather than implying certainty.

## Changes after notes exist

Changing a translation or an explanation must not touch notes. Changing an `original` sentence that has saved notes is a sentence-identity migration: stop, obtain explicit authorization, preserve the existing record, document the old and new text basis, and verify every note binding before and after.
