function normalizedStatus(status) {
  return status === 'reading' ? 'completed' : status;
}

function renderExpandedInterpretation(sentence) {
  if (!sentence.expandedInterpretation?.length) return '';

  const paragraphs = sentence.expandedInterpretation
    .map((paragraph) => `<p>${Reader.escapeHtml(paragraph)}</p>`)
    .join('');

  return `
    <details class="expanded-interpretation">
      <summary>
        <span>进一步解释</span>
        <span class="details-hint" aria-hidden="true"></span>
      </summary>
      <div class="expanded-content">${paragraphs}</div>
    </details>
  `;
}

function sentenceCard(sentence, workId, chapterId) {
  const ambiguities = sentence.ambiguities?.length
    ? `<section class="ambiguities">
        <h3>不确定性</h3>
        <ul>${sentence.ambiguities.map((item) => `<li>${Reader.escapeHtml(item)}</li>`).join('')}</ul>
      </section>`
    : '';
  const status = normalizedStatus(sentence.status);

  return `
    <article class="sentence-card">
      <p class="sentence-order">第 ${sentence.order} 句</p>
      <section class="original">
        <h2>原文</h2>
        <p>${Reader.escapeHtml(sentence.original)}</p>
      </section>
      <section>
        <h3>直译</h3>
        <p>${Reader.escapeHtml(sentence.literalTranslation)}</p>
      </section>
      <section class="interpretation">
        <h3>LLM 理解</h3>
        <p>${Reader.escapeHtml(sentence.llmInterpretation)}</p>
      </section>
      ${renderExpandedInterpretation(sentence)}
      ${ambiguities}
      <section class="note-section">
        <label for="note-${sentence.id}">我的笔记</label>
        <textarea id="note-${sentence.id}" rows="4" placeholder="记录你的理解、质疑、联想或不同意的地方。">${Reader.escapeHtml(sentence.userNote)}</textarea>
      </section>
      <div class="save-row">
        <label>
          状态
          <select aria-label="第 ${sentence.order} 句状态">
            <option value="unread"${status === 'unread' ? ' selected' : ''}>未开始</option>
            <option value="completed"${status === 'completed' ? ' selected' : ''}>已完成</option>
            <option value="uncertain"${status === 'uncertain' ? ' selected' : ''}>存疑</option>
          </select>
        </label>
        <button
          type="button"
          data-work="${Reader.escapeHtml(workId)}"
          data-chapter="${Reader.escapeHtml(chapterId)}"
          data-sentence="${Reader.escapeHtml(sentence.id)}"
        >保存本句</button>
        <span class="save-feedback" aria-live="polite">
          ${sentence.updatedAt ? `上次保存：${Reader.formatTime(sentence.updatedAt)}` : ''}
        </span>
      </div>
    </article>
  `;
}

function autosize(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = `${textarea.scrollHeight}px`;
}

function enableSingleExpandedSection(container) {
  const sections = container.querySelectorAll('.expanded-interpretation');
  sections.forEach((section) => {
    section.addEventListener('toggle', () => {
      if (!section.open) return;
      sections.forEach((other) => {
        if (other !== section) other.open = false;
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const query = new URLSearchParams(location.search);
  const workId = query.get('work');
  const chapterId = query.get('chapter');
  const container = document.querySelector('#sentences');

  if (!workId || !chapterId) {
    Reader.showError(container, '缺少作品或章节 ID。');
    return;
  }

  try {
    const { work, chapter } = await Reader.getJson(
      `/api/works/${encodeURIComponent(workId)}/chapters/${encodeURIComponent(chapterId)}`
    );
    document.title = `${work.title} 第${chapter.number}章｜古文逐句阅读与笔记`;
    document.querySelector('#breadcrumbs').innerHTML = `
      <a href="/">作品索引</a>
      <span>/</span>
      <a href="/work.html?id=${encodeURIComponent(work.id)}">${Reader.escapeHtml(work.title)}</a>
      <span>/</span>
      <span>${Reader.escapeHtml(chapter.title)}</span>
    `;
    document.querySelector('#chapter-number').textContent = `第 ${chapter.number} 章`;
    document.querySelector('#chapter-title').textContent = chapter.title;
    document.querySelector('#full-text').textContent = chapter.fullText;

    const completed = chapter.sentences.filter(
      (sentence) => normalizedStatus(sentence.status) === 'completed'
    ).length;
    document.querySelector('#progress').textContent =
      `章节阅读进度：${completed} / ${chapter.sentences.length} 句已完成`;

    container.innerHTML = chapter.sentences
      .map((sentence) => sentenceCard(sentence, work.id, chapter.id))
      .join('');
    container.querySelectorAll('textarea').forEach((textarea) => {
      autosize(textarea);
      textarea.addEventListener('input', () => autosize(textarea));
    });
    enableSingleExpandedSection(container);
  } catch (error) {
    console.error(error);
    Reader.showError(container, error.message);
  }
});

document.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-sentence]');
  if (!button) return;

  const card = button.closest('.sentence-card');
  const note = card.querySelector('textarea');
  const feedback = card.querySelector('.save-feedback');
  const statusSelect = card.querySelector('select');
  const requestedStatus = statusSelect.value;

  button.disabled = true;
  button.textContent = '保存中…';
  feedback.textContent = '正在写入本地文件…';
  feedback.className = 'save-feedback saving';

  try {
    const url = `/api/works/${encodeURIComponent(button.dataset.work)}`
      + `/chapters/${encodeURIComponent(button.dataset.chapter)}`
      + `/sentences/${encodeURIComponent(button.dataset.sentence)}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userNote: note.value, status: requestedStatus })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `保存失败（${response.status}）`);

    if (requestedStatus === 'unread') statusSelect.value = 'completed';
    feedback.textContent = `已保存：${Reader.formatTime(data.savedAt)}`;
    feedback.className = 'save-feedback saved';
  } catch (error) {
    console.error('Sentence save failed:', error);
    feedback.textContent = `保存失败：${error.message}`;
    feedback.className = 'save-feedback failed';
  } finally {
    button.disabled = false;
    button.textContent = '保存本句';
  }
});
