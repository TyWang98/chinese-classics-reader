const express = require('express');
const { createJsonStore, StoreError } = require('../services/jsonStore');
const { validateSentenceUpdate } = require('../utils/validation');

function chapterSummary(chapter) {
  const noteCount = chapter.sentences.filter((sentence) => sentence.userNote.trim()).length;
  const completedSentences = chapter.sentences.filter(
    (sentence) => sentence.status === 'completed' || sentence.status === 'reading'
  ).length;

  return {
    id: chapter.id,
    number: chapter.number,
    title: chapter.title,
    status: chapter.status,
    updatedAt: chapter.updatedAt,
    noteCount,
    sentenceCount: chapter.sentences.length,
    completedSentences
  };
}

function createApiRouter({ libraryRoot, notesRoot }) {
  const router = express.Router();
  const store = createJsonStore({ libraryRoot, notesRoot });

  router.get('/works', async (_request, response, next) => {
    try {
      const library = await store.getLibrary();
      const works = await Promise.all(
        library.works.map(async (entry) => {
          const work = await store.getWork(entry.id);
          const chapters = work.chapters.map(chapterSummary);
          const recentChapter = chapters
            .filter((chapter) => chapter.updatedAt)
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] || null;

          return {
            ...entry,
            updatedAt: work.updatedAt,
            chapterCount: chapters.length,
            completedChapterCount: chapters.filter(
              (chapter) => chapter.sentenceCount === chapter.completedSentences
            ).length,
            recentChapter
          };
        })
      );
      response.json({ works });
    } catch (error) {
      next(error);
    }
  });

  router.get('/works/:workId', async (request, response, next) => {
    try {
      const work = await store.getWork(request.params.workId);
      response.json({
        id: work.id,
        title: work.title,
        author: work.author,
        textBasis: work.textBasis,
        updatedAt: work.updatedAt,
        chapters: work.chapters.map(chapterSummary)
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/works/:workId/chapters/:chapterId', async (request, response, next) => {
    try {
      const { work, chapter } = await store.getChapter(
        request.params.workId,
        request.params.chapterId
      );
      response.json({ work: { id: work.id, title: work.title, author: work.author }, chapter });
    } catch (error) {
      next(error);
    }
  });

  router.patch('/works/:workId/chapters/:chapterId/sentences/:sentenceId', async (request, response, next) => {
    const validation = validateSentenceUpdate(request.body);
    if (!validation.valid) {
      return response.status(400).json({ success: false, error: validation.error });
    }

    try {
      const update = {
        userNote: request.body.userNote,
        status: request.body.status === 'unread' ? 'completed' : request.body.status
      };
      const result = await store.updateSentence(
        request.params.workId,
        request.params.chapterId,
        request.params.sentenceId,
        update
      );
      return response.json({ success: true, ...result });
    } catch (error) {
      return next(error);
    }
  });

  router.use((_request, response) => {
    response.status(404).json({ success: false, error: 'API route not found' });
  });

  router.use((error, _request, response, next) => {
    if (error instanceof StoreError) {
      return response.status(error.status).json({ success: false, error: error.message });
    }
    return next(error);
  });

  return router;
}

module.exports = { createApiRouter };
