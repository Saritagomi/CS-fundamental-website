import { loadTopics } from './content-loader.js';
import { buildSearchIndex, initSearch } from './search.js';
import { getTopicProgress } from './progress.js';

const CARD_COLORS = {
  'computer-basics':          '#3fb950',
  'programming-fundamentals': '#58a6ff',
  'data-structures':          '#bc8cff',
  'algorithms':               '#d29922',
  'operating-systems':        '#39c5cf',
  'networking':               '#f85149',
  'databases':                '#ff7b72',
  'web-development':          '#ffa657',
};

async function init() {
  const grid = document.getElementById('topics-grid');
  const statTopics = document.getElementById('stat-topics');

  try {
    const { topics } = await loadTopics();

    if (statTopics) statTopics.textContent = topics.length;

    buildSearchIndex(topics);
    initSearch(
      document.getElementById('global-search'),
      document.getElementById('search-results')
    );

    renderGrid(topics, grid);
    setupFilters(topics, grid);
  } catch (err) {
    grid.innerHTML = `<div class="topics-loading" style="color:var(--red)">Failed to load topics. Run this site from a local server (e.g. <code>python3 -m http.server</code>).</div>`;
    console.error(err);
  }
}

function renderGrid(topics, grid, filter = 'all') {
  const filtered = filter === 'all' ? topics : topics.filter(t => t.difficulty === filter);
  if (!filtered.length) {
    grid.innerHTML = '<div class="topics-loading">No topics found.</div>';
    return;
  }
  grid.innerHTML = filtered.map(topic => buildCard(topic)).join('');
}

function buildCard(topic) {
  const color = CARD_COLORS[topic.slug] || 'var(--accent)';
  const progress = getTopicProgress(topic.slug, topic.sections?.length || topic.totalSections || 0);
  const tags = (topic.tags || []).slice(0, 3).map(t => `<span class="tag">${t}</span>`).join('');

  return `
<a class="topic-card" href="topic.html?topic=${topic.slug}&section=${topic.sections?.[0]?.slug || ''}"
   style="--card-accent: ${color}">
  <div class="topic-card-icon">${topic.icon || '📚'}</div>
  <div class="topic-card-header">
    <div class="topic-card-title">${topic.title}</div>
    <span class="difficulty-badge difficulty-${topic.difficulty}">${topic.difficulty}</span>
  </div>
  <p class="topic-card-desc">${topic.description}</p>
  <div class="topic-card-meta">
    <span class="topic-meta-item">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      ${topic.sections?.length || topic.totalSections || 0} sections
    </span>
    <span class="topic-meta-item">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      ${topic.estimatedTime || '—'}
    </span>
  </div>
  <div class="topic-card-tags">${tags}</div>
  <div class="topic-card-footer">
    <div class="topic-card-progress">
      <div class="progress-track"><div class="progress-fill" style="width:${progress.pct}%"></div></div>
      <span>${progress.pct}%</span>
    </div>
    <span class="btn btn-sm btn-ghost">Start →</span>
  </div>
</a>`.trim();
}

function setupFilters(topics, grid) {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderGrid(topics, grid, btn.dataset.filter);
    });
  });
}

init();
