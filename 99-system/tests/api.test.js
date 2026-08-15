const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createApp } = require('../server');

const projectLibrary = path.join(__dirname, '..', '..', '00-library');

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'classical-reader-api-'));
  const libraryRoot = path.join(root, '00-library');
  const notesRoot = path.join(root, '01-notes');
  await fs.mkdir(path.join(libraryRoot, 'works'), { recursive: true });
  await fs.mkdir(notesRoot, { recursive: true });
  await fs.copyFile(
    path.join(projectLibrary, 'library.json'),
    path.join(libraryRoot, 'library.json')
  );
  await fs.copyFile(
    path.join(projectLibrary, 'works', 'daodejing.json'),
    path.join(libraryRoot, 'works', 'daodejing.json')
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));

  const server = createApp({ libraryRoot, notesRoot }).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return {
    libraryRoot,
    notesRoot,
    base: `http://127.0.0.1:${server.address().port}`
  };
}

test('API returns the library, text basis, chapters, and sentence content', async (t) => {
  const { base } = await fixture(t);
  const library = await fetch(`${base}/api/works`).then((response) => response.json());
  assert.equal(library.works[0].title, '道德经');
  assert.equal(Object.hasOwn(library.works[0], 'description'), false);

  const work = await fetch(`${base}/api/works/daodejing`).then((response) => response.json());
  assert.equal(work.chapters.length, 3);
  assert.equal(work.textBasis.status, 'unverified');
  assert.equal(Object.hasOwn(work, 'sourceVersion'), false);

  const result = await fetch(
    `${base}/api/works/daodejing/chapters/daodejing-01`
  ).then((response) => response.json());
  assert.equal(result.chapter.sentences.length, 10);

  for (const sentence of result.chapter.sentences) {
    assert.equal(typeof sentence.userNote, 'string');
    assert.equal(Object.hasOwn(sentence, 'confidence'), false);
    assert.ok(Array.isArray(sentence.expandedInterpretation));
    assert.ok(sentence.expandedInterpretation.length >= 2);
    assert.ok(sentence.expandedInterpretation.every(
      (paragraph) => typeof paragraph === 'string' && paragraph.trim() && !paragraph.includes('?')
    ));
  }
});

test('API rejects removed status, source fields, and missing resources', async (t) => {
  const { base } = await fixture(t);
  const sentenceUrl = `${base}/api/works/daodejing/chapters/daodejing-01/sentences/daodejing-01-01`;
  const invalid = await fetch(sentenceUrl, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userNote: 'x', status: 'reading' })
  });
  assert.equal(invalid.status, 400);

  const extraField = await fetch(sentenceUrl, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userNote: 'x', status: 'completed', original: 'forbidden' })
  });
  assert.equal(extraField.status, 400);
  assert.equal((await extraField.json()).error, 'Only userNote and status may be updated');

  const missingRequests = [
    { url: '/api/works/none', options: {} },
    { url: '/api/works/daodejing/chapters/none', options: {} },
    {
      url: '/api/works/daodejing/chapters/daodejing-01/sentences/none',
      options: {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userNote: 'x', status: 'completed' })
      }
    }
  ];

  for (const request of missingRequests) {
    const response = await fetch(base + request.url, request.options);
    assert.equal(response.status, 404);
    assert.equal((await response.json()).success, false);
  }
});

test('saving unread persists completed in notes without changing work content', async (t) => {
  const { libraryRoot, notesRoot, base } = await fixture(t);
  const workPath = path.join(libraryRoot, 'works', 'daodejing.json');
  const workBefore = await fs.readFile(workPath, 'utf8');
  const saved = await fetch(
    `${base}/api/works/daodejing/chapters/daodejing-03/sentences/daodejing-03-01`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userNote: '自动完成测试', status: 'unread' })
    }
  );

  assert.equal(saved.status, 200);
  assert.equal(await fs.readFile(workPath, 'utf8'), workBefore);
  const notes = JSON.parse(await fs.readFile(path.join(notesRoot, 'daodejing.json'), 'utf8'));
  assert.equal(notes.sentences['daodejing-03-01'].status, 'completed');
  assert.equal(notes.sentences['daodejing-03-01'].userNote, '自动完成测试');

  const chapter = await fetch(
    `${base}/api/works/daodejing/chapters/daodejing-03`
  ).then((response) => response.json());
  assert.equal(chapter.chapter.sentences[0].status, 'completed');
});
