const fs = require('node:fs/promises');
const path = require('node:path');
const { isSafeId } = require('../utils/validation');
const { nowIso } = require('../utils/time');

class StoreError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

function createJsonStore(dataRoot) {
  const libraryPath = path.join(dataRoot, 'library.json');
  const writeChains = new Map();

  async function readJson(filePath) {
    try {
      return JSON.parse(await fs.readFile(filePath, 'utf8'));
    } catch (error) {
      if (error.code === 'ENOENT') throw new StoreError('Resource not found', 404);
      if (error instanceof SyntaxError) throw new StoreError('Stored JSON is invalid', 500);
      throw error;
    }
  }

  async function getLibrary() {
    return readJson(libraryPath);
  }

  async function findWorkEntry(workId) {
    if (!isSafeId(workId)) throw new StoreError('Work not found', 404);
    const library = await getLibrary();
    const work = library.works.find((entry) => entry.id === workId);
    if (!work) throw new StoreError('Work not found', 404);
    return work;
  }

  async function getContentWork(workId) {
    await findWorkEntry(workId);
    const work = await readJson(path.join(dataRoot, 'works', `${workId}.json`));
    if (work.id !== workId) throw new StoreError('Work data does not match requested work', 500);
    return work;
  }

  async function getNotes(workId) {
    const notesPath = path.join(dataRoot, 'notes', `${workId}.json`);
    try {
      const notes = await readJson(notesPath);
      if (notes.workId !== workId || !notes.sentences || typeof notes.sentences !== 'object' || Array.isArray(notes.sentences)) {
        throw new StoreError('Notes data does not match requested work', 500);
      }
      return notes;
    } catch (error) {
      if (error instanceof StoreError && error.status === 404) {
        return { workId, updatedAt: null, sentences: {} };
      }
      throw error;
    }
  }

  function isCompleted(sentence) {
    return sentence.status === 'completed' || sentence.status === 'reading';
  }

  function deriveChapterStatus(sentences) {
    if (sentences.length > 0 && sentences.every(isCompleted)) return 'completed';
    if (sentences.some((sentence) => sentence.status === 'uncertain')) return 'uncertain';
    return 'unread';
  }

  function mergeNoteState(work, notes) {
    let latestWorkUpdate = work.updatedAt || null;
    for (const chapter of work.chapters) {
      let latestChapterUpdate = chapter.updatedAt || null;
      for (const sentence of chapter.sentences) {
        const note = notes.sentences[sentence.id];
        if (note && note.original !== sentence.original) {
          throw new StoreError(`Note-to-source integrity mismatch for ${sentence.id}`, 500);
        }
        sentence.userNote = note?.userNote ?? '';
        sentence.status = note?.status ?? 'unread';
        sentence.updatedAt = note?.updatedAt ?? null;
        if (sentence.updatedAt && (!latestChapterUpdate || sentence.updatedAt > latestChapterUpdate)) {
          latestChapterUpdate = sentence.updatedAt;
        }
      }
      chapter.status = deriveChapterStatus(chapter.sentences);
      chapter.updatedAt = latestChapterUpdate;
      if (latestChapterUpdate && (!latestWorkUpdate || latestChapterUpdate > latestWorkUpdate)) {
        latestWorkUpdate = latestChapterUpdate;
      }
    }
    work.updatedAt = latestWorkUpdate;
    return work;
  }

  async function getWork(workId) {
    const [work, notes] = await Promise.all([getContentWork(workId), getNotes(workId)]);
    return mergeNoteState(work, notes);
  }

  async function getChapter(workId, chapterId) {
    if (!isSafeId(chapterId)) throw new StoreError('Chapter not found', 404);
    const work = await getWork(workId);
    const chapter = work.chapters.find((entry) => entry.id === chapterId);
    if (!chapter) throw new StoreError('Chapter not found', 404);
    return { work, chapter };
  }

  async function getSentence(workId, chapterId, sentenceId) {
    if (!isSafeId(sentenceId)) throw new StoreError('Sentence not found', 404);
    const { work, chapter } = await getChapter(workId, chapterId);
    const sentence = chapter.sentences.find((entry) => entry.id === sentenceId);
    if (!sentence) throw new StoreError('Sentence not found', 404);
    return { work, chapter, sentence };
  }

  async function writeJsonSafely(filePath, value) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const temporaryPath = `${filePath}.tmp`;
    await fs.writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
    await fs.rename(temporaryPath, filePath);
  }

  function enqueueWorkWrite(workId, task) {
    const previous = writeChains.get(workId) || Promise.resolve();
    const current = previous.catch(() => undefined).then(task);
    writeChains.set(workId, current);
    return current.finally(() => {
      if (writeChains.get(workId) === current) writeChains.delete(workId);
    });
  }

  async function updateSentence(workId, chapterId, sentenceId, update) {
    if (!isSafeId(chapterId) || !isSafeId(sentenceId)) {
      throw new StoreError('Chapter or sentence not found', 404);
    }

    return enqueueWorkWrite(workId, async () => {
      const work = await getContentWork(workId);
      const chapter = work.chapters.find((entry) => entry.id === chapterId);
      if (!chapter) throw new StoreError('Chapter not found', 404);
      const sentence = chapter.sentences.find((entry) => entry.id === sentenceId);
      if (!sentence) throw new StoreError('Sentence not found', 404);

      const notes = await getNotes(workId);
      const existing = notes.sentences[sentenceId];
      if (existing && existing.original !== sentence.original) {
        throw new StoreError(`Note-to-source integrity mismatch for ${sentenceId}`, 500);
      }

      const savedAt = nowIso();
      notes.sentences[sentenceId] = {
        original: sentence.original,
        userNote: update.userNote,
        status: update.status,
        updatedAt: savedAt
      };
      notes.updatedAt = savedAt;
      await writeJsonSafely(path.join(dataRoot, 'notes', `${workId}.json`), notes);
      return { sentenceId, savedAt };
    });
  }

  return {
    getLibrary,
    getContentWork,
    getNotes,
    getWork,
    getChapter,
    getSentence,
    updateSentence,
    writeJsonSafely
  };
}

module.exports = { createJsonStore, StoreError };
