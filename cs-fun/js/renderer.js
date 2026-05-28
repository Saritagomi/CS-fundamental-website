/* Content block renderer — maps JSON block types to HTML strings */

const CALLOUT_META = {
  info:    { icon: 'ℹ️',  label: 'Note' },
  success: { icon: '✅', label: 'Success' },
  warning: { icon: '⚠️', label: 'Warning' },
  danger:  { icon: '🚫', label: 'Danger' },
  tip:     { icon: '💡', label: 'Tip' },
};

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E'];

export function renderBlocks(blocks) {
  if (!Array.isArray(blocks)) return '';
  return blocks.map(renderBlock).join('');
}

function renderBlock(block) {
  switch (block.type) {
    case 'heading':           return renderHeading(block);
    case 'paragraph':         return renderParagraph(block);
    case 'code':              return renderCode(block);
    case 'list':              return renderList(block);
    case 'callout':           return renderCallout(block);
    case 'table':             return renderTable(block);
    case 'accordion':         return renderAccordion(block);
    case 'tabs':              return renderTabs(block);
    case 'interview':         return renderInterview(block);
    case 'roadmap':           return renderRoadmap(block);
    case 'quiz':              return renderQuiz(block);
    case 'key-points':        return renderKeyPoints(block);
    case 'definition':        return renderDefinition(block);
    case 'divider':           return '<hr style="border:none;border-top:1px solid var(--border);margin:2rem 0;" />';
    case 'image':             return renderImage(block);
    default:                  return '';
  }
}

