function renderTextBasis(textBasis) {
  if (!textBasis) return '';
  const statusLabels = {
    unverified: '待校勘',
    reviewed: '已核验',
    critical: '校勘本基础'
  };
  const limitations = Array.isArray(textBasis.limitations) ? textBasis.limitations : [];
  const layers = Array.isArray(textBasis.editorialLayers) ? textBasis.editorialLayers : [];
  const limitationList = limitations.length
    ? `<ul>${limitations.map((item) => `<li>${Reader.escapeHtml(item)}</li>`).join('')}</ul>`
    : '';
  const layerText = layers.length ? `编辑层：${layers.map(Reader.escapeHtml).join('、')}` : '';

  return `<h2>文本依据</h2>
    <p><strong>${Reader.escapeHtml(statusLabels[textBasis.status] || '状态未注明')}</strong> · ${Reader.escapeHtml(textBasis.baseText || '底本未注明')}</p>
    ${layerText ? `<p class="muted">${layerText}</p>` : ''}
    ${limitationList}`;
}

document.addEventListener('DOMContentLoaded', async () => {
  const id = new URLSearchParams(location.search).get('id');
  const chapters = document.querySelector('#chapters');
  const textBasis = document.querySelector('#text-basis');
  if (!id) {
    Reader.showError(chapters, '缺少作品 ID。');
    return;
  }

  try {
    const work = await Reader.getJson(`/api/works/${encodeURIComponent(id)}`);
    document.title = `${work.title}｜古文逐句阅读与笔记`;
    document.querySelector('#work-title').textContent = work.title;
    document.querySelector('#crumb-title').textContent = work.title;
    document.querySelector('#work-meta').textContent = [work.author, work.sourceVersion].filter(Boolean).join(' · ');
    if (work.textBasis) {
      textBasis.innerHTML = renderTextBasis(work.textBasis);
      textBasis.hidden = false;
    }
    chapters.innerHTML = work.chapters.map((chapter) => `<a class="index-card chapter-card" href="/chapter.html?work=${encodeURIComponent(work.id)}&chapter=${encodeURIComponent(chapter.id)}">
      <div>
        <p class="chapter-number">第 ${chapter.number} 章</p>
        <h2>${Reader.escapeHtml(chapter.title)}</h2>
        <p>${Reader.statusLabel(chapter.status)}</p>
      </div>
      <dl>
        <div><dt>笔记完成数量</dt><dd>${chapter.noteCount} / ${chapter.sentenceCount}</dd></div>
        <div><dt>阅读完成</dt><dd>${chapter.completedSentences} / ${chapter.sentenceCount}</dd></div>
        <div><dt>最近修改</dt><dd>${Reader.formatTime(chapter.updatedAt)}</dd></div>
      </dl>
    </a>`).join('');
  } catch (error) {
    console.error(error);
    Reader.showError(chapters, error.message);
  }
});
