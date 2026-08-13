document.addEventListener('DOMContentLoaded', async () => {
  const container = document.querySelector('#works');

  try {
    const { works } = await Reader.getJson('/api/works');
    if (!works.length) {
      container.innerHTML = '<p class="muted">尚未收录作品。</p>';
      return;
    }

    container.innerHTML = works.map((work) => `
      <a class="index-card" href="/work.html?id=${encodeURIComponent(work.id)}">
        <div>
          <h2>${Reader.escapeHtml(work.title)}</h2>
          <p>${Reader.escapeHtml(work.author || '传统归属未注明')}</p>
        </div>
        <dl>
          <div><dt>已收录章节</dt><dd>${work.chapterCount}</dd></div>
          <div><dt>已完成章节</dt><dd>${work.completedChapterCount}</dd></div>
          <div>
            <dt>最近阅读章节</dt>
            <dd>${work.recentChapter
              ? `第${work.recentChapter.number}章 ${Reader.escapeHtml(work.recentChapter.title)}`
              : '尚未阅读'}</dd>
          </div>
          <div><dt>最近修改</dt><dd>${Reader.formatTime(work.updatedAt)}</dd></div>
        </dl>
      </a>
    `).join('');
  } catch (error) {
    console.error(error);
    Reader.showError(container, error.message);
  }
});
