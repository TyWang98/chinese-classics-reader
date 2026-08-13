---
name: classical-text-reader
description: Maintain and extend the local Classical Text Reader web app. Use when adding classical works or chapters, revising source text, literal translations, LLM interpretations or ambiguities, adjusting the reading UI, fixing sentence saves, changing JSON data, or adding local import/export.
---

# Classical Text Reader Maintainer

Maintain this Node.js, Express, native HTML/CSS/JavaScript application as a local-only project.

## Required workflow

1. Read `AGENTS.md`, this Skill, `docs/EDITORIAL_POLICY.md`, and the relevant data, API/UI, and tests before editing.
2. Keep source content and personal state isolated. Content changes must not write to `data/notes/`; persistence changes must preserve every note record exactly unless the user explicitly changes it.
3. Keep content, backend validation, frontend rendering, README, documentation, and tests consistent.
4. Run `npm test` after every change. For UI or API work, start the local server and exercise the affected endpoint or page.
5. For any persistence or sentence-identity work, compare each affected note record's `sentence.id`, `original`, `userNote`, `status`, and `updatedAt` before and after.

## Default new-chapter delivery

When the user asks for a new chapter of an existing work, treat it as an implementation request, not merely a prose answer.

1. Confirm the requested text basis. If the user provides only a title or the edition could materially change the text, request the source text or edition before adding it.
2. Add ordered sentence cards to the relevant `data/works/<work-id>.json` file, retaining the work's `textBasis` and adding sentence-level variants or uncertainties where needed.
3. Supply concise `literalTranslation`, clearly labeled `llmInterpretation`, a paragraph array in `expandedInterpretation`, and `ambiguities` for every sentence.
4. Do not edit the work's notes file. New sentence state is implicit `unread` until the user first saves that sentence.
5. Validate JSON, run tests, start the local server if needed, and return `http://localhost:3000/chapter.html?work=<work-id>&chapter=<chapter-id>`.

## Non-negotiable note-to-source integrity

Store personal state exclusively in `data/notes/<work-id>.json`, keyed by stable `sentence.id`. Each note record contains the exact `original` snapshot plus `userNote`, `status`, and `updatedAt`. Keep those fields out of `data/works/*.json`.

- Never write to a notes file while adding chapters, revising translations or interpretations, changing layout, or performing other content-only work.
- Never delete, reuse, or change the `sentence.id` or `original` of a sentence that has a note record.
- The storage service must reject a note record whose stored `original` differs from the current content sentence.
- Create a new note record only when the user first saves a new sentence; bind it to that sentence's current ID and exact original text.
- Ordinary content edits do not require a notes backup because they must not open or modify the notes file.
- Create a timestamped notes backup only before changing the notes schema, save service, import/export logic, or sentence identity.
- For an explicitly authorized notes migration, stop if any record changes unexpectedly.
- If a requested content change conflicts with an existing note binding, stop and ask the user instead of silently moving or rewriting the note.

## Text basis and source rules

Treat `docs/EDITORIAL_POLICY.md` as the single source of truth for textual evidence and editorial layers.

- Every work must have a `textBasis` object with `status`, `baseText`, `witnesses`, `editorialLayers`, and `limitations`.
- Record consequential variants, segmentation differences, omissions, additions, and uncertain references in `ambiguities` or `variants`; never silently harmonize them.
- Treat simplified characters, punctuation, chapter titles, and chapter numbers as editorial layers unless the chosen witness establishes them.
- Do not change a noted sentence's `original` merely to adopt a new base text. That is an authorized sentence-identity migration, not an ordinary content edit.

## Content rules

- Keep `original`, `literalTranslation`, `llmInterpretation`, `expandedInterpretation`, and `userNote` separate.
- Do not modernize or polish original text.
- Do not add ideas to a literal translation that the source does not express.
- Label model explanations as LLM understanding; never present them as a standard or unique interpretation.
- Do not silently adopt historic commentators' or modern scholars' translations, and do not soften the source for modern values.
- Put viable alternate readings, punctuation questions, unclear references, and confidence limits in `ambiguities`.

