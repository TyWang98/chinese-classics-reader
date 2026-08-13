window.Reader = {
  async getJson(url) {
    const response = await fetch(url);
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || `请求失败（${response.status}）`);
    return body;
  },

  formatTime(value) {
    if (!value) return '尚无记录';
    return new Intl.DateTimeFormat('zh-CN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  },

  escapeHtml(value) {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    };
    return String(value).replace(/[&<>'"]/g, (character) => entities[character]);
  },

  statusLabel(status) {
    return {
      unread: '未开始',
      reading: '已完成',
      completed: '已完成',
      uncertain: '存疑'
    }[status] || status;
  },

  showError(container, message) {
    container.innerHTML = `<p class="page-error">${this.escapeHtml(message)}</p>`;
  }
};