function escape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function md(text) {
  // Minimal inline markdown: **bold**, *italic*, `code`, [link](url)
  return String(text)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

function renderHeading(block) {
  const level = Math.min(Math.max(block.level || 2, 1), 6);
  const id = (block.text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `<h${level} id="${id}">${md(block.text || '')}</h${level}>`;
}

function renderParagraph(block) {
  if (!block.text) return '';
  return `<p>${md(block.text)}</p>`;
}

function renderCode(block) {
  const lang = block.language || 'plaintext';
  const title = block.title ? `<span class="code-block-title">${escape(block.title)}</span>` : '';
  const id = `code-${Math.random().toString(36).slice(2, 8)}`;
  return `
<div class="code-block">
  <div class="code-block-header">
    <span class="code-block-lang">${escape(lang)}</span>
    ${title}
    <button class="code-copy-btn" onclick="copyCode('${id}')">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      Copy
    </button>
  </div>
  <pre><code id="${id}" class="language-${escape(lang)}">${escape(block.code || '')}</code></pre>
</div>`.trim();
}

function renderList(block) {
  const tag = block.style === 'ordered' ? 'ol' : 'ul';
  const items = (block.items || []).map(item => {
    if (typeof item === 'string') return `<li>${md(item)}</li>`;
    return `<li><strong>${md(item.label || '')}</strong>${item.desc ? ' — ' + md(item.desc) : ''}</li>`;
  }).join('');
  return `<${tag}>${items}</${tag}>`;
}

function renderCallout(block) {
  const variant = block.variant || 'info';
  const meta = CALLOUT_META[variant] || CALLOUT_META.info;
  const title = block.title || meta.label;
  const body = block.text ? `<p>${md(block.text)}</p>` : renderBlocks(block.blocks || []);
  return `
<div class="callout callout-${escape(variant)}">
  <div class="callout-icon">${meta.icon}</div>
  <div class="callout-content">
    <div class="callout-title">${escape(title)}</div>
    <div class="callout-body">${body}</div>
  </div>
</div>`.trim();
}

function renderTable(block) {
  const headers = (block.headers || []).map(h => `<th>${md(h)}</th>`).join('');
  const rows = (block.rows || []).map(row =>
    `<tr>${row.map(cell => `<td>${md(cell)}</td>`).join('')}</tr>`
  ).join('');
  return `
<div class="table-wrap">
  <table class="content-table">
    <thead><tr>${headers}</tr></thead>
    <tbody>${rows}</tbody>
  </table>
</div>`.trim();
}

function renderAccordion(block) {
  const items = (block.items || []).map((item, i) => {
    const id = `accordion-${Math.random().toString(36).slice(2, 8)}-${i}`;
    const body = item.blocks ? renderBlocks(item.blocks) : `<p>${md(item.content || '')}</p>`;
    return `
<div class="accordion-item">
  <button class="accordion-trigger" aria-expanded="false" aria-controls="${id}" onclick="toggleAccordion(this)">
    ${escape(item.title || '')}
    <svg class="accordion-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
  </button>
  <div class="accordion-body" id="${id}">${body}</div>
</div>`.trim();
  }).join('');
  return `<div class="accordion">${items}</div>`;
}

function renderTabs(block) {
  const groupId = `tabs-${Math.random().toString(36).slice(2, 8)}`;
  const triggers = (block.tabs || []).map((tab, i) =>
    `<button class="tab-trigger${i === 0 ? ' active' : ''}" onclick="switchTab('${groupId}', ${i}, this)">${escape(tab.label || '')}</button>`
  ).join('');
  const panels = (block.tabs || []).map((tab, i) => {
    const body = tab.blocks ? renderBlocks(tab.blocks) : `<p>${md(tab.content || '')}</p>`;
    const code = tab.code ? renderCode({ type: 'code', language: tab.language || 'plaintext', code: tab.code, title: tab.label }) : '';
    return `<div class="tab-panel${i === 0 ? ' active' : ''}" data-group="${groupId}">${body}${code}</div>`;
  }).join('');
  return `
<div class="tabs" id="${groupId}">
  <div class="tabs-list">${triggers}</div>
  <div class="tab-panels">${panels}</div>
</div>`.trim();
}

function renderInterview(block) {
  const items = (block.questions || []).map((q, i) => {
    const id = `iq-${Math.random().toString(36).slice(2, 8)}-${i}`;
    return `
<div class="interview-item">
  <div class="interview-q">${md(q.question || '')}</div>
  <button class="interview-reveal-btn" onclick="revealAnswer('${id}')">Show answer ↓</button>
  <div class="interview-a" id="${id}">${md(q.answer || '')}</div>
</div>`.trim();
  }).join('');
  return `
<div class="interview-block">
  <div class="interview-block-title">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    Interview Questions
  </div>
  <div class="interview-list">${items}</div>
</div>`.trim();
}

function renderRoadmap(block) {
  const items = (block.items || []).map(item => {
    const status = item.status || 'upcoming';
    return `
<div class="roadmap-item">
  <div class="roadmap-dot ${status}"></div>
  <div class="roadmap-label">
    ${escape(item.title || '')}
    ${item.badge ? `<span class="difficulty-badge difficulty-${escape(item.badge)}">${escape(item.badge)}</span>` : ''}
  </div>
  ${item.description ? `<div class="roadmap-desc">${md(item.description)}</div>` : ''}
</div>`.trim();
  }).join('');
  return `
<div class="roadmap">${items}</div>`.trim();
}

function renderQuiz(block) {
  const questions = (block.questions || []).map((q, qi) => {
    const qId = `q-${Math.random().toString(36).slice(2, 8)}-${qi}`;
    const options = (q.options || []).map((opt, oi) => {
      const letter = OPTION_LETTERS[oi] || String(oi + 1);
      const isCorrect = oi === q.correct;
      return `
<button class="quiz-option" data-correct="${isCorrect}" data-qid="${qId}" onclick="handleQuizAnswer(this)">
  <span class="quiz-option-letter">${letter}</span>
  <span>${md(opt)}</span>
</button>`.trim();
    }).join('');
    const explanation = q.explanation
      ? `<div class="quiz-explanation" id="${qId}-exp">${md(q.explanation)}</div>`
      : '';
    return `
<div class="quiz-question" id="${qId}">
  <div class="quiz-q-text">${md(q.question || '')}</div>
  <div class="quiz-options">${options}</div>
  ${explanation}
</div>`.trim();
  }).join('');
  return `<div class="quiz-block"><div class="quiz-block-header"><span class="quiz-block-title">Knowledge Check</span></div>${questions}</div>`;
}

function renderKeyPoints(block) {
  const items = (block.points || []).map(p =>
    `<li><span class="key-point-dot">▸</span><span>${md(p)}</span></li>`
  ).join('');
  return `
<div class="key-points">
  <div class="key-points-title">🎯 Key Takeaways</div>
  <ul>${items}</ul>
</div>`.trim();
}

function renderDefinition(block) {
  return `
<div class="definition-block">
  <div class="definition-term">${escape(block.term || '')}</div>
  <div class="definition-body">${md(block.definition || '')}</div>
</div>`.trim();
}

function renderImage(block) {
  const alt = escape(block.alt || '');
  const caption = block.caption ? `<figcaption style="font-size:0.75rem;color:var(--text-3);text-align:center;margin-top:0.5rem;">${md(block.caption)}</figcaption>` : '';
  return `<figure style="margin:1.5rem 0;"><img src="${escape(block.src || '')}" alt="${alt}" style="border-radius:var(--r-lg);border:1px solid var(--border);" />${caption}</figure>`;
}

/* ── Global interaction handlers (attached to window) ─── */

window.copyCode = function(id) {
  const el = document.getElementById(id);
  if (!el) return;
  navigator.clipboard.writeText(el.textContent).then(() => {
    const btn = el.closest('.code-block')?.querySelector('.code-copy-btn');
    if (btn) {
      btn.textContent = 'Copied!';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy`;
        btn.classList.remove('copied');
      }, 2000);
    }
  });
};

window.toggleAccordion = function(trigger) {
  const expanded = trigger.getAttribute('aria-expanded') === 'true';
  const bodyId = trigger.getAttribute('aria-controls');
  const body = document.getElementById(bodyId);
  if (!body) return;
  trigger.setAttribute('aria-expanded', String(!expanded));
  body.classList.toggle('open', !expanded);
};

window.switchTab = function(groupId, index, triggerEl) {
  const container = document.getElementById(groupId);
  if (!container) return;
  container.querySelectorAll('.tab-trigger').forEach((t, i) => t.classList.toggle('active', i === index));
  container.querySelectorAll('.tab-panel').forEach((p, i) => p.classList.toggle('active', i === index));
};

window.revealAnswer = function(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('revealed');
  const btn = el.previousElementSibling;
  if (btn) btn.style.display = 'none';
};

window.handleQuizAnswer = function(optionBtn) {
  const qId = optionBtn.dataset.qid;
  const qEl = document.getElementById(qId);
  if (!qEl) return;
  // Disable all options in this question
  qEl.querySelectorAll('.quiz-option').forEach(btn => {
    btn.disabled = true;
    if (btn.dataset.correct === 'true') btn.classList.add('correct');
  });
  if (optionBtn.dataset.correct !== 'true') optionBtn.classList.add('wrong');
  // Show explanation
  const expEl = document.getElementById(`${qId}-exp`);
  if (expEl) expEl.classList.add('visible');
};

/* ── Highlight.js trigger ─────────────────────────────── */
export function highlightAll() {
  if (window.hljs) {
    document.querySelectorAll('pre code').forEach(el => {
      if (!el.dataset.highlighted) window.hljs.highlightElement(el);
    });
  }
}