## Translation and interpretation quality

Write `literalTranslation` as controlled, readable modern Chinese. It must be a complete sentence for a present-day reader while remaining traceable to the source sentence. Literal does not mean preserving archaic word order, particles, repetition, or ellipsis in an ungrammatical shell; it also does not permit a polished paraphrase that adds claims.

Before finalizing a sentence:

1. Establish predicate, logical relation, omitted elements, pronoun reference, modifiers, and parallel structure.
2. Render that structure in ordinary Chinese, adding only grammatical material needed for clarity.
3. Remove causal relations, psychological states, value judgments, historical doctrines, or conclusions not required by the text.
4. Use neutral wording when it preserves a material ambiguity; otherwise choose the best-supported reading and record alternatives in `ambiguities`.
5. Revise if the result is a word-by-word gloss, contains a modern-Chinese grammatical gap, or hides uncertainty behind vague wording.

Make `llmInterpretation` complementary rather than repetitive. Identify the grammatical choice behind the translation, explain the role and scope of key terms, separate direct textual support from inference, and state consequential alternatives. Never turn an interpretation into a definitive answer because it reads smoothly.

Write `expandedInterpretation` as two to four short, self-contained paragraphs. Start from syntax and immediate context, then develop reasonable implications, competing readings, and their practical difference. This layer may be more suggestive than `llmInterpretation`, but distinguish textual support from inference and do not claim certainty, consensus, or authority that has not been established. Never quote, imitate, or respond to `userNote`.

## Data and persistence rules

- Use a stable lowercase English slug for work IDs.
- Use `<work-id>-NN` for chapters and `<work-id>-NN-NN` for sentences.
- Keep UTF-8 JSON, two-space indentation, and a trailing newline.
- Do not change the JSON schema without updating backend, frontend, README, documentation, and tests together.
- Add works to `library.json`, then create a separate file in `data/works/`; never make a user-supplied path a file path.
- Merge user fields from notes only at read time and write only the target work's notes file on save.
- Notes writes are serialized per work so simultaneous saves from separate tabs cannot lose one another's changes. Preserve that guarantee in future persistence changes.
- Derive chapter reading state from merged sentence notes; do not persist reader progress in content JSON.

## UI and save rules

- Keep only two indexes: works and chapters. Do not create a sentence directory.
- Every sentence has its own textarea, status select, and explicit save button.
- Allow only `unread`, `completed`, and `uncertain`; saving `unread` must persist as `completed`. Treat legacy `reading` values as display-only completed until an explicitly authorized data migration.
- Render `llmInterpretation` in the always-visible concise layer. Render `expandedInterpretation` in a native `<details>` element labeled “进一步解释”, collapsed by default; keep the control easy to tap on mobile and close other expanded explanations when a new one opens.
- Do not add automatic overwrite saving unless the user explicitly requests it.
- On success show the returned time; on failure retain input and show an error.
- Only PATCH `userNote` and `status`; never expose source fields for frontend edits.
- Keep the interface quiet, readable, offline, and free of decorative animation.

## Repository hygiene

- Follow `.editorconfig`: UTF-8, LF, trailing newline, two-space indentation, and no trailing whitespace.
- Keep HTML, CSS, JavaScript, and JSON readable and unminified in the repository.
- Prefer Node.js and browser built-ins over a new dependency when they provide the required behavior clearly.
- Do not create a helper module for a single trivial expression; do keep API, storage, validation, browser code, and data in their existing responsibility boundaries.
- Remove a data field only after confirming that the backend, frontend, documentation, and tests have no remaining consumer.
- Keep formatting-only changes out of later feature commits unless formatting is the explicit task.

## Scope

Do not add GitHub, cloud sync, accounts, remote databases, LLM APIs, online fonts, analytics, or a front-end build framework unless explicitly requested.
