const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createJsonStore, StoreError } = require('../src/services/jsonStore');

const projectData = path.join(__dirname, '..', 'data');

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'classical-reader-'));
  await fs.mkdir(path.join(root, 'works'), { recursive: true });
  await fs.copyFile(path.join(projectData, 'library.json'), path.join(root, 'library.json'));
  await fs.copyFile(
    path.join(projectData, 'works', 'daodejing.json'),
    path.join(root, 'works', 'daodejing.json')
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  return root;
}

test('reads public content, starts with no personal state, and derives chapter status', async (t) => {
  const store = createJsonStore(await fixture(t));

  assert.equal((await store.getLibrary()).works[0].id, 'daodejing');
  const content = await store.getContentWork('daodejing');
  assert.equal(Object.hasOwn(content.chapters[0].sentences[0], 'userNote'), false);

  const initial = await store.getWork('daodejing');
  assert.equal(initial.chapters[0].status, 'unread');
  assert.equal(initial.chapters[1].status, 'unread');

  const { sentence } = await store.getSentence(
    'daodejing',
    'daodejing-01',
    'daodejing-01-01'
  );
  assert.equal(sentence.original, '道可道，非常道。');
  assert.equal(sentence.userNote, '');

  await store.updateSentence(
    'daodejing',
    'daodejing-01',
    'daodejing-01-01',
    { userNote: 'A question', status: 'uncertain' }
  );
  assert.equal((await store.getChapter('daodejing', 'daodejing-01')).chapter.status, 'uncertain');
});

test('saving changes only the target notes record and never public content', async (t) => {
  const root = await fixture(t);
  const store = createJsonStore(root);
  const workPath = path.join(root, 'works', 'daodejing.json');
  const libraryPath = path.join(root, 'library.json');
  const notesPath = path.join(root, 'notes', 'daodejing.json');
  const contentBefore = await fs.readFile(workPath, 'utf8');
  const libraryBefore = await fs.readFile(libraryPath, 'utf8');

  await store.updateSentence(
    'daodejing',
    'daodejing-01',
    'daodejing-01-01',
    { userNote: 'My reading', status: 'completed' }
  );

  assert.equal(await fs.readFile(workPath, 'utf8'), contentBefore);
  assert.equal(await fs.readFile(libraryPath, 'utf8'), libraryBefore);

  const notesAfterRaw = await fs.readFile(notesPath, 'utf8');
  assert.doesNotThrow(() => JSON.parse(notesAfterRaw));
  const notesAfter = JSON.parse(notesAfterRaw);
  const changed = notesAfter.sentences['daodejing-01-01'];
  assert.equal(changed.original, '道可道，非常道。');
  assert.equal(changed.userNote, 'My reading');
  assert.equal(changed.status, 'completed');
  assert.ok(changed.updatedAt);
  assert.equal(Object.hasOwn(notesAfter.sentences, 'daodejing-01-02'), false);

  const merged = await store.getSentence('daodejing', 'daodejing-01', 'daodejing-01-01');
  assert.equal(merged.sentence.userNote, 'My reading');
});

test('serializes simultaneous saves for one work without losing either sentence', async (t) => {
  const store = createJsonStore(await fixture(t));

  await Promise.all([
    store.updateSentence(
      'daodejing',
      'daodejing-03',
      'daodejing-03-01',
      { userNote: 'First concurrent save', status: 'completed' }
    ),
    store.updateSentence(
      'daodejing',
      'daodejing-03',
      'daodejing-03-02',
      { userNote: 'Second concurrent save', status: 'uncertain' }
    )
  ]);

  const notes = await store.getNotes('daodejing');
  assert.equal(notes.sentences['daodejing-03-01'].userNote, 'First concurrent save');
  assert.equal(notes.sentences['daodejing-03-01'].status, 'completed');
  assert.equal(notes.sentences['daodejing-03-02'].userNote, 'Second concurrent save');
  assert.equal(notes.sentences['daodejing-03-02'].status, 'uncertain');
});

test('rejects a note whose original no longer matches its sentence', async (t) => {
  const root = await fixture(t);
  const store = createJsonStore(root);
  const notesPath = path.join(root, 'notes', 'daodejing.json');
  await store.updateSentence(
    'daodejing',
    'daodejing-01',
    'daodejing-01-01',
    { userNote: 'Saved note', status: 'completed' }
  );

  const notes = JSON.parse(await fs.readFile(notesPath, 'utf8'));
  notes.sentences['daodejing-01-01'].original = 'Wrong source sentence';
  await fs.writeFile(notesPath, `${JSON.stringify(notes, null, 2)}\n`, 'utf8');

  await assert.rejects(
    () => store.getWork('daodejing'),
    (error) => error instanceof StoreError
      && error.status === 500
      && error.message.includes('integrity mismatch')
  );
});

test('missing work, chapter, and sentence return StoreError 404', async (t) => {
  const store = createJsonStore(await fixture(t));
  const operations = [
    () => store.getWork('missing-work'),
    () => store.getChapter('daodejing', 'missing-chapter'),
    () => store.getSentence('daodejing', 'daodejing-01', 'missing-sentence')
  ];

  for (const operation of operations) {
    await assert.rejects(
      operation,
      (error) => error instanceof StoreError && error.status === 404
    );
  }
});
